# ScamAlertVN - Code Walkthrough cho van dap

Tai lieu nay tom tat luong xu ly cua du an de nhom co the on van dap nhanh.
Trong code, tim cum `NOTE VAN DAP` de xem ghi chu truc tiep tai file quan trong.
Sau lan cap nhat nay, trong nhieu file con co them comment sat dong:

- Backend: comment ngay tren/canh field, class, serializer field va action de biet dong do xu ly gi.
- Frontend: comment JSX dang `{/* ... */}` de biet khoi giao dien do la sidebar, form, card, popup, nut action hay danh sach.
- Khi on van dap, nen doc theo thu tu: `models.py` -> `serializers/` -> `views/` -> frontend page tuong ung.

## 1. Buctranh tong quan

Du an gom 2 phan:

- Backend: Django + Django REST Framework, nam trong `backend/`.
- Frontend: React + TypeScript + Vite, nam trong `frontend/`.

Luong request co ban:

```text
User thao tac tren React
-> Axios goi http://127.0.0.1:8000/api/
-> Django URL router chon ViewSet/APIView
-> Serializer validate/chuyen Model thanh JSON
-> Model doc/ghi SQLite
-> JSON tra ve frontend de render UI
```

## 2. Luong dang nhap va phan quyen

File lien quan:

- `backend/core/urls.py`
- `backend/core/settings.py`
- `backend/api/views/user_views.py`
- `frontend/src/app/contexts/AuthContext.tsx`
- `frontend/src/api/axiosInstance.ts`
- `frontend/src/app/routes.tsx`

Flow:

```text
Login page goi AuthContext.login()
-> POST /api/login/ voi username + password
-> Django SimpleJWT tra access + refresh token
-> Frontend luu token vao localStorage
-> Frontend goi GET /api/users/me/
-> Backend tra thong tin user, role_name, is_staff
-> routes.tsx dung is_admin de chan /admin
```

Diem can noi voi thay:

- JWT nam o header `Authorization: Bearer <token>`.
- `axiosInstance.ts` tu dong gan token cho moi request.
- `AdminProtectedRoute` chi cho vao admin khi user co role Admin va `is_staff=true`.

## 3. Luong tao bai viet

File lien quan:

- `frontend/src/app/pages/CreatePost.tsx`
- `backend/api/views/post_views.py`
- `backend/api/serializers/post_serializers.py`
- `backend/api/models.py`

Flow:

```text
User nhap title/content/category/anh
-> CreatePost tao FormData
-> POST /api/posts/
-> PostCreateSerializer validate title/content
-> PostViewSet.perform_create() gan user=request.user
-> Kiem tra blacklist
-> Luu Post voi status mac dinh PENDING
-> Neu co file, luu vao media/posts/<post_id>/
-> Tao Media + TargetMedia de gan file vao Post
```

Diem can noi:

- Bai moi khong public ngay, ma o trang thai `PENDING`.
- File upload phai dung `multipart/form-data`, nen FE dung `FormData`.
- Anh/video khong luu truc tiep trong Post, ma luu qua `Media` va `TargetMedia`.

## 4. Luong hien thi bai viet public

File lien quan:

- `frontend/src/app/pages/Home.tsx`
- `frontend/src/app/pages/PostDetail.tsx`
- `backend/api/views/post_views.py`
- `backend/api/views/public_views.py`
- `backend/api/serializers/post_serializers.py`

Flow trang chu:

```text
Home goi GET /api/posts/ va /api/categories/
-> Backend chi tra bai APPROVED cho user thuong/khach
-> Frontend loc theo category, searchQuery
-> Sap xep latest hoac trending
-> Render PostCard
```

Flow chi tiet:

```text
PostDetail goi GET /api/posts/<id>/
-> Lay post, likes_count, comments_count, is_liked, is_bookmarked
-> Goi GET /api/comments/?post=<id>
-> Render comment + reply
```

Diem can noi:

- Admin thay tat ca bai; user thuong chi thay `APPROVED`, rieng chu bai duoc xem bai cua minh.
- Bai/comment an danh duoc mask trong serializer, khong chi an tren UI.

## 5. Luong kiem duyet admin

File lien quan:

- `frontend/src/app/pages/admin/AdminLayout.tsx`
- `frontend/src/app/pages/admin/Posts.tsx`
- `backend/api/views/post_views.py`
- `backend/api/serializers/moderation_serializers.py`

Flow:

```text
AdminLayout goi GET /api/posts/all/
-> Backend tra toan bo post moi trang thai
-> AdminPosts loc/search tren frontend
-> Admin bam approve/reject/hide/lock/delete
-> FE goi endpoint custom:
   /api/posts/<id>/approve/
   /api/posts/<id>/reject/
   /api/posts/<id>/hide/
   /api/posts/<id>/lock/
   /api/posts/<id>/admin-delete/
-> Backend doi status, luu reviewed_by/reviewed_at/reason
-> Tao Notification/AuditLog
```

Diem can noi:

