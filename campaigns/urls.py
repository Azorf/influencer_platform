from django.urls import path
from . import views

app_name = 'campaigns'

urlpatterns = [
    # ===========================================
    # REST API ENDPOINTS (for Next.js frontend)
    # ===========================================
    
    # Campaign CRUD
    path('', views.CampaignListAPIView.as_view(), name='api_campaign_list'),
    path('create/', views.api_create_campaign, name='api_create_campaign'),
    path('<int:pk>/', views.CampaignDetailAPIView.as_view(), name='api_campaign_detail'),
    path('<int:pk>/update/', views.api_update_campaign, name='api_update_campaign'),
    path('<int:pk>/delete/', views.api_delete_campaign, name='api_delete_campaign'),
    
    # Collaborations
    path('<int:pk>/collaborations/', views.api_collaborations, name='api_collaborations'),
    path('<int:pk>/invite-influencer/', views.api_invite_influencer, name='api_invite_influencer'),
    path('<int:campaign_pk>/collaborations/<int:pk>/', views.api_update_collaboration, name='api_update_collaboration'),
    path('collaboration/<int:pk>/', views.api_collaboration_detail, name='api_collaboration_detail'),
    path('collaboration/<int:pk>/update-status/', views.api_update_collaboration_status, name='api_update_collaboration_status'),
    
    # Content
    path('collaboration/<int:pk>/content/', views.api_content_list, name='api_content_list'),
    path('collaboration/<int:pk>/content/create/', views.api_create_content, name='api_create_content'),
    path('<int:campaign_pk>/content/<int:pk>/', views.api_update_content, name='api_update_content'),
    path('content/<int:pk>/review/', views.api_review_content, name='api_review_content'),
    path('content/<int:pk>/update-metrics/', views.api_update_content_metrics, name='api_update_content_metrics'),
    
    # Analytics
    path('<int:pk>/analytics/', views.api_campaign_analytics, name='api_campaign_analytics'),
    path('<int:pk>/analytics/refresh/', views.api_refresh_analytics, name='api_refresh_analytics'),
]
