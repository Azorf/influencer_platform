from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse

def api_root(request):
    """API root endpoint - lists available endpoints"""
    return JsonResponse({
        "message": "Influencer Platform API",
        "version": "1.0",
        "endpoints": {
            "admin": "/admin/",
            "auth": "/api/auth/",
            "agencies": "/api/agencies/",
            "influencers": "/api/influencers/",
            "campaigns": "/api/campaigns/",
            "payments": "/api/payments/",
            "reports": "/api/reports/",
            "docs": "/api/docs/"
        }
    })

urlpatterns = [
    # API root
    path('', api_root, name='api_root'),
    
    # Admin (keep for management)
    path('admin/', admin.site.urls),
    
    # API endpoints
    path('api/auth/', include('allauth.urls')),
    path('api/accounts/', include('accounts.urls')),
    path('api/agencies/', include('agencies.urls')),
    path('api/influencers/', include('influencers.urls')),
    path('api/campaigns/', include('campaigns.urls')),
    path('api/payments/', include('payments.urls')),
    path('api/reports/', include('reports.urls')),
]

# Static files for admin only
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

# Admin customization
admin.site.site_header = "Influencer Platform API Admin"
admin.site.site_title = "Influencer Platform API"
admin.site.index_title = "API Administration"