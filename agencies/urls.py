from django.urls import path
from . import views

app_name = 'agencies'

urlpatterns = [
    # ===========================================
    # REST API ENDPOINTS (for Next.js frontend)
    # ===========================================
    
    # Agency CRUD
    path('', views.AgencyListAPIView.as_view(), name='api_agency_list'),
    path('me/', views.api_current_agency, name='api_current_agency'),
    path('create/', views.api_create_agency, name='api_create_agency'),
    path('<int:pk>/', views.AgencyDetailAPIView.as_view(), name='api_agency_detail'),
    path('<int:pk>/update/', views.api_update_agency, name='api_update_agency'),
    
    # Team management
    path('<int:pk>/team/', views.api_team_members, name='api_team_members'),
    path('<int:pk>/team/add/', views.api_add_team_member, name='api_add_team_member'),
    path('<int:pk>/team/<int:member_pk>/', views.api_update_team_member, name='api_update_team_member'),
    path('<int:pk>/team/<int:member_pk>/remove/', views.api_remove_team_member, name='api_remove_team_member'),
    
    # Invitations
    path('<int:pk>/invitations/', views.api_list_invitations, name='api_list_invitations'),
    path('<int:pk>/invitations/create/', views.api_create_invitation, name='api_create_invitation'),
    path('<int:pk>/invitations/<int:invitation_pk>/resend/', views.api_resend_invitation, name='api_resend_invitation'),
    path('<int:pk>/invitations/<int:invitation_pk>/cancel/', views.api_cancel_invitation, name='api_cancel_invitation'),
    path('invitations/accept/<uuid:token>/', views.api_accept_invitation, name='api_accept_invitation'),
    
    # Subscription
    path('<int:pk>/subscription/', views.api_subscription, name='api_subscription'),
    path('<int:pk>/subscription/update/', views.api_update_subscription, name='api_update_subscription'),
]
