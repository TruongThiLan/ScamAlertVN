from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from api.models import ContentReport, Comment, Reaction, TargetType, Post
from api.serializers.interact_serializers import (
    ContentReportSerializer, ContentReportCreateSerializer,
    CommentSerializer
)
from api.permissions import IsAdminRole

class ContentReportViewSet(viewsets.ModelViewSet):
    """
    Quản lý báo cáo vi phạm nội dung.
    """
    queryset = ContentReport.objects.all().select_related('reporter_user').order_by('-reported_time')
    http_method_names = ['get', 'post', 'head', 'options']

    def get_serializer_class(self):
        if self.action == 'create':
            return ContentReportCreateSerializer
        return ContentReportSerializer

    def get_permissions(self):
        if self.action == 'create':
            return [permissions.IsAuthenticated()]
        return [IsAdminRole()]

    def perform_create(self, serializer):
        serializer.save(reporter_user=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[IsAdminRole], url_path='dismiss')
    def dismiss(self, request, pk=None):
        report = self.get_object()
        report.processing_status = ContentReport.ProcessStatus.DISMISSED
        report.save()
        return Response({'detail': 'Báo cáo đã bị bác bỏ.'})

    @action(detail=True, methods=['post'], permission_classes=[IsAdminRole], url_path='process')
    def process(self, request, pk=None):
        report = self.get_object()
        report.processing_status = ContentReport.ProcessStatus.PROCESSED
        report.save()
        return Response({'detail': 'Báo cáo đã được đánh dấu là đã xử lý.'})


class CommentViewSet(viewsets.ModelViewSet):
    """
    Quản lý bình luận.
    """
    queryset = Comment.objects.all().select_related('user', 'post', 'parent_comment').prefetch_related('replies')
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        post = serializer.validated_data.get('post')
        if post and post.status in [Post.PostStatus.LOCKED, Post.PostStatus.HIDDEN]:
            raise PermissionDenied('Không thể bình luận vào bài viết đã bị khóa hoặc bị ẩn.')
        serializer.save(user=self.request.user)

    def get_queryset(self):
        qs = super().get_queryset()
        post_id = self.request.query_params.get('post')
        if post_id:
            # Chỉ lấy các comment cấp 1 (parent_comment=None), replies sẽ được nested bên trong
            qs = qs.filter(post_id=post_id, parent_comment__isnull=True)
        return qs


class ReactionViewSet(viewsets.ViewSet):
    """
    Quản lý lượt thích (Upvote/Downvote).
    """
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['post'])
    def toggle(self, request):
        target_type = request.data.get('target_type')
        target_id = request.data.get('target_id')
        reaction_val = request.data.get('reaction_type', 'UPVOTE')

        if not target_type or not target_id:
            return Response({'error': 'Missing target_type or target_id'}, status=status.HTTP_400_BAD_REQUEST)

        # Block reactions if the target is a LOCKED post
        if target_type == TargetType.POST:
            _post = Post.objects.filter(pk=target_id).first()
            if _post and _post.status in [Post.PostStatus.LOCKED, Post.PostStatus.HIDDEN]:
                raise PermissionDenied('Không thể tương tác với bài viết đã bị khóa hoặc bị ẩn.')

        reaction, created = Reaction.objects.get_or_create(
            user=request.user,
            target_type=target_type,
            target_id=target_id,
            defaults={'reaction_type': reaction_val}
        )

        if not created:
            # Nếu đã tồn tại, xóa đi (Toggle off)
            reaction.delete()
            return Response({'status': 'unreacted'})
        
        return Response({'status': 'reacted', 'type': reaction_val})
