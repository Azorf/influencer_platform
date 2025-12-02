from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from datetime import timedelta


class Influencer(models.Model):
    """Influencer profile model"""
    
    GENDER_CHOICES = (
        ('male', _('Male')),
        ('female', _('Female')),
        ('other', _('Other')),
        ('prefer_not_to_say', _('Prefer not to say')),
    )
    
    CATEGORY_CHOICES = (
        ('fashion', _('Fashion')),
        ('beauty', _('Beauty')),
        ('fitness', _('Fitness')),
        ('food', _('Food')),
        ('travel', _('Travel')),
        ('tech', _('Technology')),
        ('gaming', _('Gaming')),
        ('lifestyle', _('Lifestyle')),
        ('business', _('Business')),
        ('education', _('Education')),
        ('entertainment', _('Entertainment')),
        ('sports', _('Sports')),
        ('music', _('Music')),
        ('art', _('Art')),
        ('parenting', _('Parenting')),
        ('health', _('Health')),
        ('finance', _('Finance')),
    )
    
    # Basic Information
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='influencer_profile', blank=True, null=True)
    full_name = models.CharField(max_length=200)
    username = models.CharField(max_length=100, unique=True, help_text=_('Primary username (usually Instagram)'))
    email = models.EmailField(blank=True, null=True)
    bio = models.TextField(blank=True, null=True)
    avatar = models.ImageField(upload_to='influencer_avatars/', blank=True, null=True)
    
    # Demographics
    age = models.PositiveIntegerField(blank=True, null=True, validators=[MinValueValidator(13), MaxValueValidator(120)])
    gender = models.CharField(max_length=20, choices=GENDER_CHOICES, blank=True, null=True)
    location = models.CharField(max_length=200, blank=True, null=True)
    language = models.CharField(max_length=100, default='Arabic')
    
    # Categories and Niches
    primary_category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    secondary_categories = models.CharField(max_length=200, blank=True, null=True, help_text=_('Comma-separated list'))
    
    # Contact Information
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    website = models.URLField(blank=True, null=True)
    
    # Data Collection Workflow Fields
    is_influencer = models.BooleanField(default=True, help_text=_('Manually verified as actual influencer'))
    country = models.CharField(max_length=100, default='Morocco', help_text=_('Primary country/market'))
    data_source = models.CharField(max_length=50, default='manual', choices=[
        ('manual', _('Manual Entry')),
        ('social_blade', _('Social Blade')),
        ('scraping', _('Web Scraping')),
        ('api', _('Platform API')),
    ])
    
    # Verification and Status
    is_verified = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    
    # Data Collection Tracking
    social_blade_data_updated = models.DateTimeField(blank=True, null=True)
    manual_data_updated = models.DateTimeField(blank=True, null=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_scraped = models.DateTimeField(blank=True, null=True)
    
    class Meta:
        db_table = 'influencers_influencer'
        verbose_name = _('Influencer')
        verbose_name_plural = _('Influencers')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['username']),
            models.Index(fields=['country', 'is_influencer']),
            models.Index(fields=['primary_category']),
            models.Index(fields=['is_verified', 'is_active']),
        ]
    
    def __str__(self):
        return f"{self.full_name} (@{self.username})"
    
    def get_secondary_categories_list(self):
        """Return secondary categories as a list"""
        if self.secondary_categories:
            return [c.strip() for c in self.secondary_categories.split(',')]
        return []
    
    def get_follower_tier(self):
        """Get follower tier based on highest follower count across all platforms"""
        max_followers = 0
        for account in self.social_accounts.filter(is_active=True):
            if account.followers_count > max_followers:
                max_followers = account.followers_count
        
        if max_followers < 1000:
            return 'nano'
        elif max_followers < 10000:
            return 'micro'
        elif max_followers < 100000:
            return 'mid'
        elif max_followers < 1000000:
            return 'macro'
        else:
            return 'mega'
    
    def get_total_followers(self):
        """Get total followers across all platforms"""
        return self.social_accounts.filter(is_active=True).aggregate(
            total=models.Sum('followers_count')
        )['total'] or 0
    
    def get_primary_account(self):
        """Get the account with most followers (primary account)"""
        return self.social_accounts.filter(is_active=True).order_by('-followers_count').first()
    
    def get_platform_accounts(self):
        """Get dictionary of accounts by platform"""
        accounts = {}
        for account in self.social_accounts.filter(is_active=True):
            accounts[account.platform] = account
        return accounts
    
    def calculate_overall_engagement_rate(self):
        """Calculate weighted average engagement rate across all platforms"""
        total_followers = 0
        weighted_engagement = 0
        
        for account in self.social_accounts.filter(is_active=True):
            if account.followers_count > 0 and account.engagement_rate > 0:
                total_followers += account.followers_count
                weighted_engagement += account.engagement_rate * account.followers_count
        
        if total_followers > 0:
            return weighted_engagement / total_followers
        return 0.0


