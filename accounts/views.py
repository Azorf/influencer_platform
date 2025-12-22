from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import login, authenticate, logout
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.utils.translation import gettext as _
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
import json

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.authtoken.models import Token

from .models import CustomUser, UserProfile
from .serializers import (
    UserSerializer, 
    UserUpdateSerializer,
    UserProfileSerializer,
    UserProfileUpdateSerializer,
    ChangePasswordSerializer,
    TokenSerializer,
)

# Try to import forms if they exist
try:
    from .forms import CustomUserCreationForm, UserProfileForm
except ImportError:
    CustomUserCreationForm = None
    UserProfileForm = None


# ===========================================
# REST API VIEWS
# ===========================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def api_current_user(request):
    """Get current authenticated user"""
    serializer = UserSerializer(request.user)
    return Response(serializer.data)


@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def api_update_user(request):
    """Update current user's information"""
    serializer = UserUpdateSerializer(
        request.user, 
        data=request.data, 
        partial=request.method == 'PATCH'
    )
    if serializer.is_valid():
        serializer.save()
        return Response(UserSerializer(request.user).data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def api_user_profile(request):
    """Get or update user profile"""
    profile, created = UserProfile.objects.get_or_create(user=request.user)
    
    if request.method == 'GET':
        serializer = UserProfileSerializer(profile)
        return Response(serializer.data)
    
    serializer = UserProfileUpdateSerializer(
        profile, 
        data=request.data, 
        partial=request.method == 'PATCH'
    )
    if serializer.is_valid():
        serializer.save()
        return Response(UserProfileSerializer(profile).data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_change_password(request):
    """Change user password"""
    serializer = ChangePasswordSerializer(
        data=request.data,
        context={'request': request}
    )
    if serializer.is_valid():
        request.user.set_password(serializer.validated_data['new_password'])
        request.user.save()
        return Response({'message': 'Password changed successfully'})
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_logout(request):
    """Logout user and delete token"""
    try:
        # Delete the user's token
        Token.objects.filter(user=request.user).delete()
    except Exception:
        pass
    
    logout(request)
    return Response({'message': 'Logged out successfully'})


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def api_delete_account(request):
    """Delete user account"""
    user = request.user
    
    # Delete token first
    try:
        Token.objects.filter(user=user).delete()
    except Exception:
        pass
    
    logout(request)
    user.delete()
    
    return Response({'message': 'Account deleted successfully'})


@api_view(['POST'])
@permission_classes([AllowAny])
def api_google_auth_callback(request):
    """
    Handle Google OAuth callback from frontend.
    This endpoint receives the auth code/token from Google OAuth flow
    and returns our app's auth token.
    """
    from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
    from allauth.socialaccount.providers.oauth2.client import OAuth2Client
    from allauth.socialaccount.models import SocialAccount, SocialToken, SocialApp
    from allauth.socialaccount.helpers import complete_social_login
    from allauth.socialaccount.models import SocialLogin
    import requests
    
    access_token = request.data.get('access_token')
    code = request.data.get('code')
    
    if not access_token and not code:
        return Response(
            {'error': 'Either access_token or code is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # If we have a code, exchange it for an access token
        if code and not access_token:
            try:
                google_app = SocialApp.objects.get(provider='google')
                token_url = 'https://oauth2.googleapis.com/token'
                
                # Get the redirect URI from the request or settings
                redirect_uri = request.data.get('redirect_uri', 
                    f"{settings.FRONTEND_URL}/auth/callback")
                
                response = requests.post(token_url, data={
                    'code': code,
                    'client_id': google_app.client_id,
                    'client_secret': google_app.secret,
                    'redirect_uri': redirect_uri,
                    'grant_type': 'authorization_code',
                })
                
                if response.status_code != 200:
                    return Response(
                        {'error': 'Failed to exchange code for token', 'details': response.json()},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                token_data = response.json()
                access_token = token_data.get('access_token')
            except SocialApp.DoesNotExist:
                return Response(
                    {'error': 'Google OAuth not configured'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        # Get user info from Google
        user_info_url = 'https://www.googleapis.com/oauth2/v2/userinfo'
        headers = {'Authorization': f'Bearer {access_token}'}
        user_response = requests.get(user_info_url, headers=headers)
        
        if user_response.status_code != 200:
            return Response(
                {'error': 'Failed to get user info from Google'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        google_user = user_response.json()
        email = google_user.get('email')
        google_id = google_user.get('id')
        
        if not email:
            return Response(
                {'error': 'Email not provided by Google'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Find or create user
        user = None
        social_account = None
        
        # First, try to find by social account
        try:
            social_account = SocialAccount.objects.get(
                provider='google',
                uid=google_id
            )
            user = social_account.user
        except SocialAccount.DoesNotExist:
            # Try to find by email
            try:
                user = CustomUser.objects.get(email=email)
            except CustomUser.DoesNotExist:
                # Create new user
                username = email.split('@')[0]
                base_username = username
                counter = 1
                while CustomUser.objects.filter(username=username).exists():
                    username = f"{base_username}{counter}"
                    counter += 1
                
                user = CustomUser.objects.create_user(
                    email=email,
                    username=username,
                    first_name=google_user.get('given_name', ''),
                    last_name=google_user.get('family_name', ''),
                    user_type='agency',  # Default to agency
                    is_verified=google_user.get('verified_email', False),
                )
            
            # Create social account link
            social_account = SocialAccount.objects.create(
                user=user,
                provider='google',
                uid=google_id,
                extra_data=google_user
            )
        
        # Update user info from Google if needed
        if not user.first_name and google_user.get('given_name'):
            user.first_name = google_user.get('given_name')
        if not user.last_name and google_user.get('family_name'):
            user.last_name = google_user.get('family_name')
        user.save()
        
        # Update profile avatar if not set
        if hasattr(user, 'profile') and not user.profile.avatar:
            picture = google_user.get('picture')
            if picture:
                user.profile.avatar = picture
                user.profile.save()
        
        # Get or create auth token
        token, created = Token.objects.get_or_create(user=user)
        
        # Return token and user data
        return Response({
            'token': token.key,
            'user': UserSerializer(user).data,
        })
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([AllowAny])
def api_google_auth_url(request):
    """
    Get the Google OAuth authorization URL for the frontend.
    """
    from allauth.socialaccount.models import SocialApp
    
    try:
        google_app = SocialApp.objects.get(provider='google')
        
        # Build the authorization URL
        redirect_uri = request.query_params.get(
            'redirect_uri', 
            f"{settings.FRONTEND_URL}/auth/callback"
        )
        
        scope = 'openid email profile'
        
        auth_url = (
            f"https://accounts.google.com/o/oauth2/v2/auth"
            f"?client_id={google_app.client_id}"
            f"&redirect_uri={redirect_uri}"
            f"&response_type=code"
            f"&scope={scope}"
            f"&access_type=offline"
            f"&prompt=consent"
        )
        
        return Response({
            'auth_url': auth_url,
            'client_id': google_app.client_id,
        })
        
    except SocialApp.DoesNotExist:
        return Response(
            {'error': 'Google OAuth not configured'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([AllowAny])
def api_verify_token(request):
    """Verify if a token is valid and return user data"""
    token_key = request.data.get('token')
    
    if not token_key:
        return Response(
            {'valid': False, 'error': 'Token required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        token = Token.objects.get(key=token_key)
        return Response({
            'valid': True,
            'user': UserSerializer(token.user).data,
        })
    except Token.DoesNotExist:
        return Response({
            'valid': False,
            'error': 'Invalid token',
        }, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['POST', 'GET'])
@permission_classes([AllowAny])
def api_get_token(request):
    """
    Get or create an auth token for the currently authenticated user (via session).
    This is used after Django allauth OAuth to get a token for the frontend.
    """
    # Check if user is authenticated via session
    if not request.user.is_authenticated:
        return Response(
            {'error': 'Not authenticated'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    # Get or create token for the user
    token, created = Token.objects.get_or_create(user=request.user)
    
    return Response({
        'token': token.key,
        'user': UserSerializer(request.user).data,
    })


# CSRF-exempt version for OAuth callback
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

@csrf_exempt
@api_view(['POST', 'GET'])
@permission_classes([AllowAny])
def api_get_token_no_csrf(request):
    """
    Get or create an auth token - CSRF exempt version for OAuth flow.
    """
    if not request.user.is_authenticated:
        return Response(
            {'error': 'Not authenticated'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    token, created = Token.objects.get_or_create(user=request.user)
    
    return Response({
        'token': token.key,
        'user': UserSerializer(request.user).data,
    })


# ===========================================
# TEMPLATE-BASED VIEWS (Original views)
# ===========================================

def signup_view(request):
    """User registration view"""
    if request.user.is_authenticated:
        return redirect('dashboard')
    
    if request.method == 'POST' and CustomUserCreationForm:
        form = CustomUserCreationForm(request.POST)
        if form.is_valid():
            user = form.save()
            UserProfile.objects.create(user=user)
            messages.success(request, _('Account created successfully! Please check your email to verify your account.'))
            return redirect('account_login')
        else:
            messages.error(request, _('Please correct the errors below.'))
    else:
        form = CustomUserCreationForm() if CustomUserCreationForm else None
    
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
    
    if request.method == 'POST' and UserProfileForm:
        form = UserProfileForm(request.POST, request.FILES, instance=profile)
        if form.is_valid():
            form.save()
            messages.success(request, _('Profile updated successfully!'))
            return redirect('profile')
        else:
            messages.error(request, _('Please correct the errors below.'))
    else:
        form = UserProfileForm(instance=profile) if UserProfileForm else None
    
    return render(request, 'accounts/profile_edit.html', {'form': form, 'profile': profile})


@login_required
def dashboard_view(request):
    """Main dashboard view"""
    context = {
        'user': request.user,
        'user_type': request.user.user_type,
    }
    
    if request.user.user_type == 'agency':
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
