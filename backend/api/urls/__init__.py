from api.urls.public_urls import urlpatterns as public_urlpatterns
from api.urls.moderation_urls import urlpatterns as moderation_urlpatterns


urlpatterns = public_urlpatterns + moderation_urlpatterns
