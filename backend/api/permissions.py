from rest_framework.permissions import BasePermission, SAFE_METHODS

class IsAdminRole(BasePermission):
    """
    Phân quyền chỉ cho phép những người dùng có vai trò là 'Admin' truy cập.
    Admin = user.is_staff == True HOẶC user.role.role_name == 'Admin'
    """
    message = 'Bạn không có quyền thực hiện thao tác này. Chỉ Admin mới được phép.'

    def has_permission(self, request, view):
        # Người dùng phải đăng nhập trước
        if not request.user or not request.user.is_authenticated:
            return False
            
        # Kiểm tra vai trò của người dùng (Staff hoặc Role Admin)
        # Kiểm tra vai trò của người dùng (Staff hoặc Role Admin)
        return (
            request.user.is_staff
            or (request.user.role is not None and request.user.role.role_name.lower() == 'admin')
        )

class IsAdminOrReadOnly(BasePermission):
    """
    Cho phép GET/HEAD/OPTIONS với mọi người đã đăng nhập.
    Chỉ Admin mới được POST/PUT/PATCH/DELETE.
    """
    message = 'Chỉ Admin mới được chỉnh sửa dữ liệu này.'

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.method in SAFE_METHODS:
            return True
        # Kiểm tra vai trò của người dùng (Staff hoặc Role Admin)
        return (
            request.user.is_staff
            or (request.user.role is not None and request.user.role.role_name.lower() == 'admin')
        )
