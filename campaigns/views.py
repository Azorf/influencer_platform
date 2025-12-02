from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.utils.translation import gettext as _
from django.http import JsonResponse
from django.core.paginator import Paginator
from django.views.decorators.http import require_http_methods
from django.db.models import Q
import json

from .models import Campaign, InfluencerCollaboration, CampaignContent, CampaignAnalytics
from .forms import CampaignForm, InfluencerCollaborationForm, CampaignContentForm
from agencies.models import Agency
from influencers.models import Influencer


@login_required
def campaign_list_view(request):
    """List campaigns for the current agency"""
    try:
        agency = Agency.objects.get(user=request.user)
    except Agency.DoesNotExist:
        messages.error(request, _('Agency profile not found.'))
        return redirect('accounts:dashboard')
    
    campaigns = Campaign.objects.filter(agency=agency).order_by('-created_at')
    
    # Filter by status
    status_filter = request.GET.get('status')
    if status_filter:
        campaigns = campaigns.filter(status=status_filter)
    
    # Search
    search_query = request.GET.get('search')
    if search_query:
        campaigns = campaigns.filter(
            Q(name__icontains=search_query) |
            Q(brand_name__icontains=search_query)
        )
    
    # Pagination
    paginator = Paginator(campaigns, 12)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    context = {
        'page_obj': page_obj,
        'status_choices': Campaign.STATUS_CHOICES,
        'current_status': status_filter,
        'search_query': search_query,
    }
    
    return render(request, 'campaigns/list.html', context)


@login_required
def campaign_create_view(request):
    """Create a new campaign"""
    try:
        agency = Agency.objects.get(user=request.user)
    except Agency.DoesNotExist:
        messages.error(request, _('Agency profile not found.'))
        return redirect('accounts:dashboard')
    
    if request.method == 'POST':
        form = CampaignForm(request.POST, request.FILES)
        if form.is_valid():
            campaign = form.save(commit=False)
            campaign.agency = agency
            campaign.created_by = request.user
            campaign.save()
            messages.success(request, _('Campaign created successfully!'))
            return redirect('campaigns:campaign_detail', pk=campaign.pk)
    else:
        form = CampaignForm()
    
    return render(request, 'campaigns/create.html', {'form': form})


@login_required
def campaign_detail_view(request, pk):
    """Campaign detail view"""
    campaign = get_object_or_404(Campaign, pk=pk)
    
    # Check permissions
    if request.user != campaign.agency.user and not request.user.agency_memberships.filter(agency=campaign.agency, is_active=True).exists():
        messages.error(request, _('You do not have permission to view this campaign.'))
        return redirect('campaigns:campaign_list')
    
    collaborations = campaign.collaborations.all().select_related('influencer')
    
    # Get analytics if available
    try:
        analytics = campaign.analytics
    except CampaignAnalytics.DoesNotExist:
        analytics = None
    
    context = {
        'campaign': campaign,
        'collaborations': collaborations,
        'analytics': analytics,
    }
    
    return render(request, 'campaigns/detail.html', context)


@login_required
def campaign_edit_view(request, pk):
    """Edit campaign"""
    campaign = get_object_or_404(Campaign, pk=pk)
    
    # Check permissions
    if request.user != campaign.agency.user:
        messages.error(request, _('Only the agency owner can edit campaigns.'))
        return redirect('campaigns:campaign_detail', pk=pk)
    
    if request.method == 'POST':
        form = CampaignForm(request.POST, request.FILES, instance=campaign)
        if form.is_valid():
            form.save()
            messages.success(request, _('Campaign updated successfully!'))
            return redirect('campaigns:campaign_detail', pk=pk)
    else:
        form = CampaignForm(instance=campaign)
    
    return render(request, 'campaigns/edit.html', {'form': form, 'campaign': campaign})


@login_required
def campaign_delete_view(request, pk):
    """Delete campaign"""
    campaign = get_object_or_404(Campaign, pk=pk)
    
    # Check permissions
    if request.user != campaign.agency.user:
        messages.error(request, _('Only the agency owner can delete campaigns.'))
        return redirect('campaigns:campaign_detail', pk=pk)
    
    if request.method == 'POST':
        campaign.delete()
        messages.success(request, _('Campaign deleted successfully!'))
        return redirect('campaigns:campaign_list')
    
    return render(request, 'campaigns/delete_confirm.html', {'campaign': campaign})


@login_required
def collaboration_list_view(request, pk):
    """List collaborations for a campaign"""
    campaign = get_object_or_404(Campaign, pk=pk)
    
    # Check permissions
    if request.user != campaign.agency.user and not request.user.agency_memberships.filter(agency=campaign.agency, is_active=True).exists():
        messages.error(request, _('You do not have permission to view this campaign.'))
        return redirect('campaigns:campaign_list')
    
    collaborations = campaign.collaborations.all().select_related('influencer')
    
    context = {
        'campaign': campaign,
        'collaborations': collaborations,
    }
    
    return render(request, 'campaigns/collaborations.html', context)


