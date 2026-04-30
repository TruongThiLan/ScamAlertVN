"""
URLS CHO THÔNG BÁO (NOTIFICATION)
---------------------------------
- GET  /api/notifications/                : Danh sách thông báo cá nhân
- POST /api/notifications/{id}/mark_as_read/ : Đánh dấu đã đọc
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from ..views.notification_views import NotificationViewSet

router = DefaultRouter()
router.register(r'', NotificationViewSet, basename='notification')

urlpatterns = [
    path('', include(router.urls)),
]
