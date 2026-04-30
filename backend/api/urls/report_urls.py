"""
DANH SÁCH CÁC ĐƯỜNG DẪN BÀI VIẾT & DANH MỤC:
-------------------------------------------
1. Bài viết (Post):
   - GET /api/posts/ : Danh sách các bài viết đã được duyệt

2. Danh mục (Category):
   - GET /api/categories/ : Danh sách các loại hình lừa đảo
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from ..views.report_views import PostViewSet, ScamCategoryViewSet

router = DefaultRouter()
router.register(r'posts', PostViewSet, basename='post')
router.register(r'categories', ScamCategoryViewSet, basename='category')

urlpatterns = [
    path('', include(router.urls)),
]
