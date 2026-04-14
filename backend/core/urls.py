from django.contrib import admin
from django.urls import path, include  # Nhớ thêm 'include' vào đây

from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    path('admin/', admin.site.urls),

    # 1. Các API về Login (JWT) giữ nguyên
    path('api/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # 2. Kết nối tới file urls.py mà bạn vừa tạo thủ công trong app 'api'
    path('api/', include('api.urls')),
]