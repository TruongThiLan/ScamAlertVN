
# ============================================================
# interact_urls.py
# Chức năng: URL routing cho Tương tác & Phản hồi (UC 10.1 – 10.4)
# ============================================================

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from api.views.interact_views import (
    CommentViewSet,
    ContentReportViewSet,
    ReactionViewSet,
    BookmarkViewSet,
    PostShareViewSet,
)

router = DefaultRouter()

# UC 10.2 – Bình luận bài viết & Phản hồi bình luận
router.register(r'comments', CommentViewSet, basename='comment')

# UC 10.4 – Báo cáo bài viết / bình luận
router.register(r'reports', ContentReportViewSet, basename='report')

# UC 10.3 – Like / Unlike bài viết và bình luận
router.register(r'reactions', ReactionViewSet, basename='reaction')

# Bookmark (lưu bài viết)
router.register(r'bookmarks', BookmarkViewSet, basename='bookmark')

# UC 10.1 – Chia sẻ bài viết
router.register(r'shares', PostShareViewSet, basename='share')

urlpatterns = [
    path('', include(router.urls)),
]
