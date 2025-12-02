from django.urls import path
from . import views

app_name = 'influencers'

urlpatterns = [
    # Influencer management
    path('', views.influencer_list_view, name='influencer_list'),
    path('<int:pk>/', views.influencer_detail_view, name='influencer_detail'),
    path('search/', views.influencer_search_view, name='influencer_search'),
    path('analytics/<int:pk>/', views.influencer_analytics_view, name='influencer_analytics'),
    
    # Social media accounts
    path('<int:pk>/social-accounts/', views.social_accounts_view, name='social_accounts'),
    path('social-accounts/add/', views.add_social_account_view, name='add_social_account'),
    
    # Tags and categories
    path('tags/', views.tag_list_view, name='tag_list'),
    path('categories/', views.category_list_view, name='category_list'),
]