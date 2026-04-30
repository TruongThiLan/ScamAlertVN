from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from ..models import Notification
from ..serializers.notification_serializers import NotificationSerializer

class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet cho phép người dùng xem danh sách thông báo của chính mình.
    """
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Chỉ trả về thông báo của người dùng đang đăng nhập
        return Notification.objects.filter(user=self.request.user).order_by('-created_time')

    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        """Đánh dấu một thông báo là đã đọc."""
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response({'status': 'notification marked as read'})
