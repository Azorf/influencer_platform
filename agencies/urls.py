from django.urls import path
from . import views

app_name = 'agencies'

urlpatterns = [
    # Agency management
    path('setup/', views.agency_setup_view, name='agency_setup'),
    path('<int:pk>/', views.agency_detail_view, name='agency_detail'),
    path('<int:pk>/edit/', views.agency_edit_view, name='agency_edit'),
    path('list/', views.agency_list_view, name='agency_list'),
    
    # Team management (enhanced)
    path('<int:pk>/team/', views.team_manage_view, name='team_manage'),
    path('<int:pk>/team/add/', views.team_add_view, name='team_add'),  # Existing user
    path('<int:pk>/team/invite/', views.team_invite_view, name='team_invite'),  # New invitation
    path('<int:pk>/team/remove/<int:member_pk>/', views.team_remove_view, name='team_remove'),
    
    # Team invitation system
    path('invitations/accept/<uuid:token>/', views.accept_invitation_view, name='accept_invitation'),
    path('invitations/cancel/<int:invitation_pk>/', views.cancel_invitation_view, name='cancel_invitation'),
    
    # Subscription management
    path('<int:pk>/subscription/', views.subscription_view, name='subscription'),
    
    # API endpoints for AJAX operations
    path('api/<int:pk>/team/remove/', views.api_remove_team_member, name='api_remove_team_member'),
    path('api/<int:pk>/invitations/', views.api_list_invitations, name='api_list_invitations'),
    path('api/invitations/<int:invitation_pk>/resend/', views.api_resend_invitation, name='api_resend_invitation'),
]