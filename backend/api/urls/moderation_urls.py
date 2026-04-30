"""
URLS CHO KIỂM DUYỆT & TOÀN BỘ HỆ THỐNG (TEAM STYLE)
--------------------------------------------------
File này đóng vai trò là Hub trung tâm để đăng ký toàn bộ Route của API.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from ..views.notification_views import NotificationViewSet
from api.views import (
    PostViewSet, 
    UserViewSet, 
    ScamCategoryViewSet, 
    ContentReportViewSet,
    CommentViewSet,
    ReactionViewSet
)
from api.views.interact_views import BookmarkViewSet, PostShareViewSet

# Router chính của dự án
router = DefaultRouter()

router.register(r'posts', PostViewSet)
router.register(r'users', UserViewSet)
router.register(r'categories', ScamCategoryViewSet)
router.register(r'reports', ContentReportViewSet)
router.register(r'comments', CommentViewSet)
router.register(r'reactions', ReactionViewSet, basename='reaction')
router.register(r'bookmarks', BookmarkViewSet, basename='bookmark')
router.register(r'shares', PostShareViewSet, basename='share')
router.register(r'notifications', NotificationViewSet, basename='notification')

urlpatterns = [
    path('', include(router.urls)),

    path('api/', include('api.urls.interact_urls')),
]
