from rest_framework import viewsets, permissions
from ..models import Post, ScamCategory
from ..serializers.report_serializers import PostSerializer, ScamCategorySerializer

class PostViewSet(viewsets.ModelViewSet):
    """
    ViewSet xử lý các bài viết tố cáo (Lan thực hiện).
    Mặc định chỉ hiển thị các bài viết đã được phê duyệt (APPROVED).
    """
    queryset = Post.objects.filter(status='APPROVED').order_by('-created_time')
    serializer_class = PostSerializer
    permission_classes = [permissions.AllowAny]

class ScamCategoryViewSet(viewsets.ModelViewSet):
    """
    ViewSet quản lý các danh mục lừa đảo.
    """
    queryset = ScamCategory.objects.all()
    serializer_class = ScamCategorySerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None # Tắt phân trang để Frontend hiện danh sách ở Sidebar
