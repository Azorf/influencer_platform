from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib.auth import get_user_model
from django.contrib import messages
from django.utils.translation import gettext as _
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.core.paginator import Paginator
from django.core.mail import send_mail
from django.urls import reverse
from django.utils import timezone
from django.db import models
import json
import uuid

from .models import Agency, AgencyTeamMember, AgencySubscription, TeamInvitation
from .forms import AgencyForm, AgencyTeamMemberForm

User = get_user_model()


def require_agency_role(allowed_roles):
    """Decorator to require specific agency roles"""
    def decorator(view_func):
        def _wrapped_view(request, *args, **kwargs):
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
                return view_func(request, *args, **kwargs)
            
            # Check if user is team member with required role
            try:
                team_member = AgencyTeamMember.objects.get(
                    agency=agency, 
                    user=request.user, 
                    is_active=True
                )
                if team_member.role in allowed_roles:
                    return view_func(request, *args, **kwargs)
            except AgencyTeamMember.DoesNotExist:
                pass
            
            messages.error(request, _('You do not have permission to perform this action.'))
            return redirect('agencies:agency_detail', pk=agency.pk)
        
        return _wrapped_view
    return decorator


@login_required
def agency_setup_view(request):
    """Agency setup view for new users - enhanced with trial messaging"""
    if request.user.user_type != 'agency':
        messages.error(request, _('Only agency users can create agencies.'))
        return redirect('accounts:dashboard')
    
    try:
        agency = Agency.objects.get(user=request.user)
        messages.info(request, _('Your agency is already set up!'))
        return redirect('agencies:agency_detail', pk=agency.pk)
    except Agency.DoesNotExist:
        pass
    
    if request.method == 'POST':
        form = AgencyForm(request.POST, request.FILES)
        if form.is_valid():
            agency = form.save(commit=False)
            agency.user = request.user
            agency.email = request.user.email
            agency.save()
            
            # Create owner team membership
            AgencyTeamMember.objects.get_or_create(
                agency=agency,
                user=request.user,
                defaults={'role': 'owner'}
            )
            
            # Create 14-day trial if not exists
            subscription, created = AgencySubscription.objects.get_or_create(
                agency=agency,
                defaults={
                    'plan_type': 'basic',
                    'status': 'trial',
                    'start_date': timezone.now(),
                    'end_date': timezone.now() + timezone.timedelta(days=365),
                    'trial_end_date': timezone.now() + timezone.timedelta(days=14),
                    'max_campaigns': 2,
                    'max_influencer_searches': 50,
                    'max_team_members': 999
                }
            )
            
            messages.success(request, _(
                'Agency created successfully! You have a 14-day free trial with unlimited team members.'
            ))
            return redirect('agencies:agency_detail', pk=agency.pk)
    else:
        form = AgencyForm()
    
    return render(request, 'agencies/setup.html', {
        'form': form,
        'trial_days': 14,
        'trial_features': [
            _('Unlimited team members'),
            _('Up to 2 campaigns'),
            _('50 influencer searches'),
            _('Basic analytics'),
            _('Email support')
        ]
    })


@login_required
@require_agency_role(['owner', 'manager'])
def agency_detail_view(request, pk):
    """Agency detail view with trial status"""
    agency = get_object_or_404(Agency, pk=pk)
    team_members = agency.team_members.filter(is_active=True).select_related('user')
    subscription = getattr(agency, 'subscription', None)
    
    # Check trial status
    trial_days_left = None
    if subscription and subscription.status == 'trial' and subscription.trial_end_date:
        trial_days_left = (subscription.trial_end_date - timezone.now()).days
    
    context = {
        'agency': agency,
        'team_members': team_members,
        'subscription': subscription,
        'trial_days_left': trial_days_left,
        'is_owner': request.user == agency.user,
        'user_role': get_user_role(request.user, agency),
    }
    
    return render(request, 'agencies/detail.html', context)


@login_required
@require_agency_role(['owner'])
def agency_edit_view(request, pk):
    """Edit agency information"""
    agency = get_object_or_404(Agency, pk=pk)
    
    if request.method == 'POST':
        form = AgencyForm(request.POST, request.FILES, instance=agency)
        if form.is_valid():
            form.save()
            messages.success(request, _('Agency information updated successfully!'))
            return redirect('agencies:agency_detail', pk=agency.pk)
    else:
        form = AgencyForm(instance=agency)
    
    context = {
        'form': form,
        'agency': agency,
    }
    
    return render(request, 'agencies/edit.html', context)


