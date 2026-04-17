from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PostViewSet, UserViewSet, ScamCategoryViewSet, ContentReportViewSet

# Router của REST Framework giúp tự động tạo các đường dẫn chuẩn
router = DefaultRouter()
router.register(r'posts', PostViewSet)
router.register(r'users', UserViewSet)
router.register(r'categories', ScamCategoryViewSet)
router.register(r'reports', ContentReportViewSet)

urlpatterns = [
    path('', include(router.urls)),
]