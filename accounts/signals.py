from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from datetime import timedelta
from allauth.account.signals import user_signed_up
from .models import CustomUser, UserProfile


@receiver(post_save, sender=CustomUser)
def create_user_profile(sender, instance, created, **kwargs):
    """Create UserProfile when a new user is created"""
    if created:
        UserProfile.objects.get_or_create(user=instance)


@receiver(post_save, sender=CustomUser)
def save_user_profile(sender, instance, **kwargs):
    """Save UserProfile when user is saved"""
    if hasattr(instance, 'profile'):
        instance.profile.save()


@receiver(user_signed_up)
def create_organization_on_signup(sender, request, user, **kwargs):
    """
    Auto-create agency/brand organization and trial subscription when user signs up
    Works for both 'agency' and 'brand' user types
    """
    # Set user type to agency by default if not specified
    if not user.user_type:
        user.user_type = 'agency'
        user.save(update_fields=['user_type'])
    
    # Create organization for agency AND brand user types
    if user.user_type in ['agency', 'brand']:
        from agencies.models import Agency, AgencySubscription, AgencyTeamMember
        
        # Generate organization name based on user type
        if user.user_type == 'brand':
            if user.first_name and user.last_name:
                org_name = f"{user.first_name} {user.last_name}"
            elif user.first_name:
                org_name = f"{user.first_name}"
            else:
                org_name = f"{user.email.split('@')[0].title()}"
        else:  # agency
            if user.first_name and user.last_name:
                org_name = f"{user.first_name} {user.last_name}'s Agency"
            elif user.first_name:
                org_name = f"{user.first_name}'s Agency"
            else:
                org_name = f"{user.email.split('@')[0].title()}'s Agency"
        
        # Determine organization type from user type
        organization_type = 'brand' if user.user_type == 'brand' else 'agency'
        
        # Create the organization
        agency = Agency.objects.create(
            user=user,
            name=org_name,
            organization_type=organization_type,
            email=user.email,
            country='Morocco'  # Default country
        )
        
        # Make the user the organization owner
        AgencyTeamMember.objects.create(
            agency=agency,
            user=user,
            role='owner',
            permissions='full_access',
            can_invite_members=True,
            can_manage_billing=True
        )
        
        # Create 14-day free trial subscription with generous limits
        trial_end = timezone.now() + timedelta(days=14)
        AgencySubscription.objects.create(
            agency=agency,
            plan_type='basic',
            status='trial',
            start_date=timezone.now(),
            end_date=timezone.now() + timedelta(days=365),  # Far future for basic plan
            trial_end_date=trial_end,
            max_campaigns=5,  # Increased from 2 for better trial experience
            max_influencer_searches=100,  # Increased from 50
            max_team_members=999,  # Unlimited team members
            max_reports_per_month=20,  # Generous reporting
            monthly_price=0,  # Free during trial
            currency='MAD'
        )
        
        # Log the creation
        org_type_display = 'Brand' if user.user_type == 'brand' else 'Agency'
        print(f"✅ Auto-created {org_type_display.lower()} '{org_name}' with 14-day trial for {user.email}")


@receiver(post_save, sender=CustomUser)
def handle_manual_user_creation(sender, instance, created, **kwargs):
    """
    Handle users created manually (not via OAuth) to ensure they get organization setup
    """
    if created and instance.user_type in ['agency', 'brand']:
        # Check if organization was already created by OAuth signal
        from agencies.models import Agency
        try:
            Agency.objects.get(user=instance)
        except Agency.DoesNotExist:
            # This was a manual signup, trigger organization creation
            # Simulate the user_signed_up signal
            create_organization_on_signup(sender, None, instance)


@receiver(post_save, sender=CustomUser) 
def update_organization_type_on_user_change(sender, instance, **kwargs):
    """
    Update organization type when user type changes
    """
    if hasattr(instance, 'agency'):
        agency = instance.agency
        
        # Update organization type to match user type
        if instance.user_type == 'brand' and agency.organization_type != 'brand':
            agency.organization_type = 'brand'
            agency.save(update_fields=['organization_type'])
            print(f"Updated {agency.name} to brand organization")
        elif instance.user_type == 'agency' and agency.organization_type != 'agency':
            agency.organization_type = 'agency' 
            agency.save(update_fields=['organization_type'])
            print(f"Updated {agency.name} to agency organization")
