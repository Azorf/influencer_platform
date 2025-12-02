from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from datetime import timedelta
import uuid

class Agency(models.Model):
    """Agency model for marketing agencies"""
    
    AGENCY_SIZES = (
        ('small', _('Small (1-10 employees)')),
        ('medium', _('Medium (11-50 employees)')),
        ('large', _('Large (51+ employees)')),
    )
    
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='agency')
    name = models.CharField(max_length=200, verbose_name=_('Agency Name'))
    description = models.TextField(blank=True, null=True, verbose_name=_('Description'))
    logo = models.ImageField(upload_to='agency_logos/', blank=True, null=True)
    
    # Contact Information
    email = models.EmailField(verbose_name=_('Contact Email'))
    phone = models.CharField(max_length=20, blank=True, null=True)
    website = models.URLField(blank=True, null=True)
    
    # Address
    address_line1 = models.CharField(max_length=200, blank=True, null=True)
    address_line2 = models.CharField(max_length=200, blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    state = models.CharField(max_length=100, blank=True, null=True)
    postal_code = models.CharField(max_length=20, blank=True, null=True)
    country = models.CharField(max_length=100, default='Morocco')
    
    # Agency Details
    agency_size = models.CharField(max_length=20, choices=AGENCY_SIZES, default='small')
    founded_year = models.PositiveIntegerField(
        blank=True, null=True,
        validators=[MinValueValidator(1900), MaxValueValidator(2030)]
    )
    specialties = models.TextField(
        blank=True, null=True,
        help_text=_('Comma-separated list of specialties (e.g., Fashion, Tech, Food)')
    )
    
    # Verification and Status
    is_verified = models.BooleanField(default=False)
    verification_documents = models.FileField(
        upload_to='verification_docs/', 
        blank=True, null=True,
        help_text=_('Upload business registration or other verification documents')
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'agencies_agency'
        verbose_name = _('Agency')
        verbose_name_plural = _('Agencies')
        ordering = ['-created_at']
    
    def __str__(self):
        return self.name
    
    def get_specialties_list(self):
        """Return specialties as a list"""
        if self.specialties:
            return [s.strip() for s in self.specialties.split(',')]
        return []


class AgencyTeamMember(models.Model):
    """Team members within an agency"""
    
    ROLES = (
        ('owner', _('Owner')),
        ('manager', _('Manager')),
        ('account_manager', _('Account Manager')),
        ('strategist', _('Strategist')),
        ('creative', _('Creative')),
        ('analyst', _('Analyst')),
    )
    
    agency = models.ForeignKey(Agency, on_delete=models.CASCADE, related_name='team_members')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='agency_memberships')
    role = models.CharField(max_length=50, choices=ROLES)
    is_active = models.BooleanField(default=True)
    joined_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'agencies_teammember'
        verbose_name = _('Team Member')
        verbose_name_plural = _('Team Members')
        unique_together = ['agency', 'user']
    
    def __str__(self):
        return f"{self.user.get_full_name() or self.user.username} - {self.agency.name}"


class AgencySubscription(models.Model):
    """Agency subscription plans"""
    
    PLAN_TYPES = (
        ('basic', _('Basic')),
        ('professional', _('Professional')),
        ('enterprise', _('Enterprise')),
    )
    
    STATUS_CHOICES = (
        ('active', _('Active')),
        ('cancelled', _('Cancelled')),
        ('expired', _('Expired')),
        ('trial', _('Trial')),
    )
    
    agency = models.OneToOneField(Agency, on_delete=models.CASCADE, related_name='subscription')
    plan_type = models.CharField(max_length=20, choices=PLAN_TYPES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='trial')
    
    # Subscription dates
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    trial_end_date = models.DateTimeField(blank=True, null=True)
    
    # Payment information
    stripe_subscription_id = models.CharField(max_length=200, blank=True, null=True)
    stripe_customer_id = models.CharField(max_length=200, blank=True, null=True)
    
    # Plan limits
    max_campaigns = models.PositiveIntegerField(default=5)
    max_influencer_searches = models.PositiveIntegerField(default=100)
    max_team_members = models.PositiveIntegerField(default=3)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'agencies_subscription'
        verbose_name = _('Subscription')
        verbose_name_plural = _('Subscriptions')
    
    def __str__(self):
        return f"{self.agency.name} - {self.get_plan_type_display()}"
    
    def is_active(self):
        """Check if subscription is currently active"""
        from django.utils import timezone
        return self.status == 'active' and self.end_date > timezone.now()
    
    def is_trial(self):
        """Check if subscription is in trial period"""
        from django.utils import timezone
        return (
            self.status == 'trial' and 
            self.trial_end_date and 
            self.trial_end_date > timezone.now()
        )


class TeamInvitation(models.Model):
    """Secure team invitation system for agency employees"""
    
    STATUS_CHOICES = (
        ('pending', _('Pending')),
        ('accepted', _('Accepted')),
        ('expired', _('Expired')),
        ('cancelled', _('Cancelled')),
    )
    
    # Invitation details
    agency = models.ForeignKey('agencies.Agency', on_delete=models.CASCADE, related_name='invitations')
    email = models.EmailField()
    role = models.CharField(max_length=50, choices=[
        ('manager', _('Manager')),
        ('account_manager', _('Account Manager')),
        ('strategist', _('Strategist')),
        ('creative', _('Creative')),
        ('analyst', _('Analyst')),
    ])
    
    # Security
    token = models.UUIDField(default=uuid.uuid4, unique=True)
    invited_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_invitations')
    
    # Status tracking
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    message = models.TextField(blank=True, null=True, help_text=_('Optional message to the invitee'))
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    accepted_at = models.DateTimeField(blank=True, null=True)
    accepted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        blank=True, null=True,
        related_name='accepted_invitations'
    )
    
    class Meta:
        db_table = 'agencies_teaminvitation'
        verbose_name = _('Team Invitation')
        verbose_name_plural = _('Team Invitations')
        unique_together = ['agency', 'email']  # Prevent duplicate invites
    
    def __str__(self):
        return f"{self.agency.name} → {self.email} ({self.role})"
    
    def save(self, *args, **kwargs):
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(days=7)  # 7 days to accept
        super().save(*args, **kwargs)
    
    def is_expired(self):
        return timezone.now() > self.expires_at and self.status == 'pending'
    
    def is_valid(self):
        return self.status == 'pending' and not self.is_expired()
