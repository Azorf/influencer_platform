from django.urls import path
from . import views

app_name = 'campaigns'

urlpatterns = [
    # Campaign management
    path('', views.campaign_list_view, name='campaign_list'),
    path('create/', views.campaign_create_view, name='campaign_create'),
    path('<int:pk>/', views.campaign_detail_view, name='campaign_detail'),
    path('<int:pk>/edit/', views.campaign_edit_view, name='campaign_edit'),
    path('<int:pk>/delete/', views.campaign_delete_view, name='campaign_delete'),
    
    # Collaborations
    path('<int:pk>/collaborations/', views.collaboration_list_view, name='collaboration_list'),
    path('<int:pk>/invite-influencer/', views.invite_influencer_view, name='invite_influencer'),
    path('collaboration/<int:pk>/', views.collaboration_detail_view, name='collaboration_detail'),
    path('collaboration/<int:pk>/update-status/', views.update_collaboration_status, name='update_collaboration_status'),
    
    # Content management
    path('collaboration/<int:pk>/content/', views.content_list_view, name='content_list'),
    path('content/<int:pk>/review/', views.content_review_view, name='content_review'),
    
    # Analytics
    path('<int:pk>/analytics/', views.campaign_analytics_view, name='campaign_analytics'),
]