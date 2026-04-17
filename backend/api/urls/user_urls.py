"""
DANH SÁCH CÁC ĐƯỜNG DẪN QUẢN LÝ NGƯỜI DÙNG & THÔNG BÁO:
-------------------------------------------------------
1. Quản lý người dùng (Yêu cầu quyền Admin):
   - GET    /api/users/                : Xem danh sách người dùng (Phân trang & Lọc)
   - POST   /api/users/{id}/lock/      : Khóa tài khoản
   - POST   /api/users/{id}/unlock/    : Mở khóa tài khoản
   - POST   /api/users/{id}/warn/      : Gửi cảnh báo vi phạm
   - DELETE /api/users/{id}/           : Xóa mềm người dùng
   - GET    /api/users/me/             : Lấy thông tin tài khoản đang đăng nhập

2. Quản lý thông báo (Yêu cầu đăng nhập):
   - GET    /api/notifications/                : Danh sách thông báo cá nhân
   - POST   /api/notifications/{id}/mark_as_read/ : Đánh dấu thông báo đã đọc
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from ..views.user_views import UserViewSet

router = DefaultRouter()
router.register(r'', UserViewSet, basename='user') 

urlpatterns = [
    path('', include(router.urls)),
]
