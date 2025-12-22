"""
REST API Views for Agencies App
These views return JSON responses for the Next.js frontend
"""

from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.shortcuts import get_object_or_404
from django.db.models import Q

# Flexible imports to handle different model names
from .models import Agency

# Try different possible model names for TeamMember
try:
    from .models import TeamMember
except ImportError:
    try:
        from .models import AgencyTeamMember as TeamMember
    except ImportError:
        TeamMember = None

# Try different possible model names for TeamInvitation
try:
    from .models import TeamInvitation
except ImportError:
    TeamInvitation = None

# Try different possible model names for Subscription
try:
    from .models import Subscription
except ImportError:
    try:
        from .models import AgencySubscription as Subscription
    except ImportError:
        Subscription = None

from .serializers import (
    AgencySerializer,
    AgencyDetailSerializer,
    AgencyCreateUpdateSerializer,
    TeamMemberSerializer,
    TeamInvitationSerializer,
    SubscriptionSerializer,
)


class AgencyPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


# ===========================================
# AGENCY VIEWS
# ===========================================

class AgencyListAPIView(generics.ListAPIView):
    """
    GET /api/agencies/
    List all agencies (admin only in production)
    """
    serializer_class = AgencySerializer
    pagination_class = AgencyPagination
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Agency.objects.filter(is_active=True)
        
        # Search
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(description__icontains=search)
            )
        
        return queryset.order_by('-created_at')


