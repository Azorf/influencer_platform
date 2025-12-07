from django import forms
from django.utils.translation import gettext_lazy as _
from .models import Agency, AgencyTeamMember, TeamInvitation


class AgencyForm(forms.ModelForm):
    """Enhanced form for creating/editing both agencies and brands"""
    
    class Meta:
        model = Agency
        fields = [
            # Basic Information
            'name', 'display_name', 'description', 'organization_type',
            
            # Business Details
            'industry', 'organization_size', 'founded_year', 'monthly_budget_range',
            
            # Contact Information
            'email', 'phone', 'website',
            
            # Address
            'address_line_1', 'address_line_2', 'city', 'state', 'country', 'postal_code',
            
            # Specialties & Branding
            'specialties', 'target_demographics', 'brand_colors', 'logo',
            
            # Social Media
            'instagram_url', 'linkedin_url', 'twitter_url', 'facebook_url', 'youtube_url', 'tiktok_url',
        ]
        
        widgets = {
            # Basic Information
            'name': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': _('Your organization name')
            }),
            'display_name': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': _('Public display name (optional)')
            }),
            'description': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 4,
                'placeholder': _('Brief description of your organization...')
            }),
            'organization_type': forms.Select(attrs={
                'class': 'form-control'
            }),
            
            # Business Details
            'industry': forms.Select(attrs={
                'class': 'form-control'
            }),
            'organization_size': forms.Select(attrs={
                'class': 'form-control'
            }),
            'founded_year': forms.NumberInput(attrs={
                'class': 'form-control',
                'placeholder': _('Year founded'),
                'min': 1900,
                'max': 2024
            }),
            'monthly_budget_range': forms.Select(attrs={
                'class': 'form-control'
            }),
            
            # Contact Information
            'email': forms.EmailInput(attrs={
                'class': 'form-control',
                'placeholder': _('contact@yourcompany.com')
            }),
            'phone': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': _('+212 XXX XXX XXX')
            }),
            'website': forms.URLInput(attrs={
                'class': 'form-control',
                'placeholder': _('https://yourwebsite.com')
            }),
            
            # Address
            'address_line_1': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': _('Street address')
            }),
            'address_line_2': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': _('Apartment, suite, etc. (optional)')
            }),
            'city': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': _('City')
            }),
            'state': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': _('State/Province')
            }),
            'country': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': _('Country')
            }),
            'postal_code': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': _('Postal code')
            }),
            
            # Specialties & Branding
            'specialties': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 3,
                'placeholder': _('E.g., Fashion, Beauty, Tech, Food & Beverage (comma-separated)')
            }),
            'target_demographics': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 3,
                'placeholder': _('E.g., Women 18-35, Tech professionals, Parents...')
            }),
            'brand_colors': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': _('#000000, #ffffff (hex colors)')
            }),
            'logo': forms.FileInput(attrs={
                'class': 'form-control',
                'accept': 'image/*'
            }),
            
            # Social Media
            'instagram_url': forms.URLInput(attrs={
                'class': 'form-control',
                'placeholder': _('https://instagram.com/yourcompany')
            }),
            'linkedin_url': forms.URLInput(attrs={
                'class': 'form-control',
                'placeholder': _('https://linkedin.com/company/yourcompany')
            }),
            'twitter_url': forms.URLInput(attrs={
                'class': 'form-control',
                'placeholder': _('https://twitter.com/yourcompany')
            }),
            'facebook_url': forms.URLInput(attrs={
                'class': 'form-control',
                'placeholder': _('https://facebook.com/yourcompany')
            }),
            'youtube_url': forms.URLInput(attrs={
                'class': 'form-control',
                'placeholder': _('https://youtube.com/c/yourcompany')
            }),
            'tiktok_url': forms.URLInput(attrs={
                'class': 'form-control',
                'placeholder': _('https://tiktok.com/@yourcompany')
            }),
        }
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        
        # Make optional fields clearly optional
        optional_fields = [
            'display_name', 'description', 'industry', 'organization_size', 
            'founded_year', 'monthly_budget_range', 'phone', 'website',
            'address_line_1', 'address_line_2', 'city', 'state', 'postal_code',
            'specialties', 'target_demographics', 'brand_colors', 'logo',
            'instagram_url', 'linkedin_url', 'twitter_url', 'facebook_url', 
            'youtube_url', 'tiktok_url'
        ]
        
        for field_name in optional_fields:
            if field_name in self.fields:
                self.fields[field_name].required = False
        
        # Dynamic help text based on organization type
        self.fields['specialties'].help_text = _(
            'For agencies: Your service specialties (e.g., Influencer Marketing, Content Creation)<br>'
            'For brands: Your product categories (e.g., Fashion, Electronics, Food)'
        )
    
    def clean_brand_colors(self):
        """Validate hex color codes"""
        colors = self.cleaned_data.get('brand_colors')
        if colors:
            # Basic validation for hex colors
            color_list = [c.strip() for c in colors.split(',')]
            for color in color_list:
                if color and not (color.startswith('#') and len(color) == 7):
                    raise forms.ValidationError(_('Please use valid hex color codes (e.g., #000000)'))
        return colors


