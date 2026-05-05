from django.utils import timezone
from django.db.models import Q
from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied

from api.models import Post, User, Notification, AuditLog, Blacklist
from api.serializers import (
    PostSerializer, PostModerationSerializer, PostCreateSerializer,
    ApprovePostSerializer, RejectPostSerializer,
    HidePostSerializer, LockPostSerializer, AdminDeletePostSerializer
)
from api.permissions import IsAdminRole
from api.services.ai_content_analysis import analyze_and_store_post

# NOTE VAN DAP:
# post_views.py là file nghiệp vụ CHÍNH của bài viết, gồm 2 luồng:
#
# ── Luồng tạo bài (User) ─────────────────────────────────────────────────────
# FE gửi POST /api/posts/ với FormData (title, content, category, file)
#   => PostCreateSerializer validate title/content (độ dài tối thiểu)
#   => perform_create() kiểm tra blacklist, gán user=request.user
#   => save Post với status=PENDING (chưa public ngay)
#   => _handle_file_uploads() lưu ảnh/video vào Media + TargetMedia.
#
# ── Luồng kiểm duyệt (Admin) ─────────────────────────────────────────────────
# Admin gọi các endpoint custom (@action):
#   /approve  => PENDING => APPROVED, +10 điểm uy tín tác giả
#   /reject   => PENDING => REJECTED, lưu reason
#   /hide     => bất kỳ => HIDDEN, bài không hiển thị public
#   /lock     => bất kỳ => LOCKED, bài không cho tương tác thêm
#   /admin-delete => xóa vĩnh viễn khỏi DB
# Mỗi action đều: ghi reviewed_by/reviewed_at, tạo AuditLog, gửi Notification.

# --- KIEM DUYET BAI VIET -------------------------------
def _send_notification(user: User, message: str):
    """Tạo notification trong bảng Notification cho user.
    Các action kiểm duyệt (approve/reject/hide/lock/delete) đều gọi hàm này
    để báo cho tác giả biết kết quả xử lý bài của họ.
    """
    Notification.objects.create(user=user, content=message)


def _mark_reviewed(post: Post, admin_user: User, reason: str = None):
    """Ghi lại metadata 'ai xử lý bài này và lúc nào' vào Post.

    Được gọi sau mỗi action kiểm duyệt trước khi post.save().
    Ba field này giúp admin tra cứu lịch sử xử lý và hiển thị trong PostModerationSerializer.
    """
    post.reviewed_by = admin_user    # lưu admin nào đã approve/reject/hide/lock.
    post.reviewed_at = timezone.now()  # lưu thời điểm xử lý để audit.
    if reason:
        post.rejection_reason = reason  # lưu lý do để user đọc được qua Notification/UI.


# --- PHAN CUA LAN BEM ---------------------------
# ========================================================
# POST VIEWSET
# ========================================================

