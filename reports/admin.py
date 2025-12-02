from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from .models import Report, ReportTemplate, Dashboard, AnalyticsSnapshot, ReportSubscription


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ('title', 'report_type', 'agency', 'file_format', 'status', 'created_by', 'created_at')
    list_filter = ('report_type', 'file_format', 'status', 'is_scheduled', 'created_at')
    search_fields = ('title', 'description', 'agency__name', 'created_by__email')
    readonly_fields = ('created_at', 'updated_at', 'generation_started_at', 'generation_completed_at')
    
    fieldsets = (
        (_('Basic Information'), {
            'fields': ('title', 'description', 'report_type', 'created_by', 'agency')
        }),
        (_('Configuration'), {
            'fields': ('parameters', 'filters')
        }),
        (_('Output'), {
            'fields': ('file_format', 'file_path', 'report_data')
        }),
        (_('Status'), {
            'fields': ('status', 'generation_started_at', 'generation_completed_at', 'error_message')
        }),
        (_('Scheduling'), {
            'fields': ('is_scheduled', 'schedule_frequency', 'next_generation_date'),
            'classes': ('collapse',)
        }),
        (_('Timestamps'), {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(ReportTemplate)
class ReportTemplateAdmin(admin.ModelAdmin):
    list_display = ('name', 'report_type', 'is_public', 'created_by', 'created_at')
    list_filter = ('report_type', 'is_public', 'created_at')
    search_fields = ('name', 'description')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(Dashboard)
class DashboardAdmin(admin.ModelAdmin):
    list_display = ('name', 'dashboard_type', 'agency', 'is_default', 'created_by', 'created_at')
    list_filter = ('dashboard_type', 'is_default', 'created_at')
    search_fields = ('name', 'description', 'agency__name')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(AnalyticsSnapshot)
class AnalyticsSnapshotAdmin(admin.ModelAdmin):
    list_display = ('snapshot_type', 'get_related_object', 'snapshot_date', 'created_at')
    list_filter = ('snapshot_type', 'snapshot_date', 'created_at')
    search_fields = ('campaign__name', 'influencer__full_name', 'agency__name')
    readonly_fields = ('created_at',)
    
    def get_related_object(self, obj):
        if obj.campaign:
            return f"Campaign: {obj.campaign.name}"
        elif obj.influencer:
            return f"Influencer: {obj.influencer.full_name}"
        elif obj.agency:
            return f"Agency: {obj.agency.name}"
        return "Platform"
    get_related_object.short_description = _('Related Object')


@admin.register(ReportSubscription)
class ReportSubscriptionAdmin(admin.ModelAdmin):
    list_display = ('name', 'report_template', 'agency', 'frequency', 'delivery_method', 'is_active', 'next_delivery')
    list_filter = ('frequency', 'delivery_method', 'is_active', 'created_at')
    search_fields = ('name', 'agency__name', 'email_recipients')
    readonly_fields = ('created_at', 'updated_at', 'last_delivered')