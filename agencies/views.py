from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.utils.translation import gettext as _
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.core.paginator import Paginator
import json

from .models import Agency, AgencyTeamMember, AgencySubscription
from .forms import AgencyForm, AgencyTeamMemberForm


@login_required
def agency_setup_view(request):
    """Agency setup view for new users"""
    if request.user.user_type != 'agency':
        messages.error(request, _('Only agency users can create agencies.'))
        return redirect('accounts:dashboard')
    
    try:
        agency = Agency.objects.get(user=request.user)
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
            
            # Create default subscription (trial)
            from django.utils import timezone
            from datetime import timedelta
            
            AgencySubscription.objects.create(
                agency=agency,
                plan_type='basic',
                status='trial',
                start_date=timezone.now(),
                end_date=timezone.now() + timedelta(days=365),
                trial_end_date=timezone.now() + timedelta(days=30)
            )
            
            messages.success(request, _('Agency created successfully!'))
            return redirect('agencies:agency_detail', pk=agency.pk)
    else:
        form = AgencyForm()
    
    return render(request, 'agencies/setup.html', {'form': form})


@login_required
def agency_detail_view(request, pk):
    """Agency detail view"""
    agency = get_object_or_404(Agency, pk=pk)
    
    # Check permissions
    if request.user != agency.user and not request.user.agency_memberships.filter(agency=agency, is_active=True).exists():
        messages.error(request, _('You do not have permission to view this agency.'))
        return redirect('accounts:dashboard')
    
    team_members = agency.team_members.filter(is_active=True).select_related('user')
    subscription = getattr(agency, 'subscription', None)
    
    context = {
        'agency': agency,
        'team_members': team_members,
        'subscription': subscription,
        'is_owner': request.user == agency.user,
    }
    
    return render(request, 'agencies/detail.html', context)


@login_required
def agency_edit_view(request, pk):
    """Edit agency view"""
    agency = get_object_or_404(Agency, pk=pk)
    
    # Check permissions (only owner can edit)
    if request.user != agency.user:
        messages.error(request, _('Only the agency owner can edit agency details.'))
        return redirect('agencies:agency_detail', pk=agency.pk)
    
    if request.method == 'POST':
        form = AgencyForm(request.POST, request.FILES, instance=agency)
        if form.is_valid():
            form.save()
            messages.success(request, _('Agency updated successfully!'))
            return redirect('agencies:agency_detail', pk=agency.pk)
    else:
        form = AgencyForm(instance=agency)
    
    return render(request, 'agencies/edit.html', {'form': form, 'agency': agency})


@login_required
def agency_list_view(request):
    """List all agencies (for admin/public view)"""
    agencies = Agency.objects.filter(is_verified=True).order_by('-created_at')
    
    # Search functionality
    search_query = request.GET.get('search', '')
    if search_query:
        agencies = agencies.filter(
            models.Q(name__icontains=search_query) |
            models.Q(specialties__icontains=search_query) |
            models.Q(city__icontains=search_query)
        )
    
    # Filter by agency size
    agency_size = request.GET.get('size', '')
    if agency_size:
        agencies = agencies.filter(agency_size=agency_size)
    
    # Pagination
    paginator = Paginator(agencies, 12)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    context = {
        'page_obj': page_obj,
        'search_query': search_query,
        'agency_size': agency_size,
        'agency_sizes': Agency.AGENCY_SIZES,
    }
    
    return render(request, 'agencies/list.html', context)


@login_required
def team_manage_view(request, pk):
    """Manage agency team members"""
    agency = get_object_or_404(Agency, pk=pk)
    
    # Check permissions (only owner can manage team)
    if request.user != agency.user:
        messages.error(request, _('Only the agency owner can manage team members.'))
        return redirect('agencies:agency_detail', pk=agency.pk)
    
    team_members = agency.team_members.filter(is_active=True).select_related('user')
    
    context = {
        'agency': agency,
        'team_members': team_members,
    }
    
    return render(request, 'agencies/team_manage.html', context)


@login_required
def team_add_view(request, pk):
    """Add team member view"""
    agency = get_object_or_404(Agency, pk=pk)
    
    # Check permissions
    if request.user != agency.user:
        messages.error(request, _('Only the agency owner can add team members.'))
        return redirect('agencies:agency_detail', pk=agency.pk)
    
    if request.method == 'POST':
        form = AgencyTeamMemberForm(request.POST)
        if form.is_valid():
            team_member = form.save(commit=False)
            team_member.agency = agency
            team_member.save()
            messages.success(request, _('Team member added successfully!'))
            return redirect('agencies:team_manage', pk=agency.pk)
    else:
        form = AgencyTeamMemberForm()
    
    return render(request, 'agencies/team_add.html', {'form': form, 'agency': agency})


@require_http_methods(["POST"])
@login_required
def team_remove_view(request, pk, member_pk):
    """Remove team member (AJAX)"""
    agency = get_object_or_404(Agency, pk=pk)
    
    # Check permissions
    if request.user != agency.user:
        return JsonResponse({'success': False, 'message': _('Permission denied')})
    
    try:
        team_member = AgencyTeamMember.objects.get(pk=member_pk, agency=agency)
        team_member.is_active = False
        team_member.save()
        
        return JsonResponse({
            'success': True, 
            'message': _('Team member removed successfully')
        })
    except AgencyTeamMember.DoesNotExist:
        return JsonResponse({
            'success': False, 
            'message': _('Team member not found')
        })


@login_required
def subscription_view(request, pk):
    """Agency subscription management view"""
    agency = get_object_or_404(Agency, pk=pk)
    
    # Check permissions
    if request.user != agency.user:
        messages.error(request, _('Only the agency owner can manage subscriptions.'))
        return redirect('agencies:agency_detail', pk=agency.pk)
    
    subscription = getattr(agency, 'subscription', None)
    
    context = {
        'agency': agency,
        'subscription': subscription,
    }
    
    return render(request, 'agencies/subscription.html', context)