class AgencySetupForm(AgencyForm):
    """Simplified form for initial agency setup"""
    
    class Meta(AgencyForm.Meta):
        fields = [
            'name', 'organization_type', 'industry', 'organization_size',
            'country', 'specialties', 'monthly_budget_range'
        ]
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        
        # Make these required for setup
        required_fields = ['name', 'organization_type', 'country']
        for field_name in required_fields:
            if field_name in self.fields:
                self.fields[field_name].required = True
        
        # Add helpful labels
        self.fields['name'].label = _('Organization Name')
        self.fields['organization_type'].label = _('I am setting up a...')
        self.fields['specialties'].label = _('Areas of Focus')
        
        # Set default values
        self.fields['country'].initial = 'Morocco'


class EnhancedTeamMemberForm(forms.ModelForm):
    """Enhanced form for team member management"""
    
    class Meta:
        model = AgencyTeamMember
        fields = ['user', 'role', 'permissions', 'can_invite_members', 'can_manage_billing']
        widgets = {
            'user': forms.Select(attrs={
                'class': 'form-control'
            }),
            'role': forms.Select(attrs={
                'class': 'form-control'
            }),
            'permissions': forms.Select(attrs={
                'class': 'form-control'
            }),
            'can_invite_members': forms.CheckboxInput(attrs={
                'class': 'form-check-input'
            }),
            'can_manage_billing': forms.CheckboxInput(attrs={
                'class': 'form-check-input'
            }),
        }
    
    def __init__(self, *args, **kwargs):
        agency = kwargs.pop('agency', None)
        super().__init__(*args, **kwargs)
        
        if agency:
            # Exclude users already in the team
            existing_members = agency.team_members.values_list('user', flat=True)
            from django.contrib.auth import get_user_model
            User = get_user_model()
            self.fields['user'].queryset = User.objects.exclude(id__in=existing_members)
        
        # Add help text for permissions
        self.fields['permissions'].help_text = _(
            'Determines what this team member can access and modify'
        )