@login_required
def agency_list_view(request):
    """List all agencies (for admin or public directory)"""
    agencies = Agency.objects.filter(is_verified=True).order_by('name')
    
    # Search functionality
    search_query = request.GET.get('search')
    if search_query:
        agencies = agencies.filter(
            models.Q(name__icontains=search_query) |
            models.Q(description__icontains=search_query) |
            models.Q(specialties__icontains=search_query)
        )
    
    # Pagination
    paginator = Paginator(agencies, 12)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    context = {
        'page_obj': page_obj,
        'search_query': search_query,
    }
    
    return render(request, 'agencies/list.html', context)


def get_user_role(user, agency):
    """Get user's role in agency"""
    if user == agency.user:
        return 'owner'
    try:
        team_member = AgencyTeamMember.objects.get(agency=agency, user=user, is_active=True)
        return team_member.role
    except AgencyTeamMember.DoesNotExist:
        return None


@login_required
@require_agency_role(['owner', 'manager'])
def team_add_view(request, pk):
    """Add existing user to team"""
    agency = get_object_or_404(Agency, pk=pk)
    
    if request.method == 'POST':
        form = AgencyTeamMemberForm(request.POST)
        if form.is_valid():
            team_member = form.save(commit=False)
            team_member.agency = agency
            
            # Check if user is already a member
            existing_member = AgencyTeamMember.objects.filter(
                agency=agency, 
                user=team_member.user
            ).first()
            
            if existing_member:
                if existing_member.is_active:
                    messages.error(request, _('This user is already an active team member.'))
                else:
                    # Reactivate existing member
                    existing_member.role = team_member.role
                    existing_member.is_active = True
                    existing_member.save()
                    messages.success(request, _('Team member reactivated successfully!'))
            else:
                team_member.save()
                messages.success(request, _('Team member added successfully!'))
            
            return redirect('agencies:team_manage', pk=agency.pk)
    else:
        form = AgencyTeamMemberForm()
    
    context = {
        'form': form,
        'agency': agency,
    }
    
    return render(request, 'agencies/team_add.html', context)


@login_required
@require_agency_role(['owner', 'manager'])
def team_remove_view(request, pk, member_pk):
    """Remove team member"""
    agency = get_object_or_404(Agency, pk=pk)
    team_member = get_object_or_404(AgencyTeamMember, pk=member_pk, agency=agency)
    
    # Cannot remove the owner
    if team_member.user == agency.user:
        messages.error(request, _('Cannot remove the agency owner.'))
        return redirect('agencies:team_manage', pk=agency.pk)
    
    # Only owner can remove managers
    if team_member.role == 'manager' and request.user != agency.user:
        messages.error(request, _('Only the agency owner can remove managers.'))
        return redirect('agencies:team_manage', pk=agency.pk)
    
    if request.method == 'POST':
        team_member.is_active = False
        team_member.save()
        messages.success(request, _('Team member removed successfully.'))
        return redirect('agencies:team_manage', pk=agency.pk)
    
    context = {
        'agency': agency,
        'team_member': team_member,
    }
    
    return render(request, 'agencies/team_remove_confirm.html', context)


@login_required
@require_agency_role(['owner'])
def team_invite_view(request, pk):
    """Invite team members via email"""
    agency = get_object_or_404(Agency, pk=pk)
    
    if request.method == 'POST':
        email = request.POST.get('email')
        role = request.POST.get('role')
        message = request.POST.get('message', '')
        
        if not email or not role:
            messages.error(request, _('Email and role are required.'))
            return redirect('agencies:team_invite', pk=agency.pk)
        
        # Check if user already exists
        try:
            existing_user = User.objects.get(email=email)
            # Check if already a team member
            if AgencyTeamMember.objects.filter(agency=agency, user=existing_user, is_active=True).exists():
                messages.error(request, _('This user is already a member of your agency.'))
                return redirect('agencies:team_invite', pk=agency.pk)
        except User.DoesNotExist:
            existing_user = None
        
        # Check for existing pending invitation
        existing_invitation = TeamInvitation.objects.filter(
            agency=agency,
            email=email,
            status='pending'
        ).first()
        
        if existing_invitation:
            messages.error(request, _('There is already a pending invitation for this email address.'))
            return redirect('agencies:team_invite', pk=agency.pk)
        
        # Create invitation
        invitation = TeamInvitation.objects.create(
            agency=agency,
            email=email,
            role=role,
            invited_by=request.user,
            message=message
        )
        
        # Send invitation email
        send_invitation_email(invitation, request)
        
        messages.success(request, _(f'Invitation sent to {email}!'))
        return redirect('agencies:team_manage', pk=agency.pk)
    
    roles = [
        ('manager', _('Manager')),
        ('account_manager', _('Account Manager')),
        ('strategist', _('Strategist')),
        ('creative', _('Creative')),
        ('analyst', _('Analyst')),
    ]
    
    return render(request, 'agencies/team_invite.html', {
        'agency': agency,
        'roles': roles
    })


