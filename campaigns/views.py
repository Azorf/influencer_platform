from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.utils.translation import gettext as _
from django.http import JsonResponse
from django.core.paginator import Paginator
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.db.models import Q
from django.utils import timezone
from decimal import Decimal
import json

from .models import Campaign, InfluencerCollaboration, CampaignContent, CampaignAnalytics
from .forms import CampaignForm, InfluencerCollaborationForm, CampaignContentForm
from agencies.models import Agency
from influencers.models import Influencer


@login_required
def campaign_list_view(request):
    """Enhanced campaign list with performance metrics"""
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
    
    # Add performance stats for each campaign
    for campaign in campaigns:
        campaign.total_collaborations = campaign.collaborations.count()
        campaign.active_collaborations = campaign.collaborations.filter(
            status__in=['accepted', 'in_progress', 'content_submitted', 'approved', 'published']
        ).count()
        
        # Get analytics summary
        try:
            analytics = campaign.analytics
            campaign.performance_score = calculate_performance_score(campaign)
            campaign.total_engagement = analytics.total_likes + analytics.total_comments + analytics.total_shares
        except CampaignAnalytics.DoesNotExist:
            campaign.performance_score = 0
            campaign.total_engagement = 0
    
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
    """Create a new campaign with auto-created analytics"""
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
            
            # Create analytics record
            CampaignAnalytics.objects.create(campaign=campaign)
            
            messages.success(request, _('Campaign created successfully!'))
            return redirect('campaigns:campaign_detail', pk=campaign.pk)
    else:
        form = CampaignForm()
    
    return render(request, 'campaigns/create.html', {'form': form})