class SocialMediaAccount(models.Model):
    """Social media accounts for influencers"""
    
    PLATFORM_CHOICES = (
        ('instagram', _('Instagram')),
        ('youtube', _('YouTube')),
        ('tiktok', _('TikTok')),
        ('twitter', _('Twitter')),
        ('facebook', _('Facebook')),
        ('linkedin', _('LinkedIn')),
        ('snapchat', _('Snapchat')),
        ('twitch', _('Twitch')),
    )
    
    influencer = models.ForeignKey(Influencer, on_delete=models.CASCADE, related_name='social_accounts')
    platform = models.CharField(max_length=20, choices=PLATFORM_CHOICES)
    username = models.CharField(max_length=200)
    url = models.URLField()
    
    # Basic Metrics
    followers_count = models.PositiveIntegerField(default=0)
    following_count = models.PositiveIntegerField(default=0)
    posts_count = models.PositiveIntegerField(default=0)
    engagement_rate = models.FloatField(default=0.0, validators=[MinValueValidator(0), MaxValueValidator(100)])
    
    # Average Performance Metrics (for regular content)
    avg_likes = models.PositiveIntegerField(default=0)
    avg_comments = models.PositiveIntegerField(default=0)
    avg_shares = models.PositiveIntegerField(default=0)
    avg_views = models.PositiveIntegerField(default=0)  # For video platforms
    avg_saves = models.PositiveIntegerField(default=0)  # For platforms that support saves
    
    # Growth Tracking
    followers_14d_ago = models.PositiveIntegerField(default=0, help_text=_('Followers count 14 days ago'))
    followers_growth_14d = models.IntegerField(default=0, help_text=_('Followers gained in last 14 days'))
    followers_growth_rate_14d = models.FloatField(default=0.0, help_text=_('Growth rate % in last 14 days'))
    posts_count_14d = models.PositiveIntegerField(default=0, help_text=_('Posts in last 14 days'))
    
    # Verification and Status
    is_verified = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    
    # Data Tracking
    social_blade_updated = models.DateTimeField(blank=True, null=True)
    last_updated = models.DateTimeField(auto_now=True)
    last_scraped = models.DateTimeField(blank=True, null=True)
    
    class Meta:
        db_table = 'influencers_socialmediaaccount'
        verbose_name = _('Social Media Account')
        verbose_name_plural = _('Social Media Accounts')
        unique_together = ['influencer', 'platform', 'username']
        indexes = [
            models.Index(fields=['platform', 'followers_count']),
            models.Index(fields=['influencer', 'is_active']),
        ]
    
    def __str__(self):
        return f"{self.influencer.full_name} - {self.get_platform_display()}"
    
    def get_follower_tier(self):
        """Categorize influencer by follower count"""
        if self.followers_count < 1000:
            return 'nano'
        elif self.followers_count < 10000:
            return 'micro'
        elif self.followers_count < 100000:
            return 'mid'
        elif self.followers_count < 1000000:
            return 'macro'
        else:
            return 'mega'
    
    def calculate_growth_rate(self):
        """Calculate and update growth rate"""
        if self.followers_14d_ago > 0:
            self.followers_growth_14d = self.followers_count - self.followers_14d_ago
            self.followers_growth_rate_14d = (self.followers_growth_14d / self.followers_14d_ago) * 100
        else:
            self.followers_growth_rate_14d = 0.0
    
    def calculate_engagement_rate(self):
        """Calculate engagement rate based on average metrics"""
        if self.followers_count > 0:
            total_engagement = self.avg_likes + self.avg_comments + self.avg_shares
            self.engagement_rate = (total_engagement / self.followers_count) * 100
        else:
            self.engagement_rate = 0.0


