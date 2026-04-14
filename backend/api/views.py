import re
from django.db import models
from django.utils import timezone
from datetime import timedelta
from rest_framework import viewsets, permissions
from rest_framework.decorators import action # <--- Vừa thêm
from rest_framework.response import Response # Đảm bảo có cả cái này để dùng trong hàm me()
from .models import User, Post, ScamCategory, ActivityLog
from .serializers import UserSerializer, PostSerializer, ScamCategorySerializer

# View xử lý danh sách người dùng
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    # Tạm thời cho phép mọi người xem để test, sau này Trang làm xong Auth sẽ siết lại
    permission_classes = [permissions.AllowAny]

    def list(self, request, *args, **kwargs):
        # Tự động mở khóa những người dùng đã hết hạn bị khóa
        self._auto_unlock_expired_users()
        return super().list(request, *args, **kwargs)

    def _auto_unlock_expired_users(self):
        """Quét tất cả user đang bị banned, kiểm tra log và tự động mở khóa nếu hết hạn."""
        banned_users = User.objects.filter(status=User.UserStatus.BANNED)
        for user in banned_users:
            latest_log = ActivityLog.objects.filter(
                action__contains=f"target={user.username}"
            ).filter(
                models.Q(action__contains="LOCK_INFO") | models.Q(action__contains="UNLOCK_INFO")
            ).order_by('-created_time').first()

            if not latest_log or "UNLOCK_INFO" in latest_log.action:
                continue

            match = re.search(r"duration=([^ \],]+)", latest_log.action)
            if not match:
                continue

            duration_str = match.group(1)
            if duration_str == 'forever':
                continue  # Khóa vĩnh viễn thì không tự mở

            try:
                duration_days = int(duration_str)
                expiry_date = latest_log.created_time + timedelta(days=duration_days)
                if timezone.now() >= expiry_date:
                    user.status = User.UserStatus.ACTIVE
                    user.save(update_fields=['status'])
            except (ValueError, TypeError):
                continue

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def lock(self, request, pk=None):
        user = self.get_object()
        user.status = User.UserStatus.BANNED
        user.save()
        
        # Lưu log (Giả sử admin là request.user, nếu không thì lấy mặc định user id 1 để test)
        admin_user = request.user if request.user.is_authenticated else User.objects.get(pk=1)
        reason = request.data.get('reason', 'Không có lý do')
        duration = request.data.get('duration', '3')
        
        # Log cấu trúc: [LOCK_INFO:target=username,duration=X] để Backend dễ parse
        ActivityLog.objects.create(
            user=admin_user,
            action=f"[LOCK_INFO:target={user.username},duration={duration}] Khóa người dùng {user.username}. Lý do: {reason}"
        )
        return Response({'status': 'user locked'})

    @action(detail=True, methods=['post'])
    def unlock(self, request, pk=None):
        user = self.get_object()
        user.status = User.UserStatus.ACTIVE
        user.save()
        
        admin_user = request.user if request.user.is_authenticated else User.objects.get(pk=1)
        # Log cấu trúc: [UNLOCK_INFO:target=username] để ngắt thời hạn khóa
        ActivityLog.objects.create(
            user=admin_user,
            action=f"[UNLOCK_INFO:target={user.username}] Mở khóa người dùng {user.username}"
        )
        return Response({'status': 'user unlocked'})

    @action(detail=True, methods=['post'])
    def warn(self, request, pk=None):
        user = self.get_object()
        user.status = User.UserStatus.WARNING
        user.save()
        
        admin_user = request.user if request.user.is_authenticated else User.objects.get(pk=1)
        reason = request.data.get('warning_type', 'Cảnh báo vi phạm')
        ActivityLog.objects.create(
            user=admin_user,
            action=f"Cảnh báo người dùng {user.username}. Loại: {reason}"
        )
        return Response({'status': 'user warned'})

    def destroy(self, request, *args, **kwargs):
        user = self.get_object()
        user.status = User.UserStatus.INACTIVE
        user.save()
        
        admin_user = request.user if request.user.is_authenticated else User.objects.get(pk=1)
        reason = request.data.get('reason', 'Xóa tài khoản (xóa mềm)')
        ActivityLog.objects.create(
            user=admin_user,
            action=f"Xóa mềm người dùng {user.username}. Lý do: {reason}"
        )
        return Response({'status': 'user deleted (soft delete)'})

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