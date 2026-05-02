
# ============================================================
# interact_views.py
# Chức năng: Tương tác & Phản hồi (UC 10.1 – 10.4)
# Author   : Thảo B
#
# CÁC PHẦN LIÊN KẾT CHỨC NĂNG KHÁC:
#   - Post model & PostStatus   → post_views.py (Nguyệt / chức năng quản lý bài viết)
#   - User.reputation_score     → user_views.py (chức năng quản lý tài khoản)
#   - ReputationHistory model   → models.py (dùng chung)
#   - AuditLog                  → post_views.py đang dùng, tạm thời không dùng ở đây
#   - IsAdminRole permission    → permissions.py (dùng chung)
#   - Notification              → models.py (dùng chung, tạo thông báo ở đây)
# ============================================================

import os
import json

from django.conf import settings
from django.core.files.storage import default_storage

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied

from api.models import (
    ContentReport, Comment, Reaction, TargetType,
    Post, Bookmark, ReputationHistory, Notification,
    Media, TargetMedia, User
)
from api.serializers.interact_serializers import (
    ContentReportSerializer,
    ContentReportCreateSerializer,
    CommentSerializer,
    ReactionToggleSerializer,
    PostShareSerializer,
)
from api.permissions import IsAdminRole


# ============================================================
# HELPERS – Dùng nội bộ trong file này
# ============================================================

def _send_notification(user, message: str):
    """
    Tạo Notification cho user.
    NOTE: Hàm này cũng tồn tại ở post_views.py (Nguyệt viết).
    Nếu nhóm refactor thì nên chuyển vào api/utils.py dùng chung.
    """
    Notification.objects.create(user=user, content=message)


def _add_reputation(user, score_change: int, action_type: str):
    """
    Cộng / trừ điểm uy tín cho user và ghi lịch sử.
    NOTE: reputation_score không được âm (MinValueValidator(0) ở models.py),
    nên khi trừ cần kiểm tra để tránh lỗi DB.
    """
    if score_change < 0:
        # Không cho âm dưới 0
        user.reputation_score = max(0, user.reputation_score + score_change)
    else:
        user.reputation_score += score_change
    user.save(update_fields=['reputation_score'])

    ReputationHistory.objects.create(
        user=user,
        action_type=action_type,
        score_change=score_change,
    )


# ============================================================
# MILESTONE THRESHOLDS – UC 10.3 Business Rule
# Bài viết đạt X upvote → cộng Y điểm cho tác giả (tích lũy)
# 1000 → +1 | 3000 → +3 | 5000 → +5
# Tổng cộng khi đạt 5000: 1+3+5 = 9 điểm
# ============================================================

LIKE_MILESTONES = [
    (5000, 5),   # đạt 5000: cộng thêm 5
    (3000, 3),   # đạt 3000: cộng thêm 3
    (1000, 1),   # đạt 1000: cộng thêm 1
]


def _sync_milestone_reputation(post: Post, old_count: int, new_count: int):
    """
    Sau mỗi lần like/unlike, kiểm tra milestone và cộng / trừ điểm uy tín tương ứng.

    Logic:
    - Với mỗi milestone (threshold, points):
        * Nếu old_count < threshold <= new_count  → vừa VƯỢT qua ngưỡng → cộng điểm
        * Nếu new_count < threshold <= old_count  → vừa TỤT XUỐNG dưới ngưỡng → trừ điểm
    """
    author = post.user
    for threshold, points in LIKE_MILESTONES:
        crossed_up   = old_count < threshold <= new_count
        crossed_down = new_count < threshold <= old_count

        if crossed_up:
            _add_reputation(
                author,
                score_change=points,
                action_type=f'Bài viết "{post.title}" đạt {threshold} lượt thích'
            )
            _send_notification(
                author,
                f'🎉 Bài viết "{post.title}" đã đạt {threshold} lượt thích! Bạn được +{points} điểm uy tín.'
            )

        elif crossed_down:
            _add_reputation(
                author,
                score_change=-points,
                action_type=f'Bài viết "{post.title}" giảm xuống dưới {threshold} lượt thích'
            )


# ============================================================
# UC 10.3 – REACTION (Like/Unlike bài viết & bình luận)
# ============================================================

