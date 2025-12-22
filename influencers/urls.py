from django.urls import path
from . import views

app_name = 'influencers'

urlpatterns = [
    # ===========================================
    # REST API ENDPOINTS (for Next.js frontend)
    # ===========================================
    
    # List influencers with filtering
    # GET /api/influencers/
    path('', views.InfluencerListAPIView.as_view(), name='api_influencer_list'),
    
    # Get influencer details
    # GET /api/influencers/<id>/
    path('<int:pk>/', views.InfluencerDetailAPIView.as_view(), name='api_influencer_detail'),
    
    # Advanced search
    # POST /api/influencers/search/
    path('search/', views.influencer_search_api, name='api_influencer_search'),
    
    # Get influencer analytics
    # GET /api/influencers/analytics/<id>/
    path('analytics/<int:pk>/', views.influencer_analytics_api, name='api_influencer_analytics'),
    
    # Get social accounts for an influencer
    # GET /api/influencers/<id>/social-accounts/
    path('<int:pk>/social-accounts/', views.social_accounts_api, name='api_social_accounts'),
    
    # List all tags
    # GET /api/influencers/tags/
    path('tags/', views.tag_list_api, name='api_tag_list'),
    
    # List all categories
    # GET /api/influencers/categories/
    path('categories/', views.category_list_api, name='api_category_list'),
]
