from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from .models import Campaign, InfluencerCollaboration, CampaignContent, CampaignAnalytics


@admin.register(Campaign)
class CampaignAdmin(admin.ModelAdmin):
    list_display = ('name', 'agency', 'campaign_type', 'status', 'total_budget', 'start_date', 'end_date', 'created_at')
    list_filter = ('campaign_type', 'status', 'budget_currency', 'start_date', 'created_at')
    search_fields = ('name', 'brand_name', 'product_name', 'agency__name')
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        (_('Basic Information'), {
            'fields': ('agency', 'name', 'description', 'campaign_type', 'created_by')
        }),
        (_('Campaign Details'), {
            'fields': ('brand_name', 'product_name', 'target_audience', 'campaign_objectives')
        }),
        (_('Budget and Timeline'), {
            'fields': ('total_budget', 'budget_currency', 'start_date', 'end_date')
        }),
        (_('Content Guidelines'), {
            'fields': ('content_guidelines', 'hashtags', 'mentions')
        }),
        (_('Assets'), {
            'fields': ('brief_document', 'brand_assets')
        }),
        (_('Status'), {
            'fields': ('status',)
        }),
        (_('Timestamps'), {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(InfluencerCollaboration)
class InfluencerCollaborationAdmin(admin.ModelAdmin):
    list_display = ('campaign', 'influencer', 'content_type', 'status', 'agreed_rate', 'deadline', 'payment_status')
    list_filter = ('status', 'content_type', 'payment_status', 'invited_at')
    search_fields = ('campaign__name', 'influencer__full_name', 'influencer__username')
    readonly_fields = ('invited_at', 'responded_at')


@admin.register(CampaignContent)
class CampaignContentAdmin(admin.ModelAdmin):
    list_display = ('collaboration', 'title', 'status', 'likes_count', 'comments_count', 'created_at', 'published_at')
    list_filter = ('status', 'created_at', 'published_at')
    search_fields = ('title', 'collaboration__campaign__name', 'collaboration__influencer__full_name')
    readonly_fields = ('created_at', 'submitted_at', 'published_at')


@admin.register(CampaignAnalytics)
class CampaignAnalyticsAdmin(admin.ModelAdmin):
    list_display = ('campaign', 'total_reach', 'total_impressions', 'avg_engagement_rate', 'total_spent', 'last_calculated')
    readonly_fields = ('last_calculated',)
    search_fields = ('campaign__name',)