class ReactionViewSet(viewsets.ViewSet):
    """
    Quản lý lượt thích (Upvote/Downvote) cho Post và Comment.
    Endpoint chính: POST /api/reactions/toggle/
    """
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['post'])
    def toggle(self, request):
        """
        UC 10.3 – Toggle Like / Unlike.

        FE gửi: { target_type, target_id, reaction_type (default: UPVOTE) }
        Response:
          - { status: 'reacted',   type: 'UPVOTE', likes_count: N }  khi Like thành công
          - { status: 'unreacted', type: 'UPVOTE', likes_count: N }  khi Unlike thành công

        Business Rule (UC 10.3):
          - Bài viết đạt 1000 upvote → tác giả +1 điểm uy tín
          - Bài viết đạt 3000 upvote → tác giả +3 điểm uy tín (tổng +4)
          - Bài viết đạt 5000 upvote → tác giả +5 điểm uy tín (tổng +9)
          - Khi số like tụt xuống dưới ngưỡng → trừ lại điểm tương ứng
        """
        serializer = ReactionToggleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        target_type   = serializer.validated_data['target_type']
        target_id     = serializer.validated_data['target_id']
        reaction_val  = serializer.validated_data['reaction_type']

        # ---- Kiểm tra trạng thái bài viết (không like bài bị khóa/ẩn) ----
        if target_type == TargetType.POST:
            post = Post.objects.filter(pk=target_id).first()
            if post and post.status in [Post.PostStatus.LOCKED, Post.PostStatus.HIDDEN]:
                raise PermissionDenied('Không thể tương tác với bài viết đã bị khóa hoặc bị ẩn.')

        # ---- Đếm trước khi toggle ----
        old_count = Reaction.objects.filter(
            target_type=target_type,
            target_id=target_id,
            reaction_type='UPVOTE'
        ).count()

        # ---- Toggle ----
        reaction, created = Reaction.objects.get_or_create(
            user=request.user,
            target_type=target_type,
            target_id=target_id,
            defaults={'reaction_type': reaction_val}
        )

        if not created:
            # Đã like → Unlike
            reaction.delete()
            new_count = old_count - 1
            result_status = 'unreacted'
        else:
            new_count = old_count + 1
            result_status = 'reacted'

        # ---- Cập nhật milestone điểm uy tín (chỉ áp dụng cho POST) ----
        if target_type == TargetType.POST and post:
            _sync_milestone_reputation(post, old_count, new_count)

        return Response({
            'status'     : result_status,
            'type'       : reaction_val,
            'likes_count': new_count,
        })

    @action(detail=False, methods=['get'], url_path='my-reactions')
    def my_reactions(self, request):
        """
        Trả về danh sách target_id mà user đang đăng nhập đã like.
        Dùng để FE render trạng thái nút Like (đã like hay chưa).
        Query param: ?target_type=POST hoặc ?target_type=COMMENT
        """
        target_type = request.query_params.get('target_type', TargetType.POST)
        ids = Reaction.objects.filter(
            user=request.user,
            target_type=target_type,
            reaction_type='UPVOTE'
        ).values_list('target_id', flat=True)
        return Response({'reacted_ids': list(ids)})


# ============================================================
# UC 10.2 – COMMENT (Bình luận & Phản hồi bình luận)
# ============================================================

