# campaigns/serializers.py
from rest_framework import serializers
from .models import Campaign, InfluencerCollaboration, CampaignContent, CampaignAnalytics

# Flexible import for InfluencerListSerializer
try:
    from influencers.serializers import InfluencerListSerializer
except ImportError:
    # Fallback: create a minimal serializer if import fails
    class InfluencerListSerializer(serializers.Serializer):
        id = serializers.IntegerField()
        fullName = serializers.CharField(source='full_name', default='')
        username = serializers.CharField(default='')
        email = serializers.EmailField(default='')


class CampaignContentSerializer(serializers.ModelSerializer):
    """Serializer for CampaignContent"""
    
    collaborationId = serializers.IntegerField(source='collaboration_id', read_only=True)
    postUrl = serializers.URLField(source='post_url', allow_null=True, allow_blank=True, required=False)
    likesCount = serializers.IntegerField(source='likes_count', default=0)
    commentsCount = serializers.IntegerField(source='comments_count', default=0)
    sharesCount = serializers.IntegerField(source='shares_count', default=0)
    viewsCount = serializers.IntegerField(source='views_count', default=0)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    submittedAt = serializers.DateTimeField(source='submitted_at', read_only=True, allow_null=True)
    publishedAt = serializers.DateTimeField(source='published_at', read_only=True, allow_null=True)
    
    # Add type field for frontend compatibility
    type = serializers.SerializerMethodField()
    
    class Meta:
        model = CampaignContent
        fields = [
            'id', 'collaborationId', 'type', 'title', 'caption', 'image', 'video', 'postUrl',
            'status', 'feedback', 'likesCount', 'commentsCount', 'sharesCount', 'viewsCount',
            'createdAt', 'submittedAt', 'publishedAt',
        ]
    
    def get_type(self, obj):
        # Try to get content type from collaboration
        if hasattr(obj, 'collaboration') and obj.collaboration:
            return obj.collaboration.content_type
        return 'post'


class CampaignContentCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating content - accepts camelCase"""
    
    postUrl = serializers.URLField(source='post_url', required=False, allow_null=True, allow_blank=True)
    likesCount = serializers.IntegerField(source='likes_count', required=False, default=0)
    commentsCount = serializers.IntegerField(source='comments_count', required=False, default=0)
    sharesCount = serializers.IntegerField(source='shares_count', required=False, default=0)
    viewsCount = serializers.IntegerField(source='views_count', required=False, default=0)
    
    class Meta:
        model = CampaignContent
        fields = [
            'title', 'caption', 'image', 'video', 'postUrl', 'status',
            'likesCount', 'commentsCount', 'sharesCount', 'viewsCount',
        ]


class CampaignAnalyticsSerializer(serializers.ModelSerializer):
    """Serializer for CampaignAnalytics"""
    
    campaignId = serializers.IntegerField(source='campaign_id', read_only=True)
    totalReach = serializers.IntegerField(source='total_reach')
    totalImpressions = serializers.IntegerField(source='total_impressions')
    totalLikes = serializers.IntegerField(source='total_likes')
    totalComments = serializers.IntegerField(source='total_comments')
    totalShares = serializers.IntegerField(source='total_shares')
    totalSaves = serializers.IntegerField(source='total_saves')
    avgEngagementRate = serializers.FloatField(source='avg_engagement_rate')
    costPerEngagement = serializers.DecimalField(source='cost_per_engagement', max_digits=8, decimal_places=2)
    websiteClicks = serializers.IntegerField(source='website_clicks')
    conversionRate = serializers.FloatField(source='conversion_rate')
    totalSpent = serializers.DecimalField(source='total_spent', max_digits=12, decimal_places=2)
    estimatedValue = serializers.DecimalField(source='estimated_value', max_digits=12, decimal_places=2)
    roiPercentage = serializers.FloatField(source='roi_percentage')
    lastCalculated = serializers.DateTimeField(source='last_calculated', read_only=True)
    
    class Meta:
        model = CampaignAnalytics
        fields = [
            'id', 'campaignId', 'totalReach', 'totalImpressions',
            'totalLikes', 'totalComments', 'totalShares', 'totalSaves',
            'avgEngagementRate', 'costPerEngagement', 'websiteClicks',
            'conversions', 'conversionRate', 'totalSpent', 'estimatedValue',
            'roiPercentage', 'lastCalculated',
        ]


class CollaborationSerializer(serializers.ModelSerializer):
    """Serializer for InfluencerCollaboration"""
    
    campaignId = serializers.IntegerField(source='campaign_id', read_only=True)
    influencerId = serializers.IntegerField(source='influencer_id', read_only=True)
    influencer = InfluencerListSerializer(read_only=True)
    contentType = serializers.CharField(source='content_type')
    deliverablesCount = serializers.IntegerField(source='deliverables_count')
    agreedRate = serializers.DecimalField(source='agreed_rate', max_digits=10, decimal_places=2)
    specificRequirements = serializers.CharField(source='specific_requirements', allow_null=True, allow_blank=True, required=False)
    invitedAt = serializers.DateTimeField(source='invited_at', read_only=True)
    respondedAt = serializers.DateTimeField(source='responded_at', read_only=True, allow_null=True)
    actualReach = serializers.IntegerField(source='actual_reach', allow_null=True, required=False)
    actualEngagement = serializers.IntegerField(source='actual_engagement', allow_null=True, required=False)
    paymentStatus = serializers.CharField(source='payment_status')
    content = CampaignContentSerializer(many=True, read_only=True)
    
    # Add deliverables for frontend compatibility
    deliverables = serializers.SerializerMethodField()
    
    class Meta:
        model = InfluencerCollaboration
        fields = [
            'id', 'campaignId', 'influencerId', 'influencer',
            'contentType', 'deliverablesCount', 'deliverables', 'agreedRate', 'currency',
            'deadline', 'specificRequirements', 'status', 'notes',
            'invitedAt', 'respondedAt', 'actualReach', 'actualEngagement',
            'paymentStatus', 'content',
        ]
    
    def get_deliverables(self, obj):
        """Return deliverables in format expected by frontend"""
        return [{'type': obj.content_type, 'quantity': obj.deliverables_count}]


class CollaborationDetailSerializer(CollaborationSerializer):
    """Detailed serializer for single collaboration view - same as CollaborationSerializer"""
    pass


class CollaborationCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating collaborations"""
    
    influencerId = serializers.IntegerField(source='influencer_id')
    contentType = serializers.CharField(source='content_type')
    deliverablesCount = serializers.IntegerField(source='deliverables_count')
    agreedRate = serializers.DecimalField(source='agreed_rate', max_digits=10, decimal_places=2)
    specificRequirements = serializers.CharField(
        source='specific_requirements', 
        required=False, 
        allow_null=True, 
        allow_blank=True
    )
    
    class Meta:
        model = InfluencerCollaboration
        fields = [
            'influencerId', 'contentType', 'deliverablesCount',
            'agreedRate', 'currency', 'deadline', 'specificRequirements', 'notes',
        ]


class CollaborationUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating collaborations"""
    
    agreedRate = serializers.DecimalField(source='agreed_rate', max_digits=10, decimal_places=2, required=False)
    specificRequirements = serializers.CharField(
        source='specific_requirements', 
        required=False, 
        allow_null=True, 
        allow_blank=True
    )
    
    class Meta:
        model = InfluencerCollaboration
        fields = ['agreedRate', 'deadline', 'notes', 'specificRequirements', 'status']


class CampaignListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for campaign list views"""
    
    agencyId = serializers.IntegerField(source='agency_id', read_only=True)
    campaignType = serializers.CharField(source='campaign_type')
    brandName = serializers.CharField(source='brand_name')
    totalBudget = serializers.DecimalField(source='total_budget', max_digits=12, decimal_places=2)
    budgetCurrency = serializers.CharField(source='budget_currency')
    startDate = serializers.DateField(source='start_date')
    endDate = serializers.DateField(source='end_date')
    createdById = serializers.IntegerField(source='created_by_id', read_only=True)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    updatedAt = serializers.DateTimeField(source='updated_at', read_only=True)
    
    # Computed fields
    collaborationsCount = serializers.SerializerMethodField()
    totalSpent = serializers.SerializerMethodField()
    
    class Meta:
        model = Campaign
        fields = [
            'id', 'agencyId', 'name', 'description', 'campaignType',
            'brandName', 'status', 'totalBudget', 'budgetCurrency',
            'startDate', 'endDate', 'createdById', 'createdAt', 'updatedAt',
            'collaborationsCount', 'totalSpent',
        ]
    
    def get_collaborationsCount(self, obj):
        return obj.collaborations.count()
    
    def get_totalSpent(self, obj):
        return obj.get_total_spent()


