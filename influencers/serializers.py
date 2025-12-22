# influencers/serializers.py
from rest_framework import serializers

# Flexible imports to handle missing models
try:
    from .models import Influencer
except ImportError:
    Influencer = None

try:
    from .models import SocialMediaAccount
except ImportError:
    SocialMediaAccount = None

try:
    from .models import SponsoredPost
except ImportError:
    SponsoredPost = None

try:
    from .models import InfluencerAnalytics
except ImportError:
    InfluencerAnalytics = None

try:
    from .models import InfluencerTag
except ImportError:
    InfluencerTag = None

try:
    from .models import InfluencerTagging
except ImportError:
    InfluencerTagging = None


class SocialMediaAccountSerializer(serializers.ModelSerializer):
    """Serializer for SocialMediaAccount - uses camelCase for frontend"""
    
    followersCount = serializers.IntegerField(source='followers_count', default=0)
    followingCount = serializers.IntegerField(source='following_count', default=0)
    postsCount = serializers.IntegerField(source='posts_count', default=0)
    engagementRate = serializers.FloatField(source='engagement_rate', default=0.0)
    avgLikes = serializers.IntegerField(source='avg_likes', default=0)
    avgComments = serializers.IntegerField(source='avg_comments', default=0)
    avgShares = serializers.IntegerField(source='avg_shares', default=0)
    avgViews = serializers.IntegerField(source='avg_views', default=0)
    avgSaves = serializers.IntegerField(source='avg_saves', default=0)
    followers14dAgo = serializers.IntegerField(source='followers_14d_ago', default=0)
    followersGrowth14d = serializers.IntegerField(source='followers_growth_14d', default=0)
    followersGrowthRate14d = serializers.FloatField(source='followers_growth_rate_14d', default=0.0)
    postsCount14d = serializers.IntegerField(source='posts_count_14d', default=0)
    isVerified = serializers.BooleanField(source='is_verified', default=False)
    isActive = serializers.BooleanField(source='is_active', default=True)
    lastUpdated = serializers.DateTimeField(source='last_updated', read_only=True, required=False)
    
    class Meta:
        model = SocialMediaAccount
        fields = [
            'id', 'platform', 'username', 'url',
            'followersCount', 'followingCount', 'postsCount', 'engagementRate',
            'avgLikes', 'avgComments', 'avgShares', 'avgViews', 'avgSaves',
            'followers14dAgo', 'followersGrowth14d', 'followersGrowthRate14d', 'postsCount14d',
            'isVerified', 'isActive', 'lastUpdated',
        ]


class SponsoredPostSerializer(serializers.ModelSerializer):
    """Serializer for SponsoredPost"""
    
    postUrl = serializers.URLField(source='post_url', default='')
    postType = serializers.CharField(source='post_type', default='')
    brandName = serializers.CharField(source='brand_name', default='')
    brandHandle = serializers.CharField(source='brand_handle', allow_null=True, default='')
    viewsCount = serializers.IntegerField(source='views_count', default=0)
    likesCount = serializers.IntegerField(source='likes_count', default=0)
    commentsCount = serializers.IntegerField(source='comments_count', default=0)
    sharesCount = serializers.IntegerField(source='shares_count', default=0)
    engagementRate = serializers.FloatField(source='engagement_rate', default=0.0)
    postedAt = serializers.DateTimeField(source='posted_at', required=False)
    
    class Meta:
        model = SponsoredPost if SponsoredPost else Influencer  # Fallback
        fields = [
            'id', 'postUrl', 'postType', 'brandName', 'brandHandle',
            'viewsCount', 'likesCount', 'commentsCount', 'sharesCount',
            'engagementRate', 'postedAt',
        ]


class InfluencerAnalyticsSerializer(serializers.ModelSerializer):
    """Serializer for InfluencerAnalytics"""
    
    avgEngagementRate = serializers.FloatField(source='avg_engagement_rate', default=0.0)
    estimatedRatePerPost = serializers.DecimalField(
        source='estimated_rate_per_post', 
        max_digits=10, 
        decimal_places=2,
        allow_null=True,
        default=None
    )
    collaborationCount = serializers.IntegerField(source='collaboration_count', default=0)
    authenticityScore = serializers.FloatField(source='authenticity_score', default=0.0)
    influenceScore = serializers.FloatField(source='influence_score', default=0.0)
    topAudienceCountries = serializers.JSONField(source='top_audience_countries', default=list)
    topAudienceCities = serializers.JSONField(source='top_audience_cities', default=list)
    audienceGenderMale = serializers.FloatField(source='audience_gender_male', default=0.0)
    audienceGenderFemale = serializers.FloatField(source='audience_gender_female', default=0.0)
    
    class Meta:
        model = InfluencerAnalytics if InfluencerAnalytics else Influencer  # Fallback
        fields = [
            'id', 'avgEngagementRate', 'estimatedRatePerPost', 'collaborationCount',
            'authenticityScore', 'influenceScore', 'topAudienceCountries', 
            'topAudienceCities', 'audienceGenderMale', 'audienceGenderFemale',
        ]