@login_required
def campaign_detail_view(request, pk):
    """Enhanced campaign detail with comprehensive metrics"""
    campaign = get_object_or_404(Campaign, pk=pk)
    
    # Check permissions
    if request.user != campaign.agency.user and not request.user.agency_memberships.filter(agency=campaign.agency, is_active=True).exists():
        messages.error(request, _('You do not have permission to view this campaign.'))
        return redirect('campaigns:campaign_list')
    
    collaborations = campaign.collaborations.all().select_related('influencer')
    
    # Get or create analytics
    analytics, created = CampaignAnalytics.objects.get_or_create(campaign=campaign)
    
    # Update analytics with current data
    update_campaign_analytics(campaign)
    
    # Performance summary
    performance_data = {
        'total_spent': float(campaign.get_total_spent()),
        'remaining_budget': float(campaign.get_remaining_budget()),
        'budget_used_percentage': (float(campaign.get_total_spent()) / float(campaign.total_budget)) * 100 if campaign.total_budget > 0 else 0,
        'avg_cost_per_collaboration': float(campaign.get_total_spent()) / max(collaborations.filter(status='completed').count(), 1),
        'performance_score': calculate_performance_score(campaign),
    }
    
    # ROI calculations
    total_engagement = analytics.total_likes + analytics.total_comments + analytics.total_shares
    if total_engagement > 0:
        cost_per_engagement = float(campaign.get_total_spent()) / total_engagement
        estimated_value = total_engagement * 0.50  # $0.50 per engagement
        roi_percentage = ((estimated_value - float(campaign.get_total_spent())) / float(campaign.get_total_spent())) * 100 if campaign.get_total_spent() > 0 else 0
        
        performance_data.update({
            'cost_per_engagement': round(cost_per_engagement, 2),
            'estimated_roi': round(roi_percentage, 1),
            'estimated_value': round(estimated_value, 2),
        })
    
    context = {
        'campaign': campaign,
        'collaborations': collaborations,
        'analytics': analytics,
        'performance_data': performance_data,
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
    """List collaborations for a campaign with enhanced metrics"""
    campaign = get_object_or_404(Campaign, pk=pk)
    
    # Check permissions
    if request.user != campaign.agency.user and not request.user.agency_memberships.filter(agency=campaign.agency, is_active=True).exists():
        messages.error(request, _('You do not have permission to view this campaign.'))
        return redirect('campaigns:campaign_list')
    
    collaborations = campaign.collaborations.all().select_related('influencer')
    
    # Add performance metrics to each collaboration
    for collaboration in collaborations:
        content_items = collaboration.content.all()
        collaboration.total_engagement = sum(
            content.likes_count + content.comments_count + content.shares_count 
            for content in content_items
        )
        collaboration.total_views = sum(content.views_count for content in content_items)
        collaboration.content_count = content_items.count()
        
        # Calculate engagement rate
        if collaboration.total_views > 0:
            collaboration.engagement_rate = (collaboration.total_engagement / collaboration.total_views) * 100
        else:
            collaboration.engagement_rate = 0
    
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
    """Enhanced collaboration detail with performance metrics"""
    collaboration = get_object_or_404(InfluencerCollaboration, pk=pk)
    
    # Check permissions
    campaign_agency = collaboration.campaign.agency
    if (request.user != campaign_agency.user and 
        not request.user.agency_memberships.filter(agency=campaign_agency, is_active=True).exists() and
        request.user != collaboration.influencer.user):
        messages.error(request, _('You do not have permission to view this collaboration.'))
        return redirect('accounts:dashboard')
    
    content_items = collaboration.content.all().order_by('-created_at')
    
    # Calculate performance metrics
    total_engagement = sum(
        content.likes_count + content.comments_count + content.shares_count 
        for content in content_items
    )
    total_views = sum(content.views_count for content in content_items)
    engagement_rate = (total_engagement / total_views * 100) if total_views > 0 else 0
    cost_per_engagement = float(collaboration.agreed_rate) / total_engagement if total_engagement > 0 else 0
    
    context = {
        'collaboration': collaboration,
        'content_items': content_items,
        'total_engagement': total_engagement,
        'total_views': total_views,
        'engagement_rate': round(engagement_rate, 2),
        'cost_per_engagement': round(cost_per_engagement, 2),
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
def update_content_metrics(request, pk):
    """Manual update of content performance metrics"""
    content = get_object_or_404(CampaignContent, pk=pk)
    collaboration = content.collaboration
    
    # Check permissions
    campaign_agency = collaboration.campaign.agency
    if (request.user != campaign_agency.user and 
        not request.user.agency_memberships.filter(agency=campaign_agency, is_active=True).exists()):
        messages.error(request, _('You do not have permission to update metrics.'))
        return redirect('accounts:dashboard')
    
    if request.method == 'POST':
        try:
            # Update metrics from form data
            content.likes_count = int(request.POST.get('likes_count', 0))
            content.comments_count = int(request.POST.get('comments_count', 0))
            content.shares_count = int(request.POST.get('shares_count', 0))
            content.views_count = int(request.POST.get('views_count', 0))
            content.post_url = request.POST.get('post_url', '')
            content.save()
            
            # Update campaign analytics
            update_campaign_analytics(collaboration.campaign)
            
            messages.success(request, _('Performance metrics updated successfully!'))
            
            # AJAX response
            if request.headers.get('x-requested-with') == 'XMLHttpRequest':
                engagement_rate = ((content.likes_count + content.comments_count + content.shares_count) / max(content.views_count, 1)) * 100
                return JsonResponse({
                    'success': True,
                    'message': _('Metrics updated successfully!'),
                    'metrics': {
                        'likes': content.likes_count,
                        'comments': content.comments_count,
                        'shares': content.shares_count,
                        'views': content.views_count,
                        'engagement_rate': round(engagement_rate, 2)
                    }
                })
            
        except ValueError:
            messages.error(request, _('Please enter valid numbers for metrics.'))
            if request.headers.get('x-requested-with') == 'XMLHttpRequest':
                return JsonResponse({'success': False, 'message': _('Please enter valid numbers.')})
    
    return redirect('campaigns:collaboration_detail', pk=collaboration.pk)


@login_required
def campaign_analytics_view(request, pk):
    """Comprehensive campaign analytics dashboard"""
    campaign = get_object_or_404(Campaign, pk=pk)
    
    # Check permissions
    if request.user != campaign.agency.user and not request.user.agency_memberships.filter(agency=campaign.agency, is_active=True).exists():
        messages.error(request, _('You do not have permission to view this campaign.'))
        return redirect('campaigns:campaign_list')
    
    # Update analytics
    analytics = update_campaign_analytics(campaign)
    
    # Calculate influencer performance ranking
    collaborations = campaign.collaborations.all()
    influencer_performance = []
    
    for collaboration in collaborations:
        content_items = collaboration.content.all()
        total_engagement = sum(
            content.likes_count + content.comments_count + content.shares_count 
            for content in content_items
        )
        total_views = sum(content.views_count for content in content_items)
        
        influencer_performance.append({
            'influencer': collaboration.influencer,
            'collaboration': collaboration,
            'total_engagement': total_engagement,
            'total_views': total_views,
            'engagement_rate': (total_engagement / max(total_views, 1)) * 100,
            'cost_per_engagement': float(collaboration.agreed_rate) / max(total_engagement, 1),
            'agreed_rate': collaboration.agreed_rate,
            'status': collaboration.status,
        })
    
    # Sort by engagement rate
    influencer_performance.sort(key=lambda x: x['engagement_rate'], reverse=True)
    
    # ROI calculations
    total_spent = float(campaign.get_total_spent())
    total_engagement = analytics.total_likes + analytics.total_comments + analytics.total_shares
    
    roi_data = {
        'total_spent': total_spent,
        'total_engagement': total_engagement,
        'cost_per_engagement': total_spent / max(total_engagement, 1),
        'estimated_value': total_engagement * 0.50,
        'roi_percentage': 0
    }
    
    if total_spent > 0:
        roi_data['roi_percentage'] = ((roi_data['estimated_value'] - total_spent) / total_spent) * 100
    
    context = {
        'campaign': campaign,
        'analytics': analytics,
        'influencer_performance': influencer_performance[:10],  # Top 10
        'roi_data': roi_data,
        'performance_score': calculate_performance_score(campaign),
        'total_collaborations': collaborations.count(),
        'completed_collaborations': collaborations.filter(status='completed').count(),
    }
    
    return render(request, 'campaigns/analytics.html', context)


# API Endpoints

@require_http_methods(["GET"])
@login_required
def api_campaign_performance(request, pk):
    """API endpoint for real-time campaign performance data"""
    campaign = get_object_or_404(Campaign, pk=pk)
    
    # Check permissions
    if request.user != campaign.agency.user and not request.user.agency_memberships.filter(agency=campaign.agency, is_active=True).exists():
        return JsonResponse({'error': 'Permission denied'}, status=403)
    
    # Get analytics
    analytics = update_campaign_analytics(campaign)
    collaborations = campaign.collaborations.all()
    
    performance_data = {
        'campaign_id': campaign.id,
        'campaign_name': campaign.name,
        'status': campaign.status,
        'total_budget': float(campaign.total_budget),
        'total_spent': float(campaign.get_total_spent()),
        'remaining_budget': float(campaign.get_remaining_budget()),
        'budget_used_percentage': (float(campaign.get_total_spent()) / float(campaign.total_budget)) * 100 if campaign.total_budget > 0 else 0,
        
        # Analytics
        'total_reach': analytics.total_reach,
        'total_impressions': analytics.total_impressions,
        'total_likes': analytics.total_likes,
        'total_comments': analytics.total_comments,
        'total_shares': analytics.total_shares,
        'total_engagement': analytics.total_likes + analytics.total_comments + analytics.total_shares,
        'avg_engagement_rate': float(analytics.avg_engagement_rate),
        'cost_per_engagement': float(analytics.cost_per_engagement) if analytics.cost_per_engagement else 0,
        'estimated_value': float(analytics.estimated_value),
        'roi_percentage': float(analytics.roi_percentage),
        
        # Collaboration stats
        'total_collaborations': collaborations.count(),
        'active_collaborations': collaborations.filter(status__in=['accepted', 'in_progress', 'published']).count(),
        'completed_collaborations': collaborations.filter(status='completed').count(),
        'pending_collaborations': collaborations.filter(status='invited').count(),
        
        # Performance score
        'performance_score': calculate_performance_score(campaign),
        
        # Last updated
        'last_updated': analytics.last_calculated.isoformat() if analytics.last_calculated else None,
    }
    
    return JsonResponse({
        'success': True,
        'data': performance_data
    })


@csrf_exempt
@require_http_methods(["POST"])
@login_required
def api_update_content_metrics(request, pk):
    """API endpoint for updating content metrics via AJAX"""
    content = get_object_or_404(CampaignContent, pk=pk)
    collaboration = content.collaboration
    
    # Check permissions
    campaign_agency = collaboration.campaign.agency
    if (request.user != campaign_agency.user and 
        not request.user.agency_memberships.filter(agency=campaign_agency, is_active=True).exists()):
        return JsonResponse({'error': 'Permission denied'}, status=403)
    
    try:
        data = json.loads(request.body)
        
        # Validate and update metrics
        likes = int(data.get('likes_count', 0))
        comments = int(data.get('comments_count', 0))
        shares = int(data.get('shares_count', 0))
        views = int(data.get('views_count', 0))
        post_url = data.get('post_url', '')
        
        # Basic validation
        if any(metric < 0 for metric in [likes, comments, shares, views]):
            return JsonResponse({
                'success': False,
                'error': 'Metrics cannot be negative'
            }, status=400)
        
        # Update content
        content.likes_count = likes
        content.comments_count = comments
        content.shares_count = shares
        content.views_count = views
        content.post_url = post_url
        content.save()
        
        # Update campaign analytics
        update_campaign_analytics(collaboration.campaign)
        
        # Calculate new metrics
        total_engagement = likes + comments + shares
        engagement_rate = (total_engagement / max(views, 1)) * 100
        
        return JsonResponse({
            'success': True,
            'message': 'Metrics updated successfully',
            'data': {
                'content_id': content.id,
                'likes_count': likes,
                'comments_count': comments,
                'shares_count': shares,
                'views_count': views,
                'total_engagement': total_engagement,
                'engagement_rate': round(engagement_rate, 2),
                'post_url': post_url,
                'updated_at': timezone.now().isoformat()
            }
        })
        
    except (ValueError, KeyError) as e:
        return JsonResponse({
            'success': False,
            'error': f'Invalid data: {str(e)}'
        }, status=400)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': f'Server error: {str(e)}'
        }, status=500)


