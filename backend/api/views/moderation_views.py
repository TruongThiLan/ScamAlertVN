from django.utils import timezone
from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response

from api.models import (
    User, Post, ScamCategory, Comment,
    ContentReport, Notification, TargetType
)
from api.serializers import (
    UserSerializer, UserBriefSerializer,
    PostSerializer, PostModerationSerializer,
    ApprovePostSerializer, RejectPostSerializer,
    HidePostSerializer, LockPostSerializer, AdminDeletePostSerializer,
    ScamCategorySerializer,
    CommentSerializer,
    ContentReportSerializer, ContentReportCreateSerializer,
)
from api.permissions import IsAdminRole, IsAdminOrReadOnly


# ========================================================
# HELPER
# ========================================================

def _send_notification(user: User, message: str):
    """Tạo notification cho user."""
    Notification.objects.create(user=user, content=message)


def _mark_reviewed(post: Post, admin_user: User, reason: str = None):
    """Cập nhật tracking fields của post sau khi Admin xử lý."""
    post.reviewed_by = admin_user
    post.reviewed_at = timezone.now()
    if reason:
        post.rejection_reason = reason


# ========================================================
# USER VIEW
# ========================================================

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().select_related('role')
    serializer_class = UserSerializer

    def _is_admin(self):
        user = self.request.user
        if not user or not user.is_authenticated:
            return False
        return (
            user.is_staff
            or (user.role is not None and user.role.role_name == 'Admin')
        )

    def get_permissions(self):
        if self.action == 'me':
            return [permissions.IsAuthenticated()]
        if self.action in ['list', 'create', 'destroy']:
            return [IsAdminRole()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        queryset = User.objects.all().select_related('role')
        if self._is_admin():
            return queryset
        if self.request.user and self.request.user.is_authenticated:
            return queryset.filter(pk=self.request.user.pk)
        return queryset.none()

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def me(self, request):
        """Trả về thông tin của user đang đăng nhập."""
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)


# ========================================================
# SCAM CATEGORY VIEW
# ========================================================

class ScamCategoryViewSet(viewsets.ModelViewSet):
    """
    UC 4.1 — Quản lý danh mục lừa đảo.
    - GET (list/retrieve): Mọi người xem được.
    - POST/PUT/PATCH/DELETE: Chỉ Admin.
    """
    queryset = ScamCategory.objects.all()
    serializer_class = ScamCategorySerializer
    permission_classes = [IsAdminOrReadOnly]

    def destroy(self, request, *args, **kwargs):
        """Không cho xóa danh mục nếu đang có bài viết liên kết."""
        instance = self.get_object()
        if instance.posts.exists():
            return Response(
                {
                    'detail': (
                        f'Không thể xóa danh mục "{instance.category_name}" '
                        f'vì đang có {instance.posts.count()} bài viết sử dụng.'
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        return super().destroy(request, *args, **kwargs)


# ========================================================
# POST VIEW
# ========================================================

class PostViewSet(viewsets.ModelViewSet):
    """
    Quản lý bài viết + kiểm duyệt.

    Public endpoints (read-only):
      GET /api/posts/        → Danh sách bài APPROVED
      GET /api/posts/{id}/   → Chi tiết bài APPROVED

    Admin-only endpoints:
      GET  /api/posts/pending/            → UC 3.1 — Danh sách bài chờ duyệt
      GET  /api/posts/all/                → Tất cả bài (để quản lý)
      POST /api/posts/{id}/approve/       → UC 3.1 — Duyệt bài
      POST /api/posts/{id}/reject/        → UC 3.1 — Từ chối bài
      POST /api/posts/{id}/hide/          → UC 3.3 — Ẩn bài
      POST /api/posts/{id}/lock/          → UC 3.3 — Khóa bài
      POST /api/posts/{id}/admin_delete/  → UC 3.2 — Xóa bài vi phạm
    """
    queryset = Post.objects.all().select_related('user', 'category', 'reviewed_by')
    serializer_class = PostSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        # Mặc định: chỉ bài APPROVED cho public
        if self.action in ['list', 'retrieve'] and not self._is_admin():
            return Post.objects.filter(
                status=Post.PostStatus.APPROVED
            ).select_related('user', 'category').order_by('-created_time')
        return Post.objects.all().select_related('user', 'category', 'reviewed_by')

    def get_serializer_class(self):
        # Các action admin dùng PostModerationSerializer
        if self.action in [
            'pending_list', 'all_posts',
            'approve', 'reject', 'hide', 'lock', 'admin_delete'
        ]:
            return PostModerationSerializer
        return PostSerializer

    def _is_admin(self):
        user = self.request.user
        if not user or not user.is_authenticated:
            return False
        return (
            user.is_staff
            or (user.role is not None and user.role.role_name == 'Admin')
        )

    # ---------------------------------------------------------
    # UC 3.1 — Danh sách bài chờ duyệt
    # ---------------------------------------------------------
    @action(
        detail=False, methods=['get'],
        permission_classes=[IsAdminRole],
        url_path='pending'
    )
    def pending_list(self, request):
        """Lấy danh sách tất cả bài viết đang ở trạng thái PENDING."""
        posts = Post.objects.filter(
            status=Post.PostStatus.PENDING
        ).select_related('user', 'category').order_by('-created_time')

        page = self.paginate_queryset(posts)
        if page is not None:
            serializer = PostModerationSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = PostModerationSerializer(posts, many=True)
        return Response(serializer.data)

    # ---------------------------------------------------------
    # Tất cả bài (admin quản lý)
    # ---------------------------------------------------------
    @action(
        detail=False, methods=['get'],
        permission_classes=[IsAdminRole],
        url_path='all'
    )
    def all_posts(self, request):
        """Lấy tất cả bài viết (mọi trạng thái) cho trang quản lý."""
        status_filter = request.query_params.get('status', None)
        posts = Post.objects.all().select_related('user', 'category', 'reviewed_by')

        if status_filter:
            posts = posts.filter(status=status_filter.upper())

        posts = posts.order_by('-created_time')

        page = self.paginate_queryset(posts)
        if page is not None:
            serializer = PostModerationSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = PostModerationSerializer(posts, many=True)
        return Response(serializer.data)

    # ---------------------------------------------------------
    # Bài viết của tôi (Người dùng xem lại bài của mình)
    # ---------------------------------------------------------
    @action(
        detail=False, methods=['get'],
        permission_classes=[permissions.IsAuthenticated],
        url_path='mine'
    )
    def mine(self, request):
        """Lấy danh sách bài viết do chính người dùng hiện tại đăng."""
        posts = Post.objects.filter(
            user=request.user
        ).select_related('category').order_by('-created_time')

        page = self.paginate_queryset(posts)
        if page is not None:
            # Dùng PostSerializer hoặc PostModerationSerializer tùy nhu cầu hiện thông tin
            serializer = PostSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = PostSerializer(posts, many=True)
        return Response(serializer.data)

    # ---------------------------------------------------------
    # UC 3.1 — Duyệt bài
    # ---------------------------------------------------------
    @action(
        detail=True, methods=['post'],
        permission_classes=[IsAdminRole],
        url_path='approve'
    )
    def approve(self, request, pk=None):
        """Duyệt bài viết (chỉ bài PENDING mới được duyệt)."""
        post = self.get_object()

        if post.status != Post.PostStatus.PENDING:
            return Response(
                {'detail': f'Chỉ có thể duyệt bài đang ở trạng thái PENDING. Trạng thái hiện tại: {post.status}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = ApprovePostSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        post.status = Post.PostStatus.APPROVED
        post.published_time = timezone.now()
        _mark_reviewed(post, request.user)
        post.save()

        # Gửi thông báo
        _send_notification(
            post.user,
            f'Bài viết "{post.title}" của bạn đã được phê duyệt và xuất bản.'
        )

        return Response(
            {'detail': 'Bài viết đã được duyệt thành công.', 'post': PostModerationSerializer(post).data},
            status=status.HTTP_200_OK
        )

    # ---------------------------------------------------------
    # UC 3.1 — Từ chối bài
    # ---------------------------------------------------------
    @action(
        detail=True, methods=['post'],
        permission_classes=[IsAdminRole],
        url_path='reject'
    )
    def reject(self, request, pk=None):
        """Từ chối bài viết (bắt buộc nhập lý do)."""
        post = self.get_object()

        if post.status != Post.PostStatus.PENDING:
            return Response(
                {'detail': f'Chỉ có thể từ chối bài đang ở trạng thái PENDING. Trạng thái hiện tại: {post.status}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = RejectPostSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        reason = serializer.validated_data['reason']
        post.status = Post.PostStatus.REJECTED
        _mark_reviewed(post, request.user, reason)
        post.save()

        # Gửi thông báo cho người đăng
        _send_notification(
            post.user,
            f'Bài viết "{post.title}" của bạn đã bị từ chối. Lý do: {reason}'
        )

        return Response(
            {'detail': 'Bài viết đã bị từ chối.', 'post': PostModerationSerializer(post).data},
            status=status.HTTP_200_OK
        )

    # ---------------------------------------------------------
    # UC 3.3 — Ẩn bài
    # ---------------------------------------------------------
    @action(
        detail=True, methods=['post'],
        permission_classes=[IsAdminRole],
        url_path='hide'
    )
    def hide(self, request, pk=None):
        """Ẩn bài viết (bắt buộc nhập lý do). Bài bị ẩn không hiển thị với user thường."""
        post = self.get_object()

        if post.status in [Post.PostStatus.REJECTED]:
            return Response(
                {'detail': 'Không thể ẩn bài đã bị từ chối.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = HidePostSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        reason = serializer.validated_data['reason']
        post.status = Post.PostStatus.HIDDEN
        _mark_reviewed(post, request.user, reason)
        post.save()

        _send_notification(
            post.user,
            f'Bài viết "{post.title}" của bạn đã bị ẩn. Lý do: {reason}'
        )

        return Response(
            {'detail': 'Bài viết đã được ẩn.', 'post': PostModerationSerializer(post).data},
            status=status.HTTP_200_OK
        )

    # ---------------------------------------------------------
    # UC 3.3 — Khóa bài
    # ---------------------------------------------------------
    @action(
        detail=True, methods=['post'],
        permission_classes=[IsAdminRole],
        url_path='lock'
    )
    def lock(self, request, pk=None):
        """Khóa bài viết (bắt buộc nhập lý do). Bài bị khóa không cho bình luận/chỉnh sửa."""
        post = self.get_object()

        if post.status in [Post.PostStatus.REJECTED, Post.PostStatus.HIDDEN]:
            return Response(
                {'detail': 'Không thể khóa bài đã bị từ chối hoặc ẩn.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = LockPostSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        reason = serializer.validated_data['reason']
        post.status = Post.PostStatus.LOCKED
        _mark_reviewed(post, request.user, reason)
        post.save()

        _send_notification(
            post.user,
            f'Bài viết "{post.title}" của bạn đã bị khóa. Lý do: {reason}'
        )

        return Response(
            {'detail': 'Bài viết đã bị khóa.', 'post': PostModerationSerializer(post).data},
            status=status.HTTP_200_OK
        )

    # ---------------------------------------------------------
    # UC 3.2 — Admin xóa bài vi phạm
    # ---------------------------------------------------------
    @action(
        detail=True, methods=['delete'],
        permission_classes=[IsAdminRole],
        url_path='admin-delete'
    )
    def admin_delete(self, request, pk=None):
        """
        Xóa cứng bài viết vi phạm nghiêm trọng.
        Body bắt buộc: { "reason": "...", "confirm": true }
        """
        post = self.get_object()

        serializer = AdminDeletePostSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        reason = serializer.validated_data['reason']
        post_title = post.title
        post_user = post.user

        # Gửi thông báo trước khi xóa
        _send_notification(
            post_user,
            f'Bài viết "{post_title}" của bạn đã bị xóa do vi phạm. Lý do: {reason}'
        )

        post.delete()

        return Response(
            {'detail': f'Bài viết "{post_title}" đã bị xóa vĩnh viễn.'},
            status=status.HTTP_200_OK
        )


# ========================================================
# CONTENT REPORT VIEW
# ========================================================

class ContentReportViewSet(viewsets.ModelViewSet):
    """
    Quản lý báo cáo vi phạm nội dung.

    User endpoints:
      POST /api/reports/       → Tạo báo cáo mới

    Admin endpoints:
      GET  /api/reports/       → Danh sách tất cả báo cáo
      GET  /api/reports/{id}/  → Chi tiết báo cáo
      POST /api/reports/{id}/dismiss/  → Bác bỏ báo cáo (không vi phạm)
      POST /api/reports/{id}/process/  → Đánh dấu đã xử lý
    """
    queryset = ContentReport.objects.all().select_related('reporter_user').order_by('-reported_time')
    http_method_names = ['get', 'post', 'head', 'options']  # Không cho PUT/PATCH/DELETE

    def get_serializer_class(self):
        if self.action == 'create':
            return ContentReportCreateSerializer
        return ContentReportSerializer

    def get_permissions(self):
        if self.action == 'create':
            return [permissions.IsAuthenticated()]
        return [IsAdminRole()]

    def get_queryset(self):
        qs = ContentReport.objects.all().select_related('reporter_user').order_by('-reported_time')

        # Lọc theo processing_status nếu có
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            qs = qs.filter(processing_status=status_filter.upper())

        # Lọc theo target_type nếu có
        target_type = self.request.query_params.get('target_type', None)
        if target_type:
            qs = qs.filter(target_type=target_type.upper())

        return qs

    def perform_create(self, serializer):
        """Gắn reporter_user = user đang đăng nhập khi tạo báo cáo."""
        serializer.save(reporter_user=self.request.user)

    # ---------------------------------------------------------
    # Bác bỏ báo cáo
    # ---------------------------------------------------------
    @action(
        detail=True, methods=['post'],
        permission_classes=[IsAdminRole],
        url_path='dismiss'
    )
    def dismiss(self, request, pk=None):
        """Bác bỏ báo cáo — nội dung không vi phạm."""
        report = self.get_object()

        if report.processing_status != ContentReport.ProcessStatus.PENDING:
            return Response(
                {'detail': 'Báo cáo này đã được xử lý rồi.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        report.processing_status = ContentReport.ProcessStatus.DISMISSED
        report.save()

        return Response(
            {'detail': 'Báo cáo đã bị bác bỏ.', 'report': ContentReportSerializer(report).data},
            status=status.HTTP_200_OK
        )

    # ---------------------------------------------------------
    # Đánh dấu đã xử lý
    # ---------------------------------------------------------
    @action(
        detail=True, methods=['post'],
        permission_classes=[IsAdminRole],
        url_path='process'
    )
    def process(self, request, pk=None):
        """Đánh dấu báo cáo đã được xử lý."""
        report = self.get_object()

        if report.processing_status != ContentReport.ProcessStatus.PENDING:
            return Response(
                {'detail': 'Báo cáo này đã được xử lý rồi.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        report.processing_status = ContentReport.ProcessStatus.PROCESSED
        report.save()

        return Response(
            {'detail': 'Báo cáo đã được đánh dấu là đã xử lý.', 'report': ContentReportSerializer(report).data},
            status=status.HTTP_200_OK
        )
