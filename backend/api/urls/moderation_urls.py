"""
URLS CHO KIỂM DUYỆT & TOÀN BỘ HỆ THỐNG (TEAM STYLE)
--------------------------------------------------
File này đóng vai trò là Hub trung tâm để đăng ký toàn bộ Route của API.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from ..views.moderation_views import (
    UserViewSet, PostViewSet, ScamCategoryViewSet, ContentReportViewSet, NotificationViewSet
)

# Router chính của dự án
router = DefaultRouter()

# Đăng ký các module
router.register(r'reports', ContentReportViewSet, basename='content-report')
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'users', UserViewSet, basename='user')
router.register(r'posts', PostViewSet, basename='post')
router.register(r'categories', ScamCategoryViewSet, basename='category')

urlpatterns = [
    path('', include(router.urls)),
    
    # Include các URL thủ công khác nếu có
    path('', include('api.urls.public_urls')),
    path('', include('api.urls.interact_urls')),
]
