from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import login, authenticate, logout
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.utils.translation import gettext as _
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
import json

from .models import CustomUser, UserProfile
from .forms import CustomUserCreationForm, UserProfileForm


def signup_view(request):
    """User registration view"""
    if request.user.is_authenticated:
        return redirect('dashboard')
    
    if request.method == 'POST':
        form = CustomUserCreationForm(request.POST)
        if form.is_valid():
            user = form.save()
            # Create user profile
            UserProfile.objects.create(user=user)
            messages.success(request, _('Account created successfully! Please check your email to verify your account.'))
            return redirect('account_login')
        else:
            messages.error(request, _('Please correct the errors below.'))
    else:
        form = CustomUserCreationForm()
    
    return render(request, 'account/signup.html', {'form': form})


@login_required
def profile_view(request):
    """User profile view"""
    profile, created = UserProfile.objects.get_or_create(user=request.user)
    return render(request, 'accounts/profile.html', {'profile': profile})


@login_required
def profile_edit_view(request):
    """Edit user profile view"""
    profile, created = UserProfile.objects.get_or_create(user=request.user)
    
    if request.method == 'POST':
        form = UserProfileForm(request.POST, request.FILES, instance=profile)
        if form.is_valid():
            form.save()
            messages.success(request, _('Profile updated successfully!'))
            return redirect('profile')
        else:
            messages.error(request, _('Please correct the errors below.'))
    else:
        form = UserProfileForm(instance=profile)
    
    return render(request, 'accounts/profile_edit.html', {'form': form, 'profile': profile})


@login_required
def dashboard_view(request):
    """Main dashboard view"""
    context = {
        'user': request.user,
        'user_type': request.user.user_type,
    }
    
    if request.user.user_type == 'agency':
        # Add agency-specific dashboard data
        from agencies.models import Agency
        try:
            agency = Agency.objects.get(user=request.user)
            context['agency'] = agency
        except Agency.DoesNotExist:
            context['agency'] = None
    
    return render(request, 'accounts/dashboard.html', context)


def logout_view(request):
    """Custom logout view"""
    logout(request)
    messages.success(request, _('You have been logged out successfully.'))
    return redirect('home')


@require_http_methods(["POST"])
@login_required
def update_user_type(request):
    """AJAX view to update user type"""
    try:
        data = json.loads(request.body)
        user_type = data.get('user_type')
        
        if user_type in dict(CustomUser.USER_TYPES):
            request.user.user_type = user_type
            request.user.save()
            return JsonResponse({'success': True, 'message': _('User type updated successfully')})
        else:
            return JsonResponse({'success': False, 'message': _('Invalid user type')})
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)})


@login_required
def delete_account_view(request):
    """Delete user account view"""
    if request.method == 'POST':
        user = request.user
        logout(request)
        user.delete()
        messages.success(request, _('Your account has been deleted successfully.'))
        return redirect('home')
    
    return render(request, 'accounts/delete_account.html')