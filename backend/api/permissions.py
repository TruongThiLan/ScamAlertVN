from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsAdminRole(BasePermission):
    """
    Chỉ cho phép Admin thực hiện.
    Admin = user.is_staff == True HOẶC user.role.role_name == 'Admin'
    """
    message = 'Bạn không có quyền thực hiện thao tác này. Chỉ Admin mới được phép.'

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return (
            request.user.is_staff
            or (request.user.role is not None and request.user.role.role_name == 'Admin')
        )


class IsAdminOrReadOnly(BasePermission):
    """
    Cho phép GET/HEAD/OPTIONS với mọi người đã đăng nhập.
    Chỉ Admin mới được POST/PUT/PATCH/DELETE.
    """
    message = 'Chỉ Admin mới được chỉnh sửa dữ liệu này.'

    def has_permission(self, request, view):
        # Cho phép xem (SAFE_METHODS) với tất cả mọi người (kể cả Khách)
        if request.method in SAFE_METHODS:
            return True
        
        # Các thao tác thay đổi dữ liệu yêu cầu phải là Admin
        if not request.user or not request.user.is_authenticated:
            return False
            
        return (
            request.user.is_staff
            or (request.user.role is not None and request.user.role.role_name == 'Admin')
        )
