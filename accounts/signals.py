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
def create_agency_on_signup(sender, request, user, **kwargs):
    """
    Auto-create agency and trial subscription when user signs up via Google OAuth
    This ensures every signup = agency account by default
    """
    # Set user type to agency by default for all signups
    if not user.user_type:
        user.user_type = 'agency'
        user.save(update_fields=['user_type'])
    
    # Only create agency for agency user types
    if user.user_type == 'agency':
        from agencies.models import Agency, AgencySubscription, AgencyTeamMember
        
        # Generate agency name from user info
        if user.first_name and user.last_name:
            agency_name = f"{user.first_name} {user.last_name}'s Agency"
        elif user.first_name:
            agency_name = f"{user.first_name}'s Agency"
        else:
            agency_name = f"{user.email.split('@')[0].title()}'s Agency"
        
        # Create the agency
        agency = Agency.objects.create(
            user=user,
            name=agency_name,
            email=user.email,
            country='Morocco'  # Default country
        )
        
        # Make the user the agency owner
        AgencyTeamMember.objects.create(
            agency=agency,
            user=user,
            role='owner'
        )
        
        # Create 14-day free trial subscription with unlimited team members
        trial_end = timezone.now() + timedelta(days=14)
        AgencySubscription.objects.create(
            agency=agency,
            plan_type='basic',
            status='trial',
            start_date=timezone.now(),
            end_date=timezone.now() + timedelta(days=365),  # Far future for basic plan
            trial_end_date=trial_end,
            max_campaigns=2,  # Limited during trial
            max_influencer_searches=50,  # Limited during trial  
            max_team_members=999  # Unlimited team members (basic plan feature)
        )
        
        print(f"✅ Auto-created agency '{agency_name}' with 14-day trial for {user.email}")


@receiver(post_save, sender=CustomUser)
def handle_manual_user_creation(sender, instance, created, **kwargs):
    """
    Handle users created manually (not via OAuth) to ensure they get agency setup
    """
    if created and instance.user_type == 'agency':
        # Check if agency was already created by OAuth signal
        from agencies.models import Agency
        try:
            Agency.objects.get(user=instance)
        except Agency.DoesNotExist:
            # This was a manual signup, trigger agency creation
            # Simulate the user_signed_up signal
            create_agency_on_signup(sender, None, instance)