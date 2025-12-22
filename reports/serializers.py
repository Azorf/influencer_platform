# reports/serializers.py
"""
REST API serializers for reports app
"""
from rest_framework import serializers
from .models import Report, ReportTemplate, Dashboard, AnalyticsSnapshot, ReportSubscription


class ReportListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for report list"""
    
    reportType = serializers.CharField(source='report_type')
    reportTypeDisplay = serializers.CharField(source='get_report_type_display', read_only=True)
    fileFormat = serializers.CharField(source='file_format')
    fileFormatDisplay = serializers.CharField(source='get_file_format_display', read_only=True)
    statusDisplay = serializers.CharField(source='get_status_display', read_only=True)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    updatedAt = serializers.DateTimeField(source='updated_at', read_only=True)
    createdById = serializers.IntegerField(source='created_by_id', read_only=True)
    agencyId = serializers.IntegerField(source='agency_id', read_only=True)
    
    # Computed
    canDownload = serializers.SerializerMethodField()
    downloadUrl = serializers.SerializerMethodField()
    
    class Meta:
        model = Report
        fields = [
            'id', 'title', 'description', 'reportType', 'reportTypeDisplay',
            'fileFormat', 'fileFormatDisplay', 'status', 'statusDisplay',
            'createdAt', 'updatedAt', 'createdById', 'agencyId',
            'canDownload', 'downloadUrl',
        ]
    
    def get_canDownload(self, obj):
        return obj.status == 'completed' and bool(obj.file_path)
    
    def get_downloadUrl(self, obj):
        if obj.status == 'completed' and obj.file_path:
            return f"/api/reports/{obj.id}/download/"
        return None


class ReportDetailSerializer(serializers.ModelSerializer):
    """Full serializer for report detail"""
    
    reportType = serializers.CharField(source='report_type')
    reportTypeDisplay = serializers.CharField(source='get_report_type_display', read_only=True)
    fileFormat = serializers.CharField(source='file_format')
    fileFormatDisplay = serializers.CharField(source='get_file_format_display', read_only=True)
    statusDisplay = serializers.CharField(source='get_status_display', read_only=True)
    filePath = serializers.FileField(source='file_path', read_only=True)
    reportData = serializers.JSONField(source='report_data', read_only=True)
    createdById = serializers.IntegerField(source='created_by_id', read_only=True)
    agencyId = serializers.IntegerField(source='agency_id', read_only=True)
    generationStartedAt = serializers.DateTimeField(source='generation_started_at', read_only=True)
    generationCompletedAt = serializers.DateTimeField(source='generation_completed_at', read_only=True)
    errorMessage = serializers.CharField(source='error_message', read_only=True)
    isScheduled = serializers.BooleanField(source='is_scheduled')
    scheduleFrequency = serializers.CharField(source='schedule_frequency', allow_null=True)
    nextGenerationDate = serializers.DateTimeField(source='next_generation_date', allow_null=True)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    updatedAt = serializers.DateTimeField(source='updated_at', read_only=True)
    
    # Computed
    canDownload = serializers.SerializerMethodField()
    canRegenerate = serializers.SerializerMethodField()
    downloadUrl = serializers.SerializerMethodField()
    generationTime = serializers.SerializerMethodField()
    
    class Meta:
        model = Report
        fields = [
            'id', 'title', 'description', 'reportType', 'reportTypeDisplay',
            'parameters', 'filters', 'fileFormat', 'fileFormatDisplay',
            'filePath', 'reportData', 'status', 'statusDisplay',
            'createdById', 'agencyId',
            'generationStartedAt', 'generationCompletedAt', 'errorMessage',
            'isScheduled', 'scheduleFrequency', 'nextGenerationDate',
            'createdAt', 'updatedAt',
            'canDownload', 'canRegenerate', 'downloadUrl', 'generationTime',
        ]
    
    def get_canDownload(self, obj):
        return obj.status == 'completed' and bool(obj.file_path)
    
    def get_canRegenerate(self, obj):
        return obj.status in ['failed', 'completed']
    
    def get_downloadUrl(self, obj):
        if obj.status == 'completed' and obj.file_path:
            return f"/api/reports/{obj.id}/download/"
        return None
    
    def get_generationTime(self, obj):
        if obj.generation_completed_at and obj.generation_started_at:
            delta = obj.generation_completed_at - obj.generation_started_at
            return delta.total_seconds()
        return None


class ReportCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating reports"""
    
    reportType = serializers.CharField(source='report_type')
    fileFormat = serializers.CharField(source='file_format', default='pdf')
    isScheduled = serializers.BooleanField(source='is_scheduled', default=False)
    scheduleFrequency = serializers.CharField(source='schedule_frequency', required=False, allow_null=True)
    
    class Meta:
        model = Report
        fields = [
            'title', 'description', 'reportType', 'parameters', 'filters',
            'fileFormat', 'isScheduled', 'scheduleFrequency',
        ]


class ReportTemplateSerializer(serializers.ModelSerializer):
    """Serializer for report templates"""
    
    reportType = serializers.CharField(source='report_type')
    reportTypeDisplay = serializers.CharField(source='get_report_type_display', read_only=True)
    defaultParameters = serializers.JSONField(source='default_parameters')
    defaultFilters = serializers.JSONField(source='default_filters')
    chartConfigurations = serializers.JSONField(source='chart_configurations', read_only=True)
    isPublic = serializers.BooleanField(source='is_public')
    createdById = serializers.IntegerField(source='created_by_id', read_only=True)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    
    class Meta:
        model = ReportTemplate
        fields = [
            'id', 'name', 'description', 'reportType', 'reportTypeDisplay',
            'defaultParameters', 'defaultFilters', 'chartConfigurations',
            'sections', 'isPublic', 'createdById', 'createdAt',
        ]


class DashboardListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for dashboard list"""
    
    dashboardType = serializers.CharField(source='dashboard_type')
    dashboardTypeDisplay = serializers.CharField(source='get_dashboard_type_display', read_only=True)
    agencyId = serializers.IntegerField(source='agency_id', read_only=True)
    createdById = serializers.IntegerField(source='created_by_id', read_only=True)
    isDefault = serializers.BooleanField(source='is_default')
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    
    class Meta:
        model = Dashboard
        fields = [
            'id', 'name', 'description', 'dashboardType', 'dashboardTypeDisplay',
            'agencyId', 'createdById', 'isDefault', 'createdAt',
        ]


class DashboardDetailSerializer(serializers.ModelSerializer):
    """Full serializer for dashboard detail"""
    
    dashboardType = serializers.CharField(source='dashboard_type')
    dashboardTypeDisplay = serializers.CharField(source='get_dashboard_type_display', read_only=True)
    agencyId = serializers.IntegerField(source='agency_id', read_only=True)
    createdById = serializers.IntegerField(source='created_by_id', read_only=True)
    isDefault = serializers.BooleanField(source='is_default')
    autoRefreshInterval = serializers.IntegerField(source='auto_refresh_interval')
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    updatedAt = serializers.DateTimeField(source='updated_at', read_only=True)
    
    class Meta:
        model = Dashboard
        fields = [
            'id', 'name', 'description', 'dashboardType', 'dashboardTypeDisplay',
            'layout', 'widgets', 'agencyId', 'createdById',
            'isDefault', 'autoRefreshInterval', 'createdAt', 'updatedAt',
        ]


class DashboardCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating dashboards"""
    
    dashboardType = serializers.CharField(source='dashboard_type')
    isDefault = serializers.BooleanField(source='is_default', default=False)
    autoRefreshInterval = serializers.IntegerField(source='auto_refresh_interval', default=300)
    
    class Meta:
        model = Dashboard
        fields = [
            'name', 'description', 'dashboardType', 'layout', 'widgets',
            'isDefault', 'autoRefreshInterval',
        ]


class AnalyticsSnapshotSerializer(serializers.ModelSerializer):
    """Serializer for analytics snapshots"""
    
    snapshotType = serializers.CharField(source='snapshot_type')
    snapshotTypeDisplay = serializers.CharField(source='get_snapshot_type_display', read_only=True)
    campaignId = serializers.IntegerField(source='campaign_id', read_only=True, allow_null=True)
    influencerId = serializers.IntegerField(source='influencer_id', read_only=True, allow_null=True)
    agencyId = serializers.IntegerField(source='agency_id', read_only=True, allow_null=True)
    snapshotDate = serializers.DateTimeField(source='snapshot_date')
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    
    class Meta:
        model = AnalyticsSnapshot
        fields = [
            'id', 'snapshotType', 'snapshotTypeDisplay',
            'campaignId', 'influencerId', 'agencyId',
            'metrics', 'snapshotDate', 'createdAt',
        ]


class ReportSubscriptionSerializer(serializers.ModelSerializer):
    """Serializer for report subscriptions"""
    
    reportTemplateId = serializers.IntegerField(source='report_template_id')
    reportTemplateName = serializers.SerializerMethodField()
    agencyId = serializers.IntegerField(source='agency_id', read_only=True)
    frequencyDisplay = serializers.CharField(source='get_frequency_display', read_only=True)
    deliveryMethod = serializers.CharField(source='delivery_method')
    deliveryMethodDisplay = serializers.CharField(source='get_delivery_method_display', read_only=True)
    emailRecipients = serializers.CharField(source='email_recipients')
    slackWebhookUrl = serializers.URLField(source='slack_webhook_url', allow_null=True, required=False)
    customWebhookUrl = serializers.URLField(source='custom_webhook_url', allow_null=True, required=False)
    deliveryTime = serializers.TimeField(source='delivery_time')
    deliveryDayOfWeek = serializers.IntegerField(source='delivery_day_of_week', allow_null=True, required=False)
    deliveryDayOfMonth = serializers.IntegerField(source='delivery_day_of_month', allow_null=True, required=False)
    isActive = serializers.BooleanField(source='is_active')
    lastDelivered = serializers.DateTimeField(source='last_delivered', read_only=True, allow_null=True)
    nextDelivery = serializers.DateTimeField(source='next_delivery', read_only=True, allow_null=True)
    reportParameters = serializers.JSONField(source='report_parameters')
    createdById = serializers.IntegerField(source='created_by_id', read_only=True)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    
    class Meta:
        model = ReportSubscription
        fields = [
            'id', 'name', 'reportTemplateId', 'reportTemplateName', 'agencyId',
            'frequency', 'frequencyDisplay', 'deliveryMethod', 'deliveryMethodDisplay',
            'emailRecipients', 'slackWebhookUrl', 'customWebhookUrl',
            'deliveryTime', 'deliveryDayOfWeek', 'deliveryDayOfMonth',
            'isActive', 'lastDelivered', 'nextDelivery',
            'reportParameters', 'createdById', 'createdAt',
        ]
    
    def get_reportTemplateName(self, obj):
        return obj.report_template.name if obj.report_template else None