@require_http_methods(["GET"])
@login_required
def api_campaign_analytics(request, pk):
    """API endpoint for detailed campaign analytics"""
    campaign = get_object_or_404(Campaign, pk=pk)
    
    # Check permissions
    if request.user != campaign.agency.user and not request.user.agency_memberships.filter(agency=campaign.agency, is_active=True).exists():
        return JsonResponse({'error': 'Permission denied'}, status=403)
    
    # Update analytics
    analytics = update_campaign_analytics(campaign)
    
    # Get influencer performance data
    collaborations = campaign.collaborations.all()
    influencer_data = []
    
    for collaboration in collaborations:
        content_items = collaboration.content.all()
        total_engagement = sum(
            content.likes_count + content.comments_count + content.shares_count 
            for content in content_items
        )
        total_views = sum(content.views_count for content in content_items)
        
        influencer_data.append({
            'influencer_id': collaboration.influencer.id,
            'influencer_name': collaboration.influencer.full_name,
            'username': collaboration.influencer.username,
            'collaboration_id': collaboration.id,
            'status': collaboration.status,
            'agreed_rate': float(collaboration.agreed_rate),
            'content_count': content_items.count(),
            'total_engagement': total_engagement,
            'total_views': total_views,
            'engagement_rate': (total_engagement / max(total_views, 1)) * 100,
            'cost_per_engagement': float(collaboration.agreed_rate) / max(total_engagement, 1),
            'deadline': collaboration.deadline.isoformat() if collaboration.deadline else None,
        })
    
    # Sort by engagement rate
    influencer_data.sort(key=lambda x: x['engagement_rate'], reverse=True)
    
    # Content performance data
    all_content = CampaignContent.objects.filter(collaboration__campaign=campaign)
    content_data = []
    
    for content in all_content:
        total_engagement = content.likes_count + content.comments_count + content.shares_count
        engagement_rate = (total_engagement / max(content.views_count, 1)) * 100
        
        content_data.append({
            'content_id': content.id,
            'collaboration_id': content.collaboration.id,
            'influencer_name': content.collaboration.influencer.full_name,
            'post_url': content.post_url,
            'status': content.status,
            'likes_count': content.likes_count,
            'comments_count': content.comments_count,
            'shares_count': content.shares_count,
            'views_count': content.views_count,
            'total_engagement': total_engagement,
            'engagement_rate': engagement_rate,
            'created_at': content.created_at.isoformat() if content.created_at else None,
            'published_at': content.published_at.isoformat() if content.published_at else None,
        })
    
    # Sort by engagement
    content_data.sort(key=lambda x: x['total_engagement'], reverse=True)
    
    return JsonResponse({
        'success': True,
        'data': {
            'campaign': {
                'id': campaign.id,
                'name': campaign.name,
                'status': campaign.status,
                'campaign_type': campaign.campaign_type,
                'total_budget': float(campaign.total_budget),
                'start_date': campaign.start_date.isoformat() if campaign.start_date else None,
                'end_date': campaign.end_date.isoformat() if campaign.end_date else None,
            },
            'analytics': {
                'total_reach': analytics.total_reach,
                'total_impressions': analytics.total_impressions,
                'total_likes': analytics.total_likes,
                'total_comments': analytics.total_comments,
                'total_shares': analytics.total_shares,
                'total_engagement': analytics.total_likes + analytics.total_comments + analytics.total_shares,
                'avg_engagement_rate': float(analytics.avg_engagement_rate),
                'cost_per_engagement': float(analytics.cost_per_engagement) if analytics.cost_per_engagement else 0,
                'total_spent': float(analytics.total_spent),
                'estimated_value': float(analytics.estimated_value),
                'roi_percentage': float(analytics.roi_percentage),
                'performance_score': calculate_performance_score(campaign),
                'last_calculated': analytics.last_calculated.isoformat() if analytics.last_calculated else None,
            },
            'influencers': influencer_data,
            'content': content_data[:20],  # Top 20 performing content
        }
    })