@login_required
@require_agency_role(['owner'])
def cancel_invitation_view(request, pk, invitation_pk):
    """Cancel pending team invitation"""
    agency = get_object_or_404(Agency, pk=pk)
    invitation = get_object_or_404(TeamInvitation, pk=invitation_pk, agency=agency)
    
    if request.method == 'POST':
        invitation.status = 'cancelled'
        invitation.save()
        messages.success(request, _('Invitation cancelled successfully.'))
        return redirect('agencies:team_manage', pk=agency.pk)
    
    context = {
        'agency': agency,
        'invitation': invitation,
    }
    
    return render(request, 'agencies/cancel_invitation_confirm.html', context)


def send_invitation_email(invitation, request):
    """Send team invitation email"""
    invite_url = request.build_absolute_uri(
        reverse('agencies:accept_invitation', kwargs={'token': invitation.token})
    )
    
    subject = f"Invitation to join {invitation.agency.name}"
    message = f"""
    You've been invited to join {invitation.agency.name} as a {invitation.get_role_display()}.
    
    {invitation.message if invitation.message else ''}
    
    Click here to accept: {invite_url}
    
    This invitation expires in 7 days.
    """
    
    send_mail(
        subject=subject,
        message=message,
        from_email='noreply@yourplatform.com',
        recipient_list=[invitation.email],
        fail_silently=False
    )


def accept_invitation_view(request, token):
    """Accept team invitation and create account if needed"""
    try:
        invitation = TeamInvitation.objects.get(token=token, status='pending')
    except TeamInvitation.DoesNotExist:
        messages.error(request, _('Invalid or expired invitation.'))
        return redirect('accounts:login')
    
    if invitation.is_expired():
        invitation.status = 'expired'
        invitation.save()
        messages.error(request, _('This invitation has expired.'))
        return redirect('accounts:login')
    
    # Check if user exists
    try:
        user = User.objects.get(email=invitation.email)
        if request.user.is_authenticated and request.user != user:
            messages.error(request, _(
                'Please log out and sign in with the invited email address.'
            ))
            return redirect('accounts:logout')
        elif not request.user.is_authenticated:
            messages.info(request, _(
                'Please sign in with your invited email address to join the agency.'
            ))
            # Store invitation token in session
            request.session['invitation_token'] = str(invitation.token)
            return redirect('account_login')
    except User.DoesNotExist:
        # User doesn't exist, they need to sign up
        messages.info(request, _(
            'Please create an account with your invited email address to join the agency.'
        ))
        request.session['invitation_token'] = str(invitation.token)
        return redirect('account_signup')
    
    # User is authenticated and matches invitation
    if request.user.is_authenticated and request.user.email == invitation.email:
        return complete_invitation(request, invitation)
    
    return redirect('account_login')


def complete_invitation(request, invitation):
    """Complete the invitation process"""
    # Create team membership
    team_member, created = AgencyTeamMember.objects.get_or_create(
        agency=invitation.agency,
        user=request.user,
        defaults={
            'role': invitation.role,
            'is_active': True
        }
    )
    
    if not created:
        # User was already a member, reactivate
        team_member.role = invitation.role
        team_member.is_active = True
        team_member.save()
    
    # Mark invitation as accepted
    invitation.status = 'accepted'
    invitation.accepted_at = timezone.now()
    invitation.accepted_by = request.user
    invitation.save()
    
    messages.success(request, _(
        f'Welcome to {invitation.agency.name}! You have been added as a {invitation.get_role_display()}.'
    ))
    
    return redirect('agencies:agency_detail', pk=invitation.agency.pk)


