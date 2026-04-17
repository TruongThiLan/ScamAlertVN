from django.urls import path

from api.views.public_views import RegisterView


urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
]