@csrf_exempt
@require_http_methods(["POST"])
@login_required
def api_bulk_update_metrics(request):
    """API endpoint for bulk updating multiple content metrics"""
    try:
        data = json.loads(request.body)
        updates = data.get('updates', [])
        
        updated_content = []
        errors = []
        
        for update in updates:
            try:
                content_id = update.get('content_id')
                content = get_object_or_404(CampaignContent, pk=content_id)
                
                # Check permissions
                campaign_agency = content.collaboration.campaign.agency
                if (request.user != campaign_agency.user and 
                    not request.user.agency_memberships.filter(agency=campaign_agency, is_active=True).exists()):
                    errors.append(f'Permission denied for content {content_id}')
                    continue
                
                # Update metrics
                content.likes_count = int(update.get('likes_count', content.likes_count))
                content.comments_count = int(update.get('comments_count', content.comments_count))
                content.shares_count = int(update.get('shares_count', content.shares_count))
                content.views_count = int(update.get('views_count', content.views_count))
                
                if 'post_url' in update:
                    content.post_url = update['post_url']
                
                content.save()
                updated_content.append(content_id)
                
                # Update campaign analytics
                update_campaign_analytics(content.collaboration.campaign)
                
            except Exception as e:
                errors.append(f'Error updating content {content_id}: {str(e)}')
        
        return JsonResponse({
            'success': len(errors) == 0,
            'updated_count': len(updated_content),
            'updated_content_ids': updated_content,
            'errors': errors
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': f'Bulk update failed: {str(e)}'
        }, status=500)


