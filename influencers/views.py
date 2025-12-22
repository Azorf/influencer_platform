"""
REST API Views for Influencers App
These views return JSON responses for the Next.js frontend
"""

from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.db.models import Q, Avg, Sum

from .models import Influencer, SocialMediaAccount, InfluencerTag, InfluencerAnalytics
from .serializers import (
    InfluencerListSerializer as InfluencerSerializer,
    InfluencerDetailSerializer,
    SocialMediaAccountSerializer,
    InfluencerTagSerializer,
    InfluencerAnalyticsSerializer,
)


class InfluencerPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


class InfluencerListAPIView(generics.ListAPIView):
    """
    GET /api/influencers/
    List all influencers with filtering and search
    """
    serializer_class = InfluencerSerializer
    pagination_class = InfluencerPagination
    permission_classes = [AllowAny]  # Allow public access to browse influencers

    def get_queryset(self):
        queryset = Influencer.objects.filter(is_active=True).select_related(
            'user'
        ).prefetch_related(
            'social_accounts', 'tags'
        )

        # Search by name or username
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(full_name__icontains=search) |
                Q(username__icontains=search) |
                Q(bio__icontains=search)
            )

        # Filter by category
        category = self.request.query_params.get('category', None)
        if category:
            queryset = queryset.filter(
                Q(primary_category__iexact=category) |
                Q(secondary_categories__icontains=category)
            )

        # Filter by location
        location = self.request.query_params.get('location', None)
        if location:
            queryset = queryset.filter(location__icontains=location)

        # Filter by follower count (using social accounts)
        min_followers = self.request.query_params.get('min_followers', None)
        if min_followers:
            queryset = queryset.filter(
                social_accounts__followers_count__gte=int(min_followers)
            ).distinct()

        max_followers = self.request.query_params.get('max_followers', None)
        if max_followers:
            queryset = queryset.filter(
                social_accounts__followers_count__lte=int(max_followers)
            ).distinct()

        # Filter by verified status
        verified = self.request.query_params.get('verified', None)
        if verified is not None:
            is_verified = verified.lower() in ('true', '1', 'yes')
            queryset = queryset.filter(is_verified=is_verified)

        # Filter by platform
        platform = self.request.query_params.get('platform', None)
        if platform:
            queryset = queryset.filter(
                social_accounts__platform__iexact=platform
            ).distinct()

        # Sorting
        sort_by = self.request.query_params.get('sort_by', '-created_at')
        if sort_by in ['followers', '-followers']:
            # Sort by follower count requires annotation
            queryset = queryset.annotate(
                total_followers=Sum('social_accounts__followers_count')
            ).order_by('-total_followers' if sort_by == '-followers' else 'total_followers')
        elif sort_by in ['engagement', '-engagement']:
            queryset = queryset.annotate(
                avg_engagement=Avg('social_accounts__engagement_rate')
            ).order_by('-avg_engagement' if sort_by == '-engagement' else 'avg_engagement')
        else:
            queryset = queryset.order_by(sort_by)

        return queryset


class InfluencerDetailAPIView(generics.RetrieveAPIView):
    """
    GET /api/influencers/<id>/
    Get detailed influencer information
    """
    serializer_class = InfluencerDetailSerializer
    permission_classes = [AllowAny]
    lookup_field = 'pk'

    def get_queryset(self):
        return Influencer.objects.filter(is_active=True).select_related(
            'user'
        ).prefetch_related(
            'social_accounts', 'tags'
        )


