from django.urls import path
from . import views

app_name = 'reports'

urlpatterns = [
    # Reports
    path('', views.report_list_view, name='report_list'),
    path('create/', views.report_create_view, name='report_create'),
    path('<int:pk>/', views.report_detail_view, name='report_detail'),
    path('<int:pk>/download/', views.report_download_view, name='report_download'),
    path('<int:pk>/share/', views.report_share_view, name='report_share'),
    
    # Templates
    path('templates/', views.template_list_view, name='template_list'),
    path('templates/<int:pk>/', views.template_detail_view, name='template_detail'),
    
    # Dashboards
    path('dashboards/', views.dashboard_list_view, name='dashboard_list'),
    path('dashboards/create/', views.dashboard_create_view, name='dashboard_create'),
    path('dashboards/<int:pk>/', views.dashboard_view, name='dashboard_view'),
    path('dashboards/<int:pk>/edit/', views.dashboard_edit_view, name='dashboard_edit'),
    
    # Analytics snapshots
    path('snapshots/', views.snapshot_list_view, name='snapshot_list'),
    path('snapshots/create/', views.create_snapshot_view, name='create_snapshot'),
    
    # Subscriptions
    path('subscriptions/', views.subscription_list_view, name='subscription_list'),
    path('subscriptions/create/', views.subscription_create_view, name='subscription_create'),
]