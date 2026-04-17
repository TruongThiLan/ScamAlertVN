from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from api.models import User
from api.serializers import UserSerializer

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().select_related('role')
    serializer_class = UserSerializer
    permission_classes = [permissions.AllowAny]  # Sẽ siết lại khi làm Auth

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def me(self, request):
        """Trả về thông tin của user đang đăng nhập."""
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)