class CampaignDetailSerializer(serializers.ModelSerializer):
    """Full serializer with nested data for campaign detail views"""
    
    agencyId = serializers.IntegerField(source='agency_id', read_only=True)
    campaignType = serializers.CharField(source='campaign_type')
    brandName = serializers.CharField(source='brand_name')
    productName = serializers.CharField(source='product_name', allow_null=True, allow_blank=True)
    targetAudience = serializers.CharField(source='target_audience')
    campaignObjectives = serializers.CharField(source='campaign_objectives')
    totalBudget = serializers.DecimalField(source='total_budget', max_digits=12, decimal_places=2)
    budgetCurrency = serializers.CharField(source='budget_currency')
    startDate = serializers.DateField(source='start_date')
    endDate = serializers.DateField(source='end_date')
    contentGuidelines = serializers.CharField(source='content_guidelines', allow_null=True, allow_blank=True)
    briefDocument = serializers.FileField(source='brief_document', allow_null=True)
    brandAssets = serializers.FileField(source='brand_assets', allow_null=True)
    createdById = serializers.IntegerField(source='created_by_id', read_only=True)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    updatedAt = serializers.DateTimeField(source='updated_at', read_only=True)
    
    # Nested serializers
    collaborations = CollaborationSerializer(many=True, read_only=True)
    analytics = CampaignAnalyticsSerializer(read_only=True)
    
    class Meta:
        model = Campaign
        fields = [
            'id', 'agencyId', 'name', 'description', 'campaignType',
            'brandName', 'productName', 'targetAudience', 'campaignObjectives',
            'totalBudget', 'budgetCurrency', 'startDate', 'endDate',
            'contentGuidelines', 'hashtags', 'mentions',
            'briefDocument', 'brandAssets', 'status',
            'createdById', 'createdAt', 'updatedAt',
            'collaborations', 'analytics',
        ]


class CampaignCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating campaigns - accepts camelCase"""
    
    campaignType = serializers.CharField(source='campaign_type')
    brandName = serializers.CharField(source='brand_name')
    productName = serializers.CharField(source='product_name', required=False, allow_null=True, allow_blank=True)
    targetAudience = serializers.CharField(source='target_audience')
    campaignObjectives = serializers.CharField(source='campaign_objectives')
    totalBudget = serializers.DecimalField(source='total_budget', max_digits=12, decimal_places=2)
    budgetCurrency = serializers.CharField(source='budget_currency', required=False, default='MAD')
    startDate = serializers.DateField(source='start_date')
    endDate = serializers.DateField(source='end_date')
    contentGuidelines = serializers.CharField(source='content_guidelines', required=False, allow_null=True, allow_blank=True)
    
    class Meta:
        model = Campaign
        fields = [
            'name', 'description', 'campaignType', 'brandName', 'productName',
            'targetAudience', 'campaignObjectives', 'totalBudget', 'budgetCurrency',
            'startDate', 'endDate', 'contentGuidelines', 'hashtags', 'mentions', 'status',
        ]
    
    def create(self, validated_data):
        # Get agency from request user
        request = self.context.get('request')
        if request and hasattr(request.user, 'agency'):
            validated_data['agency'] = request.user.agency
        validated_data['created_by'] = request.user
        return Campaign.objects.create(**validated_data)
    
    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance
