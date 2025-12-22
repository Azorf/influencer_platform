from django.conf import settings
from allauth.account.adapter import DefaultAccountAdapter
from allauth.socialaccount.adapter import DefaultSocialAccountAdapter


class CustomAccountAdapter(DefaultAccountAdapter):
    """
    Custom account adapter to handle redirects to the Next.js frontend
    """
    
    def get_login_redirect_url(self, request):
        """
        Return the URL to redirect to after a successful login.
        """
        # If request came from the API or has a specific next parameter pointing to frontend
        next_url = request.GET.get('next') or request.POST.get('next')
        
        if next_url and next_url.startswith(settings.FRONTEND_URL):
            return next_url
        
        # Default: redirect to frontend dashboard
        return f"{settings.FRONTEND_URL}/auth/callback"
    
    def get_logout_redirect_url(self, request):
        """
        Return the URL to redirect to after logging out.
        """
        return f"{settings.FRONTEND_URL}/"
    
    def get_signup_redirect_url(self, request):
        """
        Return the URL to redirect to after a successful signup.
        """
        return f"{settings.FRONTEND_URL}/auth/callback"


class CustomSocialAccountAdapter(DefaultSocialAccountAdapter):
    """
    Custom social account adapter for handling OAuth responses
    """
    
    def get_connect_redirect_url(self, request, socialaccount):
        """
        Return the URL to redirect to after successfully connecting a social account.
        """
        return f"{settings.FRONTEND_URL}/dashboard/settings"
    
    def authentication_error(
        self,
        request,
        provider_id,
        error=None,
        exception=None,
        extra_context=None
    ):
        """
        Handle authentication errors by redirecting to frontend with error info
        """
        error_message = str(error) if error else 'authentication_failed'
        return f"{settings.FRONTEND_URL}/login?error={error_message}"
    
    def pre_social_login(self, request, sociallogin):
        """
        Called after a user successfully authenticates via a social provider,
        but before the login is actually processed.
        
        You can use this to:
        - Link social accounts to existing users by email
        - Customize user data before saving
        """
        # If user exists with this email, connect the accounts
        if sociallogin.is_existing:
            return
        
        # Check if a user with this email already exists
        try:
            from .models import CustomUser
            email = sociallogin.account.extra_data.get('email')
            if email:
                existing_user = CustomUser.objects.get(email=email)
                sociallogin.connect(request, existing_user)
        except CustomUser.DoesNotExist:
            pass
    
    def save_user(self, request, sociallogin, form=None):
        """
        Save user with additional data from social provider
        """
        user = super().save_user(request, sociallogin, form)
        
        # Set user type to agency by default
        if not user.user_type:
            user.user_type = 'agency'
            user.save()
        
        return user
