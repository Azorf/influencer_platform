from django.urls import path
from . import views

app_name = 'agencies'

urlpatterns = [
    # Agency management
    path('setup/', views.agency_setup_view, name='agency_setup'),
    path('<int:pk>/', views.agency_detail_view, name='agency_detail'),
    path('<int:pk>/edit/', views.agency_edit_view, name='agency_edit'),
    path('list/', views.agency_list_view, name='agency_list'),
    
    # Team management
    path('<int:pk>/team/', views.team_manage_view, name='team_manage'),
    path('<int:pk>/team/add/', views.team_add_view, name='team_add'),
    path('<int:pk>/team/remove/<int:member_pk>/', views.team_remove_view, name='team_remove'),
    
    # Subscription management
    path('<int:pk>/subscription/', views.subscription_view, name='subscription'),
]