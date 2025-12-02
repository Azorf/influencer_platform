from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from django.utils.html import format_html
from django.db.models import Sum, Avg
from django.urls import reverse
from .models import (
    Influencer, SocialMediaAccount, InfluencerAnalytics, InfluencerTag, 
    InfluencerTagging, SponsoredPost, InfluencerDataImport
)


@admin.register(Influencer)
class InfluencerAdmin(admin.ModelAdmin):
    list_display = (
        'full_name', 'username', 'primary_category', 'country', 'is_influencer', 
        'follower_tier', 'is_verified', 'data_source', 'created_at'
    )
    list_filter = (
        'primary_category', 'country', 'is_influencer', 'is_verified', 
        'is_active', 'gender', 'language', 'data_source', 'created_at'
    )
    search_fields = ('full_name', 'username', 'email', 'location')
    readonly_fields = (
        'created_at', 'updated_at', 'last_scraped', 'follower_tier_display',
        'total_followers', 'social_blade_data_updated', 'manual_data_updated'
    )
    
    fieldsets = (
        (_('Basic Information'), {
            'fields': ('user', 'full_name', 'username', 'email', 'bio', 'avatar')
        }),
        (_('Demographics'), {
            'fields': ('age', 'gender', 'location', 'language')
        }),
        (_('Categories'), {
            'fields': ('primary_category', 'secondary_categories')
        }),
        (_('Data Collection'), {
            'fields': (
                'is_influencer', 'country', 'data_source', 
                'social_blade_data_updated', 'manual_data_updated'
            )
        }),
        (_('Contact'), {
            'fields': ('phone_number', 'website')
        }),
        (_('Status'), {
            'fields': ('is_verified', 'is_active', 'follower_tier_display', 'total_followers')
        }),
        (_('Timestamps'), {
            'fields': ('created_at', 'updated_at', 'last_scraped'),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['mark_as_verified', 'mark_as_not_influencer', 'update_from_social_blade']
    
    def follower_tier(self, obj):
        return obj.get_follower_tier().title()
    follower_tier.short_description = _('Tier')
    
    def follower_tier_display(self, obj):
        tier = obj.get_follower_tier()
        total_followers = self.total_followers(obj)
        return f"{tier.title()} ({total_followers:,} followers)"
    follower_tier_display.short_description = _('Follower Tier')
    
    def total_followers(self, obj):
        return obj.social_accounts.aggregate(
            total=Sum('followers_count')
        )['total'] or 0
    total_followers.short_description = _('Total Followers')
    
    def mark_as_verified(self, request, queryset):
        updated = queryset.update(is_verified=True)
        self.message_user(request, f'{updated} influencers marked as verified.')
    mark_as_verified.short_description = _('Mark selected influencers as verified')
    
    def mark_as_not_influencer(self, request, queryset):
        updated = queryset.update(is_influencer=False, is_active=False)
        self.message_user(request, f'{updated} accounts marked as non-influencer.')
    mark_as_not_influencer.short_description = _('Mark selected as non-influencer')


@admin.register(SocialMediaAccount)
class SocialMediaAccountAdmin(admin.ModelAdmin):
    list_display = (
        'influencer', 'platform', 'username', 'followers_count', 'followers_growth_14d',
        'engagement_rate', 'avg_views', 'is_verified', 'social_blade_updated'
    )
    list_filter = ('platform', 'is_verified', 'is_active', 'social_blade_updated')
    search_fields = ('influencer__full_name', 'influencer__username', 'username', 'url')
    readonly_fields = ('last_updated', 'last_scraped', 'follower_tier', 'growth_rate_display')
    
    fieldsets = (
        (_('Account Info'), {
            'fields': ('influencer', 'platform', 'username', 'url', 'is_verified', 'is_active')
        }),
        (_('Current Metrics'), {
            'fields': (
                'followers_count', 'following_count', 'posts_count', 'engagement_rate'
            )
        }),
        (_('Average Performance'), {
            'fields': ('avg_likes', 'avg_comments', 'avg_shares', 'avg_views', 'avg_saves')
        }),
        (_('Growth Tracking (14 Days)'), {
            'fields': (
                'followers_14d_ago', 'followers_growth_14d', 'followers_growth_rate_14d',
                'posts_count_14d', 'growth_rate_display'
            )
        }),
        (_('Data Sources'), {
            'fields': ('social_blade_updated', 'last_updated', 'last_scraped'),
            'classes': ('collapse',)
        }),
    )
    
    def follower_tier(self, obj):
        return obj.get_follower_tier().title()
    follower_tier.short_description = _('Tier')
    
    def growth_rate_display(self, obj):
        if obj.followers_growth_rate_14d > 0:
            color = 'green'
            symbol = '↗'
        elif obj.followers_growth_rate_14d < 0:
            color = 'red'
            symbol = '↘'
        else:
            color = 'gray'
            symbol = '→'
        
        return format_html(
            '<span style="color: {};">{} {:.2f}%</span>',
            color, symbol, obj.followers_growth_rate_14d
        )
    growth_rate_display.short_description = _('Growth Rate (14d)')


@admin.register(SponsoredPost)
class SponsoredPostAdmin(admin.ModelAdmin):
    list_display = (
        'influencer', 'brand_name', 'campaign_type', 'platform', 'views_count',
        'likes_count', 'engagement_rate', 'estimated_cost', 'manually_verified', 'posted_at'
    )
    list_filter = (
        'campaign_type', 'disclosure_present', 'manually_verified',
        'social_account__platform', 'posted_at'
    )
    search_fields = (
        'brand_name', 'brand_handle', 'influencer__full_name', 'influencer__username',
        'product_mentions', 'disclosure_text'
    )
    readonly_fields = ('engagement_rate', 'created_at', 'updated_at')
    
    fieldsets = (
        (_('Influencer & Platform'), {
            'fields': ('influencer', 'social_account')
        }),
        (_('Post Details'), {
            'fields': ('post_url', 'post_type', 'caption', 'hashtags', 'posted_at')
        }),
        (_('Brand Information'), {
            'fields': ('brand_name', 'brand_handle', 'campaign_type')
        }),
        (_('Performance Metrics'), {
            'fields': (
                'views_count', 'likes_count', 'comments_count', 
                'shares_count', 'saves_count', 'engagement_rate'
            )
        }),
        (_('Content Analysis'), {
            'fields': ('disclosure_present', 'disclosure_text', 'product_mentions')
        }),
        (_('Business Metrics'), {
            'fields': ('estimated_cost', 'estimated_reach', 'cpm', 'cpe')
        }),
        (_('Verification'), {
            'fields': ('manually_verified', 'notes')
        }),
        (_('Timestamps'), {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['mark_as_verified', 'calculate_metrics']
    
    def platform(self, obj):
        return obj.social_account.get_platform_display()
    platform.short_description = _('Platform')
    
    def mark_as_verified(self, request, queryset):
        updated = queryset.update(manually_verified=True)
        self.message_user(request, f'{updated} sponsored posts marked as verified.')
    mark_as_verified.short_description = _('Mark selected posts as verified')
    
    def calculate_metrics(self, request, queryset):
        updated = 0
        for post in queryset:
            post.calculate_engagement_rate()
            post.calculate_cpe()
            post.calculate_cpm()
            post.save()
            updated += 1
        self.message_user(request, f'Calculated metrics for {updated} sponsored posts.')
    calculate_metrics.short_description = _('Recalculate performance metrics')


@admin.register(InfluencerDataImport)
class InfluencerDataImportAdmin(admin.ModelAdmin):
    list_display = (
        'import_type', 'status', 'total_records', 'successful_records',
        'failed_records', 'started_by', 'started_at', 'completed_at'
    )
    list_filter = ('import_type', 'status', 'started_at')
    search_fields = ('started_by__username', 'error_log')
    readonly_fields = (
        'started_at', 'completed_at', 'success_rate'
    )
    
    fieldsets = (
        (_('Import Details'), {
            'fields': ('import_type', 'status', 'started_by')
        }),
        (_('Data Source'), {
            'fields': ('source_file', 'import_data')
        }),
        (_('Results'), {
            'fields': (
                'total_records', 'successful_records', 'failed_records', 'success_rate'
            )
        }),
        (_('Errors'), {
            'fields': ('error_log',),
            'classes': ('collapse',)
        }),
        (_('Timing'), {
            'fields': ('started_at', 'completed_at')
        }),
    )
    
    def success_rate(self, obj):
        if obj.total_records > 0:
            rate = (obj.successful_records / obj.total_records) * 100
            color = 'green' if rate > 90 else 'orange' if rate > 70 else 'red'
            return format_html(
                '<span style="color: {};">{:.1f}%</span>',
                color, rate
            )
        return 'N/A'
    success_rate.short_description = _('Success Rate')


@admin.register(InfluencerAnalytics)
class InfluencerAnalyticsAdmin(admin.ModelAdmin):
    list_display = ('influencer', 'avg_engagement_rate', 'authenticity_score', 'influence_score', 'updated_at')
    readonly_fields = ('updated_at',)


@admin.register(InfluencerTag)
class InfluencerTagAdmin(admin.ModelAdmin):
    list_display = ('name', 'color', 'created_at')
    search_fields = ('name',)


@admin.register(InfluencerTagging)
class InfluencerTaggingAdmin(admin.ModelAdmin):
    list_display = ('influencer', 'tag', 'added_by', 'added_at')
    list_filter = ('tag', 'added_at')
    search_fields = ('influencer__full_name', 'tag__name')