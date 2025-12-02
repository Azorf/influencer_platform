from django import forms
from django.contrib.auth import get_user_model
from django.utils.translation import gettext_lazy as _
from django.core.validators import validate_email
from .models import Agency, AgencyTeamMember

User = get_user_model()


class AgencyForm(forms.ModelForm):
    """Form for creating and editing agencies"""
    
    class Meta:
        model = Agency
        fields = [
            'name', 'description', 'logo', 'phone', 'website',
            'address_line1', 'address_line2', 'city', 'state', 'postal_code', 'country',
            'agency_size', 'founded_year', 'specialties', 'verification_documents'
        ]
        widgets = {
            'name': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': _('Agency Name')
            }),
            'description': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 4,
                'placeholder': _('Describe your agency...')
            }),
            'phone': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': _('Phone Number')
            }),
            'website': forms.URLInput(attrs={
                'class': 'form-control',
                'placeholder': _('https://yourwebsite.com')
            }),
            'address_line1': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': _('Street Address')
            }),
            'address_line2': forms.TextInput(attrs={
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
            'postal_code': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': _('Postal Code')
            }),
            'country': forms.TextInput(attrs={
                'class': 'form-control',
                'value': 'Morocco'
            }),
            'agency_size': forms.Select(attrs={
                'class': 'form-control'
            }),
            'founded_year': forms.NumberInput(attrs={
                'class': 'form-control',
                'placeholder': _('Year Founded'),
                'min': 1900,
                'max': 2030
            }),
            'specialties': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': _('Fashion, Tech, Food, Beauty, etc.')
            }),
            'logo': forms.FileInput(attrs={
                'class': 'form-control',
                'accept': 'image/*'
            }),
            'verification_documents': forms.FileInput(attrs={
                'class': 'form-control',
                'accept': '.pdf,.doc,.docx,.jpg,.jpeg,.png'
            })
        }
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Make some fields optional
        optional_fields = [
            'description', 'logo', 'phone', 'website', 'address_line2',
            'state', 'postal_code', 'founded_year', 'specialties', 'verification_documents'
        ]
        for field in optional_fields:
            if field in self.fields:
                self.fields[field].required = False


class TeamInvitationForm(forms.Form):
    """Form for inviting team members via email"""
    
    ROLE_CHOICES = [
        ('manager', _('Manager - Can create and manage campaigns')),
        ('account_manager', _('Account Manager - Client relationship management')),
        ('strategist', _('Strategist - Campaign planning and strategy')),
        ('creative', _('Creative - Content review and approval')),
        ('analyst', _('Analyst - Analytics and reporting')),
    ]
    
    email = forms.EmailField(
        widget=forms.EmailInput(attrs={
            'class': 'form-control',
            'placeholder': _('Enter email address'),
            'autocomplete': 'off'
        }),
        help_text=_('We\'ll send an invitation to this email address')
    )
    
    role = forms.ChoiceField(
        choices=ROLE_CHOICES,
        widget=forms.Select(attrs={
            'class': 'form-control'
        }),
        help_text=_('Select the role for this team member')
    )
    
    message = forms.CharField(
        required=False,
        widget=forms.Textarea(attrs={
            'class': 'form-control',
            'rows': 3,
            'placeholder': _('Optional personal message to include with the invitation...')
        }),
        help_text=_('Add a personal message (optional)')
    )
    
    def __init__(self, agency, *args, **kwargs):
        self.agency = agency
        super().__init__(*args, **kwargs)
    
    def clean_email(self):
        email = self.cleaned_data['email'].lower()
        
        # Check if email is already a team member
        if AgencyTeamMember.objects.filter(
            agency=self.agency, 
            user__email=email, 
            is_active=True
        ).exists():
            raise forms.ValidationError(
                _('This email address is already a member of your agency.')
            )
        
        # Check if there's already a pending invitation
        from .models import TeamInvitation
        if TeamInvitation.objects.filter(
            agency=self.agency,
            email=email,
            status='pending'
        ).exists():
            raise forms.ValidationError(
                _('There is already a pending invitation for this email address.')
            )
        
        return email


class AgencyTeamMemberForm(forms.ModelForm):
    """Form for adding existing users to agency team"""
    
    email = forms.EmailField(
        widget=forms.EmailInput(attrs={
            'class': 'form-control',
            'placeholder': _('Team member email')
        }),
        help_text=_('Enter the email of an existing user')
    )
    
    class Meta:
        model = AgencyTeamMember
        fields = ['role']
        widgets = {
            'role': forms.Select(attrs={
                'class': 'form-control'
            })
        }
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['role'].required = True
        
        # Exclude 'owner' role from choices (only system can assign this)
        role_choices = [choice for choice in AgencyTeamMember.ROLES if choice[0] != 'owner']
        self.fields['role'].choices = role_choices
    
    def clean_email(self):
        email = self.cleaned_data['email']
        try:
            user = User.objects.get(email=email)
            return user
        except User.DoesNotExist:
            raise forms.ValidationError(_('No user found with this email address.'))
    
    def save(self, commit=True):
        team_member = super().save(commit=False)
        team_member.user = self.cleaned_data['email']  # This is actually the user object now
        if commit:
            team_member.save()
        return team_member


class AgencySearchForm(forms.Form):
    """Form for searching agencies"""
    
    search = forms.CharField(
        max_length=200,
        required=False,
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': _('Search agencies by name, specialties, or location...')
        })
    )
    
    size = forms.ChoiceField(
        choices=[('', _('All Sizes'))] + list(Agency.AGENCY_SIZES),
        required=False,
        widget=forms.Select(attrs={
            'class': 'form-control'
        })
    )
    
    country = forms.CharField(
        max_length=100,
        required=False,
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': _('Country')
        })
    )


class AgencyOnboardingForm(forms.ModelForm):
    """Simplified form for initial agency setup after signup"""
    
    class Meta:
        model = Agency
        fields = ['name', 'city', 'country', 'specialties']
        widgets = {
            'name': forms.TextInput(attrs={
                'class': 'form-control form-control-lg',
                'placeholder': _('What\'s your agency name?')
            }),
            'city': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': _('Which city are you based in?')
            }),
            'country': forms.TextInput(attrs={
                'class': 'form-control',
                'value': 'Morocco'
            }),
            'specialties': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': _('What industries do you specialize in? (e.g., Fashion, Tech, Beauty)')
            }),
        }
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['name'].help_text = _('You can change this later in settings')
        self.fields['specialties'].help_text = _('Separate multiple specialties with commas')
        self.fields['specialties'].required = False