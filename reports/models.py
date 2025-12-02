from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _
import json


class Report(models.Model):
    """Report model for various analytics and insights"""
    
    REPORT_TYPES = (
        ('campaign_performance', _('Campaign Performance')),
        ('influencer_analytics', _('Influencer Analytics')),
        ('audience_insights', _('Audience Insights')),
        ('roi_analysis', _('ROI Analysis')),
        ('competitive_analysis', _('Competitive Analysis')),
        ('trend_analysis', _('Trend Analysis')),
        ('agency_dashboard', _('Agency Dashboard')),
        ('custom', _('Custom Report')),
    )
    
    STATUS_CHOICES = (
        ('generating', _('Generating')),
        ('completed', _('Completed')),
        ('failed', _('Failed')),
        ('scheduled', _('Scheduled')),
    )
    
    FORMAT_CHOICES = (
        ('pdf', _('PDF')),
        ('excel', _('Excel')),
        ('csv', _('CSV')),
        ('json', _('JSON')),
        ('dashboard', _('Dashboard View')),
    )
    
    # Basic Information
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    report_type = models.CharField(max_length=50, choices=REPORT_TYPES)
    
    # Report Configuration
    parameters = models.JSONField(default=dict, help_text=_('Report configuration parameters'))
    filters = models.JSONField(default=dict, help_text=_('Applied filters and date ranges'))
    
    # Generated Report
    file_format = models.CharField(max_length=20, choices=FORMAT_CHOICES, default='pdf')
    file_path = models.FileField(upload_to='reports/', blank=True, null=True)
    report_data = models.JSONField(default=dict, help_text=_('Structured report data'))
    
    # Ownership and Access
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='created_reports')
    agency = models.ForeignKey('agencies.Agency', on_delete=models.CASCADE, related_name='reports')
    
    # Status and Processing
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='generating')
    generation_started_at = models.DateTimeField(blank=True, null=True)
    generation_completed_at = models.DateTimeField(blank=True, null=True)
    error_message = models.TextField(blank=True, null=True)
    
    # Scheduling
    is_scheduled = models.BooleanField(default=False)
    schedule_frequency = models.CharField(
        max_length=20,
        choices=[
            ('daily', _('Daily')),
            ('weekly', _('Weekly')),
            ('monthly', _('Monthly')),
            ('quarterly', _('Quarterly')),
        ],
        blank=True, null=True
    )
    next_generation_date = models.DateTimeField(blank=True, null=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'reports_report'
        verbose_name = _('Report')
        verbose_name_plural = _('Reports')
        ordering = ['-created_at']
    
    def __str__(self):
        return self.title


class ReportTemplate(models.Model):
    """Templates for standardized reports"""
    
    name = models.CharField(max_length=200)
    description = models.TextField()
    report_type = models.CharField(max_length=50, choices=Report.REPORT_TYPES)
    
    # Template Configuration
    default_parameters = models.JSONField(default=dict)
    default_filters = models.JSONField(default=dict)
    chart_configurations = models.JSONField(default=list)
    
    # Template Structure
    sections = models.JSONField(default=list, help_text=_('Report sections and layout'))
    
    # Access Control
    is_public = models.BooleanField(default=False)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    allowed_agencies = models.ManyToManyField('agencies.Agency', blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'reports_template'
        verbose_name = _('Report Template')
        verbose_name_plural = _('Report Templates')
    
    def __str__(self):
        return self.name


class Dashboard(models.Model):
    """Custom dashboards for agencies"""
    
    DASHBOARD_TYPES = (
        ('executive', _('Executive Dashboard')),
        ('campaign_manager', _('Campaign Manager')),
        ('influencer_manager', _('Influencer Manager')),
        ('financial', _('Financial Dashboard')),
        ('custom', _('Custom Dashboard')),
    )
    
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    dashboard_type = models.CharField(max_length=50, choices=DASHBOARD_TYPES)
    
    # Dashboard Configuration
    layout = models.JSONField(default=dict, help_text=_('Dashboard layout configuration'))
    widgets = models.JSONField(default=list, help_text=_('Widget configurations'))
    
    # Access Control
    agency = models.ForeignKey('agencies.Agency', on_delete=models.CASCADE, related_name='dashboards')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    shared_with = models.ManyToManyField(settings.AUTH_USER_MODEL, blank=True, related_name='accessible_dashboards')
    
    # Settings
    is_default = models.BooleanField(default=False)
    auto_refresh_interval = models.PositiveIntegerField(default=300, help_text=_('Auto-refresh interval in seconds'))
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'reports_dashboard'
        verbose_name = _('Dashboard')
        verbose_name_plural = _('Dashboards')
    
    def __str__(self):
        return f"{self.agency.name} - {self.name}"


class AnalyticsSnapshot(models.Model):
    """Periodic snapshots of key metrics for historical tracking"""
    
    SNAPSHOT_TYPES = (
        ('campaign', _('Campaign Metrics')),
        ('influencer', _('Influencer Metrics')),
        ('agency', _('Agency Metrics')),
        ('platform', _('Platform Metrics')),
    )
    
    snapshot_type = models.CharField(max_length=20, choices=SNAPSHOT_TYPES)
    
    # Related Objects
    campaign = models.ForeignKey('campaigns.Campaign', on_delete=models.CASCADE, blank=True, null=True, related_name='snapshots')
    influencer = models.ForeignKey('influencers.Influencer', on_delete=models.CASCADE, blank=True, null=True, related_name='snapshots')
    agency = models.ForeignKey('agencies.Agency', on_delete=models.CASCADE, blank=True, null=True, related_name='snapshots')
    
    # Metrics Data
    metrics = models.JSONField(default=dict, help_text=_('Snapshot of metrics at this point in time'))
    
    # Snapshot Metadata
    snapshot_date = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'reports_snapshot'
        verbose_name = _('Analytics Snapshot')
        verbose_name_plural = _('Analytics Snapshots')
        ordering = ['-snapshot_date']
    
    def __str__(self):
        return f"{self.get_snapshot_type_display()} - {self.snapshot_date.strftime('%Y-%m-%d')}"


class ReportSubscription(models.Model):
    """Subscriptions for automated report delivery"""
    
    FREQUENCY_CHOICES = (
        ('daily', _('Daily')),
        ('weekly', _('Weekly')),
        ('monthly', _('Monthly')),
        ('quarterly', _('Quarterly')),
    )
    
    DELIVERY_METHODS = (
        ('email', _('Email')),
        ('slack', _('Slack')),
        ('webhook', _('Webhook')),
    )
    
    # Subscription Details
    name = models.CharField(max_length=200)
    report_template = models.ForeignKey(ReportTemplate, on_delete=models.CASCADE, related_name='subscriptions')
    agency = models.ForeignKey('agencies.Agency', on_delete=models.CASCADE, related_name='report_subscriptions')
    
    # Delivery Settings
    frequency = models.CharField(max_length=20, choices=FREQUENCY_CHOICES)
    delivery_method = models.CharField(max_length=20, choices=DELIVERY_METHODS)
    
    # Recipients
    email_recipients = models.TextField(help_text=_('Comma-separated email addresses'))
    slack_webhook_url = models.URLField(blank=True, null=True)
    custom_webhook_url = models.URLField(blank=True, null=True)
    
    # Schedule
    delivery_time = models.TimeField(help_text=_('Time of day to deliver reports'))
    delivery_day_of_week = models.IntegerField(
        blank=True, null=True,
        choices=[(i, day) for i, day in enumerate(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])],
        help_text=_('Day of week for weekly reports (0=Monday)')
    )
    delivery_day_of_month = models.IntegerField(
        blank=True, null=True,
        help_text=_('Day of month for monthly reports (1-28)')
    )
    
    # Status
    is_active = models.BooleanField(default=True)
    last_delivered = models.DateTimeField(blank=True, null=True)
    next_delivery = models.DateTimeField(blank=True, null=True)
    
    # Configuration
    report_parameters = models.JSONField(default=dict)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'reports_subscription'
        verbose_name = _('Report Subscription')
        verbose_name_plural = _('Report Subscriptions')
    
    def __str__(self):
        return f"{self.name} - {self.get_frequency_display()}"