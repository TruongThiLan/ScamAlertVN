from api.urls.moderation_urls import urlpatterns as moderation_urlpatterns

# Re-export để core/urls.py có thể dùng include('api.urls')
urlpatterns = moderation_urlpatterns