class CommentViewSet(viewsets.ModelViewSet):
    """
    Quản lý bình luận và reply (phản hồi bình luận).
    Endpoint: /api/comments/

    - GET  /api/comments/?post=<id>  → lấy tất cả comment cấp 1 của bài viết (kèm replies lồng)
    - POST /api/comments/            → tạo comment mới (gốc hoặc reply)
    - PUT/PATCH /api/comments/<id>/  → sửa comment (chỉ chủ sở hữu)
    - DELETE /api/comments/<id>/     → xóa comment (chủ sở hữu hoặc Admin)
    """
    queryset = Comment.objects.all() \
        .select_related('user', 'post', 'parent_comment') \
        .prefetch_related('replies__user', 'replies__replies')  # prefetch để tránh N+1

    serializer_class   = CommentSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        """
        Lọc comment theo post_id nếu có query param ?post=<id>.
        Mặc định chỉ trả comment cấp 1 (parent_comment=None) để tránh duplicate.
        Replies sẽ được lồng bên trong qua get_replies() của serializer.
        """
        qs      = super().get_queryset()
        post_id = self.request.query_params.get('post')
        if post_id:
            qs = qs.filter(post_id=post_id, parent_comment__isnull=True)
        return qs

    def perform_create(self, serializer):
        """
        UC 10.2 – Tạo bình luận / phản hồi bình luận.
        - Không cho bình luận vào bài viết LOCKED hoặc HIDDEN.
        - Không giới hạn cấp reply (FE gửi parent_comment để tạo reply).
        - Hỗ trợ đính kèm ảnh qua request.FILES['attachments'].
        """
        # FIX: Lấy post trực tiếp từ DB thay vì dùng object từ validated_data
        # Lý do: DRF validate FK bằng cách query Post.objects.all() không có
        # select_related('user'), nên post.user_id có thể không được load đúng.
        # Để chắc chắn, query lại với select_related('user') trước khi so sánh.
        post_raw = serializer.validated_data.get('post')
        post = None
        if post_raw is not None:
            post = Post.objects.select_related('user').filter(pk=post_raw.pk).first()

        if post and post.status in [Post.PostStatus.LOCKED, Post.PostStatus.HIDDEN]:
            raise PermissionDenied('Không thể bình luận vào bài viết đã bị khóa hoặc bị ẩn.')

        # --- Xác định is_anonymous cho comment ---
        # Chỉ ẩn danh khi: bài viết ẩn danh VÀ người comment là chính tác giả bài viết
        # So sánh int với int (cả hai đều là integer primary key)
        is_anonymous = (
            post is not None
            and post.is_anonymous is True
            and int(post.user_id) == int(self.request.user.pk)
        )
        # Lưu comment, tự gán user từ request
        instance = serializer.save(
            user=self.request.user,
            is_anonymous=is_anonymous,
        )

        # Xử lý upload ảnh đính kèm (nếu có)
        self._handle_file_uploads(instance)

        # NOTE: Nếu có tính năng thông báo cho tác giả bài viết
        # khi có người bình luận, bổ sung _send_notification() ở đây.
        # → Liên quan chức năng Thông báo (teammate khác phụ trách).

    def get_object(self):
        """
        Kiểm tra quyền sở hữu trước khi update / delete.
        Admin có thể xóa mọi comment.
        """
        obj = super().get_object()
        if self.action in ['update', 'partial_update', 'destroy']:
            is_admin = (
                self.request.user.is_staff
                or (
                    hasattr(self.request.user, 'role')
                    and self.request.user.role
                    and self.request.user.role.role_name == 'Admin'
                )
            )
            if not is_admin and obj.user != self.request.user:
                raise PermissionDenied('Bạn chỉ có thể chỉnh sửa hoặc xóa bình luận của chính mình.')
        return obj

    def _handle_file_uploads(self, instance: Comment):
        """
        Xử lý upload ảnh đính kèm cho comment.
        FE gửi file qua multipart/form-data với key 'attachments'.
        Lưu vào thư mục media/comments/<comment_id>/ và tạo bản ghi TargetMedia.
        """
        files = self.request.FILES.getlist('attachments')
        if not files:
            return

        for f in files:
            ext        = os.path.splitext(f.name)[1].lower()
            media_type = Media.MediaType.IMAGE

            if ext in ['.mp4', '.mov', '.avi', '.mkv']:
                media_type = Media.MediaType.VIDEO
            elif ext in ['.pdf', '.doc', '.docx', '.txt']:
                media_type = Media.MediaType.DOCUMENT

            path = default_storage.save(f'comments/{instance.id}/{f.name}', f)
            url  = f"{settings.MEDIA_URL}{path}"

            media_obj = Media.objects.create(url=url, media_type=media_type)
            TargetMedia.objects.create(
                media=media_obj,
                target_type=TargetType.COMMENT,
                target_id=instance.id,
            )

    @action(
        detail=True,
        methods=['get'],
        permission_classes=[permissions.AllowAny],
        url_path='replies'
    )
    def replies(self, request, pk=None):
        """
        UC 10.2b – Lấy danh sách reply của một comment cụ thể.
        Endpoint: GET /api/comments/<id>/replies/
        Không giới hạn số cấp reply.
        """
        comment = self.get_object()
        replies = comment.replies.all().select_related('user').prefetch_related('replies__user')
        serializer = CommentSerializer(replies, many=True, context={'request': request})
        return Response(serializer.data)


