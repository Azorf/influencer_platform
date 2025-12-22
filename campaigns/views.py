"""
REST API Views for Campaigns App
These views return JSON responses for the Next.js frontend
"""

from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.shortcuts import get_object_or_404
from django.db.models import Q, Sum
from django.utils import timezone
from decimal import Decimal

from .models import Campaign, InfluencerCollaboration, CampaignContent, CampaignAnalytics
from .serializers import (
    CampaignListSerializer,
    CampaignDetailSerializer,
    CampaignCreateUpdateSerializer,
    CollaborationSerializer,
    CollaborationDetailSerializer,
    CollaborationCreateSerializer,
    CampaignContentSerializer,
    CampaignContentCreateSerializer,
    CampaignAnalyticsSerializer,
)
from agencies.models import Agency


class CampaignPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


# ===========================================
# CAMPAIGN VIEWS
# ===========================================

class CampaignListAPIView(generics.ListAPIView):
    """
    GET /api/campaigns/
    List campaigns for the current user's agency
    """
    serializer_class = CampaignListSerializer
    pagination_class = CampaignPagination
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        
        # Get user's agency (as owner or team member)
        agency = _get_user_agency(user)
        if not agency:
            return Campaign.objects.none()
        
        queryset = Campaign.objects.filter(agency=agency).order_by('-created_at')
        
        # Filter by status
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Search
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(brand_name__icontains=search) |
                Q(description__icontains=search)
            )
        
        # Filter by campaign type
        campaign_type = self.request.query_params.get('type', None)
        if campaign_type:
            queryset = queryset.filter(campaign_type=campaign_type)
        
        return queryset


