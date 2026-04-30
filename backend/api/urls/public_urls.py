from django.urls import include, path
from rest_framework.routers import DefaultRouter

from api.views.public_views import PublicCommentViewSet, PublicPostViewSet, RegisterView


router = DefaultRouter()
router.register(r'posts', PublicPostViewSet, basename='public-post')
router.register(r'comments', PublicCommentViewSet, basename='public-comment')

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('public/', include(router.urls)),
]
