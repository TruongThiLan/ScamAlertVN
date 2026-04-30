from rest_framework import filters, generics, permissions, viewsets

from api.models import Comment, Post
from api.serializers.public_serializers import (
    PublicCommentSerializer,
    PublicPostSerializer,
    RegisterSerializer,
)


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class PublicPostSearchFilter(filters.SearchFilter):
    """Search public theo tieu de va noi dung bai viet."""

    def get_search_fields(self, view, request):
        return ['title', 'content']


class PublicPostViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API cong khai cho khach doc va tim kiem bai viet da duyet.
    Khong yeu cau JWT token, phu hop cho trang search/detail public.
    """

    serializer_class = PublicPostSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [PublicPostSearchFilter]

    def get_queryset(self):
        return (
            Post.objects
            .filter(status=Post.PostStatus.APPROVED)
            .select_related('user', 'category')
            .order_by('-published_time', '-created_time')
        )


class PublicCommentViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API cong khai cho khach doc binh luan theo bai viet.
    Goi: GET /api/public/comments/?post=<post_id>
    """

    serializer_class = PublicCommentSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        queryset = (
            Comment.objects
            .filter(
                status=Comment.CommentStatus.ACTIVE,
                post__status=Post.PostStatus.APPROVED,
            )
            .select_related('user', 'post')
            .order_by('created_time')
        )

        # Loc binh luan theo ID bai viet tu query string public.
        post_id = self.request.query_params.get('post') or self.request.query_params.get('post_id')
        if post_id:
            queryset = queryset.filter(post_id=post_id)
        elif getattr(self, 'action', '') == 'list':
            queryset = queryset.none()

        return queryset
