# agencies/serializers.py
from rest_framework import serializers

# Import with try/except to handle different possible model names
try:
    from .models import Agency, AgencyTeamMember as TeamMember, AgencySubscription as Subscription, TeamInvitation
except ImportError:
    try:
        from .models import Agency, TeamMember, Subscription, TeamInvitation
    except ImportError:
        from .models import Agency
        TeamMember = None
        Subscription = None
        TeamInvitation = None


class AgencySerializer(serializers.ModelSerializer):
    """Serializer for Agency - list view"""
    
    # Handle fields that may or may not exist
    ownerName = serializers.SerializerMethodField()
    isVerified = serializers.BooleanField(source='is_verified', read_only=True, default=False)
    isActive = serializers.BooleanField(source='is_active', read_only=True, default=True)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    
    class Meta:
        model = Agency
        fields = [
            'id', 'name', 'description', 'email', 'phone', 'website',
            'city', 'country', 'logo',
            'isVerified', 'isActive', 'ownerName', 'createdAt',
        ]
    
    def get_ownerName(self, obj):
        if hasattr(obj, 'owner') and obj.owner:
            return obj.owner.get_full_name() or obj.owner.email
        if hasattr(obj, 'user') and obj.user:
            return obj.user.get_full_name() or obj.user.email
        return None


class AgencyDetailSerializer(serializers.ModelSerializer):
    """Serializer for Agency - detail view with more fields"""
    
    ownerName = serializers.SerializerMethodField()
    ownerEmail = serializers.SerializerMethodField()
    displayName = serializers.CharField(source='display_name', required=False, allow_blank=True, allow_null=True)
    organizationType = serializers.CharField(source='organization_type', required=False, allow_blank=True, allow_null=True)
    organizationSize = serializers.CharField(source='organization_size', required=False, allow_blank=True, allow_null=True)
    addressLine1 = serializers.CharField(source='address_line_1', required=False, allow_null=True, allow_blank=True)
    addressLine2 = serializers.CharField(source='address_line_2', required=False, allow_null=True, allow_blank=True)
    postalCode = serializers.CharField(source='postal_code', required=False, allow_null=True, allow_blank=True)
    foundedYear = serializers.IntegerField(source='founded_year', required=False, allow_null=True)
    isVerified = serializers.BooleanField(source='is_verified', read_only=True, default=False)
    isActive = serializers.BooleanField(source='is_active', read_only=True, default=True)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    updatedAt = serializers.DateTimeField(source='updated_at', read_only=True)
    
    # Nested data
    teamMembers = serializers.SerializerMethodField()
    subscription = serializers.SerializerMethodField()
    
    class Meta:
        model = Agency
        fields = [
            'id', 'name', 'displayName', 'description',
            'organizationType', 'industry', 'organizationSize',
            'email', 'phone', 'website',
            'addressLine1', 'addressLine2', 'city', 'state', 'country', 'postalCode',
            'foundedYear', 'specialties', 'logo',
            'isVerified', 'isActive',
            'ownerName', 'ownerEmail',
            'teamMembers', 'subscription',
            'createdAt', 'updatedAt',
        ]
    
    def get_ownerName(self, obj):
        if hasattr(obj, 'owner') and obj.owner:
            return obj.owner.get_full_name() or obj.owner.email
        if hasattr(obj, 'user') and obj.user:
            return obj.user.get_full_name() or obj.user.email
        return None
    
    def get_ownerEmail(self, obj):
        if hasattr(obj, 'owner') and obj.owner:
            return obj.owner.email
        if hasattr(obj, 'user') and obj.user:
            return obj.user.email
        return None
    
    def get_teamMembers(self, obj):
        if TeamMember is None:
            return []
        try:
            # Try different possible related names
            if hasattr(obj, 'team_members'):
                members = obj.team_members.filter(is_active=True)
            elif hasattr(obj, 'members'):
                members = obj.members.filter(is_active=True)
            else:
                return []
            return TeamMemberSerializer(members, many=True).data
        except Exception:
            return []
    
    def get_subscription(self, obj):
        if Subscription is None:
            return None
        try:
            if hasattr(obj, 'subscription'):
                return SubscriptionSerializer(obj.subscription).data
        except Exception:
            pass
        return None


class AgencyCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating agency"""
    
    displayName = serializers.CharField(source='display_name', required=False, allow_blank=True)
    organizationType = serializers.CharField(source='organization_type', required=False, allow_blank=True)
    organizationSize = serializers.CharField(source='organization_size', required=False, allow_blank=True)
    
    class Meta:
        model = Agency
        fields = [
            'name', 'displayName', 'description',
            'organizationType', 'industry', 'organizationSize',
            'email', 'phone', 'website', 'city', 'country', 'specialties',
        ]


class TeamMemberSerializer(serializers.ModelSerializer):
    """Serializer for Team Member"""
    
    userId = serializers.IntegerField(source='user_id', read_only=True)
    name = serializers.SerializerMethodField()
    email = serializers.SerializerMethodField()
    avatar = serializers.SerializerMethodField()
    isActive = serializers.BooleanField(source='is_active', default=True)
    joinedAt = serializers.DateTimeField(source='joined_at', read_only=True, required=False)
    
    class Meta:
        # Model will be set dynamically
        model = TeamMember if TeamMember else Agency  # Fallback to prevent import errors
        fields = [
            'id', 'userId', 'name', 'email', 'avatar', 'role', 'isActive', 'joinedAt',
        ]
    
    def get_name(self, obj):
        if hasattr(obj, 'user') and obj.user:
            return obj.user.get_full_name() or obj.user.email
        return None
    
    def get_email(self, obj):
        if hasattr(obj, 'user') and obj.user:
            return obj.user.email
        return None
    
    def get_avatar(self, obj):
        if hasattr(obj, 'user') and obj.user:
            if hasattr(obj.user, 'profile') and obj.user.profile and obj.user.profile.avatar:
                return obj.user.profile.avatar.url
        return None


class TeamInvitationSerializer(serializers.ModelSerializer):
    """Serializer for TeamInvitation"""
    
    invitedByName = serializers.SerializerMethodField()
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    expiresAt = serializers.DateTimeField(source='expires_at', read_only=True, required=False)
    
    class Meta:
        model = TeamInvitation if TeamInvitation else Agency  # Fallback
        fields = [
            'id', 'email', 'role', 'status', 'invitedByName', 'createdAt', 'expiresAt',
        ]
    
    def get_invitedByName(self, obj):
        if hasattr(obj, 'invited_by') and obj.invited_by:
            return obj.invited_by.get_full_name() or obj.invited_by.email
        return None


class SubscriptionSerializer(serializers.ModelSerializer):
    """Serializer for Subscription"""
    
    planType = serializers.CharField(source='plan_type', required=False)
    startDate = serializers.DateTimeField(source='start_date', required=False)
    endDate = serializers.DateTimeField(source='end_date', required=False, allow_null=True)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    
    class Meta:
        model = Subscription if Subscription else Agency  # Fallback
        fields = [
            'id', 'plan', 'planType', 'status', 'startDate', 'endDate', 'createdAt',
        ]
