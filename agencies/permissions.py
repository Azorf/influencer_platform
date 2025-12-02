from django.contrib.auth.decorators import login_required
from django.shortcuts import get_object_or_404, redirect
from django.contrib import messages
from django.utils.translation import gettext as _
from django.utils import timezone
from functools import wraps


def require_agency_role(allowed_roles):
    """
    Decorator to require specific agency roles
    
    Usage:
    @require_agency_role(['owner', 'manager'])
    def campaign_create_view(request, pk):
        # Only owners and managers can access
    """
    def decorator(view_func):
        @wraps(view_func)
        @login_required
        def _wrapped_view(request, *args, **kwargs):
            # Import here to avoid circular imports
            from agencies.models import Agency, AgencyTeamMember
            
            # Get agency from URL parameter or user
            agency_pk = kwargs.get('pk') 
            if agency_pk:
                agency = get_object_or_404(Agency, pk=agency_pk)
            else:
                try:
                    agency = Agency.objects.get(user=request.user)
                except Agency.DoesNotExist:
                    messages.error(request, _('No agency found for your account.'))
                    return redirect('accounts:dashboard')
            
            # Check if user is owner
            if request.user == agency.user:
                request.user_agency_role = 'owner'
                request.user_agency = agency
                return view_func(request, *args, **kwargs)
            
            # Check if user is team member with required role
            try:
                team_member = AgencyTeamMember.objects.get(
                    agency=agency, 
                    user=request.user, 
                    is_active=True
                )
                if team_member.role in allowed_roles:
                    request.user_agency_role = team_member.role
                    request.user_agency = agency
                    return view_func(request, *args, **kwargs)
                else:
                    messages.error(request, _(
                        f'This action requires {" or ".join(allowed_roles)} role.'
                    ))
                    return redirect('agencies:agency_detail', pk=agency.pk)
            except AgencyTeamMember.DoesNotExist:
                pass
            
            messages.error(request, _('You do not have permission to perform this action.'))
            return redirect('agencies:agency_detail', pk=agency.pk)
        
        return _wrapped_view
    return decorator


def require_active_subscription(view_func):
    """
    Decorator to require active subscription (non-expired trial or paid plan)
    """
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        from agencies.models import Agency
        
        # Get user's agency
        try:
            if hasattr(request, 'user_agency'):
                agency = request.user_agency
            else:
                agency = Agency.objects.get(user=request.user)
        except Agency.DoesNotExist:
            messages.error(request, _('No agency found for your account.'))
            return redirect('accounts:dashboard')
        
        subscription = getattr(agency, 'subscription', None)
        
        if not subscription:
            messages.error(request, _('No subscription found. Please set up your subscription.'))
            return redirect('agencies:subscription', pk=agency.pk)
        
        # Check if subscription is active
        if subscription.status == 'trial':
            # Check if trial expired
            if subscription.trial_end_date and subscription.trial_end_date < timezone.now():
                messages.error(request, _('Your trial has expired. Please upgrade to continue.'))
                return redirect('agencies:subscription', pk=agency.pk)
        elif subscription.status != 'active':
            messages.error(request, _('Your subscription is not active. Please update your payment.'))
            return redirect('agencies:subscription', pk=agency.pk)
        
        return view_func(request, *args, **kwargs)
    
    return _wrapped_view


def check_subscription_limits(agency, feature_type, current_count=None):
    """
    Check if agency has reached subscription limits
    
    Args:
        agency: Agency instance
        feature_type: 'campaigns', 'searches', 'team_members'
        current_count: Optional current usage count
    
    Returns:
        tuple: (can_use: bool, limit: int, current: int)
    """
    subscription = getattr(agency, 'subscription', None)
    
    if not subscription:
        return False, 0, current_count or 0
    
    limits = {
        'campaigns': subscription.max_campaigns,
        'searches': subscription.max_influencer_searches,
        'team_members': subscription.max_team_members,
    }
    
    limit = limits.get(feature_type, 0)
    
    if current_count is None:
        # Calculate current usage
        if feature_type == 'campaigns':
            current_count = agency.campaigns.filter(status__in=['active', 'paused']).count()
        elif feature_type == 'team_members':
            current_count = agency.team_members.filter(is_active=True).count()
        elif feature_type == 'searches':
            # You'd need to track search usage
            current_count = 0  # Placeholder
    
    can_use = current_count < limit if limit > 0 else True
    
    return can_use, limit, current_count


