"""
FILE ĐIỀU HƯỚNG TRUNG TÂM (API ROUTING)
--------------------------------------
File này kết nối các module URL con để tạo thành hệ thống API hoàn chỉnh.
"""

from django.urls import path, include

urlpatterns = [
    # Quản lý người dùng
    path('users/', include('api.urls.user_urls')),
    
    # Thông báo (Notifications)
    path('notifications/', include('api.urls.notification_urls')),
    
    # Bài viết và Danh mục (Công khai)
    path('', include('api.urls.report_urls')),
    
    # Các module khác
    path('', include('api.urls.public_urls')),
    path('', include('api.urls.interact_urls')),
    path('moderation/', include('api.urls.moderation_urls')),
]
