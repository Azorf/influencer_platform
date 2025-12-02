from django import forms
from django.contrib.auth import get_user_model
from django.utils.translation import gettext_lazy as _
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


class AgencyTeamMemberForm(forms.ModelForm):
    """Form for adding team members to an agency"""
    
    email = forms.EmailField(
        widget=forms.EmailInput(attrs={
            'class': 'form-control',
            'placeholder': _('Team member email')
        }),
        help_text=_('Enter the email of the user you want to add to your team')
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