class SponsoredPost(models.Model):
    """Sponsored/branded content tracking - individual post performance"""
    
    CAMPAIGN_TYPES = (
        ('sponsored', _('Sponsored Post')),
        ('partnership', _('Brand Partnership')),
        ('gifted', _('Gifted Product')),
        ('collaboration', _('Collaboration')),
        ('ambassador', _('Brand Ambassador')),
        ('affiliate', _('Affiliate Marketing')),
    )
    
    POST_TYPES = (
        ('photo', _('Photo')),
        ('video', _('Video')),
        ('carousel', _('Carousel')),
        ('reel', _('Reel')),
        ('story', _('Story')),
        ('igtv', _('IGTV')),
        ('youtube_video', _('YouTube Video')),
        ('tiktok_video', _('TikTok Video')),
        ('tweet', _('Tweet')),
    )
    
    # Link to influencer and platform
    influencer = models.ForeignKey(Influencer, on_delete=models.CASCADE, related_name='sponsored_posts')
    social_account = models.ForeignKey(SocialMediaAccount, on_delete=models.CASCADE, related_name='sponsored_posts')
    
    # Post Details
    post_url = models.URLField(help_text=_('Direct link to the sponsored post'))
    post_type = models.CharField(max_length=20, choices=POST_TYPES)
    caption = models.TextField(blank=True, null=True)
    hashtags = models.TextField(blank=True, null=True)
    
    # Brand Information
    brand_name = models.CharField(max_length=200)
    brand_handle = models.CharField(max_length=100, blank=True, null=True)
    campaign_type = models.CharField(max_length=50, choices=CAMPAIGN_TYPES, default='sponsored')
    
    # Individual Performance Metrics (only for sponsored content)
    views_count = models.PositiveIntegerField(default=0)
    likes_count = models.PositiveIntegerField(default=0)
    comments_count = models.PositiveIntegerField(default=0)
    shares_count = models.PositiveIntegerField(default=0)
    saves_count = models.PositiveIntegerField(default=0)
    
    # Engagement Calculation
    engagement_rate = models.FloatField(default=0.0, help_text=_('Post-specific engagement rate'))
    
    # Content Analysis
    disclosure_present = models.BooleanField(default=False, help_text=_('#ad, #sponsored, etc.'))
    disclosure_text = models.CharField(max_length=200, blank=True, null=True)
    product_mentions = models.TextField(blank=True, null=True)
    
    # Performance Tracking
    estimated_cost = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    estimated_reach = models.PositiveIntegerField(blank=True, null=True)
    cpm = models.DecimalField(max_digits=8, decimal_places=2, blank=True, null=True, help_text=_('Cost per mille'))
    cpe = models.DecimalField(max_digits=8, decimal_places=2, blank=True, null=True, help_text=_('Cost per engagement'))
    
    # Manual Data Entry
    manually_verified = models.BooleanField(default=False)
    notes = models.TextField(blank=True, null=True)
    
    # Timestamps
    posted_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'influencers_sponsoredpost'
        verbose_name = _('Sponsored Post')
        verbose_name_plural = _('Sponsored Posts')
        ordering = ['-posted_at']
        indexes = [
            models.Index(fields=['brand_name']),
            models.Index(fields=['campaign_type']),
            models.Index(fields=['influencer', 'posted_at']),
            models.Index(fields=['views_count']),
        ]
    
    def __str__(self):
        return f"{self.brand_name} - {self.influencer.username} ({self.posted_at.date()})"
    
    def calculate_engagement_rate(self):
        """Calculate engagement rate based on followers"""
        followers = self.social_account.followers_count
        if followers > 0:
            total_engagement = self.likes_count + self.comments_count + self.shares_count
            self.engagement_rate = (total_engagement / followers) * 100
        else:
            self.engagement_rate = 0.0
    
    def calculate_cpe(self):
        """Calculate cost per engagement"""
        total_engagement = self.likes_count + self.comments_count + self.shares_count
        if total_engagement > 0 and self.estimated_cost:
            self.cpe = self.estimated_cost / total_engagement
        else:
            self.cpe = None
    
    def calculate_cpm(self):
        """Calculate cost per mille (thousand impressions)"""
        if self.views_count > 0 and self.estimated_cost:
            self.cpm = (self.estimated_cost / self.views_count) * 1000
        else:
            self.cpm = None


