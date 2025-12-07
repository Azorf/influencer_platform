# Fixed Agency Model with proper nullable fields
# agencies/models.py

from django.db import models
from django.contrib.auth import get_user_model
from django.utils.translation import gettext_lazy as _
from django.core.validators import URLValidator
import uuid

User = get_user_model()


class Agency(models.Model):
    """
    Unified model for both Marketing Agencies and Brands
    This model represents any organization that creates campaigns
    """
    
    ORGANIZATION_TYPES = (
        ('agency', _('Marketing Agency')),
        ('brand', _('Brand/Company')),
        ('freelancer', _('Freelance Marketer')),
    )
    
    ORGANIZATION_SIZES = (
        ('startup', _('Startup (1-10 employees)')),
        ('small', _('Small (11-50 employees)')),
        ('medium', _('Medium (51-200 employees)')),
        ('large', _('Large (201-1000 employees)')),
        ('enterprise', _('Enterprise (1000+ employees)')),
    )
    
    INDUSTRIES = (
        # Tech & Digital
        ('technology', _('Technology')),
        ('software', _('Software & SaaS')),
        ('fintech', _('Fintech')),
        ('ecommerce', _('E-commerce')),
        ('gaming', _('Gaming')),
        
        # Consumer Brands
        ('fashion', _('Fashion & Apparel')),
        ('beauty', _('Beauty & Cosmetics')),
        ('food_beverage', _('Food & Beverage')),
        ('health_wellness', _('Health & Wellness')),
        ('fitness', _('Fitness & Sports')),
        ('home_lifestyle', _('Home & Lifestyle')),
        ('luxury', _('Luxury Goods')),
        
        # Professional Services
        ('marketing', _('Marketing & Advertising')),
        ('consulting', _('Consulting')),
        ('finance', _('Financial Services')),
        ('real_estate', _('Real Estate')),
        ('education', _('Education')),
        ('healthcare', _('Healthcare')),
        
        # Other
        ('travel', _('Travel & Tourism')),
        ('automotive', _('Automotive')),
        ('entertainment', _('Entertainment & Media')),
        ('nonprofit', _('Non-Profit')),
        ('government', _('Government')),
        ('other', _('Other')),
    )
    
    BUDGET_RANGES = (
        ('under_1k', _('Under $1,000/month')),
        ('1k_5k', _('$1,000 - $5,000/month')),
        ('5k_15k', _('$5,000 - $15,000/month')),
        ('15k_50k', _('$15,000 - $50,000/month')),
        ('50k_100k', _('$50,000 - $100,000/month')),
        ('over_100k', _('Over $100,000/month')),
    )
    
    # Basic Information
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='agency')
    name = models.CharField(max_length=200, help_text=_('Organization name'))
    display_name = models.CharField(max_length=200, blank=True, help_text=_('Public display name'))
    description = models.TextField(blank=True, help_text=_('Brief description of your organization'))
    
    # Organization Classification
    organization_type = models.CharField(
        max_length=20, 
        choices=ORGANIZATION_TYPES, 
        default='agency',
        help_text=_('Type of organization')
    )
    industry = models.CharField(
        max_length=50, 
        choices=INDUSTRIES, 
        blank=True,
        help_text=_('Primary industry or focus area')
    )
    organization_size = models.CharField(
        max_length=20, 
        choices=ORGANIZATION_SIZES, 
        blank=True,
        help_text=_('Number of employees')
    )
    
    # Contact Information
    email = models.EmailField()
    phone = models.CharField(max_length=20, blank=True)
    website = models.URLField(blank=True)
    
    # Address - ALL FIELDS NULLABLE to avoid migration issues
    address_line_1 = models.CharField(max_length=255, blank=True, null=True)
    address_line_2 = models.CharField(max_length=255, blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)  # ✅ Made nullable
    state = models.CharField(max_length=100, blank=True, null=True)  # ✅ Made nullable
    country = models.CharField(max_length=100, default='Morocco')  # ✅ Keep default
    postal_code = models.CharField(max_length=20, blank=True, null=True)  # ✅ Made nullable
    
    # Business Information
    founded_year = models.PositiveIntegerField(blank=True, null=True)
    monthly_budget_range = models.CharField(
        max_length=20, 
        choices=BUDGET_RANGES, 
        blank=True,
        help_text=_('Typical monthly influencer marketing budget')
    )
    
    # Specialties & Focus Areas (for agencies) OR Brand Categories (for brands)
    specialties = models.TextField(
        blank=True, 
        help_text=_('Comma-separated list of specialties (agencies) or product categories (brands)')
    )
    target_demographics = models.TextField(
        blank=True,
        help_text=_('Target audience demographics')
    )
    
    # Social Media & Branding
    logo = models.ImageField(upload_to='agencies/logos/', blank=True, null=True)
    brand_colors = models.CharField(
        max_length=100, 
        blank=True, 
        help_text=_('Primary brand colors (hex codes)')
    )
    
    # Social Media Links
    instagram_url = models.URLField(blank=True)
    linkedin_url = models.URLField(blank=True)
    twitter_url = models.URLField(blank=True)
    facebook_url = models.URLField(blank=True)
    youtube_url = models.URLField(blank=True)
    tiktok_url = models.URLField(blank=True)
    
    # Platform Status
    is_verified = models.BooleanField(default=False, help_text=_('Verified organization'))
    is_active = models.BooleanField(default=True)
    is_premium = models.BooleanField(default=False)
    
    # Performance Tracking
    total_campaigns_run = models.PositiveIntegerField(default=0)
    total_influencers_worked_with = models.PositiveIntegerField(default=0)
    average_campaign_roi = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'agencies_agency'
        verbose_name = _('Organization')
        verbose_name_plural = _('Organizations')
        ordering = ['name']
    
    def __str__(self):
        return self.name
    
    def get_display_name(self):
        """Return display name or fallback to regular name"""
        return self.display_name if self.display_name else self.name
    
    def get_organization_type_display_friendly(self):
        """Get friendly organization type for UI"""
        type_mapping = {
            'agency': 'Marketing Agency',
            'brand': 'Brand',
            'freelancer': 'Freelancer'
        }
        return type_mapping.get(self.organization_type, self.get_organization_type_display())
    
    def is_brand(self):
        """Check if this is a brand organization"""
        return self.organization_type == 'brand'
    
    def is_agency(self):
        """Check if this is a marketing agency"""
        return self.organization_type == 'agency'
    
    def get_team_size_display(self):
        """Get human-readable team size"""
        size_mapping = {
            'startup': '1-10',
            'small': '11-50', 
            'medium': '51-200',
            'large': '201-1000',
            'enterprise': '1000+'
        }
        return size_mapping.get(self.organization_size, 'Not specified')
    
    def get_specialties_list(self):
        """Return specialties as a list"""
        if self.specialties:
            return [s.strip() for s in self.specialties.split(',') if s.strip()]
        return []
    
    def get_absolute_url(self):
        """Get URL for agency detail page"""
        from django.urls import reverse
        return reverse('agencies:agency_detail', kwargs={'pk': self.pk})
    
    def get_full_address(self):
        """Get formatted full address"""
        parts = [
            part for part in [
                self.address_line_1, 
                self.address_line_2, 
                self.city, 
                self.state, 
                self.country, 
                self.postal_code
            ] if part
        ]
        return ', '.join(parts) if parts else ''
    
    def update_performance_stats(self):
        """Update performance tracking fields"""
        self.total_campaigns_run = self.campaigns.count()
        self.total_influencers_worked_with = self.campaigns.values('collaborations__influencer').distinct().count()
        
        # Calculate average ROI from completed campaigns
        completed_campaigns = self.campaigns.filter(status='completed')
        if completed_campaigns.exists():
            total_roi = sum(
                campaign.analytics.roi_percentage 
                for campaign in completed_campaigns 
                if hasattr(campaign, 'analytics')
            )
            self.average_campaign_roi = total_roi / completed_campaigns.count()
        
        self.save()


