from rest_framework import viewsets, permissions
from rest_framework.decorators import action # <--- Vừa thêm
from rest_framework.response import Response # Đảm bảo có cả cái này để dùng trong hàm me()
from .models import User, Post, ScamCategory
from .serializers import UserSerializer, PostSerializer, ScamCategorySerializer

# View xử lý danh sách người dùng
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    # Tạm thời cho phép mọi người xem để test, sau này Trang làm xong Auth sẽ siết lại
    permission_classes = [permissions.AllowAny]

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

# View xử lý bài viết
class PostViewSet(viewsets.ModelViewSet):
    # Logic nghiệp vụ: Chỉ những bài đã được Admin duyệt mới hiện lên trang chủ
    queryset = Post.objects.filter(status='APPROVED').order_by('-created_time')
    serializer_class = PostSerializer
    permission_classes = [permissions.AllowAny]

class ScamCategoryViewSet(viewsets.ModelViewSet):
    queryset = ScamCategory.objects.all()
    serializer_class = ScamCategorySerializer
    permission_classes = [permissions.AllowAny]