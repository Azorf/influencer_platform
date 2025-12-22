# reports/urls.py
"""
URL patterns for reports REST API
"""
from django.urls import path
from . import views

app_name = 'reports'

urlpatterns = [
    # Reports
    path('', views.report_list, name='report_list'),
    path('<int:pk>/', views.report_detail, name='report_detail'),
    path('<int:pk>/download/', views.report_download, name='report_download'),
    path('<int:pk>/status/', views.report_status, name='report_status'),
    path('<int:pk>/regenerate/', views.report_regenerate, name='report_regenerate'),
    
    # Templates
    path('templates/', views.template_list, name='template_list'),
    path('templates/<int:pk>/', views.template_detail, name='template_detail'),
    
    # Dashboards
    path('dashboards/', views.dashboard_list, name='dashboard_list'),
    path('dashboards/<int:pk>/', views.dashboard_detail, name='dashboard_detail'),
    
    # Analytics Snapshots
    path('snapshots/', views.snapshot_list, name='snapshot_list'),
    
    # Subscriptions
    path('subscriptions/', views.subscription_list, name='subscription_list'),
    path('subscriptions/<int:pk>/', views.subscription_detail, name='subscription_detail'),
    path('subscriptions/<int:pk>/toggle/', views.subscription_toggle, name='subscription_toggle'),
    
    # Options (for forms)
    path('options/', views.report_options, name='report_options'),
]