class AgencyTeamMember(models.Model):
    """Enhanced team member model with better role definitions"""
    
    ROLES = (
        ('owner', _('Owner')),
        ('admin', _('Administrator')),
        ('manager', _('Campaign Manager')),
        ('account_manager', _('Account Manager')),
        ('strategist', _('Strategist')),
        ('creative', _('Creative Director')),
        ('analyst', _('Data Analyst')),
        ('coordinator', _('Coordinator')),
        ('intern', _('Intern')),
    )
    
    PERMISSIONS = (
        ('full_access', _('Full Access')),
        ('campaign_management', _('Campaign Management')),
        ('influencer_management', _('Influencer Management')),
        ('analytics_only', _('Analytics Only')),
        ('content_review', _('Content Review Only')),
        ('read_only', _('Read Only')),
    )
    
    agency = models.ForeignKey(Agency, on_delete=models.CASCADE, related_name='team_members')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='agency_memberships')
    role = models.CharField(max_length=50, choices=ROLES, default='coordinator')
    permissions = models.CharField(max_length=50, choices=PERMISSIONS, default='read_only')
    
    # Status
    is_active = models.BooleanField(default=True)
    can_invite_members = models.BooleanField(default=False)
    can_manage_billing = models.BooleanField(default=False)
    
    # Timestamps
    joined_at = models.DateTimeField(auto_now_add=True)
    last_active = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'agencies_team_member'
        unique_together = ('agency', 'user')
        verbose_name = _('Team Member')
        verbose_name_plural = _('Team Members')
    
    def __str__(self):
        return f"{self.user.email} - {self.agency.name} ({self.get_role_display()})"
    
    def is_owner(self):
        return self.role == 'owner'
    
    def is_admin(self):
        return self.role in ['owner', 'admin']
    
    def can_manage_campaigns(self):
        return self.role in ['owner', 'admin', 'manager'] or self.permissions == 'campaign_management'


