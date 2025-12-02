from django import forms
from django.utils.translation import gettext_lazy as _
from .models import (
    Influencer, SocialMediaAccount, InfluencerTag, SponsoredPost, InfluencerDataImport
)


class InfluencerForm(forms.ModelForm):
    """Enhanced form for creating and editing influencer profiles"""
    
    class Meta:
        model = Influencer
        fields = [
            'full_name', 'username', 'email', 'bio', 'avatar',
            'age', 'gender', 'location', 'language',
            'primary_category', 'secondary_categories',
            'phone_number', 'website', 'is_influencer', 'country'
        ]
        widgets = {
            'full_name': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': _('Full Name')
            }),
            'username': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': _('Username (without @)')
            }),
            'email': forms.EmailInput(attrs={
                'class': 'form-control',
                'placeholder': _('Email Address')
            }),
            'bio': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 4,
                'placeholder': _('Tell us about yourself...')
            }),
            'age': forms.NumberInput(attrs={
                'class': 'form-control',
                'min': 13,
                'max': 120
            }),
            'gender': forms.Select(attrs={
                'class': 'form-control'
            }),
            'location': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': _('City, Country')
            }),
            'language': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': _('Primary Language')
            }),
            'primary_category': forms.Select(attrs={
                'class': 'form-control'
            }),
            'secondary_categories': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': _('Fashion, Tech, Food (comma-separated)')
            }),
            'phone_number': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': _('Phone Number')
            }),
            'website': forms.URLInput(attrs={
                'class': 'form-control',
                'placeholder': _('https://yourwebsite.com')
            }),
            'country': forms.TextInput(attrs={
                'class': 'form-control',
                'value': 'Morocco'
            }),
            'is_influencer': forms.CheckboxInput(attrs={
                'class': 'form-check-input'
            }),
            'avatar': forms.FileInput(attrs={
                'class': 'form-control',
                'accept': 'image/*'
            })
        }
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Make some fields optional
        optional_fields = [
            'email', 'bio', 'avatar', 'age', 'gender', 'location',
            'secondary_categories', 'phone_number', 'website'
        ]
        for field in optional_fields:
            if field in self.fields:
                self.fields[field].required = False


class SocialMediaAccountForm(forms.ModelForm):
    """Enhanced form for adding social media accounts"""
    
    class Meta:
        model = SocialMediaAccount
        fields = [
            'platform', 'username', 'url', 'followers_count', 'following_count',
            'posts_count', 'engagement_rate', 'avg_likes', 'avg_comments',
            'avg_shares', 'avg_views', 'followers_14d_ago', 'followers_growth_14d',
            'followers_growth_rate_14d', 'posts_count_14d', 'is_verified'
        ]
        widgets = {
            'platform': forms.Select(attrs={
                'class': 'form-control'
            }),
            'username': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': _('Username (without @)')
            }),
            'url': forms.URLInput(attrs={
                'class': 'form-control',
                'placeholder': _('Full URL to your profile')
            }),
            'followers_count': forms.NumberInput(attrs={
                'class': 'form-control',
                'min': 0,
                'placeholder': _('Number of followers')
            }),
            'following_count': forms.NumberInput(attrs={
                'class': 'form-control',
                'min': 0,
                'placeholder': _('Following count')
            }),
            'posts_count': forms.NumberInput(attrs={
                'class': 'form-control',
                'min': 0,
                'placeholder': _('Total posts')
            }),
            'engagement_rate': forms.NumberInput(attrs={
                'class': 'form-control',
                'min': 0,
                'max': 100,
                'step': 0.01,
                'placeholder': _('Engagement rate (%)')
            }),
            'avg_views': forms.NumberInput(attrs={
                'class': 'form-control',
                'placeholder': _('Average views')
            }),
            'avg_likes': forms.NumberInput(attrs={
                'class': 'form-control',
                'placeholder': _('Average likes')
            }),
            'avg_comments': forms.NumberInput(attrs={
                'class': 'form-control',
                'placeholder': _('Average comments')
            }),
            'avg_shares': forms.NumberInput(attrs={
                'class': 'form-control',
                'placeholder': _('Average shares')
            }),
            'followers_14d_ago': forms.NumberInput(attrs={
                'class': 'form-control',
                'placeholder': _('Followers 14 days ago')
            }),
            'followers_growth_14d': forms.NumberInput(attrs={
                'class': 'form-control',
                'placeholder': _('Growth in 14 days')
            }),
            'followers_growth_rate_14d': forms.NumberInput(attrs={
                'class': 'form-control',
                'step': 0.01,
                'placeholder': _('Growth rate %')
            }),
            'posts_count_14d': forms.NumberInput(attrs={
                'class': 'form-control',
                'placeholder': _('Posts in last 14 days')
            }),
            'is_verified': forms.CheckboxInput(attrs={
                'class': 'form-check-input'
            })
        }
    
    def clean_url(self):
        url = self.cleaned_data['url']
        platform = self.cleaned_data.get('platform')
        
        # Basic URL validation per platform
        platform_domains = {
            'instagram': 'instagram.com',
            'youtube': 'youtube.com',
            'tiktok': 'tiktok.com',
            'twitter': 'twitter.com',
            'facebook': 'facebook.com',
            'linkedin': 'linkedin.com',
        }
        
        if platform in platform_domains:
            if platform_domains[platform] not in url.lower():
                raise forms.ValidationError(
                    _('URL must be a valid %(platform)s profile URL') % {'platform': platform.title()}
                )
        
        return url

