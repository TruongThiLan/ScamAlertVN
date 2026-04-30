from django.utils import timezone
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from ..models import Post, ScamCategory, User, Notification
from ..serializers.report_serializers import PostSerializer, ScamCategorySerializer
from ..serializers.moderation_serializers import (
    PostModerationSerializer, ApprovePostSerializer, 
    RejectPostSerializer, HidePostSerializer, 
    LockPostSerializer, AdminDeletePostSerializer
)
from ..permissions import IsAdminRole, IsAdminOrReadOnly

# ========================================================
# HELPER FUNCTIONS
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
# VIEWS
# ========================================================

class ScamCategoryViewSet(viewsets.ModelViewSet):
    """
    Quản lý danh mục lừa đảo.
    - GET (list/retrieve): Mọi người xem được.
    - POST/PUT/PATCH/DELETE: Chỉ Admin.
    """
    queryset = ScamCategory.objects.all()
    serializer_class = ScamCategorySerializer
    permission_classes = [IsAdminOrReadOnly]
    pagination_class = None

    def destroy(self, request, *args, **kwargs):
        """Không cho xóa danh mục nếu đang có bài viết liên kết."""
        instance = self.get_object()
        if instance.posts.exists():
            return Response(
                {'detail': f'Không thể xóa danh mục "{instance.category_name}" vì đang có {instance.posts.count()} bài viết sử dụng.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        return super().destroy(request, *args, **kwargs)

class PostViewSet(viewsets.ModelViewSet):
    """
    Quản lý bài viết + kiểm duyệt.
    """
    queryset = Post.objects.all().select_related('user', 'category', 'reviewed_by')
    serializer_class = PostSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        # Mặc định: chỉ bài APPROVED cho public
        if self.action in ['list', 'retrieve'] and not self._is_admin():
            return Post.objects.filter(status=Post.PostStatus.APPROVED).select_related('user', 'category').order_by('-created_time')
        return Post.objects.all().select_related('user', 'category', 'reviewed_by')

    def get_serializer_class(self):
        # Các action admin dùng PostModerationSerializer
        admin_actions = ['pending_list', 'all_posts', 'approve', 'reject', 'hide', 'lock', 'admin_delete']
        if self.action in admin_actions:
            return PostModerationSerializer
        return PostSerializer

    def _is_admin(self):
        user = self.request.user
        if not user or not user.is_authenticated:
            return False
        return user.is_staff or (user.role and user.role.role_name == 'Admin')

    @action(detail=False, methods=['get'], permission_classes=[IsAdminRole], url_path='pending')
    def pending_list(self, request):
        """Lấy danh sách bài viết chờ duyệt."""
        posts = Post.objects.filter(status=Post.PostStatus.PENDING).select_related('user', 'category').order_by('-created_time')
        page = self.paginate_queryset(posts)
        if page is not None:
            return self.get_paginated_response(PostModerationSerializer(page, many=True).data)
        return Response(PostModerationSerializer(posts, many=True).data)

    @action(detail=False, methods=['get'], permission_classes=[IsAdminRole], url_path='all')
    def all_posts(self, request):
        """Tất cả bài viết (Admin quản lý)."""
        status_filter = request.query_params.get('status', None)
        posts = Post.objects.all().select_related('user', 'category', 'reviewed_by')
        if status_filter:
            posts = posts.filter(status=status_filter.upper())
        posts = posts.order_by('-created_time')
        page = self.paginate_queryset(posts)
        if page is not None:
            return self.get_paginated_response(PostModerationSerializer(page, many=True).data)
        return Response(PostModerationSerializer(posts, many=True).data)

    @action(detail=True, methods=['post'], permission_classes=[IsAdminRole], url_path='approve')
    def approve(self, request, pk=None):
        """Duyệt bài viết."""
        post = self.get_object()
        if post.status != Post.PostStatus.PENDING:
            return Response({'detail': 'Chỉ có thể duyệt bài đang PENDING.'}, status=status.HTTP_400_BAD_REQUEST)
        
        post.status = Post.PostStatus.APPROVED
        post.published_time = timezone.now()
        _mark_reviewed(post, request.user)
        post.save()
        _send_notification(post.user, f'Bài viết "{post.title}" của bạn đã được phê duyệt.')
        return Response({'detail': 'Đã duyệt bài.', 'post': PostModerationSerializer(post).data})

    @action(detail=True, methods=['post'], permission_classes=[IsAdminRole], url_path='reject')
    def reject(self, request, pk=None):
        """Từ chối bài viết."""
        post = self.get_object()
        serializer = RejectPostSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        reason = serializer.validated_data['reason']
        post.status = Post.PostStatus.REJECTED
        _mark_reviewed(post, request.user, reason)
        post.save()
        _send_notification(post.user, f'Bài viết "{post.title}" của bạn bị từ chối. Lý do: {reason}')
        return Response({'detail': 'Đã từ chối.', 'post': PostModerationSerializer(post).data})

    @action(detail=True, methods=['post'], permission_classes=[IsAdminRole], url_path='hide')
    def hide(self, request, pk=None):
        """Ẩn bài viết vi phạm."""
        post = self.get_object()
        serializer = HidePostSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        reason = serializer.validated_data['reason']
        post.status = Post.PostStatus.HIDDEN
        _mark_reviewed(post, request.user, reason)
        post.save()
        _send_notification(post.user, f'Bài viết "{post.title}" bị ẩn. Lý do: {reason}')
        return Response({'detail': 'Đã ẩn bài.', 'post': PostModerationSerializer(post).data})

    @action(detail=True, methods=['post'], permission_classes=[IsAdminRole], url_path='lock')
    def lock(self, request, pk=None):
        """Khóa bài viết (ngừng bình luận)."""
        post = self.get_object()
        serializer = LockPostSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        reason = serializer.validated_data['reason']
        post.status = Post.PostStatus.LOCKED
        _mark_reviewed(post, request.user, reason)
        post.save()
        _send_notification(post.user, f'Bài viết "{post.title}" bị khóa. Lý do: {reason}')
        return Response({'detail': 'Đã khóa bài.', 'post': PostModerationSerializer(post).data})

    @action(detail=True, methods=['delete'], permission_classes=[IsAdminRole], url_path='admin-delete')
    def admin_delete(self, request, pk=None):
        """Xóa vĩnh viễn bài vi phạm."""
        post = self.get_object()
        serializer = AdminDeletePostSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        post_title = post.title
        _send_notification(post.user, f'Bài viết "{post_title}" bị xóa do vi phạm: {serializer.validated_data["reason"]}')
        post.delete()
        return Response({'detail': f'Đã xóa vĩnh viễn bài "{post_title}".'})