@login_required
@require_agency_role(['owner', 'manager'])
def team_manage_view(request, pk):
    """Enhanced team management with invitations"""
    agency = get_object_or_404(Agency, pk=pk)
    team_members = agency.team_members.filter(is_active=True).select_related('user')
    
    # Get pending invitations
    pending_invitations = TeamInvitation.objects.filter(
        agency=agency, 
        status='pending'
    ).order_by('-created_at')
    
    context = {
        'agency': agency,
        'team_members': team_members,
        'pending_invitations': pending_invitations,
        'is_owner': request.user == agency.user,
    }
    
    return render(request, 'agencies/team_manage.html', context)


@login_required
def subscription_view(request, pk):
    """Enhanced subscription management with trial info"""
    agency = get_object_or_404(Agency, pk=pk)
    
    # Check permissions
    if request.user != agency.user:
        messages.error(request, _('Only the agency owner can manage subscriptions.'))
        return redirect('agencies:agency_detail', pk=agency.pk)
    
    subscription = getattr(agency, 'subscription', None)
    
    # Calculate trial info
    trial_info = None
    if subscription and subscription.status == 'trial':
        days_left = (subscription.trial_end_date - timezone.now()).days
        trial_info = {
            'days_left': max(0, days_left),
            'expired': days_left <= 0,
            'campaigns_used': agency.campaigns.count(),
            'max_campaigns': subscription.max_campaigns,
        }
    
    context = {
        'agency': agency,
        'subscription': subscription,
        'trial_info': trial_info,
        'plan_features': {
            'basic': {
                'price': 0,  # Free during trial, then basic plan
                'campaigns': 'Unlimited',
                'team_members': 'Unlimited',
                'searches': 'Unlimited',
                'features': [
                    'Campaign management',
                    'Influencer search',
                    'Basic analytics',
                    'Email support',
                    'Team collaboration'
                ]
            }
        }
    }
    
    return render(request, 'agencies/subscription.html', context)


# API Endpoints for AJAX operations

@csrf_exempt
@require_http_methods(["POST"])
@login_required
@require_agency_role(['owner', 'manager'])
def api_remove_team_member(request, pk):
    """API endpoint to remove team member via AJAX"""
    try:
        agency = get_object_or_404(Agency, pk=pk)
        data = json.loads(request.body)
        member_id = data.get('member_id')
        
        team_member = get_object_or_404(AgencyTeamMember, id=member_id, agency=agency)
        
        # Cannot remove the owner
        if team_member.user == agency.user:
            return JsonResponse({'success': False, 'error': 'Cannot remove agency owner'})
        
        # Only owner can remove managers
        if team_member.role == 'manager' and request.user != agency.user:
            return JsonResponse({'success': False, 'error': 'Only owner can remove managers'})
        
        team_member.is_active = False
        team_member.save()
        
        return JsonResponse({
            'success': True,
            'message': f'{team_member.user.get_full_name() or team_member.user.email} removed successfully'
        })
        
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})


@require_http_methods(["GET"])
@login_required
@require_agency_role(['owner', 'manager'])
def api_list_invitations(request, pk):
    """API endpoint to list pending invitations"""
    agency = get_object_or_404(Agency, pk=pk)
    
    invitations = TeamInvitation.objects.filter(
        agency=agency,
        status='pending'
    ).order_by('-created_at')
    
    data = [{
        'id': inv.id,
        'email': inv.email,
        'role': inv.get_role_display(),
        'invited_by': inv.invited_by.get_full_name() or inv.invited_by.email,
        'created_at': inv.created_at.strftime('%Y-%m-%d %H:%M'),
        'expires_at': inv.expires_at.strftime('%Y-%m-%d %H:%M'),
        'is_expired': inv.is_expired()
    } for inv in invitations]
    
    return JsonResponse({'success': True, 'invitations': data})


@csrf_exempt
@require_http_methods(["POST"])
@login_required
@require_agency_role(['owner'])
def api_resend_invitation(request, invitation_pk):
    """API endpoint to resend invitation email"""
    try:
        invitation = get_object_or_404(TeamInvitation, pk=invitation_pk)
        
        # Check permissions
        if invitation.agency.user != request.user:
            return JsonResponse({'success': False, 'error': 'Permission denied'})
        
        if invitation.status != 'pending':
            return JsonResponse({'success': False, 'error': 'Can only resend pending invitations'})
        
        if invitation.is_expired():
            return JsonResponse({'success': False, 'error': 'Invitation has expired'})
        
        # Resend email
        send_invitation_email(invitation, request)
        
        return JsonResponse({
            'success': True,
            'message': f'Invitation resent to {invitation.email}'
        })
        
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})