class InfluencerTagSerializer(serializers.ModelSerializer):
    """Serializer for InfluencerTag"""
    
    class Meta:
        model = InfluencerTag if InfluencerTag else Influencer  # Fallback
        fields = ['id', 'name', 'description', 'color']


class InfluencerListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views"""
    
    fullName = serializers.CharField(source='full_name')
    primaryCategory = serializers.CharField(source='primary_category', default='')
    secondaryCategories = serializers.SerializerMethodField()
    isVerified = serializers.BooleanField(source='is_verified', default=False)
    isActive = serializers.BooleanField(source='is_active', default=True)
    
    # Computed fields from primary social account
    tier = serializers.SerializerMethodField()
    totalFollowers = serializers.SerializerMethodField()
    followerCount = serializers.SerializerMethodField()  # Alias for frontend
    engagementRate = serializers.SerializerMethodField()
    avgViews = serializers.SerializerMethodField()
    avgLikes = serializers.SerializerMethodField()
    mediaCount = serializers.SerializerMethodField()
    profilePictureUrl = serializers.SerializerMethodField()
    
    class Meta:
        model = Influencer
        fields = [
            'id', 'fullName', 'username', 'email', 'bio', 'avatar',
            'location', 'language', 'primaryCategory', 'secondaryCategories',
            'country', 'city', 'isVerified', 'isActive',
            'tier', 'totalFollowers', 'followerCount', 'engagementRate', 
            'avgViews', 'avgLikes', 'mediaCount', 'profilePictureUrl',
        ]
    
    def get_secondaryCategories(self, obj):
        if hasattr(obj, 'get_secondary_categories_list'):
            return obj.get_secondary_categories_list()
        if hasattr(obj, 'secondary_categories') and obj.secondary_categories:
            return [c.strip() for c in obj.secondary_categories.split(',')]
        return []
    
    def get_tier(self, obj):
        if hasattr(obj, 'get_follower_tier'):
            return obj.get_follower_tier()
        followers = self.get_totalFollowers(obj)
        if followers >= 1000000:
            return 'mega'
        elif followers >= 500000:
            return 'macro'
        elif followers >= 50000:
            return 'mid'
        elif followers >= 10000:
            return 'micro'
        return 'nano'
    
    def get_totalFollowers(self, obj):
        if hasattr(obj, 'get_total_followers'):
            return obj.get_total_followers()
        if hasattr(obj, 'social_accounts'):
            return sum(sa.followers_count or 0 for sa in obj.social_accounts.all())
        return 0
    
    def get_followerCount(self, obj):
        return self.get_totalFollowers(obj)
    
    def get_engagementRate(self, obj):
        if hasattr(obj, 'calculate_overall_engagement_rate'):
            return obj.calculate_overall_engagement_rate()
        if hasattr(obj, 'social_accounts'):
            accounts = obj.social_accounts.all()
            if accounts:
                return sum(sa.engagement_rate or 0 for sa in accounts) / len(accounts)
        return 0.0
    
    def get_avgViews(self, obj):
        if hasattr(obj, 'get_primary_account'):
            primary = obj.get_primary_account()
            return primary.avg_views if primary and hasattr(primary, 'avg_views') else 0
        return 0
    
    def get_avgLikes(self, obj):
        if hasattr(obj, 'get_primary_account'):
            primary = obj.get_primary_account()
            return primary.avg_likes if primary and hasattr(primary, 'avg_likes') else 0
        return 0
    
    def get_mediaCount(self, obj):
        if hasattr(obj, 'social_accounts'):
            return sum(sa.posts_count or 0 for sa in obj.social_accounts.all())
        return 0
    
    def get_profilePictureUrl(self, obj):
        if hasattr(obj, 'avatar') and obj.avatar:
            return obj.avatar.url
        if hasattr(obj, 'profile_picture') and obj.profile_picture:
            return obj.profile_picture.url
        return None


class InfluencerDetailSerializer(serializers.ModelSerializer):
    """Full serializer with nested data for detail views"""
    
    fullName = serializers.CharField(source='full_name')
    primaryCategory = serializers.CharField(source='primary_category', default='')
    secondaryCategories = serializers.SerializerMethodField()
    phoneNumber = serializers.CharField(source='phone_number', allow_null=True, required=False)
    isVerified = serializers.BooleanField(source='is_verified', default=False)
    isActive = serializers.BooleanField(source='is_active', default=True)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True, required=False)
    
    # Nested serializers
    socialAccounts = SocialMediaAccountSerializer(source='social_accounts', many=True, read_only=True)
    analytics = serializers.SerializerMethodField()
    sponsoredPosts = serializers.SerializerMethodField()
    
    # Computed fields
    tier = serializers.SerializerMethodField()
    totalFollowers = serializers.SerializerMethodField()
    followerCount = serializers.SerializerMethodField()
    engagementRate = serializers.SerializerMethodField()
    profilePictureUrl = serializers.SerializerMethodField()
    
    class Meta:
        model = Influencer
        fields = [
            'id', 'fullName', 'username', 'email', 'bio', 'avatar',
            'age', 'gender', 'location', 'language',
            'primaryCategory', 'secondaryCategories',
            'phoneNumber', 'website', 'country', 'city',
            'isVerified', 'isActive', 'createdAt',
            'socialAccounts', 'analytics', 'sponsoredPosts',
            'tier', 'totalFollowers', 'followerCount', 'engagementRate', 'profilePictureUrl',
        ]
    
    def get_secondaryCategories(self, obj):
        if hasattr(obj, 'get_secondary_categories_list'):
            return obj.get_secondary_categories_list()
        if hasattr(obj, 'secondary_categories') and obj.secondary_categories:
            return [c.strip() for c in obj.secondary_categories.split(',')]
        return []
    
    def get_tier(self, obj):
        if hasattr(obj, 'get_follower_tier'):
            return obj.get_follower_tier()
        followers = self.get_totalFollowers(obj)
        if followers >= 1000000:
            return 'mega'
        elif followers >= 500000:
            return 'macro'
        elif followers >= 50000:
            return 'mid'
        elif followers >= 10000:
            return 'micro'
        return 'nano'
    
    def get_totalFollowers(self, obj):
        if hasattr(obj, 'get_total_followers'):
            return obj.get_total_followers()
        if hasattr(obj, 'social_accounts'):
            return sum(sa.followers_count or 0 for sa in obj.social_accounts.all())
        return 0
    
    def get_followerCount(self, obj):
        return self.get_totalFollowers(obj)
    
    def get_engagementRate(self, obj):
        if hasattr(obj, 'calculate_overall_engagement_rate'):
            return obj.calculate_overall_engagement_rate()
        if hasattr(obj, 'social_accounts'):
            accounts = list(obj.social_accounts.all())
            if accounts:
                return sum(sa.engagement_rate or 0 for sa in accounts) / len(accounts)
        return 0.0
    
    def get_analytics(self, obj):
        if hasattr(obj, 'analytics'):
            try:
                return InfluencerAnalyticsSerializer(obj.analytics).data
            except Exception:
                pass
        return None
    
    def get_sponsoredPosts(self, obj):
        if hasattr(obj, 'sponsored_posts'):
            try:
                return SponsoredPostSerializer(obj.sponsored_posts.all(), many=True).data
            except Exception:
                pass
        return []
    
    def get_profilePictureUrl(self, obj):
        if hasattr(obj, 'avatar') and obj.avatar:
            return obj.avatar.url
        if hasattr(obj, 'profile_picture') and obj.profile_picture:
            return obj.profile_picture.url
        return None


class InfluencerCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating influencers - accepts camelCase"""
    
    fullName = serializers.CharField(source='full_name')
    primaryCategory = serializers.CharField(source='primary_category')
    secondaryCategories = serializers.CharField(
        source='secondary_categories', 
        required=False, 
        allow_blank=True
    )
    phoneNumber = serializers.CharField(
        source='phone_number', 
        required=False, 
        allow_null=True, 
        allow_blank=True
    )
    isVerified = serializers.BooleanField(source='is_verified', required=False)
    isActive = serializers.BooleanField(source='is_active', required=False)
    
    class Meta:
        model = Influencer
        fields = [
            'fullName', 'username', 'email', 'bio', 'avatar',
            'age', 'gender', 'location', 'language',
            'primaryCategory', 'secondaryCategories',
            'phoneNumber', 'website', 'country',
            'isVerified', 'isActive',
        ]
    
    def create(self, validated_data):
        return Influencer.objects.create(**validated_data)
    
    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


class InfluencerSearchSerializer(serializers.Serializer):
    """Serializer for search/filter parameters"""
    
    search = serializers.CharField(required=False, allow_blank=True)
    category = serializers.CharField(required=False, allow_blank=True)
    location = serializers.CharField(required=False, allow_blank=True)
    minFollowers = serializers.IntegerField(required=False, min_value=0)
    maxFollowers = serializers.IntegerField(required=False, min_value=0)
    platform = serializers.CharField(required=False, allow_blank=True)
    tier = serializers.ChoiceField(
        choices=['nano', 'micro', 'mid', 'macro', 'mega'],
        required=False
    )
    isVerified = serializers.BooleanField(required=False)
