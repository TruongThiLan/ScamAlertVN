from django.db.models import Q
from rest_framework import filters, generics, permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

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

    @action(detail=False, methods=['get'])
    def check_scam(self, request):
        """
        API kiem tra nhanh link hoac so dien thoai.
        Goi: GET /api/public/posts/check_scam/?query=<link_hoac_sdt>
        """
        query = request.query_params.get('query', '').strip()
        if not query:
            return Response({'is_scam': False, 'message': 'Vui lòng nhập thông tin cần kiểm tra.', 'matches': []})

        # Tim trong title hoac content cua cac bai APPROVED
        matches = self.get_queryset().filter(
            Q(title__icontains=query) | Q(content__icontains=query)
        )[:5]  # Lay toi da 5 ket qua

        if matches.exists():
            return Response({
                'is_scam': True,
                'message': 'Cảnh báo: Thông tin này đã bị cộng đồng báo cáo là lừa đảo!',
                'matches': [{'id': p.id, 'title': p.title} for p in matches]
            })
        
        return Response({
            'is_scam': False,
            'message': 'An toàn: Hệ thống chưa ghi nhận báo cáo nào. Tuy nhiên, luôn cẩn trọng!',
            'matches': []
        })


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
