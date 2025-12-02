from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.utils.translation import gettext as _
from django.http import JsonResponse
from django.core.paginator import Paginator
from django.db.models import Q
import json

from .models import Influencer, SocialMediaAccount, InfluencerTag, InfluencerAnalytics
from .forms import InfluencerForm, SocialMediaAccountForm, InfluencerSearchForm


def influencer_list_view(request):
    """List all influencers with search and filtering"""
    influencers = Influencer.objects.filter(is_active=True).select_related('user').prefetch_related('social_accounts')
    
    # Search functionality
    search_form = InfluencerSearchForm(request.GET)
    if search_form.is_valid():
        search_query = search_form.cleaned_data.get('search')
        category = search_form.cleaned_data.get('category')
        location = search_form.cleaned_data.get('location')
        
        if search_query:
            influencers = influencers.filter(
                Q(full_name__icontains=search_query) |
                Q(username__icontains=search_query) |
                Q(bio__icontains=search_query)
            )
        
        if category:
            influencers = influencers.filter(
                Q(primary_category=category) |
                Q(secondary_categories__icontains=category)
            )
        
        if location:
            influencers = influencers.filter(location__icontains=location)
    
    # Pagination
    paginator = Paginator(influencers, 12)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    context = {
        'page_obj': page_obj,
        'search_form': search_form,
    }
    
    return render(request, 'influencers/list.html', context)


def influencer_detail_view(request, pk):
    """Influencer detail view"""
    influencer = get_object_or_404(Influencer, pk=pk, is_active=True)
    social_accounts = influencer.social_accounts.filter(is_active=True)
    
    try:
        analytics = influencer.analytics
    except InfluencerAnalytics.DoesNotExist:
        analytics = None
    
    context = {
        'influencer': influencer,
        'social_accounts': social_accounts,
        'analytics': analytics,
    }
    
    return render(request, 'influencers/detail.html', context)


@login_required
def influencer_search_view(request):
    """Advanced influencer search view"""
    if request.method == 'POST':
        # Handle AJAX search requests
        data = json.loads(request.body)
        
        # Build search query
        influencers = Influencer.objects.filter(is_active=True)
        
        # Apply filters from the search data
        if data.get('category'):
            influencers = influencers.filter(primary_category=data['category'])
        
        if data.get('min_followers'):
            influencers = influencers.filter(
                social_accounts__followers_count__gte=data['min_followers']
            )
        
        if data.get('max_followers'):
            influencers = influencers.filter(
                social_accounts__followers_count__lte=data['max_followers']
            )
        
        if data.get('location'):
            influencers = influencers.filter(location__icontains=data['location'])
        
        # Return JSON response
        results = []
        for influencer in influencers[:20]:  # Limit results
            results.append({
                'id': influencer.id,
                'full_name': influencer.full_name,
                'username': influencer.username,
                'primary_category': influencer.primary_category,
                'location': influencer.location,
                'avatar_url': influencer.avatar.url if influencer.avatar else None,
            })
        
        return JsonResponse({'results': results})
    
    return render(request, 'influencers/search.html')


def influencer_analytics_view(request, pk):
    """Influencer analytics view"""
    influencer = get_object_or_404(Influencer, pk=pk)
    
    try:
        analytics = influencer.analytics
    except InfluencerAnalytics.DoesNotExist:
        messages.warning(request, _('Analytics data is not available for this influencer.'))
        return redirect('influencers:influencer_detail', pk=pk)
    
    context = {
        'influencer': influencer,
        'analytics': analytics,
    }
    
    return render(request, 'influencers/analytics.html', context)


def social_accounts_view(request, pk):
    """View social media accounts for an influencer"""
    influencer = get_object_or_404(Influencer, pk=pk)
    social_accounts = influencer.social_accounts.filter(is_active=True)
    
    context = {
        'influencer': influencer,
        'social_accounts': social_accounts,
    }
    
    return render(request, 'influencers/social_accounts.html', context)


@login_required
def add_social_account_view(request):
    """Add social media account for influencer"""
    if request.user.user_type != 'influencer':
        messages.error(request, _('Only influencers can add social media accounts.'))
        return redirect('accounts:dashboard')
    
    try:
        influencer = request.user.influencer_profile
    except:
        messages.error(request, _('Influencer profile not found.'))
        return redirect('accounts:dashboard')
    
    if request.method == 'POST':
        form = SocialMediaAccountForm(request.POST)
        if form.is_valid():
            social_account = form.save(commit=False)
            social_account.influencer = influencer
            social_account.save()
            messages.success(request, _('Social media account added successfully!'))
            return redirect('influencers:social_accounts', pk=influencer.pk)
    else:
        form = SocialMediaAccountForm()
    
    return render(request, 'influencers/add_social_account.html', {'form': form})


def tag_list_view(request):
    """List all influencer tags"""
    tags = InfluencerTag.objects.all().order_by('name')
    
    context = {
        'tags': tags,
    }
    
    return render(request, 'influencers/tags.html', context)


def category_list_view(request):
    """List influencers by category"""
    categories = Influencer.CATEGORY_CHOICES
    selected_category = request.GET.get('category')
    
    if selected_category:
        influencers = Influencer.objects.filter(
            primary_category=selected_category,
            is_active=True
        )
        
        # Pagination
        paginator = Paginator(influencers, 12)
        page_number = request.GET.get('page')
        page_obj = paginator.get_page(page_number)
    else:
        page_obj = None
    
    context = {
        'categories': categories,
        'selected_category': selected_category,
        'page_obj': page_obj,
    }
    
    return render(request, 'influencers/categories.html', context)