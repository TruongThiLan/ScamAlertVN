from rest_framework import permissions

class IsAdminRole(permissions.BasePermission):
    """
    Phân quyền chỉ cho phép những người dùng có vai trò là 'Admin' truy cập.
    Dựa trên quan hệ ForeignKey tới model Role.
    """
    def has_permission(self, request, view):
        # Người dùng phải đăng nhập trước
        if not request.user or not request.user.is_authenticated:
            return False
            
        # Kiểm tra vai trò của người dùng
        # Chấp nhận cả is_superuser (để linh hoạt khi dev) hoặc role_name là 'Admin'
        if request.user.is_superuser:
            return True
            
        if request.user.role and request.user.role.role_name == 'Admin':
            return True
            
        return False
