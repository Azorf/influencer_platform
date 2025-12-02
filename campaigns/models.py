from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from decimal import Decimal


class Campaign(models.Model):
    """Marketing campaign model"""
    
    STATUS_CHOICES = (
        ('draft', _('Draft')),
        ('active', _('Active')),
        ('paused', _('Paused')),
        ('completed', _('Completed')),
        ('cancelled', _('Cancelled')),
    )
    
    CAMPAIGN_TYPES = (
        ('brand_awareness', _('Brand Awareness')),
        ('product_launch', _('Product Launch')),
        ('engagement', _('Engagement')),
        ('conversions', _('Conversions')),
        ('event_promotion', _('Event Promotion')),
        ('user_generated_content', _('User Generated Content')),
    )
    
    # Basic Information
    agency = models.ForeignKey('agencies.Agency', on_delete=models.CASCADE, related_name='campaigns')
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    campaign_type = models.CharField(max_length=50, choices=CAMPAIGN_TYPES)
    
    # Campaign Details
    brand_name = models.CharField(max_length=200)
    product_name = models.CharField(max_length=200, blank=True, null=True)
    target_audience = models.TextField(help_text=_('Describe your target audience'))
    campaign_objectives = models.TextField(help_text=_('What are you trying to achieve?'))
    
    # Budget and Timeline
    total_budget = models.DecimalField(max_digits=12, decimal_places=2)
    budget_currency = models.CharField(max_length=3, default='MAD')
    start_date = models.DateField()
    end_date = models.DateField()
    
    # Content Guidelines
    content_guidelines = models.TextField(blank=True, null=True)
    hashtags = models.CharField(max_length=500, blank=True, null=True, help_text=_('Required hashtags'))
    mentions = models.CharField(max_length=500, blank=True, null=True, help_text=_('Required mentions'))
    
    # Campaign Assets
    brief_document = models.FileField(upload_to='campaign_briefs/', blank=True, null=True)
    brand_assets = models.FileField(upload_to='brand_assets/', blank=True, null=True)
    
    # Status and Tracking
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'campaigns_campaign'
        verbose_name = _('Campaign')
        verbose_name_plural = _('Campaigns')
        ordering = ['-created_at']
    
    def __str__(self):
        return self.name
    
    def get_total_spent(self):
        """Calculate total amount spent on this campaign"""
        return sum(
            collaboration.agreed_rate 
            for collaboration in self.collaborations.filter(status='completed')
        )
    
    def get_remaining_budget(self):
        """Calculate remaining budget"""
        return self.total_budget - self.get_total_spent()


class InfluencerCollaboration(models.Model):
    """Individual collaborations between campaigns and influencers"""
    
    STATUS_CHOICES = (
        ('invited', _('Invited')),
        ('accepted', _('Accepted')),
        ('declined', _('Declined')),
        ('in_progress', _('In Progress')),
        ('content_submitted', _('Content Submitted')),
        ('approved', _('Approved')),
        ('published', _('Published')),
        ('completed', _('Completed')),
        ('cancelled', _('Cancelled')),
    )
    
    CONTENT_TYPES = (
        ('post', _('Social Media Post')),
        ('story', _('Story')),
        ('reel', _('Reel/Video')),
        ('igtv', _('IGTV')),
        ('youtube_video', _('YouTube Video')),
        ('tiktok_video', _('TikTok Video')),
        ('live_stream', _('Live Stream')),
        ('multiple', _('Multiple Content Types')),
    )
    
    campaign = models.ForeignKey(Campaign, on_delete=models.CASCADE, related_name='collaborations')
    influencer = models.ForeignKey('influencers.Influencer', on_delete=models.CASCADE, related_name='collaborations')
    
    # Collaboration Terms
    content_type = models.CharField(max_length=50, choices=CONTENT_TYPES)
    deliverables_count = models.PositiveIntegerField(default=1, help_text=_('Number of posts/videos required'))
    agreed_rate = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='MAD')
    
    # Timeline
    deadline = models.DateField()
    
    # Content Requirements
    specific_requirements = models.TextField(blank=True, null=True)
    
    # Status and Communication
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='invited')
    notes = models.TextField(blank=True, null=True)
    
    # Invitation and Response
    invited_at = models.DateTimeField(auto_now_add=True)
    responded_at = models.DateTimeField(blank=True, null=True)
    
    # Performance Tracking
    actual_reach = models.PositiveIntegerField(blank=True, null=True)
    actual_engagement = models.PositiveIntegerField(blank=True, null=True)
    
    # Payment Status
    payment_status = models.CharField(
        max_length=20,
        choices=[
            ('pending', _('Pending')),
            ('processing', _('Processing')),
            ('paid', _('Paid')),
            ('failed', _('Failed')),
        ],
        default='pending'
    )
    
    class Meta:
        db_table = 'campaigns_collaboration'
        verbose_name = _('Influencer Collaboration')
        verbose_name_plural = _('Influencer Collaborations')
        unique_together = ['campaign', 'influencer']
    
    def __str__(self):
        return f"{self.campaign.name} - {self.influencer.full_name}"


