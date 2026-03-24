from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    # path('api/', include('api.urls')), # Uncomment when api/urls.py is created
]
