
import re
from django.db import models
from django.utils import timezone
from datetime import timedelta
from django.contrib.auth import update_session_auth_hash
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from ..models import User, ActivityLog, Notification, Role, ReputationHistory
from ..serializers.user_serializers import (
    UserSerializer,
    UserProfileSerializer,
    UserPublicProfileSerializer,
    ChangePasswordSerializer,
    ReputationHistorySerializer,
)

def _first_serializer_error(serializer):
    """Tra ve text loi dau tien de frontend hien thi toast."""
    errors = serializer.errors
    if isinstance(errors, dict):
        first_error = next(iter(errors.values()), None)
        if isinstance(first_error, list) and first_error:
            return str(first_error[0])
        return str(first_error)
    if isinstance(errors, list) and errors:
        return str(errors[0])
    return 'Dữ liệu không hợp lệ.'
from ..permissions import IsAdminRole 
from ..pagination import UserPagination # Import pagination tùy chỉnh

# NOTE VAN DAP:
# user_views.py quan ly tai khoan:
# - User dang nhap goi /api/users/me/, /profile/, /change-password/.
# - Admin goi /api/users/ de list/search/filter va lock/unlock/warn/delete.
# - Soft delete khong xoa khoi DB, chi doi status=inactive.
class UserViewSet(viewsets.ModelViewSet):
    """
    ViewSet cho phép quản trị viên quản lý danh sách người dùng và xử lý các vi phạm.
    Bao gồm các chức năng chính (UC 2.1, 2.2, 2.3).
    """
    queryset = User.objects.all().order_by('-created_date') # Sắp xếp mới nhất lên đầu
    serializer_class = UserSerializer
    pagination_class = UserPagination

    def get_serializer_class(self):
        # Phan quyen theo action giup cung mot ViewSet phuc vu ca user va admin:
        # retrieve public, me/profile/change-password can login, con quan ly user can Admin.
        if self.action == 'retrieve':
            return UserPublicProfileSerializer
        return UserSerializer

    def get_queryset(self):
        """
        Hỗ trợ lọc server-side (Tìm kiếm, Trạng thái, Vai trò) cho toàn bộ database.
        """
        queryset = User.objects.all().order_by('-created_date')  # mac dinh user moi nhat len dau.
        
        # 1. Lọc theo Tìm kiếm (Search)
        search = self.request.query_params.get('search', None)  # tu khoa admin nhap tren o tim kiem.
        if search:
            queryset = queryset.filter(
                models.Q(username__icontains=search) | 
                models.Q(email__icontains=search)
            )
            
        # 2. Lọc theo Trạng thái (Status)
        status = self.request.query_params.get('status', None)  # loc active/banned/inactive/warning.
        if status and status != 'all':
            # Map 'locked' (UI) sang 'banned' (Backend) nếu cần
            backend_status = 'banned' if status == 'locked' else status
            queryset = queryset.filter(status__iexact=backend_status)
            
        # 3. Lọc theo Vai trò (Role)
        role_param = self.request.query_params.get('role', None)  # loc Admin/User.
        if role_param and role_param != 'all':
            role_val = role_param.lower()
            if role_val == 'admin':
                queryset = queryset.filter(
                    models.Q(role__role_name__iexact='Admin') | models.Q(is_superuser=True)
                )
            elif role_val == 'user':
                queryset = queryset.exclude(role__role_name__iexact='Admin').exclude(is_superuser=True)
        return queryset

    def get_permissions(self):
        """
        Phân quyền động:
        - Hành động 'me' (lấy thông tin bản thân) chỉ cần IsAuthenticated.
        - Các hành động quản lý (list, lock, unlock, warn, destroy...) yêu cầu IsAdminRole.
        """
        if self.action == 'retrieve':
            return [permissions.AllowAny()]
        if self.action in ['me', 'profile', 'profile_availability', 'change_password', 'reputation_history']:
            return [permissions.IsAuthenticated()]
        return [IsAdminRole()]

    def list(self, request, *args, **kwargs):
        """
        Ghi đè phương thức list để:
        1. Tự động mở khóa các tài khoản hết hạn.
        2. Bổ sung globalStats vào response để Frontend hiển thị thanh thống kê.
        """
        # Moi lan admin mo danh sach user, backend tranh thu mo khoa cac tai khoan het han.
        self._auto_unlock_expired_users()
        
        queryset = self.filter_queryset(self.get_queryset())  # ap dung bo loc.
        page = self.paginate_queryset(queryset)  # cat du lieu theo trang.
        
        # Tính toán thống kê nhanh (Quét tất cả biến thể hoa/thường để tránh sót dữ liệu)
        stats = {
            'active': User.objects.filter(models.Q(status__iexact='active') | models.Q(status__iexact='ACTIVE')).count(),
            'banned': User.objects.filter(models.Q(status__iexact='banned') | models.Q(status__iexact='BANNED')).count(),
            'inactive': User.objects.filter(models.Q(status__iexact='inactive') | models.Q(status__iexact='INACTIVE')).count(),
        }

        if page is not None:
            serializer = self.get_serializer(page, many=True)
            response = self.get_paginated_response(serializer.data)
            response.data['status_summary'] = stats
            return response

        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'results': serializer.data,
            'status_summary': stats
        })

    def _auto_unlock_expired_users(self):
        """
        Logic tự động mở khóa (UC 2.1):
        Quét tất cả user đang bị banned, tìm log khóa gần nhất để tính thời hạn.
        Nếu đã quá thời hạn, chuyển trạng thái về active và gửi thông báo.
        """
        banned_users = User.objects.filter(status=User.UserStatus.BANNED)  # chi quet user dang bi khoa.
        for user in banned_users:
            # Tìm log mới nhất có chứa thông tin LOCK hoặc UNLOCK của user này
            latest_log = ActivityLog.objects.filter(
                action__contains=f"target={user.username}"
            ).filter(
                models.Q(action__contains="LOCK_INFO") | models.Q(action__contains="UNLOCK_INFO")
            ).order_by('-created_time').first()

            # Nếu không có log khóa hoặc log mới nhất là mở khóa thì bỏ qua
            if not latest_log or "UNLOCK_INFO" in latest_log.action:
                continue

            # Parse thời gian khóa từ chuỗi action trong log
            match = re.search(r"duration=([^ \],]+)", latest_log.action)
            if not match:
                continue

            duration_str = match.group(1)
            if duration_str == 'forever':
                continue

            try:
                duration_days = int(duration_str)
                expiry_date = latest_log.created_time + timedelta(days=duration_days)
                
                # Nếu thời gian hiện tại đã vượt qua ngày hết hạn
                if timezone.now() >= expiry_date:
                    user.status = User.UserStatus.ACTIVE
                    user.save(update_fields=['status'])

                    # Ghi nhận hành động tự động của hệ thống vào ActivityLog
                    system_actor = User.objects.filter(
                        role__role_name='Admin'
                    ).first() or User.objects.filter(is_superuser=True).first()

                    if system_actor:
                        ActivityLog.objects.create(
                            user=system_actor,
                            action=f"[AUTO_UNLOCK:target={user.username}] He thong tu dong mo khoa sau {duration_days} ngay."
                        )

                    # Gửi thông báo cho người dùng
                    Notification.objects.create(
                        user=user,
                        content=f"Tai khoan cua ban da duoc tu dong mo khoa sau {duration_days} ngay."
                    )

                    # Thông báo cho tất cả admin để nắm bắt thông tin
                    admin_role = Role.objects.filter(role_name='Admin').first()
                    if admin_role:
                        admin_users = User.objects.filter(role=admin_role)
                        for admin in admin_users:
                            Notification.objects.create(
                                user=admin,
                                content=f"[He thong] Tai khoan '{user.username}' da duoc tu dong mo khoa sau {duration_days} ngay (het han)."
                            )

            except (ValueError, TypeError):
                continue

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def me(self, request):
        """Lấy thông tin cá nhân của người dùng hiện tại."""
        serializer = self.get_serializer(request.user)  # tra thong tin user dang dang nhap.
        return Response(serializer.data)

    @action(
        detail=False,
        methods=['get'],
        permission_classes=[permissions.IsAuthenticated],
        url_path='reputation-history',
    )
    def reputation_history(self, request):
        """Lay lich su thay doi diem uy tin cua user dang dang nhap."""
        histories = ReputationHistory.objects.filter(user=request.user).order_by('-created_time')  # lich su diem cua minh.
        serializer = ReputationHistorySerializer(histories, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['put', 'patch'], permission_classes=[permissions.IsAuthenticated])
    def profile(self, request):
        """Cap nhat username/email cua user hien tai va tra ve user moi nhat."""
        serializer = UserProfileSerializer(  # validate username/email moi.
            request.user,
            data=request.data,
            partial=request.method == 'PATCH',
        )
        if not serializer.is_valid():
            return Response(
                {'detail': _first_serializer_error(serializer)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(
        detail=False,
        methods=['get'],
        permission_classes=[permissions.IsAuthenticated],
        url_path='profile-availability',
    )
    def profile_availability(self, request):
        """Kiem tra username/email co bi trung voi user khac khong."""
        username = request.query_params.get('username', '').strip()  # username FE dang kiem tra.
        email = request.query_params.get('email', '').strip()  # email FE dang kiem tra.
        errors = {}

        if username:
            username_exists = User.objects.filter(username__iexact=username).exclude(pk=request.user.pk).exists()
            errors['username'] = 'Tên đăng nhập đã tồn tại.' if username_exists else ''

        if email:
            email_exists = User.objects.filter(email__iexact=email).exclude(pk=request.user.pk).exists()
            errors['email'] = 'Email đã tồn tại.' if email_exists else ''

        return Response(errors, status=status.HTTP_200_OK)

    @action(
        detail=False,
        methods=['put'],
        permission_classes=[permissions.IsAuthenticated],
        url_path='change-password',
    )
    def change_password(self, request):
        """Doi mat khau cho user hien tai va giu session dang nhap."""
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})  # validate mat khau cu/moi.
        if not serializer.is_valid():
            return Response(
                {'detail': _first_serializer_error(serializer)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        request.user.set_password(serializer.validated_data['new_password'])
        request.user.save()
        update_session_auth_hash(request, request.user)
        return Response({'detail': 'Đổi mật khẩu thành công.'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def lock(self, request, pk=None):
        """
        UC 2.1: Khóa tài khoản người dùng.
        Admin gửi lên: reason (lý do) và duration (số ngày khóa).
        """
        user = self.get_object()  # user bi admin thao tac.
        if user == request.user:
            return Response({'error': 'Bạn không thể tự khóa chính mình'}, status=400)
            
        # Khong xoa user khi khoa; chi doi status de login/FE co the chan theo trang thai.
        user.status = User.UserStatus.BANNED
        user.save()
        
        # Ghi log và gửi thông báo
        admin_user = request.user
        reason = request.data.get('reason', 'Vi phạm quy định')  # ly do khoa.
        duration = request.data.get('duration', '3')  # so ngay khoa hoac forever.
        
        ActivityLog.objects.create(
            user=admin_user,
            action=f"[LOCK_INFO:target={user.username},duration={duration}] Khóa người dùng {user.username}. Lý do: {reason}"
        )
        Notification.objects.create(
            user=user,
            content=f"Tài khoản của bạn đã bị khóa. Thời gian: {duration} ngày. Lý do: {reason}"
        )
        return Response({'status': 'user locked'})

    @action(detail=True, methods=['post'])
    def unlock(self, request, pk=None):
        """
        UC 2.1: Mở khóa tài khoản thủ công bởi Admin.
        """
        user = self.get_object()  # user can mo khoa.
        if user == request.user:
            return Response({'error': 'Bạn không thể tự thao tác trên chính mình'}, status=400)
            
        user.status = User.UserStatus.ACTIVE
        user.save()
        
        admin_user = request.user
        ActivityLog.objects.create(
            user=admin_user,
            action=f"[UNLOCK_INFO:target={user.username}] Mở khóa người dùng {user.username}"
        )
        Notification.objects.create(
            user=user,
            content="Tài khoản của bạn đã được mở khóa."
        )
        return Response({'status': 'user unlocked'})

    @action(detail=True, methods=['post'])
    def warn(self, request, pk=None):
        """
        UC 2.2: Gửi thông báo vi phạm (Cảnh báo).
        Chuyển trạng thái user sang 'warning'.
        """
        user = self.get_object()  # user nhan canh bao.
        if user == request.user:
            return Response({'error': 'Bạn không thể tự cảnh báo chính mình'}, status=400)
            
        user.status = User.UserStatus.WARNING
        user.save()
        
        reason = request.data.get('warning_type', 'Cảnh báo vi phạm')  # loai canh bao FE chon.
        details = request.data.get('details', '')  # noi dung chi tiet admin nhap.
        admin_user = request.user
        
        ActivityLog.objects.create(
            user=admin_user,
            action=f"Cảnh báo người dùng {user.username}. Loại: {reason}. Chi tiết: {details}"
        )
        Notification.objects.create(
            user=user,
            content=f"Bạn nhận được cảnh báo vi phạm: {reason}. {details}"
        )
        return Response({'status': 'user warned'})

    def destroy(self, request, *args, **kwargs):
        """
        UC 2.3: Xóa tài khoản (Soft delete).
        Chuyển trạng thái user sang 'inactive'.
        """
        user = self.get_object()  # user bi xoa mem.
        if user == request.user:
            return Response({'error': 'Bạn không thể tự xóa tài khoản của chính mình'}, status=400)
            
        user.status = User.UserStatus.INACTIVE
        user.save()
        
        reason = request.data.get('reason', 'Xóa tài khoản')  # ly do xoa mem.
        admin_user = request.user
        
        ActivityLog.objects.create(
            user=admin_user,
            action=f"Xóa mềm người dùng {user.username}. Lý do: {reason}"
        )
        Notification.objects.create(
            user=user,
            content=f"Tài khoản của bạn đã bị xóa khỏi hệ thống. Lý do: {reason}"
        )
        return Response({'status': 'user deleted (soft delete)'})