@api_view(['POST'])
@permission_classes([AllowAny])
def influencer_search_api(request):
    """
    POST /api/influencers/search/
    Advanced search with multiple filters
    """
    data = request.data
    queryset = Influencer.objects.filter(is_active=True)

    # Apply filters
    if data.get('category'):
        queryset = queryset.filter(
            Q(primary_category__iexact=data['category']) |
            Q(secondary_categories__icontains=data['category'])
        )

    if data.get('min_followers'):
        queryset = queryset.filter(
            social_accounts__followers_count__gte=data['min_followers']
        ).distinct()

    if data.get('max_followers'):
        queryset = queryset.filter(
            social_accounts__followers_count__lte=data['max_followers']
        ).distinct()

    if data.get('location'):
        queryset = queryset.filter(location__icontains=data['location'])

    if data.get('platform'):
        queryset = queryset.filter(
            social_accounts__platform__iexact=data['platform']
        ).distinct()

    if data.get('verified'):
        queryset = queryset.filter(is_verified=True)

    if data.get('min_engagement'):
        queryset = queryset.filter(
            social_accounts__engagement_rate__gte=data['min_engagement']
        ).distinct()

    # Limit results
    limit = data.get('limit', 50)
    queryset = queryset[:limit]

    serializer = InfluencerSerializer(queryset, many=True)
    return Response({'results': serializer.data})


@api_view(['GET'])
@permission_classes([AllowAny])
def influencer_analytics_api(request, pk):
    """
    GET /api/influencers/analytics/<id>/
    Get influencer analytics data
    """
    try:
        influencer = Influencer.objects.get(pk=pk, is_active=True)
    except Influencer.DoesNotExist:
        return Response(
            {'error': 'Influencer not found'},
            status=status.HTTP_404_NOT_FOUND
        )

    try:
        analytics = influencer.analytics
        serializer = InfluencerAnalyticsSerializer(analytics)
        return Response(serializer.data)
    except InfluencerAnalytics.DoesNotExist:
        # Return computed analytics from social accounts
        social_accounts = influencer.social_accounts.filter(is_active=True)
        
        total_followers = sum(sa.followers_count or 0 for sa in social_accounts)
        total_following = sum(sa.following_count or 0 for sa in social_accounts)
        avg_engagement = sum(sa.engagement_rate or 0 for sa in social_accounts) / max(len(social_accounts), 1)
        total_posts = sum(sa.media_count or 0 for sa in social_accounts)

        return Response({
            'influencer_id': influencer.id,
            'total_followers': total_followers,
            'total_following': total_following,
            'avg_engagement_rate': round(avg_engagement, 2),
            'total_posts': total_posts,
            'platforms': [sa.platform for sa in social_accounts],
        })


@api_view(['GET'])
@permission_classes([AllowAny])
def tag_list_api(request):
    """
    GET /api/influencers/tags/
    List all available influencer tags
    """
    tags = InfluencerTag.objects.all().order_by('name')
    serializer = InfluencerTagSerializer(tags, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def category_list_api(request):
    """
    GET /api/influencers/categories/
    List all available categories
    """
    # Get categories from model choices if defined, otherwise aggregate from data
    if hasattr(Influencer, 'CATEGORY_CHOICES'):
        categories = [
            {'value': choice[0], 'label': choice[1]}
            for choice in Influencer.CATEGORY_CHOICES
        ]
    else:
        # Aggregate unique categories from existing influencers
        categories_qs = Influencer.objects.filter(
            is_active=True
        ).values_list('primary_category', flat=True).distinct()
        
        categories = [
            {'value': cat, 'label': cat.replace('_', ' ').title()}
            for cat in categories_qs if cat
        ]

    return Response(categories)


@api_view(['GET'])
@permission_classes([AllowAny])
def social_accounts_api(request, pk):
    """
    GET /api/influencers/<id>/social-accounts/
    Get social media accounts for an influencer
    """
    try:
        influencer = Influencer.objects.get(pk=pk, is_active=True)
    except Influencer.DoesNotExist:
        return Response(
            {'error': 'Influencer not found'},
            status=status.HTTP_404_NOT_FOUND
        )

    social_accounts = influencer.social_accounts.filter(is_active=True)
    serializer = SocialMediaAccountSerializer(social_accounts, many=True)
    return Response(serializer.data)