class CampaignDetailAPIView(generics.RetrieveAPIView):
    """
    GET /api/campaigns/<id>/
    Get campaign details with collaborations and analytics
    """
    serializer_class = CampaignDetailSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'pk'

    def get_queryset(self):
        user = self.request.user
        agency = _get_user_agency(user)
        if not agency:
            return Campaign.objects.none()
        return Campaign.objects.filter(agency=agency)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_create_campaign(request):
    """
    POST /api/campaigns/create/
    Create a new campaign
    """
    agency = _get_user_agency(request.user)
    if not agency:
        return Response(
            {'error': 'No agency found for this user'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    serializer = CampaignCreateUpdateSerializer(data=request.data)
    if serializer.is_valid():
        campaign = serializer.save(
            agency=agency,
            created_by=request.user
        )
        
        # Create analytics record
        CampaignAnalytics.objects.create(campaign=campaign)
        
        return Response(
            CampaignDetailSerializer(campaign).data,
            status=status.HTTP_201_CREATED
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def api_update_campaign(request, pk):
    """
    PUT/PATCH /api/campaigns/<id>/update/
    Update campaign details
    """
    campaign = get_object_or_404(Campaign, pk=pk)
    
    # Check permission
    if not _has_campaign_access(request.user, campaign):
        return Response(
            {'error': 'Permission denied'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    serializer = CampaignCreateUpdateSerializer(
        campaign,
        data=request.data,
        partial=request.method == 'PATCH'
    )
    if serializer.is_valid():
        serializer.save()
        return Response(CampaignDetailSerializer(campaign).data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def api_delete_campaign(request, pk):
    """
    DELETE /api/campaigns/<id>/delete/
    Delete a campaign
    """
    campaign = get_object_or_404(Campaign, pk=pk)
    
    # Only agency owner can delete
    if campaign.agency.owner != request.user:
        return Response(
            {'error': 'Only agency owner can delete campaigns'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    campaign.delete()
    return Response({'message': 'Campaign deleted successfully'})


# ===========================================
# COLLABORATION VIEWS
# ===========================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def api_collaborations(request, pk):
    """
    GET /api/campaigns/<id>/collaborations/
    List collaborations for a campaign
    """
    campaign = get_object_or_404(Campaign, pk=pk)
    
    if not _has_campaign_access(request.user, campaign):
        return Response(
            {'error': 'Permission denied'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    collaborations = campaign.collaborations.all().select_related('influencer')
    serializer = CollaborationSerializer(collaborations, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_invite_influencer(request, pk):
    """
    POST /api/campaigns/<id>/invite-influencer/
    Invite an influencer to collaborate
    """
    campaign = get_object_or_404(Campaign, pk=pk)
    
    if not _has_campaign_access(request.user, campaign):
        return Response(
            {'error': 'Permission denied'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    serializer = CollaborationCreateSerializer(data=request.data)
    if serializer.is_valid():
        # Check if influencer already invited
        influencer_id = serializer.validated_data['influencer_id']
        if campaign.collaborations.filter(influencer_id=influencer_id).exists():
            return Response(
                {'error': 'Influencer already invited to this campaign'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        from influencers.models import Influencer
        influencer = get_object_or_404(Influencer, pk=influencer_id)
        
        collaboration = InfluencerCollaboration.objects.create(
            campaign=campaign,
            influencer=influencer,
            content_type=serializer.validated_data['content_type'],
            deliverables_count=serializer.validated_data.get('deliverables_count', 1),
            agreed_rate=serializer.validated_data['agreed_rate'],
            deadline=serializer.validated_data['deadline'],
            specific_requirements=serializer.validated_data.get('specific_requirements', ''),
        )
        
        return Response(
            CollaborationDetailSerializer(collaboration).data,
            status=status.HTTP_201_CREATED
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def api_collaboration_detail(request, pk):
    """
    GET /api/campaigns/collaboration/<id>/
    Get collaboration details
    """
    collaboration = get_object_or_404(InfluencerCollaboration, pk=pk)
    
    if not _has_campaign_access(request.user, collaboration.campaign):
        return Response(
            {'error': 'Permission denied'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    serializer = CollaborationDetailSerializer(collaboration)
    return Response(serializer.data)


@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def api_update_collaboration(request, campaign_pk, pk):
    """
    PUT/PATCH /api/campaigns/<campaign_id>/collaborations/<id>/
    Update collaboration details
    """
    collaboration = get_object_or_404(InfluencerCollaboration, pk=pk, campaign_id=campaign_pk)
    
    if not _has_campaign_access(request.user, collaboration.campaign):
        return Response(
            {'error': 'Permission denied'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Update allowed fields
    allowed_fields = ['agreed_rate', 'deadline', 'specific_requirements', 'notes', 'status']
    for field in allowed_fields:
        if field in request.data:
            setattr(collaboration, field, request.data[field])
    
    # Track status changes
    if 'status' in request.data and request.data['status'] != collaboration.status:
        if request.data['status'] in ['accepted', 'declined']:
            collaboration.responded_at = timezone.now()
    
    collaboration.save()
    return Response(CollaborationDetailSerializer(collaboration).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_update_collaboration_status(request, pk):
    """
    POST /api/campaigns/collaboration/<id>/update-status/
    Update collaboration status
    """
    collaboration = get_object_or_404(InfluencerCollaboration, pk=pk)
    
    if not _has_campaign_access(request.user, collaboration.campaign):
        return Response(
            {'error': 'Permission denied'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    new_status = request.data.get('status')
    if not new_status:
        return Response(
            {'error': 'Status is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    valid_statuses = [choice[0] for choice in InfluencerCollaboration.STATUS_CHOICES]
    if new_status not in valid_statuses:
        return Response(
            {'error': f'Invalid status. Must be one of: {valid_statuses}'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    collaboration.status = new_status
    if new_status in ['accepted', 'declined']:
        collaboration.responded_at = timezone.now()
    collaboration.save()
    
    return Response(CollaborationDetailSerializer(collaboration).data)


# ===========================================
# CONTENT VIEWS
# ===========================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def api_content_list(request, pk):
    """
    GET /api/campaigns/collaboration/<id>/content/
    List content for a collaboration
    """
    collaboration = get_object_or_404(InfluencerCollaboration, pk=pk)
    
    if not _has_campaign_access(request.user, collaboration.campaign):
        return Response(
            {'error': 'Permission denied'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    content = collaboration.content.all().order_by('-created_at')
    serializer = CampaignContentSerializer(content, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_create_content(request, pk):
    """
    POST /api/campaigns/collaboration/<id>/content/
    Create new content submission
    """
    collaboration = get_object_or_404(InfluencerCollaboration, pk=pk)
    
    if not _has_campaign_access(request.user, collaboration.campaign):
        return Response(
            {'error': 'Permission denied'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    serializer = CampaignContentCreateSerializer(data=request.data)
    if serializer.is_valid():
        content = serializer.save(collaboration=collaboration)
        return Response(
            CampaignContentSerializer(content).data,
            status=status.HTTP_201_CREATED
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def api_update_content(request, campaign_pk, pk):
    """
    PUT/PATCH /api/campaigns/<campaign_id>/content/<id>/
    Update content details
    """
    content = get_object_or_404(CampaignContent, pk=pk)
    
    if content.collaboration.campaign_id != campaign_pk:
        return Response(
            {'error': 'Content does not belong to this campaign'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if not _has_campaign_access(request.user, content.collaboration.campaign):
        return Response(
            {'error': 'Permission denied'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Update allowed fields
    allowed_fields = ['title', 'caption', 'post_url', 'status', 'feedback']
    for field in allowed_fields:
        if field in request.data:
            setattr(content, field, request.data[field])
    
    # Track status changes
    if 'status' in request.data:
        if request.data['status'] == 'submitted' and not content.submitted_at:
            content.submitted_at = timezone.now()
        elif request.data['status'] == 'published' and not content.published_at:
            content.published_at = timezone.now()
    
    content.save()
    
    # Update campaign analytics
    _update_campaign_analytics(content.collaboration.campaign)
    
    return Response(CampaignContentSerializer(content).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_review_content(request, pk):
    """
    POST /api/campaigns/content/<id>/review/
    Review content submission (approve/reject/request revision)
    """
    content = get_object_or_404(CampaignContent, pk=pk)
    
    if not _has_campaign_access(request.user, content.collaboration.campaign):
        return Response(
            {'error': 'Permission denied'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    new_status = request.data.get('status')
    feedback = request.data.get('feedback', '')
    
    if new_status not in ['approved', 'rejected', 'revision_requested']:
        return Response(
            {'error': 'Status must be approved, rejected, or revision_requested'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    content.status = new_status
    content.feedback = feedback
    content.save()
    
    return Response(CampaignContentSerializer(content).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_update_content_metrics(request, pk):
    """
    POST /api/campaigns/content/<id>/update-metrics/
    Update content performance metrics
    """
    content = get_object_or_404(CampaignContent, pk=pk)
    
    if not _has_campaign_access(request.user, content.collaboration.campaign):
        return Response(
            {'error': 'Permission denied'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Update metrics
    if 'likes_count' in request.data:
        content.likes_count = int(request.data['likes_count'])
    if 'comments_count' in request.data:
        content.comments_count = int(request.data['comments_count'])
    if 'shares_count' in request.data:
        content.shares_count = int(request.data['shares_count'])
    if 'views_count' in request.data:
        content.views_count = int(request.data['views_count'])
    if 'post_url' in request.data:
        content.post_url = request.data['post_url']
    
    content.save()
    
    # Update campaign analytics
    _update_campaign_analytics(content.collaboration.campaign)
    
    return Response(CampaignContentSerializer(content).data)


# ===========================================
# ANALYTICS VIEWS
# ===========================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def api_campaign_analytics(request, pk):
    """
    GET /api/campaigns/<id>/analytics/
    Get campaign analytics
    """
    campaign = get_object_or_404(Campaign, pk=pk)
    
    if not _has_campaign_access(request.user, campaign):
        return Response(
            {'error': 'Permission denied'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Get or create analytics
    analytics, created = CampaignAnalytics.objects.get_or_create(campaign=campaign)
    
    # Update with fresh data
    _update_campaign_analytics(campaign)
    analytics.refresh_from_db()
    
    serializer = CampaignAnalyticsSerializer(analytics)
    data = serializer.data
    
    # Add performance score
    data['performanceScore'] = _calculate_performance_score(campaign)
    
    return Response(data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_refresh_analytics(request, pk):
    """
    POST /api/campaigns/<id>/analytics/refresh/
    Force refresh campaign analytics
    """
    campaign = get_object_or_404(Campaign, pk=pk)
    
    if not _has_campaign_access(request.user, campaign):
        return Response(
            {'error': 'Permission denied'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    analytics = _update_campaign_analytics(campaign)
    
    return Response({
        'message': 'Analytics refreshed successfully',
        'data': CampaignAnalyticsSerializer(analytics).data
    })


# ===========================================
# HELPER FUNCTIONS
# ===========================================

def _get_user_agency(user):
    """Get agency for user (as owner or team member)"""
    from agencies.models import Agency, TeamMember
    
    # Check if user owns an agency
    try:
        return Agency.objects.get(owner=user)
    except Agency.DoesNotExist:
        pass
    
    # Check if user is a team member
    try:
        membership = TeamMember.objects.get(user=user, is_active=True)
        return membership.agency
    except TeamMember.DoesNotExist:
        pass
    
    return None


def _has_campaign_access(user, campaign):
    """Check if user has access to campaign"""
    from agencies.models import TeamMember
    
    # Agency owner
    if campaign.agency.owner == user:
        return True
    
    # Team member
    return TeamMember.objects.filter(
        agency=campaign.agency,
        user=user,
        is_active=True
    ).exists()


def _update_campaign_analytics(campaign):
    """Update campaign analytics from all content"""
    analytics, created = CampaignAnalytics.objects.get_or_create(campaign=campaign)
    
    # Aggregate from all content
    all_content = CampaignContent.objects.filter(collaboration__campaign=campaign)
    
    analytics.total_likes = sum(c.likes_count for c in all_content)
    analytics.total_comments = sum(c.comments_count for c in all_content)
    analytics.total_shares = sum(c.shares_count for c in all_content)
    analytics.total_reach = sum(c.views_count for c in all_content)
    analytics.total_impressions = analytics.total_reach  # Simplified
    
    # Calculate engagement rate
    total_engagement = analytics.total_likes + analytics.total_comments + analytics.total_shares
    if analytics.total_reach > 0:
        analytics.avg_engagement_rate = (total_engagement / analytics.total_reach) * 100
    
    # Financial metrics
    analytics.total_spent = campaign.get_total_spent()
    if total_engagement > 0:
        analytics.cost_per_engagement = analytics.total_spent / total_engagement
    
    # ROI calculation
    analytics.estimated_value = total_engagement * Decimal('0.50')
    if analytics.total_spent > 0:
        analytics.roi_percentage = float(
            ((analytics.estimated_value - analytics.total_spent) / analytics.total_spent) * 100
        )
    
    analytics.save()
    return analytics


def _calculate_performance_score(campaign):
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
