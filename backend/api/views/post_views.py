from django.utils import timezone
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

# ========================================================
# HELPERS
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
# POST VIEWSET
# ========================================================

class PostViewSet(viewsets.ModelViewSet):
    """
    Quản lý bài viết + kiểm duyệt.
    """
    queryset = Post.objects.all().select_related('user', 'category', 'reviewed_by')
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        """Mặc định chỉ trả bài APPROVED cho public. Admin thấy tất cả."""
        user_id = self.request.query_params.get('user')
        is_admin = self._is_admin()
        
        if self.action in ['list', 'retrieve'] and not is_admin:
            qs = Post.objects.filter(status=Post.PostStatus.APPROVED)
            if user_id:
                # Nếu lọc theo user, chỉ hiện bài KHÔNG ẩn danh 
                # trừ khi đang xem chính mình (owner check)
                is_owner = (
                    self.request.user.is_authenticated and 
                    str(self.request.user.id) == str(user_id)
                )
                if not is_owner:
                    qs = qs.filter(is_anonymous=False)
                qs = qs.filter(user_id=user_id)
            return qs.select_related('user', 'category').order_by('-created_time')
            
        qs = Post.objects.all().select_related('user', 'category', 'reviewed_by')
        if user_id:
            # Cho Admin hoặc các action khác, nếu có user_id thì vẫn lọc theo user đó
            qs = qs.filter(user_id=user_id)
        return qs


    def get_serializer_class(self):
        """Chọn serializer phù hợp từng action."""
        if self.action in ['create', 'update', 'partial_update']:
            return PostCreateSerializer
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

    def perform_create(self, serializer):
        """Tự động gán user, mặc định status PENDING, và kiểm tra độ dài nội dung."""
        title = self.request.data.get('title', '')
        content = self.request.data.get('content', '')
        
        if len(title.strip()) < 10:
            raise PermissionDenied('Tiêu đề phải có ít nhất 10 ký tự.')
        if len(content.strip()) < 30:
            raise PermissionDenied('Nội dung phải có nhất 30 ký tự.')

        # Content Guard: Lọc từ khóa cấm
        blacklisted_keywords = Blacklist.objects.values_list('keyword', flat=True)
        full_text = (title + " " + content).lower()
        for kw in blacklisted_keywords:
            if kw.lower() in full_text:
                raise PermissionDenied(f'Nội dung chứa từ khóa không hợp lệ: "{kw}"')

        instance = serializer.save(user=self.request.user)
        self._handle_file_uploads(instance)

    def perform_update(self, serializer):
        """Xử lý cập nhật bài viết và upload thêm file mới."""
        instance = serializer.save()
        self._handle_file_uploads(instance)

    def _handle_file_uploads(self, instance):
        """
        Xử lý tệp tin từ request.FILES. 
        Lưu tệp vào thư mục media và tạo bản ghi trong bảng Media & TargetMedia.
        """
        from api.models import Media, TargetType, TargetMedia
        import os
        import json

        files = self.request.FILES.getlist('attachments')
        
        # 1. Đồng bộ ảnh cũ (Dùng khi Edit)
        # Frontend gửi danh sách URL các ảnh muốn giữ lại
        raw_images_data = self.request.data.get('images', None)
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
                ext = os.path.splitext(f.name)[1].lower()
                media_type = Media.MediaType.IMAGE
                if ext in ['.mp4', '.mov', '.avi', '.mkv']:
                    media_type = Media.MediaType.VIDEO
                elif ext in ['.pdf', '.doc', '.docx', '.txt']:
                    media_type = Media.MediaType.DOCUMENT

                # Lưu file
                path = default_storage.save(f'posts/{instance.id}/{f.name}', f)
                url = f"{settings.MEDIA_URL}{path}"
                
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
        obj = super().get_object()
        is_admin = self._is_admin()
        
        if self.action in ['update', 'partial_update', 'destroy']:
            # 1. Kiểm tra quyền sở hữu
            if not is_admin and obj.user != self.request.user:
                raise PermissionDenied('Bạn chỉ có thể chỉnh sửa hoặc xóa bài viết của chính mình.')
            
            # 2. State Machine: Bài APPROVED không được sửa/xóa bởi User (phải hạ về Draft/Pending nếu cần)
            if not is_admin:
                if obj.status == Post.PostStatus.APPROVED:
                    raise PermissionDenied('Bài viết đã được duyệt không thể chỉnh sửa. Liên hệ Admin nếu cần thay đổi.')
                
                # Chỉ cho phép sửa khi PENDING hoặc REJECTED (hoặc DRAFT nếu có)
                if obj.status not in [Post.PostStatus.PENDING, Post.PostStatus.REJECTED]:
                    raise PermissionDenied(f'Không thể thực hiện thao tác này khi bài viết ở trạng thái {obj.status}.')
        return obj

    # ---------------------------------------------------------
    # CUSTOM ACTIONS
    # ---------------------------------------------------------

    @action(detail=False, methods=['get'], permission_classes=[IsAdminRole], url_path='pending')
    def pending_list(self, request):
        posts = Post.objects.filter(status=Post.PostStatus.PENDING).order_by('-created_time')
        page = self.paginate_queryset(posts)
        serializer = PostModerationSerializer(page if page is not None else posts, many=True)
        return self.get_paginated_response(serializer.data) if page is not None else Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[IsAdminRole], url_path='all')
    def all_posts(self, request):
        status_filter = request.query_params.get('status', None)
        posts = Post.objects.all().select_related('user', 'category', 'reviewed_by')
        if status_filter:
            posts = posts.filter(status=status_filter.upper())
        posts = posts.order_by('-created_time')
        page = self.paginate_queryset(posts)
        serializer = PostModerationSerializer(page if page is not None else posts, many=True)
        return self.get_paginated_response(serializer.data) if page is not None else Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated], url_path='mine')
    def mine(self, request):
        posts = Post.objects.filter(user=request.user).order_by('-created_time')
        page = self.paginate_queryset(posts)
        serializer = PostSerializer(page if page is not None else posts, many=True)
        return self.get_paginated_response(serializer.data) if page is not None else Response(serializer.data)

    # ---------------------------------------------------------
    # MODERATION ACTIONS
    # ---------------------------------------------------------

    @action(detail=True, methods=['post'], permission_classes=[IsAdminRole], url_path='approve')
    def approve(self, request, pk=None):
        post = self.get_object()
        if post.status != Post.PostStatus.PENDING:
            return Response({'detail': 'Chỉ có thể duyệt bài PENDING.'}, status=status.HTTP_400_BAD_REQUEST)
        
        post.status = Post.PostStatus.APPROVED
        post.published_time = timezone.now()
        _mark_reviewed(post, request.user)
        post.save()
        
        # Side Effect: Tăng điểm uy tín cho User (+10)
        author = post.user
        author.reputation_score += 10
        author.save()
        from api.models import ReputationHistory
        ReputationHistory.objects.create(
            user=author,
            action_type="Bài viết được phê duyệt: " + post.title,
            score_change=10
        )

        # Audit Log
        AuditLog.objects.create(
            action='APPROVE',
            admin_user=request.user,
            target_post=post
        )

        _send_notification(post.user, f'Bài viết "{post.title}" của bạn đã được phê duyệt.')
        return Response({'detail': 'Bài viết đã được duyệt.', 'post': PostModerationSerializer(post).data})

    @action(detail=True, methods=['post'], permission_classes=[IsAdminRole], url_path='reject')
    def reject(self, request, pk=None):
        post = self.get_object()
        if post.status != Post.PostStatus.PENDING:
            return Response({'detail': 'Chỉ có thể từ chối bài PENDING.'}, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = RejectPostSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        reason = serializer.validated_data['reason']
        post.status = Post.PostStatus.REJECTED
        _mark_reviewed(post, request.user, reason)
        post.save()

        # Audit Log
        AuditLog.objects.create(
            action='REJECT',
            admin_user=request.user,
            target_post=post,
            reason=reason
        )

        _send_notification(post.user, f'Bài viết "{post.title}" đã bị từ chối. Lý do: {reason}')
        return Response({'detail': 'Bài viết đã bị từ chối.', 'post': PostModerationSerializer(post).data})

    @action(detail=True, methods=['post'], permission_classes=[IsAdminRole], url_path='hide')
    def hide(self, request, pk=None):
        post = self.get_object()
        serializer = HidePostSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        reason = serializer.validated_data['reason']
        post.status = Post.PostStatus.HIDDEN
        _mark_reviewed(post, request.user, reason)
        post.save()

        # Audit Log
        AuditLog.objects.create(
            action='HIDE',
            admin_user=request.user,
            target_post=post,
            reason=reason
        )
        return Response({'detail': 'Bài viết đã được ẩn.'})

    @action(detail=True, methods=['post'], permission_classes=[IsAdminRole], url_path='lock')
    def lock(self, request, pk=None):
        post = self.get_object()
        serializer = LockPostSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        reason = serializer.validated_data['reason']
        post.status = Post.PostStatus.LOCKED
        _mark_reviewed(post, request.user, reason)
        post.save()

        # Audit Log
        AuditLog.objects.create(
            action='LOCK',
            admin_user=request.user,
            target_post=post,
            reason=reason
        )
        return Response({'detail': 'Bài viết đã bị khóa.'})

    @action(detail=True, methods=['delete'], permission_classes=[IsAdminRole], url_path='admin-delete')
    def admin_delete(self, request, pk=None):
        post = self.get_object()
        serializer = AdminDeletePostSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        _send_notification(post.user, f'Bài viết "{post.title}" đã bị xóa do vi phạm.')
        
        # Audit Log
        AuditLog.objects.create(
            action='DELETE',
            admin_user=request.user,
            target_post=None, # Bài viết bị xóa khỏi DB, giữ ID logic trong Audit nếu cần
            reason=reason
        )
        
        post.delete()
        return Response({'detail': 'Bài viết đã bị xóa vĩnh viễn.'})
