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
from api.views.statistics_views import SystemStatisticsView

# Router chính của dự án
router = DefaultRouter()

# NOTE VAN DAP:
# DefaultRouter tu sinh cac endpoint REST:
# - /api/posts/ -> PostViewSet: list/create/retrieve/update...
# - /api/posts/<id>/approve/ -> custom action @action trong PostViewSet.
# - /api/users/me/ -> custom action trong UserViewSet.
# - /api/comments/ -> CommentViewSet.
# - /api/reactions/toggle/ -> ReactionViewSet.toggle.
# Noi cach khac: URL o day chi dang ky, logic nam trong views/.
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
    path('statistics/', SystemStatisticsView.as_view(), name='system-statistics'),
    path('', include(router.urls)),
]
