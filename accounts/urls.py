from django.urls import path
from . import views

app_name = 'accounts'

urlpatterns = [
    # ===========================================
    # REST API ENDPOINTS (for Next.js frontend)
    # ===========================================
    
    # Current user
    path('api/me/', views.api_current_user, name='api_current_user'),
    path('api/me/update/', views.api_update_user, name='api_update_user'),
    path('api/me/profile/', views.api_user_profile, name='api_user_profile'),
    path('api/me/change-password/', views.api_change_password, name='api_change_password'),
    path('api/me/delete/', views.api_delete_account, name='api_delete_account'),
    
    # Authentication
    path('api/logout/', views.api_logout, name='api_logout'),
    path('api/verify-token/', views.api_verify_token, name='api_verify_token'),
    
    # Google OAuth
    path('api/google/url/', views.api_google_auth_url, name='api_google_auth_url'),
    path('api/google/callback/', views.api_google_auth_callback, name='api_google_auth_callback'),
    
    # ===========================================
    # TEMPLATE-BASED URLS (for Django templates)
    # ===========================================
    
    # Authentication URLs (these work alongside django-allauth)
    path('signup/', views.signup_view, name='signup'),
    path('logout/', views.logout_view, name='logout'),
    
    # Profile URLs
    path('profile/', views.profile_view, name='profile'),
    path('profile/edit/', views.profile_edit_view, name='profile_edit'),
    
    # Dashboard
    path('dashboard/', views.dashboard_view, name='dashboard'),
    
    # AJAX URLs (legacy)
    path('api/update-user-type/', views.update_user_type, name='update_user_type'),
    
    # Account management
    path('delete/', views.delete_account_view, name='delete_account'),
]