class SponsoredPostForm(forms.ModelForm):
    """Form for sponsored content details"""
    
    class Meta:
        model = SponsoredPost
        fields = [
            'brand_name', 'brand_handle', 'campaign_type', 'disclosure_present',
            'disclosure_text', 'product_mentions', 'estimated_cost',
            'estimated_reach', 'manually_verified', 'notes'
        ]
        widgets = {
            'brand_name': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': _('Brand Name')
            }),
            'brand_handle': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': _('@brandhandle')
            }),
            'campaign_type': forms.Select(attrs={
                'class': 'form-control'
            }),
            'disclosure_present': forms.CheckboxInput(attrs={
                'class': 'form-check-input'
            }),
            'disclosure_text': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': _('#ad, #sponsored, etc.')
            }),
            'product_mentions': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 2,
                'placeholder': _('Product mentions...')
            }),
            'estimated_cost': forms.NumberInput(attrs={
                'class': 'form-control',
                'step': 0.01,
                'placeholder': _('Estimated cost')
            }),
            'estimated_reach': forms.NumberInput(attrs={
                'class': 'form-control',
                'placeholder': _('Estimated reach')
            }),
            'manually_verified': forms.CheckboxInput(attrs={
                'class': 'form-check-input'
            }),
            'notes': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 2,
                'placeholder': _('Additional notes...')
            })
        }


class BulkDataImportForm(forms.Form):
    """Form for bulk data import from CSV/Excel"""
    
    IMPORT_TYPES = (
        ('social_blade', _('Social Blade Data')),
        ('posts_data', _('Posts Performance Data')),
        ('sponsored_content', _('Sponsored Content Data')),
    )
    
    import_type = forms.ChoiceField(
        choices=IMPORT_TYPES,
        widget=forms.Select(attrs={
            'class': 'form-control'
        })
    )
    
    data_file = forms.FileField(
        widget=forms.FileInput(attrs={
            'class': 'form-control',
            'accept': '.csv,.xlsx,.xls'
        }),
        help_text=_('Upload CSV or Excel file with influencer data')
    )
    
    country = forms.CharField(
        max_length=100,
        initial='Morocco',
        widget=forms.TextInput(attrs={
            'class': 'form-control'
        })
    )
    
    update_existing = forms.BooleanField(
        required=False,
        initial=True,
        widget=forms.CheckboxInput(attrs={
            'class': 'form-check-input'
        }),
        help_text=_('Update existing records if username matches')
    )
    
    dry_run = forms.BooleanField(
        required=False,
        widget=forms.CheckboxInput(attrs={
            'class': 'form-check-input'
        }),
        help_text=_('Preview import without saving data')
    )
    
    def clean_data_file(self):
        file = self.cleaned_data['data_file']
        if file:
            # Validate file extension
            name = file.name.lower()
            if not (name.endswith('.csv') or name.endswith('.xlsx') or name.endswith('.xls')):
                raise forms.ValidationError(_('File must be CSV or Excel format'))
            
            # Validate file size (max 10MB)
            if file.size > 10 * 1024 * 1024:
                raise forms.ValidationError(_('File size must be less than 10MB'))
        
        return file