@require_http_methods(["POST"])
@login_required 
def api_refresh_campaign_analytics(request, pk):
    """API endpoint to manually refresh campaign analytics"""
    campaign = get_object_or_404(Campaign, pk=pk)
    
    # Check permissions
    if request.user != campaign.agency.user and not request.user.agency_memberships.filter(agency=campaign.agency, is_active=True).exists():
        return JsonResponse({'error': 'Permission denied'}, status=403)
    
    try:
        # Force update analytics
        analytics = update_campaign_analytics(campaign)
        
        return JsonResponse({
            'success': True,
            'message': 'Analytics refreshed successfully',
            'data': {
                'total_engagement': analytics.total_likes + analytics.total_comments + analytics.total_shares,
                'total_reach': analytics.total_reach,
                'avg_engagement_rate': float(analytics.avg_engagement_rate),
                'roi_percentage': float(analytics.roi_percentage),
                'performance_score': calculate_performance_score(campaign),
                'last_updated': analytics.last_calculated.isoformat()
            }
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': f'Failed to refresh analytics: {str(e)}'
        }, status=500)


# Utility Functions

def update_campaign_analytics(campaign):
    """Update campaign analytics from all content"""
    analytics, created = CampaignAnalytics.objects.get_or_create(campaign=campaign)
    
    # Aggregate from all content in campaign
    all_content = CampaignContent.objects.filter(collaboration__campaign=campaign)
    
    analytics.total_likes = sum(content.likes_count for content in all_content)
    analytics.total_comments = sum(content.comments_count for content in all_content)
    analytics.total_shares = sum(content.shares_count for content in all_content)
    analytics.total_reach = sum(content.views_count for content in all_content)
    
    # Calculate engagement rate
    total_engagement = analytics.total_likes + analytics.total_comments + analytics.total_shares
    if analytics.total_reach > 0:
        analytics.avg_engagement_rate = (total_engagement / analytics.total_reach) * 100
    
    # Update financial metrics
    analytics.total_spent = campaign.get_total_spent()
    if total_engagement > 0:
        analytics.cost_per_engagement = analytics.total_spent / total_engagement
    
    # Estimated ROI
    analytics.estimated_value = total_engagement * Decimal('0.50')
    if analytics.total_spent > 0:
        analytics.roi_percentage = float(((analytics.estimated_value - analytics.total_spent) / analytics.total_spent) * 100)
    
    analytics.save()
    return analytics


def calculate_performance_score(campaign):
    """Calculate overall performance score (0-100)"""
    try:
        analytics = campaign.analytics
        score = 0
        
        # Engagement rate (40 points)
        if analytics.avg_engagement_rate >= 5.0:
            score += 40
        elif analytics.avg_engagement_rate >= 3.0:
            score += 32
        elif analytics.avg_engagement_rate >= 1.5:
            score += 24
        
        # Reach (25 points)
        if analytics.total_reach >= 100000:
            score += 25
        elif analytics.total_reach >= 50000:
            score += 20
        elif analytics.total_reach >= 10000:
            score += 15
        
        # ROI (25 points)
        if analytics.roi_percentage >= 100:
            score += 25
        elif analytics.roi_percentage >= 50:
            score += 20
        elif analytics.roi_percentage >= 0:
            score += 15
        
        # Completion rate (10 points)
        total_collabs = campaign.collaborations.count()
        completed_collabs = campaign.collaborations.filter(status='completed').count()
        if total_collabs > 0:
            completion_rate = (completed_collabs / total_collabs) * 100
            if completion_rate >= 90:
                score += 10
            elif completion_rate >= 75:
                score += 8
        
        return min(score, 100)
    except:
        return 0

