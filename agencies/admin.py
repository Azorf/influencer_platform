from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from .models import Agency, AgencyTeamMember, AgencySubscription, TeamInvitation


@admin.register(Agency)
class AgencyAdmin(admin.ModelAdmin):
    """Enhanced admin for the unified Agency/Brand model"""
    
    list_display = (
        'name', 'organization_type', 'industry', 'organization_size', 
        'country', 'is_verified', 'is_active', 'created_at'
    )
    
    list_filter = (
        'organization_type', 'industry', 'organization_size', 'country', 
        'is_verified', 'is_active', 'is_premium', 'created_at'
    )
    
    search_fields = ('name', 'display_name', 'email', 'description', 'user__email')
    
    readonly_fields = (
        'created_at', 'updated_at', 'total_campaigns_run', 
        'total_influencers_worked_with', 'average_campaign_roi'
    )
    
    ordering = ('-created_at',)
    
    fieldsets = (
        (_('Basic Information'), {
            'fields': ('user', 'name', 'display_name', 'description', 'organization_type')
        }),
        (_('Business Details'), {
            'fields': ('industry', 'organization_size', 'founded_year', 'monthly_budget_range')
        }),
        (_('Contact Information'), {
            'fields': ('email', 'phone', 'website')
        }),
        (_('Address'), {
            'fields': ('address_line_1', 'address_line_2', 'city', 'state', 'country', 'postal_code'),
            'classes': ('collapse',)
        }),
        (_('Branding & Social Media'), {
            'fields': ('logo', 'brand_colors', 'instagram_url', 'linkedin_url', 'twitter_url', 'facebook_url', 'youtube_url', 'tiktok_url'),
            'classes': ('collapse',)
        }),
        (_('Business Focus'), {
            'fields': ('specialties', 'target_demographics'),
            'classes': ('collapse',)
        }),
        (_('Platform Status'), {
            'fields': ('is_verified', 'is_active', 'is_premium')
        }),
        (_('Performance Metrics'), {
            'fields': ('total_campaigns_run', 'total_influencers_worked_with', 'average_campaign_roi'),
            'classes': ('collapse',)
        }),
        (_('Timestamps'), {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')
    
    actions = ['verify_organizations', 'unverify_organizations', 'activate_organizations', 'deactivate_organizations']
    
    def verify_organizations(self, request, queryset):
        count = queryset.update(is_verified=True)
        self.message_user(request, f'{count} organizations marked as verified.')
    verify_organizations.short_description = _('Mark selected organizations as verified')
    
    def unverify_organizations(self, request, queryset):
        count = queryset.update(is_verified=False)
        self.message_user(request, f'{count} organizations marked as unverified.')
    unverify_organizations.short_description = _('Mark selected organizations as unverified')
    
    def activate_organizations(self, request, queryset):
        count = queryset.update(is_active=True)
        self.message_user(request, f'{count} organizations activated.')
    activate_organizations.short_description = _('Activate selected organizations')
    
    def deactivate_organizations(self, request, queryset):
        count = queryset.update(is_active=False)
        self.message_user(request, f'{count} organizations deactivated.')
    deactivate_organizations.short_description = _('Deactivate selected organizations')


@admin.register(AgencyTeamMember)
class AgencyTeamMemberAdmin(admin.ModelAdmin):
    """Admin for team members"""
    
    list_display = (
        'user', 'agency', 'role', 'permissions', 'is_active', 
        'can_invite_members', 'can_manage_billing', 'joined_at'
    )
    
    list_filter = (
        'role', 'permissions', 'is_active', 'can_invite_members', 
        'can_manage_billing', 'joined_at'
    )
    
    search_fields = (
        'user__email', 'user__first_name', 'user__last_name', 
        'agency__name', 'agency__user__email'
    )
    
    readonly_fields = ('joined_at', 'last_active')
    
    ordering = ('-joined_at',)
    
    fieldsets = (
        (_('Member Information'), {
            'fields': ('user', 'agency')
        }),
        (_('Role & Permissions'), {
            'fields': ('role', 'permissions', 'can_invite_members', 'can_manage_billing')
        }),
        (_('Status'), {
            'fields': ('is_active',)
        }),
        (_('Timestamps'), {
            'fields': ('joined_at', 'last_active'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user', 'agency')


@admin.register(AgencySubscription)
class AgencySubscriptionAdmin(admin.ModelAdmin):
    """Admin for subscriptions"""
    
    list_display = (
        'agency', 'plan_type', 'status', 'start_date', 'end_date', 
        'trial_end_date', 'monthly_price', 'currency'
    )
    
    list_filter = (
        'plan_type', 'status', 'currency', 'start_date', 'trial_end_date'
    )
    
    search_fields = ('agency__name', 'agency__user__email')
    
    readonly_fields = ('created_at', 'updated_at')
    
    ordering = ('-created_at',)
    
    fieldsets = (
        (_('Subscription Details'), {
            'fields': ('agency', 'plan_type', 'status')
        }),
        (_('Dates'), {
            'fields': ('start_date', 'end_date', 'trial_end_date')
        }),
        (_('Usage Limits'), {
            'fields': ('max_campaigns', 'max_influencer_searches', 'max_team_members', 'max_reports_per_month')
        }),
        (_('Billing'), {
            'fields': ('monthly_price', 'currency')
        }),
        (_('Timestamps'), {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('agency')


@admin.register(TeamInvitation)
class TeamInvitationAdmin(admin.ModelAdmin):
    """Admin for team invitations"""
    
    list_display = (
        'email', 'agency', 'role', 'status', 'invited_by', 
        'sent_at', 'expires_at', 'accepted_at'
    )
    
    list_filter = (
        'status', 'role', 'permissions', 'sent_at', 'expires_at'
    )
    
    search_fields = (
        'email', 'agency__name', 'invited_by__email', 'agency__user__email'
    )
    
    readonly_fields = ('token', 'sent_at', 'accepted_at', 'accepted_by')
    
    ordering = ('-sent_at',)
    
    fieldsets = (
        (_('Invitation Details'), {
            'fields': ('agency', 'email', 'role', 'permissions', 'message')
        }),
        (_('Invitation Metadata'), {
            'fields': ('token', 'invited_by', 'status')
        }),
        (_('Timeline'), {
            'fields': ('sent_at', 'expires_at', 'accepted_at', 'accepted_by')
        }),
        (_('Response'), {
            'fields': ('response_message',),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('agency', 'invited_by', 'accepted_by')
    
    actions = ['resend_invitations', 'cancel_invitations']
    
    def resend_invitations(self, request, queryset):
        count = 0
        for invitation in queryset.filter(status='pending'):
            if not invitation.is_expired():
                # Here you could trigger email resend
                count += 1
        self.message_user(request, f'{count} invitations would be resent.')
    resend_invitations.short_description = _('Resend selected pending invitations')
    
    def cancel_invitations(self, request, queryset):
        count = queryset.filter(status='pending').update(status='cancelled')
        self.message_user(request, f'{count} invitations cancelled.')
    cancel_invitations.short_description = _('Cancel selected pending invitations')