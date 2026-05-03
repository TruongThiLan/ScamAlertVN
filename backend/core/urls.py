from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

# NOTE VAN DAP:
# Luong URL cap cao:
# 1. Frontend goi /api/login/ de lay access/refresh token JWT.
# 2. Cac API nghiep vu di vao /api/ va duoc tach tiep trong api/urls/.
# 3. Khi DEBUG=True, media upload duoc serve tu /media/ de frontend hien anh.
urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/', include('api.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
