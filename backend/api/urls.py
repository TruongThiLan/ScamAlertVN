from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PostViewSet, UserViewSet, ScamCategoryViewSet # Thêm các View khác vào đây khi code thêm

# Router của REST Framework giúp tự động tạo các đường dẫn chuẩn (GET, POST, PUT, DELETE)
router = DefaultRouter()
router.register(r'posts', PostViewSet)
router.register(r'users', UserViewSet)
router.register(r'categories', ScamCategoryViewSet)

urlpatterns = [
    path('', include(router.urls)),
]