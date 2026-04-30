from django.urls import path, include
from rest_framework.routers import DefaultRouter
from api.views import (
    PostViewSet, 
    UserViewSet, 
    ScamCategoryViewSet, 
    ContentReportViewSet,
    CommentViewSet,
    ReactionViewSet
)
from api.views.interact_views import BookmarkViewSet, PostShareViewSet

# Router của REST Framework giúp tự động tạo các đường dẫn chuẩn
router = DefaultRouter()
router.register(r'posts', PostViewSet)
router.register(r'users', UserViewSet)
router.register(r'categories', ScamCategoryViewSet)
router.register(r'reports', ContentReportViewSet)
router.register(r'comments', CommentViewSet)
router.register(r'reactions', ReactionViewSet, basename='reaction')
router.register(r'bookmarks', BookmarkViewSet, basename='bookmark')
router.register(r'shares', PostShareViewSet, basename='share')

urlpatterns = [
    path('', include(router.urls)),

    # path('api/', include('api.interact_urls'))
]