class InfluencerSearchForm(forms.Form):
    """Enhanced search form for influencers with new filters"""
    
    search = forms.CharField(
        max_length=200,
        required=False,
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': _('Search by name, username, or bio...')
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
    
    category = forms.ChoiceField(
        choices=[('', _('All Categories'))] + list(Influencer.CATEGORY_CHOICES),
        required=False,
        widget=forms.Select(attrs={
            'class': 'form-control'
        })
    )
    
    follower_tier = forms.ChoiceField(
        choices=[
            ('', _('All Tiers')),
            ('nano', _('Nano (< 1K)')),
            ('micro', _('Micro (1K - 10K)')),
            ('mid', _('Mid (10K - 100K)')),
            ('macro', _('Macro (100K - 1M)')),
            ('mega', _('Mega (> 1M)')),
        ],
        required=False,
        widget=forms.Select(attrs={
            'class': 'form-control'
        })
    )
    
    location = forms.CharField(
        max_length=200,
        required=False,
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': _('Location')
        })
    )
    
    min_followers = forms.IntegerField(
        required=False,
        widget=forms.NumberInput(attrs={
            'class': 'form-control',
            'placeholder': _('Minimum followers'),
            'min': 0
        })
    )
    
    max_followers = forms.IntegerField(
        required=False,
        widget=forms.NumberInput(attrs={
            'class': 'form-control',
            'placeholder': _('Maximum followers'),
            'min': 0
        })
    )
    
    min_engagement = forms.FloatField(
        required=False,
        widget=forms.NumberInput(attrs={
            'class': 'form-control',
            'placeholder': _('Min engagement rate %'),
            'min': 0,
            'max': 100,
            'step': 0.1
        })
    )
    
    is_verified = forms.BooleanField(
        required=False,
        widget=forms.CheckboxInput(attrs={
            'class': 'form-check-input'
        }),
        label=_('Verified accounts only')
    )
    
    is_influencer = forms.BooleanField(
        required=False,
        initial=True,
        widget=forms.CheckboxInput(attrs={
            'class': 'form-check-input'
        }),
        label=_('Confirmed influencers only')
    )
    
    has_sponsored_content = forms.BooleanField(
        required=False,
        widget=forms.CheckboxInput(attrs={
            'class': 'form-check-input'
        }),
        label=_('Has sponsored content')
    )
    
    gender = forms.ChoiceField(
        choices=[('', _('Any Gender'))] + list(Influencer.GENDER_CHOICES),
        required=False,
        widget=forms.Select(attrs={
            'class': 'form-control'
        })
    )
    
    language = forms.CharField(
        max_length=100,
        required=False,
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': _('Language')
        })
    )
    
    age_min = forms.IntegerField(
        required=False,
        widget=forms.NumberInput(attrs={
            'class': 'form-control',
            'placeholder': _('Min age'),
            'min': 13,
            'max': 120
        })
    )
    
    age_max = forms.IntegerField(
        required=False,
        widget=forms.NumberInput(attrs={
            'class': 'form-control',
            'placeholder': _('Max age'),
            'min': 13,
            'max': 120
        })
    )


class InfluencerTagForm(forms.ModelForm):
    """Form for creating influencer tags"""
    
    class Meta:
        model = InfluencerTag
        fields = ['name', 'description', 'color']
        widgets = {
            'name': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': _('Tag name')
            }),
            'description': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 3,
                'placeholder': _('Tag description (optional)')
            }),
            'color': forms.TextInput(attrs={
                'class': 'form-control',
                'type': 'color',
                'title': _('Choose tag color')
            })
        }
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['description'].required = False