class AgencyDetailAPIView(generics.RetrieveAPIView):
    """
    GET /api/agencies/<id>/
    Get agency details
    """
    serializer_class = AgencyDetailSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'pk'

    def get_queryset(self):
        return Agency.objects.filter(is_active=True)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def api_current_agency(request):
    """
    GET /api/agencies/me/
    Get the current user's agency
    """
    try:
        # Check if user owns an agency
        agency = Agency.objects.get(owner=request.user)
        serializer = AgencyDetailSerializer(agency)
        return Response(serializer.data)
    except Agency.DoesNotExist:
        # Check if user is a team member
        try:
            team_member = TeamMember.objects.get(user=request.user, is_active=True)
            serializer = AgencyDetailSerializer(team_member.agency)
            return Response(serializer.data)
        except TeamMember.DoesNotExist:
            return Response(
                {'error': 'No agency found for this user'},
                status=status.HTTP_404_NOT_FOUND
            )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_create_agency(request):
    """
    POST /api/agencies/create/
    Create a new agency
    """
    # Check if user already has an agency
    if Agency.objects.filter(owner=request.user).exists():
        return Response(
            {'error': 'You already have an agency'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    serializer = AgencyCreateUpdateSerializer(data=request.data)
    if serializer.is_valid():
        agency = serializer.save(owner=request.user)
        return Response(
            AgencyDetailSerializer(agency).data,
            status=status.HTTP_201_CREATED
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def api_update_agency(request, pk):
    """
    PUT/PATCH /api/agencies/<id>/update/
    Update agency details
    """
    agency = get_object_or_404(Agency, pk=pk)
    
    # Check permission
    if agency.owner != request.user:
        # Check if user is admin team member
        is_admin = TeamMember.objects.filter(
            agency=agency, 
            user=request.user, 
            role='admin',
            is_active=True
        ).exists()
        if not is_admin:
            return Response(
                {'error': 'Permission denied'},
                status=status.HTTP_403_FORBIDDEN
            )
    
    serializer = AgencyCreateUpdateSerializer(
        agency, 
        data=request.data, 
        partial=request.method == 'PATCH'
    )
    if serializer.is_valid():
        serializer.save()
        return Response(AgencyDetailSerializer(agency).data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ===========================================
# TEAM MEMBER VIEWS
# ===========================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def api_team_members(request, pk):
    """
    GET /api/agencies/<id>/team/
    List team members for an agency
    """
    agency = get_object_or_404(Agency, pk=pk)
    
    # Check permission
    if not _has_agency_access(request.user, agency):
        return Response(
            {'error': 'Permission denied'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    members = TeamMember.objects.filter(agency=agency, is_active=True)
    serializer = TeamMemberSerializer(members, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_add_team_member(request, pk):
    """
    POST /api/agencies/<id>/team/add/
    Add an existing user to the team
    """
    agency = get_object_or_404(Agency, pk=pk)
    
    # Check permission (only owner or admin)
    if not _is_agency_admin(request.user, agency):
        return Response(
            {'error': 'Permission denied'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    from accounts.models import CustomUser
    
    user_id = request.data.get('user_id')
    email = request.data.get('email')
    role = request.data.get('role', 'member')
    
    # Find user
    try:
        if user_id:
            user = CustomUser.objects.get(pk=user_id)
        elif email:
            user = CustomUser.objects.get(email=email)
        else:
            return Response(
                {'error': 'user_id or email required'},
                status=status.HTTP_400_BAD_REQUEST
            )
    except CustomUser.DoesNotExist:
        return Response(
            {'error': 'User not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Check if already a member
    if TeamMember.objects.filter(agency=agency, user=user).exists():
        return Response(
            {'error': 'User is already a team member'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    member = TeamMember.objects.create(
        agency=agency,
        user=user,
        role=role
    )
    
    return Response(
        TeamMemberSerializer(member).data,
        status=status.HTTP_201_CREATED
    )


@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def api_update_team_member(request, pk, member_pk):
    """
    PUT/PATCH /api/agencies/<id>/team/<member_id>/
    Update team member role
    """
    agency = get_object_or_404(Agency, pk=pk)
    member = get_object_or_404(TeamMember, pk=member_pk, agency=agency)
    
    # Check permission
    if not _is_agency_admin(request.user, agency):
        return Response(
            {'error': 'Permission denied'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    role = request.data.get('role')
    if role:
        member.role = role
        member.save()
    
    return Response(TeamMemberSerializer(member).data)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def api_remove_team_member(request, pk, member_pk):
    """
    DELETE /api/agencies/<id>/team/<member_id>/
    Remove team member
    """
    agency = get_object_or_404(Agency, pk=pk)
    member = get_object_or_404(TeamMember, pk=member_pk, agency=agency)
    
    # Check permission
    if not _is_agency_admin(request.user, agency):
        return Response(
            {'error': 'Permission denied'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Can't remove the owner
    if member.user == agency.owner:
        return Response(
            {'error': 'Cannot remove agency owner'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    member.is_active = False
    member.save()
    
    return Response({'message': 'Team member removed'})


# ===========================================
# INVITATION VIEWS
# ===========================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def api_list_invitations(request, pk):
    """
    GET /api/agencies/<id>/invitations/
    List pending invitations
    """
    agency = get_object_or_404(Agency, pk=pk)
    
    if not _is_agency_admin(request.user, agency):
        return Response(
            {'error': 'Permission denied'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    invitations = TeamInvitation.objects.filter(
        agency=agency,
        status='pending'
    ).order_by('-created_at')
    
    serializer = TeamInvitationSerializer(invitations, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_create_invitation(request, pk):
    """
    POST /api/agencies/<id>/invitations/
    Create a new team invitation
    """
    agency = get_object_or_404(Agency, pk=pk)
    
    if not _is_agency_admin(request.user, agency):
        return Response(
            {'error': 'Permission denied'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    email = request.data.get('email')
    role = request.data.get('role', 'member')
    
    if not email:
        return Response(
            {'error': 'Email is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Check if already invited
    existing = TeamInvitation.objects.filter(
        agency=agency,
        email=email,
        status='pending'
    ).first()
    
    if existing:
        return Response(
            {'error': 'Invitation already sent to this email'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    invitation = TeamInvitation.objects.create(
        agency=agency,
        email=email,
        role=role,
        invited_by=request.user
    )
    
    # TODO: Send invitation email
    
    return Response(
        TeamInvitationSerializer(invitation).data,
        status=status.HTTP_201_CREATED
    )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_resend_invitation(request, pk, invitation_pk):
    """
    POST /api/agencies/<id>/invitations/<invitation_id>/resend/
    Resend invitation email
    """
    agency = get_object_or_404(Agency, pk=pk)
    invitation = get_object_or_404(TeamInvitation, pk=invitation_pk, agency=agency)
    
    if not _is_agency_admin(request.user, agency):
        return Response(
            {'error': 'Permission denied'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    if invitation.status != 'pending':
        return Response(
            {'error': 'Can only resend pending invitations'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # TODO: Resend invitation email
    
    return Response({'message': 'Invitation resent'})


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def api_cancel_invitation(request, pk, invitation_pk):
    """
    DELETE /api/agencies/<id>/invitations/<invitation_id>/
    Cancel an invitation
    """
    agency = get_object_or_404(Agency, pk=pk)
    invitation = get_object_or_404(TeamInvitation, pk=invitation_pk, agency=agency)
    
    if not _is_agency_admin(request.user, agency):
        return Response(
            {'error': 'Permission denied'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    invitation.status = 'cancelled'
    invitation.save()
    
    return Response({'message': 'Invitation cancelled'})


@api_view(['POST'])
@permission_classes([AllowAny])
def api_accept_invitation(request, token):
    """
    POST /api/agencies/invitations/accept/<token>/
    Accept an invitation (can be called by unauthenticated user during signup)
    """
    invitation = get_object_or_404(TeamInvitation, token=token)
    
    if invitation.status != 'pending':
        return Response(
            {'error': 'Invitation is no longer valid'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if invitation.is_expired():
        return Response(
            {'error': 'Invitation has expired'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # If user is authenticated, add them to the team
    if request.user.is_authenticated:
        # Check if user email matches invitation
        if request.user.email != invitation.email:
            return Response(
                {'error': 'This invitation was sent to a different email'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create team member
        member, created = TeamMember.objects.get_or_create(
            agency=invitation.agency,
            user=request.user,
            defaults={'role': invitation.role}
        )
        
        invitation.status = 'accepted'
        invitation.save()
        
        return Response({
            'message': 'Invitation accepted',
            'agency': AgencySerializer(invitation.agency).data
        })
    
    # Return invitation details for signup flow
    return Response({
        'email': invitation.email,
        'agency_name': invitation.agency.name,
        'role': invitation.role,
    })


# ===========================================
# SUBSCRIPTION VIEWS
# ===========================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def api_subscription(request, pk):
    """
    GET /api/agencies/<id>/subscription/
    Get agency subscription details
    """
    agency = get_object_or_404(Agency, pk=pk)
    
    if not _has_agency_access(request.user, agency):
        return Response(
            {'error': 'Permission denied'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        subscription = agency.subscription
        serializer = SubscriptionSerializer(subscription)
        return Response(serializer.data)
    except Subscription.DoesNotExist:
        return Response(
            {'error': 'No subscription found'},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_update_subscription(request, pk):
    """
    POST /api/agencies/<id>/subscription/update/
    Update subscription (upgrade/downgrade)
    """
    agency = get_object_or_404(Agency, pk=pk)
    
    if agency.owner != request.user:
        return Response(
            {'error': 'Only agency owner can manage subscription'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    plan = request.data.get('plan')
    
    if not plan:
        return Response(
            {'error': 'Plan is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # TODO: Integrate with Stripe for actual subscription management
    
    subscription, created = Subscription.objects.get_or_create(agency=agency)
    subscription.plan = plan
    subscription.save()
    
    return Response(SubscriptionSerializer(subscription).data)


# ===========================================
# HELPER FUNCTIONS
# ===========================================

def _has_agency_access(user, agency):
    """Check if user has any access to agency"""
    if agency.owner == user:
        return True
    return TeamMember.objects.filter(
        agency=agency,
        user=user,
        is_active=True
    ).exists()


def _is_agency_admin(user, agency):
    """Check if user is owner or admin of agency"""
    if agency.owner == user:
        return True
    return TeamMember.objects.filter(
        agency=agency,
        user=user,
        role__in=['admin', 'owner'],
        is_active=True
    ).exists()
