from django import forms
from django.contrib.auth.forms import UserCreationForm
from django.utils.translation import gettext_lazy as _
from .models import CustomUser, UserProfile


class CustomUserCreationForm(UserCreationForm):
    """Custom user registration form"""
    
    email = forms.EmailField(
        required=True,
        widget=forms.EmailInput(attrs={
            'class': 'form-control',
            'placeholder': _('Email address')
        })
    )
    user_type = forms.ChoiceField(
        choices=CustomUser.USER_TYPES,
        widget=forms.Select(attrs={'class': 'form-control'})
    )
    phone_number = forms.CharField(
        max_length=20,
        required=False,
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': _('Phone number (optional)')
        })
    )
    
    class Meta:
        model = CustomUser
        fields = ('username', 'email', 'user_type', 'phone_number', 'password1', 'password2')
        widgets = {
            'username': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': _('Username')
            }),
        }
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['password1'].widget.attrs.update({
            'class': 'form-control',
            'placeholder': _('Password')
        })
        self.fields['password2'].widget.attrs.update({
            'class': 'form-control',
            'placeholder': _('Confirm password')
        })
    
    def save(self, commit=True):
        user = super().save(commit=False)
        user.email = self.cleaned_data['email']
        user.user_type = self.cleaned_data['user_type']
        user.phone_number = self.cleaned_data['phone_number']
        if commit:
            user.save()
        return user


class UserProfileForm(forms.ModelForm):
    """User profile form"""
    
    class Meta:
        model = UserProfile
        fields = [
            'bio', 'avatar', 'location', 'website', 'date_of_birth',
            'instagram_url', 'youtube_url', 'tiktok_url', 'twitter_url'
        ]
        widgets = {
            'bio': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 4,
                'placeholder': _('Tell us about yourself...')
            }),
            'location': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': _('City, Country')
            }),
            'website': forms.URLInput(attrs={
                'class': 'form-control',
                'placeholder': _('https://yourwebsite.com')
            }),
            'date_of_birth': forms.DateInput(attrs={
                'class': 'form-control',
                'type': 'date'
            }),
            'instagram_url': forms.URLInput(attrs={
                'class': 'form-control',
                'placeholder': _('https://instagram.com/username')
            }),
            'youtube_url': forms.URLInput(attrs={
                'class': 'form-control',
                'placeholder': _('https://youtube.com/channel/...')
            }),
            'tiktok_url': forms.URLInput(attrs={
                'class': 'form-control',
                'placeholder': _('https://tiktok.com/@username')
            }),
            'twitter_url': forms.URLInput(attrs={
                'class': 'form-control',
                'placeholder': _('https://twitter.com/username')
            }),
            'avatar': forms.FileInput(attrs={
                'class': 'form-control',
                'accept': 'image/*'
            })
        }
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Make all fields optional
        for field in self.fields.values():
            field.required = False


class UserUpdateForm(forms.ModelForm):
    """Form for updating basic user information"""
    
    class Meta:
        model = CustomUser
        fields = ['first_name', 'last_name', 'email', 'phone_number']
        widgets = {
            'first_name': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': _('First name')
            }),
            'last_name': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': _('Last name')
            }),
            'email': forms.EmailInput(attrs={
                'class': 'form-control',
                'placeholder': _('Email address')
            }),
            'phone_number': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': _('Phone number')
            }),
        }