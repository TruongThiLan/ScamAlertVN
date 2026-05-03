from api.urls.public_urls import urlpatterns as public_urlpatterns
from api.urls.moderation_urls import urlpatterns as moderation_urlpatterns


# NOTE VAN DAP:
# File nay gom cac nhom route con lai thanh mot urlpatterns duy nhat.
# core/urls.py include('api.urls') se doc file nay, nen day la diem hop nhat route.
# public_urlpatterns: register va API public.
# moderation_urlpatterns: API chinh cho post/user/category/comment/reaction/admin.
urlpatterns = public_urlpatterns + moderation_urlpatterns