class PostViewSet(viewsets.ModelViewSet):
    """
    ViewSet quản lý toàn bộ nghiệp vụ bài viết.
    DRF tự map:
      GET    /api/posts/        => list()
      POST   /api/posts/        => create()
      GET    /api/posts/<id>/   => retrieve()
      PUT    /api/posts/<id>/   => update()
      DELETE /api/posts/<id>/   => destroy()
    Ngoài ra còn các @action custom (approve/reject/hide/lock...) bên dưới.
    """
    # select_related giải quyết N+1 query: thay vì mỗi post query thêm user/category,
    # Django JOIN sẵn trong một câu SQL duy nhất.
    queryset = Post.objects.all().select_related('user', 'category', 'reviewed_by')
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]  # khách đọc được, phải đăng nhập mới ghi.

    def get_queryset(self):
        """
        Lớp lọc dữ liệu quan trọng nhất của hệ thống.
        Quy tắc:
          - Admin => thấy TẤT CẢ bài (mọi trạng thái).
          - retrieve (xem chi tiết): chủ bài thấy bài của mình dù chưa duyệt.
          - list / khách / user thường => chỉ thấy APPROVED.
          - Xem profile người khác => bài ẩn danh bị ẩn.
        """
        user_id = self.request.query_params.get('user')  # ?user=<id> để lọc theo tác giả.
        is_admin = self._is_admin()

        if self.action in ['list', 'retrieve'] and not is_admin:
            if self.action == 'retrieve' and self.request.user.is_authenticated:
                # Chủ bài được xem bài của mình kể cả khi chưa duyệt.
                qs = Post.objects.filter(
                    Q(status=Post.PostStatus.APPROVED) | Q(user=self.request.user)
                )
            else:
                # Khách / user thường chỉ thấy bài đã được duyệt.
                qs = Post.objects.filter(status=Post.PostStatus.APPROVED)

            if user_id:
                # Xem profile người khác => ẩn bài ẩn danh của họ.
                is_owner = (
                    self.request.user.is_authenticated and
                    str(self.request.user.id) == str(user_id)
                )
                if not is_owner:
                    qs = qs.filter(is_anonymous=False)  # người khác không thấy bài ẩn danh.
                qs = qs.filter(user_id=user_id)
            return qs.select_related('user', 'category').order_by('-created_time')

        # Admin hoặc các action kiểm duyệt => trả toàn bộ bài.
        qs = Post.objects.all().select_related('user', 'category', 'reviewed_by')
        if user_id:
            qs = qs.filter(user_id=user_id)
        return qs

    def get_serializer_class(self):
        """
        Chọn Serializer phù hợp với từng action.
        - PostCreateSerializer : tạo/sửa bài (ít field hơn, user tự điền).
        - PostModerationSerializer : admin kiểm duyệt (đầy đủ reviewed_by, AI...).
        - PostSerializer : mặc định cho public/user xem bài.
        """
        if self.action in ['create', 'update', 'partial_update']:
            return PostCreateSerializer
        if self.action in [
            'pending_list', 'all_posts',
            'approve', 'reject', 'hide', 'lock', 'admin_delete',
            'ai_analyze',
        ]:
            return PostModerationSerializer  # trả đầy đủ field kem duyet cho admin.
        return PostSerializer

    def retrieve(self, request, *args, **kwargs):
        """
        Lấy chi tiết một bài viết.
        Ngoài JSON bài viết, lưu ID bài vào session để theo dõi lịch sử xem.
        Header X-Recently-Viewed trả về danh sách ID đã xem.
        """
        instance = self.get_object()  # lấy bài theo pk trên URL, kiểm tra permission tự động.

        # Lưu lịch sử bài đã xem vào Django session (server-side, không dùng cookie FE).
        viewed_posts = request.session.get('viewed_posts', [])
        if instance.id not in viewed_posts:
            viewed_posts.append(instance.id)
            request.session['viewed_posts'] = viewed_posts[-20:]  # giữ tối đa 20 bài gần nhất.

        serializer = self.get_serializer(instance)
        response = Response(serializer.data)
        # Đính kèm danh sách ID vào response header để dễ demo session management.
        response['X-Recently-Viewed'] = str(request.session['viewed_posts'])
        return response

    def _is_admin(self):
        """Kiểm tra user hiện tại có quyền Admin không (is_staff hoặc role Admin)."""
        user = self.request.user
        if not user or not user.is_authenticated:
            return False
        return (
            user.is_staff
            or (user.role is not None and user.role.role_name == 'Admin')
        )

    def perform_create(self, serializer):
        """
        Hook của DRF, gọi sau khi serializer.is_valid(). Thực hiện:
          1. Validate lại title/content ở server (không tin hoàn toàn vào FE).
          2. Quét từ khóa cấm (Blacklist) trong title + content.
          3. Lưu Post với user=request.user; status mặc định là PENDING.
          4. Gọi _handle_file_uploads() để lưu file đính kèm.
        """
        title = self.request.data.get('title', '')
        content = self.request.data.get('content', '')

        # Validate lại server-side (PostCreateSerializer cũng validate, nhưng double-check để chắc).
        if len(title.strip()) < 10:
            raise PermissionDenied('Tiêu đề phải có ít nhất 10 ký tự.')
        if len(content.strip()) < 30:
            raise PermissionDenied('Nội dung phải có nhất 30 ký tự.')

        # Quét Blacklist: nếu title/content chứa từ khóa cấm => từ chối ngay.
        blacklisted_keywords = Blacklist.objects.values_list('keyword', flat=True)
        full_text = (title + " " + content).lower()  # gộp và lowercase để match không phân biệt hoa thường.
        for kw in blacklisted_keywords:
            if kw.lower() in full_text:
                raise PermissionDenied(f'Nội dung chứa từ khóa không hợp lệ: "{kw}"')

        instance = serializer.save(user=self.request.user)  # luu Post va gan tac gia la user dang dang nhap.
        self._handle_file_uploads(instance)  # neu co file thi luu file kem theo.

    def perform_update(self, serializer):
        """Xử lý cập nhật bài viết và upload thêm file mới."""
        instance = serializer.save()
        self._handle_file_uploads(instance)

    def _handle_file_uploads(self, instance):
        """
        Xử lý tệp tin từ request.FILES. 
        Lưu tệp vào thư mục media và tạo bản ghi trong bảng Media & TargetMedia.
        """
        # Flow upload:
        # 1. FE gui multipart/form-data voi key attachments.
        # 2. Backend luu file vao media/posts/<post_id>/.
        # 3. Tao Media va TargetMedia de serializer doc lai danh sach URL.
        from api.models import Media, TargetType, TargetMedia
        import os
        import json

        files = self.request.FILES.getlist('attachments')  # cac file FE gui bang key attachments.
        
        # 1. Đồng bộ ảnh cũ (Dùng khi Edit)
        # Frontend gửi danh sách URL các ảnh muốn giữ lại
        raw_images_data = self.request.data.get('images', None)  # danh sach anh cu FE muon giu lai khi edit.
        if raw_images_data:
            try:
                # Có thể là chuỗi JSON hoặc list tùy cách client gửi
                if isinstance(raw_images_data, str):
                    keep_urls = json.loads(raw_images_data)
                else:
                    keep_urls = raw_images_data
                
                # Lấy tất cả media hiện tại của post
                current_target_medias = TargetMedia.objects.filter(
                    target_type=TargetType.POST,
                    target_id=instance.id
                ).select_related('media')

                for tm in current_target_medias:
                    if tm.media.url not in keep_urls:
                        # Nếu ảnh cũ không nằm trong danh sách giữ lại -> Xóa liên kết
                        # (Có thể xóa luôn Media object nếu không dùng chung, ở đây ta xóa liên kết trước)
                        tm.delete()
            except Exception as e:
                print(f"Error syncing existing images: {e}")

        # 2. Upload file mới
        if files:
            from django.conf import settings
            from django.core.files.storage import default_storage

            for f in files:
                # Detect media type
                ext = os.path.splitext(f.name)[1].lower()  # lay duoi file de xac dinh loai.
                media_type = Media.MediaType.IMAGE  # mac dinh xem la anh.
                if ext in ['.mp4', '.mov', '.avi', '.mkv']:
                    media_type = Media.MediaType.VIDEO
                elif ext in ['.pdf', '.doc', '.docx', '.txt']:
                    media_type = Media.MediaType.DOCUMENT

                # Lưu file
                path = default_storage.save(f'posts/{instance.id}/{f.name}', f)  # luu file vao thu muc media.
                url = f"{settings.MEDIA_URL}{path}"  # URL de frontend load file.
                
                # Tạo Media & Liên kết
                media_obj = Media.objects.create(
                    url=url,
                    media_type=media_type
                )
                TargetMedia.objects.create(
                    media=media_obj,
                    target_type=TargetType.POST,
                    target_id=instance.id
                )


    def get_object(self):
        """Kiểm tra object-level permission & State Machine."""
        obj = super().get_object()  # lay object theo id tu URL.
        is_admin = self._is_admin()
        
        if self.action in ['update', 'partial_update', 'destroy']:
            # Kiểm tra quyền sở hữu: user chỉ sửa/xóa bài của chính mình.
            if not is_admin and obj.user != self.request.user:
                raise PermissionDenied('Bạn chỉ có thể chỉnh sửa hoặc xóa bài viết của chính mình.')
            # State Machine: bài APPROVED không được sửa/xóa bởi User thường.
            if not is_admin:
                if obj.status == Post.PostStatus.APPROVED:
                    raise PermissionDenied('Bài viết đã được duyệt không thể chỉnh sửa. Liên hệ Admin nếu cần thay đổi.')
                if obj.status not in [Post.PostStatus.PENDING, Post.PostStatus.REJECTED]:
                    raise PermissionDenied(f'Không thể thực hiện thao tác này khi bài viết ở trạng thái {obj.status}.')
        return obj

    # --- DANH SACH BAI CHO ADMIN KIEM DUYET  - NN -------------------
    @action(detail=False, methods=['get'], permission_classes=[IsAdminRole], url_path='pending')
    def pending_list(self, request):
        """Trả danh sách bài PENDING cho trang kiểm duyệt của admin."""
        posts = Post.objects.filter(status=Post.PostStatus.PENDING).order_by('-created_time')
        page = self.paginate_queryset(posts)
        serializer = PostModerationSerializer(page if page is not None else posts, many=True)
        return self.get_paginated_response(serializer.data) if page is not None else Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[IsAdminRole], url_path='all')
    def all_posts(self, request):
        """
        Trả toàn bộ bài viết (mọi trạng thái) cho trang quản lý admin.
        Hỗ trợ lọc bằng ?status=PENDING|APPROVED|REJECTED|HIDDEN|LOCKED.
        """
        status_filter = request.query_params.get('status', None)
        posts = Post.objects.all().select_related('user', 'category', 'reviewed_by')
        if status_filter:
            posts = posts.filter(status=status_filter.upper())  # đổi về uppercase cho khớp enum PostStatus.
        posts = posts.order_by('-created_time')
        page = self.paginate_queryset(posts)
        serializer = PostModerationSerializer(page if page is not None else posts, many=True)
        return self.get_paginated_response(serializer.data) if page is not None else Response(serializer.data)

    # --- DANH SACH BAI CHO ADMIN KIEM DUYET ---------------
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated], url_path='mine')
    def mine(self, request):
        """Trả danh sách bài của user đang đăng nhập (mọi trạng thái, kể cả PENDING)."""
        posts = Post.objects.filter(user=request.user).order_by('-created_time')
        page = self.paginate_queryset(posts)
        serializer = PostSerializer(page if page is not None else posts, many=True)
        return self.get_paginated_response(serializer.data) if page is not None else Response(serializer.data)

    # --- AI GOI Y CHO KIEM DUYET BAI VIET ----------------------
    @action(detail=True, methods=['post'], permission_classes=[IsAdminRole], url_path='ai-analyze')
    def ai_analyze(self, request, pk=None):
        """
        Endpoint: POST /api/posts/<id>/ai-analyze/
        Admin bấm 'Phân tích' => gọi service AI, lưu kết quả vào post.
        AI không tự chạy khi user đăng bài; chỉ chạy khi admin bấm thủ công.
        Kết quả trả về luôn là gợi ý, admin vẫn là người quyết định cuối cùng.
        """
        post = self.get_object()
        analyze_and_store_post(post)  # cập nhật các field ai_analysis_* trên Post.
        return Response({
            'detail': 'Đã phân tích nội dung bằng AI.',
            'post': PostModerationSerializer(post).data,
        })


    # --- CAC NUT KIEM DUYET BAI VIET (ADMIN) ------------------
    # Tất cả các action bên dưới đều yêu cầu permission IsAdminRole.
    # DRF tự map URL nhờ url_path, ví dụ: url_path='approve' => /api/posts/<id>/approve/


    @action(detail=True, methods=['post'], permission_classes=[IsAdminRole], url_path='approve')
    def approve(self, request, pk=None):
        """
        Duyệt bài: PENDING => APPROVED.
        - Đặt published_time để bài xuất hiện public.
        - Cộng +10 điểm uy tín tác giả, ghi ReputationHistory.
        - Tạo AuditLog lưu vết thao tác admin.
        - Gửi Notification cho tác giả.
        """
        post = self.get_object()
        if post.status != Post.PostStatus.PENDING:
            # Chỉ approve bài đang chờ duyệt, tránh approve lại bài đã xử lý.
            return Response({'detail': 'Chỉ có thể duyệt bài PENDING.'}, status=status.HTTP_400_BAD_REQUEST)

        post.status = Post.PostStatus.APPROVED  # bài xuất hiện ở public list.
        post.published_time = timezone.now()    # mốc thời gian được phép public.
        _mark_reviewed(post, request.user)      # lưu admin nào đã duyệt và lúc nào.
        post.save()

        # Thưởng +10 điểm uy tín cho tác giả vì bài hợp lệ.
        author = post.user
        author.reputation_score += 10
        author.save()
        from api.models import ReputationHistory
        ReputationHistory.objects.create(
            user=author,
            action_type="Bài viết được phê duyệt: " + post.title,
            score_change=10
        )

        # Ghi AuditLog để admin tra cứu lịch sử.
        AuditLog.objects.create(action='APPROVE', admin_user=request.user, target_post=post)
        _send_notification(post.user, f'Bài viết "{post.title}" của bạn đã được phê duyệt.')
        return Response({'detail': 'Bài viết đã được duyệt.', 'post': PostModerationSerializer(post).data})

    @action(detail=True, methods=['post'], permission_classes=[IsAdminRole], url_path='reject')
    def reject(self, request, pk=None):
        """
        Từ chối bài: PENDING => REJECTED.
        Bắt buộc body { "reason": "..." } (≥ 10 ký tự) để lưu lý do và gửi Notification.
        """
        post = self.get_object()
        if post.status != Post.PostStatus.PENDING:
            return Response({'detail': 'Chỉ có thể từ chối bài PENDING.'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = RejectPostSerializer(data=request.data)  # validate reason từ FE gửi lên.
        serializer.is_valid(raise_exception=True)
        reason = serializer.validated_data['reason']

        post.status = Post.PostStatus.REJECTED  # bài không hiển thị public.
        _mark_reviewed(post, request.user, reason)
        post.save()

        AuditLog.objects.create(action='REJECT', admin_user=request.user, target_post=post, reason=reason)
        _send_notification(post.user, f'Bài viết "{post.title}" đã bị từ chối. Lý do: {reason}')
        return Response({'detail': 'Bài viết đã bị từ chối.', 'post': PostModerationSerializer(post).data})

    @action(detail=True, methods=['post'], permission_classes=[IsAdminRole], url_path='hide')
    def hide(self, request, pk=None):
        """
        Ẩn bài: bất kỳ trạng thái => HIDDEN.
        Bài vẫn còn trong DB nhưng không hiển thị trang public.
        Dùng khi bài đã APPROVED nhưng phát hiện vi phạm sau đó.
        """
        post = self.get_object()
        serializer = HidePostSerializer(data=request.data)  # bắt buộc reason ≥ 10 ký tự.
        serializer.is_valid(raise_exception=True)
        reason = serializer.validated_data['reason']

        post.status = Post.PostStatus.HIDDEN  # public query không trả bài HIDDEN.
        _mark_reviewed(post, request.user, reason)
        post.save()

        AuditLog.objects.create(action='HIDE', admin_user=request.user, target_post=post, reason=reason)
        return Response({'detail': 'Bài viết đã được ẩn.'})

    @action(detail=True, methods=['post'], permission_classes=[IsAdminRole], url_path='lock')
    def lock(self, request, pk=None):
        """
        Khóa bài: bất kỳ trạng thái => LOCKED.
        Bài vẫn hiển thị nhưng không cho bình luận / chỉnh sửa thêm.
        """
        post = self.get_object()
        serializer = LockPostSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        reason = serializer.validated_data['reason']

        post.status = Post.PostStatus.LOCKED  # FE hiển thị badge "Đã khóa".
        _mark_reviewed(post, request.user, reason)
        post.save()

        AuditLog.objects.create(action='LOCK', admin_user=request.user, target_post=post, reason=reason)
        return Response({'detail': 'Bài viết đã bị khóa.'})

    @action(detail=True, methods=['delete'], permission_classes=[IsAdminRole], url_path='admin-delete')
    def admin_delete(self, request, pk=None):
        # DELETE: xoa vinh vien, nen FE phai gui reason va confirm=true.
        post = self.get_object()
        serializer = AdminDeletePostSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        reason = serializer.validated_data.get('reason', '')  # ly do xoa duoc luu vao audit log.
        _send_notification(post.user, f'Bài viết "{post.title}" đã bị xóa do vi phạm.')  # thong bao truoc khi xoa object.
        
        # Audit Log
        AuditLog.objects.create(
            action='DELETE',  # target_post=None vi sau do post.delete() se xoa ban ghi.
            admin_user=request.user,
            target_post=None,  # Bài viết bị xóa khỏi DB, giữ ID logic trong Audit nếu cần
            reason=reason
        )
        
        post.delete()  # xoa ban ghi Post khoi database.
        return Response({'detail': 'Bài viết đã bị xóa vĩnh viễn.'})


