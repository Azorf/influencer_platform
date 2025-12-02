from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from .models import Agency, AgencyTeamMember, AgencySubscription


@admin.register(Agency)
class AgencyAdmin(admin.ModelAdmin):
    """Agency admin"""
    
    list_display = ('name', 'user', 'city', 'country', 'agency_size', 'is_verified', 'created_at')
    list_filter = ('agency_size', 'is_verified', 'country', 'created_at')
    search_fields = ('name', 'user__email', 'city', 'specialties')
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        (_('Basic Information'), {
            'fields': ('user', 'name', 'description', 'logo')
        }),
        (_('Contact Information'), {
            'fields': ('email', 'phone', 'website')
        }),
        (_('Address'), {
            'fields': ('address_line1', 'address_line2', 'city', 'state', 'postal_code', 'country'),
            'classes': ('collapse',)
        }),
        (_('Agency Details'), {
            'fields': ('agency_size', 'founded_year', 'specialties')
        }),
        (_('Verification'), {
            'fields': ('is_verified', 'verification_documents')
        }),
        (_('Timestamps'), {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(AgencyTeamMember)
class AgencyTeamMemberAdmin(admin.ModelAdmin):
    """Agency team member admin"""
    
    list_display = ('user', 'agency', 'role', 'is_active', 'joined_at')
    list_filter = ('role', 'is_active', 'joined_at')
    search_fields = ('user__email', 'user__username', 'agency__name')
    
    fieldsets = (
        (_('Team Member'), {
            'fields': ('agency', 'user', 'role', 'is_active')
        }),
        (_('Timestamps'), {
            'fields': ('joined_at',),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ('joined_at',)


@admin.register(AgencySubscription)
class AgencySubscriptionAdmin(admin.ModelAdmin):
    """Agency subscription admin"""
    
    list_display = ('agency', 'plan_type', 'status', 'start_date', 'end_date', 'is_active')
    list_filter = ('plan_type', 'status', 'start_date')
    search_fields = ('agency__name', 'agency__user__email')
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        (_('Subscription'), {
            'fields': ('agency', 'plan_type', 'status')
        }),
        (_('Dates'), {
            'fields': ('start_date', 'end_date', 'trial_end_date')
        }),
        (_('Payment'), {
            'fields': ('stripe_subscription_id', 'stripe_customer_id'),
            'classes': ('collapse',)
        }),
        (_('Limits'), {
            'fields': ('max_campaigns', 'max_influencer_searches', 'max_team_members'),
            'classes': ('collapse',)
        }),
        (_('Timestamps'), {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def is_active(self, obj):
        return obj.is_active()
    is_active.boolean = True
    is_active.short_description = _('Active')