- `@action` trong DRF tao endpoint rieng cho cac nut admin.
- Approve se doi `PENDING -> APPROVED`, set `published_time`, cong 10 diem uy tin.
- Reject/hide/lock/delete can reason de luu ly do xu ly.

## 6. Luong AI analysis

File lien quan:

- `frontend/src/app/pages/admin/Posts.tsx`
- `backend/api/views/post_views.py`
- `backend/api/services/ai_content_analysis.py`
- `backend/core/settings.py`

Flow:

```text
Admin bam "Phan tich"
-> POST /api/posts/<id>/ai-analyze/
-> analyze_and_store_post()
-> Chon provider: gemini/openai/local
-> Tao prompt tu title/content + categories
-> Chuan hoa JSON ket qua
-> Luu vao Post.ai_analysis_result
-> FE hien confidence, signals, recommended_action
```

Diem can noi:

- AI khong tu chay khi user dang bai, admin bam thu cong.
- Neu khong co API key hoac API loi, he thong fallback local rule-based analyzer.
- Ket qua AI chi la goi y, admin van la nguoi ra quyet dinh cuoi.

## 7. Luong comment, like, report, bookmark

File lien quan:

- `frontend/src/app/pages/PostDetail.tsx`
- `frontend/src/app/pages/SavedPosts.tsx`
- `backend/api/views/interact_views.py`
- `backend/api/serializers/interact_serializers.py`
- `backend/api/models.py`

Comment:

```text
User gui comment/reply
-> POST /api/comments/
-> CommentSerializer validate content
-> CommentViewSet gan user=request.user
-> Neu comment co anh, luu Media + TargetMedia
-> FE reload/render comment
```

Like:

```text
User bam like
-> POST /api/reactions/toggle/
-> Neu Reaction da co: xoa
-> Neu chua co: tao moi
-> Tra likes_count moi
```

Report:

```text
User report post/comment/user
-> POST /api/reports/
-> Luu ContentReport PENDING
-> Admin process/dismiss report
-> Neu process: cong diem reporter, tru diem nguoi bi report, co the an bai
```

Bookmark:

```text
User bam luu bai
-> POST /api/bookmarks/toggle/
-> Neu bookmark da co: xoa
-> Neu chua co: tao
-> SavedPosts goi /api/bookmarks/mine/
```

## 8. Luong quan ly user

File lien quan:

- `frontend/src/app/pages/admin/Users.tsx`
- `backend/api/views/user_views.py`
- `backend/api/serializers/user_serializers.py`
- `backend/api/pagination.py`

Flow:

```text
AdminUsers gui search/status/role/page len /api/users/
-> UserViewSet loc server-side
-> UserPagination tra count/results/status_summary
-> Admin bam lock/unlock/warn/delete
-> FE goi /api/users/<id>/lock/ hoac unlock/warn/delete
-> Backend doi status va tao Notification/ActivityLog
```

Diem can noi:

- Delete user la soft delete: doi `status=inactive`, khong xoa record khoi DB.
- Lock user dung `status=banned` va luu duration trong ActivityLog.
- Khi admin list user, backend tu kiem tra va mo khoa user het han.

## 9. Cac bang database nen nho

- `User`: tai khoan, status, role, reputation_score.
- `Role`: vai tro Admin/User.
- `ScamCategory`: danh muc lua dao.
- `Post`: bai viet, status, an danh, AI analysis, reviewed fields.
- `Comment`: binh luan/reply, parent_comment.
- `Reaction`: like/downvote theo target_type + target_id.
- `Bookmark`: user luu bai.
- `ContentReport`: bao cao vi pham.
- `Media` va `TargetMedia`: file upload gan voi post/comment.
- `Notification`: thong bao cho user.
- `ReputationHistory`: lich su thay doi diem uy tin.
- `AuditLog` va `ActivityLog`: log xu ly quan trong.
- `Blacklist`: tu khoa cam khi user tao bai.

## 10. Cau hoi van dap hay gap

**Vi sao can serializer?**
Serializer validate input, chuyen Model thanh JSON va co the them field tinh toan nhu likes_count, is_bookmarked.

**Vi sao bai moi phai PENDING?**
De admin kiem duyet truoc khi public, tranh noi dung xau xuat hien ngay.

**An danh xu ly o FE hay BE?**
Xu ly o backend serializer. FE chi hien data da duoc mask, nen an toan hon.

**Vi sao co TargetMedia?**
De mot co che upload co the gan file cho nhieu loai doi tuong nhu Post va Comment.

**Vi sao admin route can ca FE va BE bao ve?**
FE chan trai nghiem nguoi dung, BE moi la lop bao ve that su bang permission `IsAdminRole`.

**Neu token het han thi sao?**
Axios response interceptor co vi tri xu ly 401. Hien tai app chu yeu xoa/dang xuat khi checkAuth that bai.

**AI analysis co bat buoc khong?**
Khong. Neu khong co API key, service dung local analyzer de demo van chay.