class TeamInvitationForm(forms.ModelForm):
    """Enhanced form for team invitations"""
    
    class Meta:
        model = TeamInvitation
        fields = ['email', 'role', 'permissions', 'message']
        widgets = {
            'email': forms.EmailInput(attrs={
                'class': 'form-control',
                'placeholder': _('colleague@example.com')
            }),
            'role': forms.Select(attrs={
                'class': 'form-control'
            }),
            'permissions': forms.Select(attrs={
                'class': 'form-control'
            }),
            'message': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 4,
                'placeholder': _('Optional personal message to include with the invitation...')
            }),
        }
    
    def __init__(self, *args, **kwargs):
        agency = kwargs.pop('agency', None)
        super().__init__(*args, **kwargs)
        
        # Make message optional
        self.fields['message'].required = False
        
        # Add helpful labels and help text
        self.fields['role'].help_text = _('The role this person will have in your organization')
        self.fields['permissions'].help_text = _('What they can access and modify')
        
        if agency:
            # Check for existing invitations to this email
            existing_invites = agency.invitations.filter(status='pending').values_list('email', flat=True)
            self.existing_invites = list(existing_invites)
    
    def clean_email(self):
        """Validate email and check for existing invitations"""
        email = self.cleaned_data.get('email')
        if hasattr(self, 'existing_invites') and email in self.existing_invites:
            raise forms.ValidationError(_('There is already a pending invitation for this email address.'))
        return email


class AgencySearchForm(forms.Form):
    """Form for searching and filtering agencies/brands in directory"""
    
    ORGANIZATION_TYPE_CHOICES = [('', _('All Organizations'))] + list(Agency.ORGANIZATION_TYPES)
    INDUSTRY_CHOICES = [('', _('All Industries'))] + list(Agency.INDUSTRIES)
    SIZE_CHOICES = [('', _('All Sizes'))] + list(Agency.ORGANIZATION_SIZES)
    
    search = forms.CharField(
        required=False,
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': _('Search organizations...')
        })
    )
    
    organization_type = forms.ChoiceField(
        choices=ORGANIZATION_TYPE_CHOICES,
        required=False,
        widget=forms.Select(attrs={
            'class': 'form-control'
        })
    )
    
    industry = forms.ChoiceField(
        choices=INDUSTRY_CHOICES,
        required=False,
        widget=forms.Select(attrs={
            'class': 'form-control'
        })
    )
    
    organization_size = forms.ChoiceField(
        choices=SIZE_CHOICES,
        required=False,
        widget=forms.Select(attrs={
            'class': 'form-control'
        })
    )
    
    country = forms.CharField(
        required=False,
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': _('Country')
        })
    )
    
    verified_only = forms.BooleanField(
        required=False,
        widget=forms.CheckboxInput(attrs={
            'class': 'form-check-input'
        }),
        label=_('Verified organizations only')
    )


class AgencyBrandingForm(forms.ModelForm):
    """Separate form for branding and visual elements"""
    
    class Meta:
        model = Agency
        fields = [
            'display_name', 'logo', 'brand_colors', 
            'instagram_url', 'linkedin_url', 'twitter_url', 
            'facebook_url', 'youtube_url', 'tiktok_url'
        ]
        widgets = {
            'display_name': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': _('How your organization appears publicly')
            }),
            'logo': forms.FileInput(attrs={
                'class': 'form-control',
                'accept': 'image/*'
            }),
            'brand_colors': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': _('#primary, #secondary, #accent')
            }),
            'instagram_url': forms.URLInput(attrs={
                'class': 'form-control',
                'placeholder': _('https://instagram.com/yourcompany')
            }),
            'linkedin_url': forms.URLInput(attrs={
                'class': 'form-control',
                'placeholder': _('https://linkedin.com/company/yourcompany')
            }),
            'twitter_url': forms.URLInput(attrs={
                'class': 'form-control',
                'placeholder': _('https://twitter.com/yourcompany')
            }),
            'facebook_url': forms.URLInput(attrs={
                'class': 'form-control',
                'placeholder': _('https://facebook.com/yourcompany')
            }),
            'youtube_url': forms.URLInput(attrs={
                'class': 'form-control',
                'placeholder': _('https://youtube.com/c/yourcompany')
            }),
            'tiktok_url': forms.URLInput(attrs={
                'class': 'form-control',
                'placeholder': _('https://tiktok.com/@yourcompany')
            }),
        }
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        
        # All fields are optional for branding
        for field in self.fields.values():
            field.required = False


# Legacy form for backward compatibility
class AgencyTeamMemberForm(EnhancedTeamMemberForm):
    """Backward compatibility alias"""
    pass