class AgencySubscription(models.Model):
    """Subscription model"""
    
    PLAN_TYPES = (
        ('basic', _('Basic Plan')),
        ('pro', _('Pro Plan')), 
        ('enterprise', _('Enterprise Plan')),
    )
    
    STATUS_CHOICES = (
        ('trial', _('Free Trial')),
        ('active', _('Active')),
        ('cancelled', _('Cancelled')),
        ('expired', _('Expired')),
        ('suspended', _('Suspended')),
    )
    
    agency = models.OneToOneField(Agency, on_delete=models.CASCADE, related_name='subscription')
    plan_type = models.CharField(max_length=20, choices=PLAN_TYPES, default='basic')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='trial')
    
    # Dates
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    trial_end_date = models.DateTimeField(blank=True, null=True)
    
    # Usage Limits
    max_campaigns = models.PositiveIntegerField(default=2)
    max_influencer_searches = models.PositiveIntegerField(default=50)
    max_team_members = models.PositiveIntegerField(default=999)
    max_reports_per_month = models.PositiveIntegerField(default=10)
    
    # Billing
    monthly_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    currency = models.CharField(max_length=3, default='MAD')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'agencies_subscription'
        verbose_name = _('Subscription')
        verbose_name_plural = _('Subscriptions')
    
    def __str__(self):
        return f"{self.agency.name} - {self.get_plan_type_display()}"
    
    def is_trial(self):
        return self.status == 'trial'
    
    def days_until_trial_ends(self):
        if self.trial_end_date:
            from django.utils import timezone
            delta = self.trial_end_date - timezone.now()
            return max(0, delta.days)
        return 0


class TeamInvitation(models.Model):
    """Team invitation model"""
    
    STATUS_CHOICES = (
        ('pending', _('Pending')),
        ('accepted', _('Accepted')),
        ('declined', _('Declined')),
        ('expired', _('Expired')),
        ('cancelled', _('Cancelled')),
    )
    
    # Invitation Details
    agency = models.ForeignKey(Agency, on_delete=models.CASCADE, related_name='invitations')
    email = models.EmailField()
    role = models.CharField(max_length=50, choices=AgencyTeamMember.ROLES, default='coordinator')
    permissions = models.CharField(max_length=50, choices=AgencyTeamMember.PERMISSIONS, default='read_only')
    
    # Invitation Metadata
    token = models.UUIDField(default=uuid.uuid4, unique=True)
    invited_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_invitations')
    message = models.TextField(blank=True, help_text=_('Personal message to include'))
    
    # Status Tracking
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    sent_at = models.DateTimeField(auto_now_add=True)  # ✅ Renamed from created_at
    expires_at = models.DateTimeField()
    
    # Response Tracking
    accepted_at = models.DateTimeField(blank=True, null=True)
    accepted_by = models.ForeignKey(User, on_delete=models.SET_NULL, blank=True, null=True, related_name='accepted_invitations')
    response_message = models.TextField(blank=True)
    
    class Meta:
        db_table = 'agencies_team_invitation'
        unique_together = ('agency', 'email', 'status')
        verbose_name = _('Team Invitation')
        verbose_name_plural = _('Team Invitations')
    
    def __str__(self):
        return f"Invitation to {self.email} - {self.agency.name}"
    
    def is_expired(self):
        from django.utils import timezone
        return timezone.now() > self.expires_at
    
    def save(self, *args, **kwargs):
        if not self.expires_at:
            from django.utils import timezone
            self.expires_at = timezone.now() + timezone.timedelta(days=7)
        super().save(*args, **kwargs)