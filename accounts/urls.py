from django.urls import path
from . import views

app_name = 'accounts'

urlpatterns = [
    # Authentication URLs (these work alongside django-allauth)
    path('signup/', views.signup_view, name='signup'),
    path('logout/', views.logout_view, name='logout'),
    
    # Profile URLs
    path('profile/', views.profile_view, name='profile'),
    path('profile/edit/', views.profile_edit_view, name='profile_edit'),
    
    # Dashboard
    path('dashboard/', views.dashboard_view, name='dashboard'),
    
    # AJAX URLs
    path('api/update-user-type/', views.update_user_type, name='update_user_type'),
    
    # Account management
    path('delete/', views.delete_account_view, name='delete_account'),
]