def get_user_role(user, agency):
    """Get user's role in agency"""
    if user == agency.user:
        return 'owner'
    try:
        from agencies.models import AgencyTeamMember
        team_member = AgencyTeamMember.objects.get(
            agency=agency, 
            user=user, 
            is_active=True
        )
        return team_member.role
    except AgencyTeamMember.DoesNotExist:
        return None


def get_role_permissions(role):
    """
    Define what each role can do
    
    Returns dict of permissions for the role
    """
    permissions = {
        'owner': {
            'can_create_campaigns': True,
            'can_edit_campaigns': True,
            'can_delete_campaigns': True,
            'can_invite_influencers': True,
            'can_approve_content': True,
            'can_manage_team': True,
            'can_view_analytics': True,
            'can_manage_payments': True,
            'can_manage_subscription': True,
        },
        'manager': {
            'can_create_campaigns': True,
            'can_edit_campaigns': True,
            'can_delete_campaigns': False,
            'can_invite_influencers': True,
            'can_approve_content': True,
            'can_manage_team': False,
            'can_view_analytics': True,
            'can_manage_payments': False,
            'can_manage_subscription': False,
        },
        'account_manager': {
            'can_create_campaigns': False,
            'can_edit_campaigns': True,
            'can_delete_campaigns': False,
            'can_invite_influencers': True,
            'can_approve_content': False,
            'can_manage_team': False,
            'can_view_analytics': True,
            'can_manage_payments': False,
            'can_manage_subscription': False,
        },
        'strategist': {
            'can_create_campaigns': True,
            'can_edit_campaigns': True,
            'can_delete_campaigns': False,
            'can_invite_influencers': False,
            'can_approve_content': False,
            'can_manage_team': False,
            'can_view_analytics': True,
            'can_manage_payments': False,
            'can_manage_subscription': False,
        },
        'creative': {
            'can_create_campaigns': False,
            'can_edit_campaigns': False,
            'can_delete_campaigns': False,
            'can_invite_influencers': False,
            'can_approve_content': True,
            'can_manage_team': False,
            'can_view_analytics': False,
            'can_manage_payments': False,
            'can_manage_subscription': False,
        },
        'analyst': {
            'can_create_campaigns': False,
            'can_edit_campaigns': False,
            'can_delete_campaigns': False,
            'can_invite_influencers': False,
            'can_approve_content': False,
            'can_manage_team': False,
            'can_view_analytics': True,
            'can_manage_payments': False,
            'can_manage_subscription': False,
        },
    }
    
    return permissions.get(role, {})


class SubscriptionLimitReached(Exception):
    """Exception raised when subscription limit is reached"""
    pass


def enforce_subscription_limit(agency, feature_type):
    """
    Enforce subscription limits by raising exception if limit reached
    
    Usage in views:
    try:
        enforce_subscription_limit(agency, 'campaigns')
        # Create campaign
    except SubscriptionLimitReached as e:
        messages.error(request, str(e))
        return redirect('agencies:subscription', pk=agency.pk)
    """
    can_use, limit, current = check_subscription_limits(agency, feature_type)
    
    if not can_use:
        feature_names = {
            'campaigns': _('campaigns'),
            'team_members': _('team members'),
            'searches': _('influencer searches'),
        }
        
        feature_name = feature_names.get(feature_type, feature_type)
        
        raise SubscriptionLimitReached(
            _('You have reached your limit of {} {}. Please upgrade your plan.').format(
                limit, feature_name
            )
        )