class CampaignContent(models.Model):
    """Content submissions for campaigns"""
    
    STATUS_CHOICES = (
        ('draft', _('Draft')),
        ('submitted', _('Submitted')),
        ('revision_requested', _('Revision Requested')),
        ('approved', _('Approved')),
        ('published', _('Published')),
        ('rejected', _('Rejected')),
    )
    
    collaboration = models.ForeignKey(InfluencerCollaboration, on_delete=models.CASCADE, related_name='content')
    
    # Content Details
    title = models.CharField(max_length=200, blank=True, null=True)
    caption = models.TextField(blank=True, null=True)
    
    # Media Files
    image = models.ImageField(upload_to='campaign_content/images/', blank=True, null=True)
    video = models.FileField(upload_to='campaign_content/videos/', blank=True, null=True)
    
    # External Content
    post_url = models.URLField(blank=True, null=True, help_text=_('URL of the published content'))
    
    # Review Process
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    feedback = models.TextField(blank=True, null=True, help_text=_('Feedback from agency'))
    
    # Performance Metrics
    likes_count = models.PositiveIntegerField(default=0)
    comments_count = models.PositiveIntegerField(default=0)
    shares_count = models.PositiveIntegerField(default=0)
    views_count = models.PositiveIntegerField(default=0)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    submitted_at = models.DateTimeField(blank=True, null=True)
    published_at = models.DateTimeField(blank=True, null=True)
    
    class Meta:
        db_table = 'campaigns_content'
        verbose_name = _('Campaign Content')
        verbose_name_plural = _('Campaign Content')
    
    def __str__(self):
        return f"{self.collaboration} - Content"


class CampaignAnalytics(models.Model):
    """Analytics and performance data for campaigns"""
    
    campaign = models.OneToOneField(Campaign, on_delete=models.CASCADE, related_name='analytics')
    
    # Reach and Impressions
    total_reach = models.PositiveIntegerField(default=0)
    total_impressions = models.PositiveIntegerField(default=0)
    
    # Engagement Metrics
    total_likes = models.PositiveIntegerField(default=0)
    total_comments = models.PositiveIntegerField(default=0)
    total_shares = models.PositiveIntegerField(default=0)
    total_saves = models.PositiveIntegerField(default=0)
    
    # Performance Indicators
    avg_engagement_rate = models.FloatField(default=0.0)
    cost_per_engagement = models.DecimalField(max_digits=8, decimal_places=2, default=Decimal('0.00'))
    
    # Conversion Tracking
    website_clicks = models.PositiveIntegerField(default=0)
    conversions = models.PositiveIntegerField(default=0)
    conversion_rate = models.FloatField(default=0.0)
    
    # ROI Metrics
    total_spent = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    estimated_value = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    roi_percentage = models.FloatField(default=0.0)
    
    # Last updated
    last_calculated = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'campaigns_analytics'
        verbose_name = _('Campaign Analytics')
        verbose_name_plural = _('Campaign Analytics')
    
    def __str__(self):
        return f"{self.campaign.name} - Analytics"