@login_required
def invite_influencer_view(request, pk):
    """Invite influencer to campaign"""
    campaign = get_object_or_404(Campaign, pk=pk)
    
    # Check permissions
    if request.user != campaign.agency.user:
        messages.error(request, _('Only the agency owner can invite influencers.'))
        return redirect('campaigns:campaign_detail', pk=pk)
    
    if request.method == 'POST':
        form = InfluencerCollaborationForm(request.POST)
        if form.is_valid():
            collaboration = form.save(commit=False)
            collaboration.campaign = campaign
            collaboration.save()
            messages.success(request, _('Influencer invited successfully!'))
            return redirect('campaigns:collaboration_list', pk=pk)
    else:
        form = InfluencerCollaborationForm()
    
    # Get available influencers
    influencers = Influencer.objects.filter(is_active=True)
    
    context = {
        'form': form,
        'campaign': campaign,
        'influencers': influencers,
    }
    
    return render(request, 'campaigns/invite_influencer.html', context)


@login_required
def collaboration_detail_view(request, pk):
    """Collaboration detail view"""
    collaboration = get_object_or_404(InfluencerCollaboration, pk=pk)
    
    # Check permissions
    campaign_agency = collaboration.campaign.agency
    if (request.user != campaign_agency.user and 
        not request.user.agency_memberships.filter(agency=campaign_agency, is_active=True).exists() and
        request.user != collaboration.influencer.user):
        messages.error(request, _('You do not have permission to view this collaboration.'))
        return redirect('accounts:dashboard')
    
    content_items = collaboration.content.all().order_by('-created_at')
    
    context = {
        'collaboration': collaboration,
        'content_items': content_items,
    }
    
    return render(request, 'campaigns/collaboration_detail.html', context)


@require_http_methods(["POST"])
@login_required
def update_collaboration_status(request, pk):
    """Update collaboration status (AJAX)"""
    collaboration = get_object_or_404(InfluencerCollaboration, pk=pk)
    
    try:
        data = json.loads(request.body)
        new_status = data.get('status')
        
        if new_status in dict(InfluencerCollaboration.STATUS_CHOICES):
            collaboration.status = new_status
            if new_status in ['accepted', 'declined']:
                from django.utils import timezone
                collaboration.responded_at = timezone.now()
            collaboration.save()
            
            return JsonResponse({
                'success': True,
                'message': _('Status updated successfully'),
                'new_status': collaboration.get_status_display()
            })
        else:
            return JsonResponse({'success': False, 'message': _('Invalid status')})
    
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)})


@login_required
def content_list_view(request, pk):
    """List content for collaboration"""
    collaboration = get_object_or_404(InfluencerCollaboration, pk=pk)
    content_items = collaboration.content.all().order_by('-created_at')
    
    context = {
        'collaboration': collaboration,
        'content_items': content_items,
    }
    
    return render(request, 'campaigns/content_list.html', context)


@login_required
def content_review_view(request, pk):
    """Review content submission"""
    content = get_object_or_404(CampaignContent, pk=pk)
    collaboration = content.collaboration
    
    # Check permissions
    campaign_agency = collaboration.campaign.agency
    if (request.user != campaign_agency.user and 
        not request.user.agency_memberships.filter(agency=campaign_agency, is_active=True).exists()):
        messages.error(request, _('You do not have permission to review this content.'))
        return redirect('accounts:dashboard')
    
    if request.method == 'POST':
        action = request.POST.get('action')
        feedback = request.POST.get('feedback', '')
        
        if action == 'approve':
            content.status = 'approved'
            content.feedback = feedback
            content.save()
            messages.success(request, _('Content approved!'))
        elif action == 'request_revision':
            content.status = 'revision_requested'
            content.feedback = feedback
            content.save()
            messages.info(request, _('Revision requested.'))
        elif action == 'reject':
            content.status = 'rejected'
            content.feedback = feedback
            content.save()
            messages.warning(request, _('Content rejected.'))
        
        return redirect('campaigns:collaboration_detail', pk=collaboration.pk)
    
    context = {
        'content': content,
        'collaboration': collaboration,
    }
    
    return render(request, 'campaigns/content_review.html', context)


@login_required
def campaign_analytics_view(request, pk):
    """Campaign analytics view"""
    campaign = get_object_or_404(Campaign, pk=pk)
    
    # Check permissions
    if request.user != campaign.agency.user and not request.user.agency_memberships.filter(agency=campaign.agency, is_active=True).exists():
        messages.error(request, _('You do not have permission to view this campaign.'))
        return redirect('campaigns:campaign_list')
    
    try:
        analytics = campaign.analytics
    except CampaignAnalytics.DoesNotExist:
        # Create analytics if they don't exist
        analytics = CampaignAnalytics.objects.create(campaign=campaign)
    
    context = {
        'campaign': campaign,
        'analytics': analytics,
    }
    
    return render(request, 'campaigns/analytics.html', context)