class InfluencerDataImport(models.Model):
    """Track data import batches for influencers"""
    
    IMPORT_TYPES = (
        ('username_list', _('Username List Import')),
        ('social_blade', _('Social Blade Data')),
        ('manual_averages', _('Manual Average Metrics')),
        ('sponsored_content', _('Sponsored Content')),
    )
    
    STATUS_CHOICES = (
        ('pending', _('Pending')),
        ('processing', _('Processing')),
        ('completed', _('Completed')),
        ('failed', _('Failed')),
        ('partial', _('Partially Completed')),
    )
    
    import_type = models.CharField(max_length=20, choices=IMPORT_TYPES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # File and Data
    source_file = models.FileField(upload_to='imports/', blank=True, null=True)
    import_data = models.JSONField(default=dict, help_text=_('Raw import data'))
    
    # Results
    total_records = models.PositiveIntegerField(default=0)
    successful_records = models.PositiveIntegerField(default=0)
    failed_records = models.PositiveIntegerField(default=0)
    error_log = models.TextField(blank=True, null=True)
    
    # Processing Info
    started_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(blank=True, null=True)
    
    class Meta:
        db_table = 'influencers_dataimport'
        verbose_name = _('Data Import')
        verbose_name_plural = _('Data Imports')
        ordering = ['-started_at']
    
    def __str__(self):
        return f"{self.get_import_type_display()} - {self.status}"


class InfluencerAnalytics(models.Model):
    """Analytics and insights for influencers"""
    
    influencer = models.OneToOneField(Influencer, on_delete=models.CASCADE, related_name='analytics')
    
    # Audience insights
    audience_age_13_17 = models.FloatField(default=0.0)
    audience_age_18_24 = models.FloatField(default=0.0)
    audience_age_25_34 = models.FloatField(default=0.0)
    audience_age_35_44 = models.FloatField(default=0.0)
    audience_age_45_54 = models.FloatField(default=0.0)
    audience_age_55_plus = models.FloatField(default=0.0)
    
    audience_gender_male = models.FloatField(default=0.0)
    audience_gender_female = models.FloatField(default=0.0)
    
    # Geographic data (top countries)
    top_audience_countries = models.JSONField(default=dict, blank=True)
    top_audience_cities = models.JSONField(default=dict, blank=True)
    
    # Performance metrics
    avg_engagement_rate = models.FloatField(default=0.0)
    best_posting_times = models.JSONField(default=list, blank=True)
    most_engaging_content_types = models.JSONField(default=dict, blank=True)
    
    # Brand collaboration history
    estimated_rate_per_post = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    collaboration_count = models.PositiveIntegerField(default=0)
    
    # Quality scores
    authenticity_score = models.FloatField(default=0.0, validators=[MinValueValidator(0), MaxValueValidator(100)])
    influence_score = models.FloatField(default=0.0, validators=[MinValueValidator(0), MaxValueValidator(100)])
    
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'influencers_analytics'
        verbose_name = _('Influencer Analytics')
        verbose_name_plural = _('Influencer Analytics')
    
    def __str__(self):
        return f"{self.influencer.full_name} - Analytics"


class InfluencerTag(models.Model):
    """Tags for categorizing and filtering influencers"""
    
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    color = models.CharField(max_length=7, default='#007bff', help_text=_('Hex color code'))
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'influencers_tag'
        verbose_name = _('Tag')
        verbose_name_plural = _('Tags')
        ordering = ['name']
    
    def __str__(self):
        return self.name


class InfluencerTagging(models.Model):
    """Many-to-many relationship between influencers and tags"""
    
    influencer = models.ForeignKey(Influencer, on_delete=models.CASCADE, related_name='tags')
    tag = models.ForeignKey(InfluencerTag, on_delete=models.CASCADE, related_name='influencers')
    added_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    added_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'influencers_tagging'
        unique_together = ['influencer', 'tag']
    
    def __str__(self):
        return f"{self.influencer.username} - {self.tag.name}"