# ============================================================
# UC 10.4 – CONTENT REPORT (Báo cáo bài viết / bình luận)
# ============================================================

class ContentReportViewSet(viewsets.ModelViewSet):
    """
    Quản lý báo cáo vi phạm nội dung.

    - POST /api/reports/              → User gửi báo cáo mới  (cần đăng nhập)
    - GET  /api/reports/              → Admin xem tất cả báo cáo
    - POST /api/reports/<id>/dismiss/ → Admin bác bỏ báo cáo
    - POST /api/reports/<id>/process/ → Admin đánh dấu đã xử lý
    """
    queryset = ContentReport.objects.all() \
        .select_related('reporter_user') \
        .order_by('-reported_time')

    # Chỉ cho phép GET và POST (không PUT/DELETE qua ViewSet mặc định)
    http_method_names = ['get', 'post', 'head', 'options']

    def get_serializer_class(self):
        if self.action == 'create':
            return ContentReportCreateSerializer
        return ContentReportSerializer

    def get_permissions(self):
        """
        - create (gửi báo cáo): User đăng nhập
        - list/retrieve + dismiss/process: Admin
        """
        if self.action == 'create':
            return [permissions.IsAuthenticated()]
        return [IsAdminRole()]

    def perform_create(self, serializer):
        """
        Lưu báo cáo, gán reporter_user từ request.
        Điểm uy tín và việc ẩn nội dung chỉ được áp dụng sau khi Admin xử lý.
        """
        serializer.save(reporter_user=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[IsAdminRole], url_path='dismiss')
    def dismiss(self, request, pk=None):
        """Admin bac bo bao cao va khong thay doi diem/noi dung."""
        report = self.get_object()
        if report.processing_status != ContentReport.ProcessStatus.PENDING:
            return Response(
                {'detail': 'Báo cáo này đã được xử lý trước đó.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        report.processing_status = ContentReport.ProcessStatus.DISMISSED
        report.save(update_fields=['processing_status'])
        return Response({'detail': 'Báo cáo đã bị bác bỏ.'})

    @action(detail=True, methods=['post'], permission_classes=[IsAdminRole], url_path='process')
    def process(self, request, pk=None):
        """
        UC 10.4 – Admin xác nhận báo cáo có căn cứ và đã xử lý.
        Trạng thái: PENDING → PROCESSED

        Business Rule (UC 10.4):
          - Người báo cáo được +5 điểm uy tín vì báo cáo hợp lệ.
          - Người bị báo cáo bị -10 điểm uy tín (bị báo cáo có căn cứ).
          NOTE: Hành động xóa / ẩn nội dung vi phạm thực hiện ở post_views.py
                (do Nguyệt / chức năng kiểm duyệt phụ trách).
        """
        # """Admin duyệt thủ công các báo cáo còn đang PENDING."""
        report = self.get_object()
        if report.processing_status != ContentReport.ProcessStatus.PENDING:
            return Response(
                {'detail': 'Báo cáo này đã được xử lý trước đó.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        self._apply_report_logic(report, is_auto=False)
        return Response({'detail': 'Admin đã phê duyệt báo cáo thành công.'})

    # --- HÀM DÙNG CHUNG ĐỂ TRÁNH VIẾT LẠI CODE ---
    def _apply_report_logic(self, report, is_auto=False):
        """Hàm tập trung logic cộng/trừ điểm và ẩn bài viết."""
        report.processing_status = ContentReport.ProcessStatus.PROCESSED
        report.save()

        suffix = "(Hệ thống tự duyệt)" if is_auto else "(Admin duyệt)"

        # 1. Cộng điểm người báo
        _add_reputation(report.reporter_user, 5, f'Báo cáo thành công {suffix}')

        # 2. Trừ điểm người bị báo và ẩn bài
        reported_user = None
        if report.target_type == TargetType.POST:
            post = Post.objects.filter(pk=report.target_id).first()
            if post:
                reported_user = post.user
                post.status = Post.PostStatus.HIDDEN
                post.save()
        elif report.target_type == TargetType.COMMENT:
            comment = Comment.objects.filter(pk=report.target_id).first()
            if comment:
                reported_user = comment.user
        elif report.target_type == TargetType.USER:
            reported_user = User.objects.filter(pk=report.target_id).first()

        if reported_user:
            _add_reputation(reported_user, -10, f'Bị báo cáo có căn cứ {suffix}')

# ============================================================
# UC 10.1 – SHARE (Chia sẻ bài viết)
# ============================================================

class PostShareViewSet(viewsets.ViewSet):
    """
    UC 10.1 – Chia sẻ bài viết.
    Endpoint: GET /api/posts/<id>/share/
    (Endpoint này được đăng ký trong interact_urls.py và
     có thể gọi từ trang chủ, trang bài viết của tôi, trang chi tiết bài viết.)

    Logic: Chỉ trả về URL bài viết để FE copy vào clipboard.
    Không lưu DB vì chia sẻ ra nền tảng ngoài không cần tracking ở đây.
    NOTE: Nếu sau này cần thống kê lượt chia sẻ thì tạo thêm model ShareLog.
    """
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    @action(detail=True, methods=['get'], url_path='share')
    def share(self, request, pk=None):
        """
        Trả về shareable URL của bài viết.
        FE sẽ dùng URL này để copy vào clipboard (navigator.clipboard.writeText).
        """
        try:
            post = Post.objects.get(pk=pk, status=Post.PostStatus.APPROVED)
        except Post.DoesNotExist:
            return Response(
                {'detail': 'Bài viết không tồn tại hoặc chưa được phê duyệt.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Tạo URL bài viết theo chuẩn FE
        # → FE route thường là: /posts/<id> hoặc /bai-viet/<id>
        # → Thay BASE_FRONTEND_URL trong settings.py theo môi trường thực tế
        base_url  = getattr(settings, 'BASE_FRONTEND_URL', 'http://localhost:5173')
        share_url = f"{base_url}/posts/{post.id}"

        return Response({
            'post_id'   : post.id,
            'post_title': post.title,
            'share_url' : share_url,
        })


# ============================================================
# UC 10.5 – BOOKMARK (Lưu bài viết)
# Thêm vào nếu chức năng bookmark thuộc phạm vi Tương tác
# ============================================================

class BookmarkViewSet(viewsets.ViewSet):
    """
    Quản lý bookmark (lưu bài viết yêu thích).
    Endpoint: POST /api/bookmarks/toggle/
              GET  /api/bookmarks/mine/
    """
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['post'], url_path='toggle')
    def toggle(self, request):
        """
        Toggle bookmark bài viết.
        FE gửi: { post_id }
        Response:
          - { status: 'bookmarked' }   khi lưu thành công
          - { status: 'unbookmarked' } khi bỏ lưu
        """
        post_id = request.data.get('post_id')
        if not post_id:
            return Response(
                {'detail': 'Thiếu post_id.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            post = Post.objects.get(pk=post_id, status=Post.PostStatus.APPROVED)
        except Post.DoesNotExist:
            return Response(
                {'detail': 'Bài viết không tồn tại hoặc chưa được phê duyệt.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        bookmark, created = Bookmark.objects.get_or_create(
            user=request.user,
            post=post,
        )
        if not created:
            bookmark.delete()
            return Response({'status': 'unbookmarked'})

        return Response({'status': 'bookmarked'})

    @action(detail=False, methods=['get'], url_path='mine')
    def mine(self, request):
        """
        Trả về danh sách bài viết đã bookmark của user hiện tại.
        """
        from api.serializers.post_serializers import PostSerializer
        post_ids = Bookmark.objects.filter(user=request.user) \
            .values_list('post_id', flat=True)
        posts = Post.objects.filter(pk__in=post_ids, status=Post.PostStatus.APPROVED) \
            .order_by('-created_time')
        serializer = PostSerializer(posts, many=True, context={'request': request})
        return Response(serializer.data)
