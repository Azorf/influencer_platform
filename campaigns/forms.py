from django import forms
from django.utils.translation import gettext_lazy as _
from django.core.exceptions import ValidationError
from .models import Campaign, InfluencerCollaboration, CampaignContent
from influencers.models import Influencer


class CampaignForm(forms.ModelForm):
    """Form for creating and editing campaigns"""
    
    class Meta:
        model = Campaign
        fields = [
            'name', 'description', 'campaign_type', 'brand_name', 'product_name',
            'target_audience', 'campaign_objectives', 'total_budget', 'budget_currency',
            'start_date', 'end_date', 'content_guidelines', 'hashtags', 'mentions',
            'brief_document', 'brand_assets', 'status'
        ]
        widgets = {
            'name': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': _('Campaign Name')
            }),
            'description': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 4,
                'placeholder': _('Describe your campaign...')
            }),
            'campaign_type': forms.Select(attrs={
                'class': 'form-control'
            }),
            'brand_name': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': _('Brand Name')
            }),
            'product_name': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': _('Product Name (optional)')
            }),
            'target_audience': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 3,
                'placeholder': _('Describe your target audience...')
            }),
            'campaign_objectives': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 3,
                'placeholder': _('What are you trying to achieve?')
            }),
            'total_budget': forms.NumberInput(attrs={
                'class': 'form-control',
                'min': 0,
                'step': 0.01,
                'placeholder': _('Total Budget')
            }),
            'budget_currency': forms.Select(attrs={
                'class': 'form-control'
            }, choices=[
                ('MAD', 'MAD - Moroccan Dirham'),
                ('EUR', 'EUR - Euro'),
                ('USD', 'USD - US Dollar'),
            ]),
            'start_date': forms.DateInput(attrs={
                'class': 'form-control',
                'type': 'date'
            }),
            'end_date': forms.DateInput(attrs={
                'class': 'form-control',
                'type': 'date'
            }),
            'content_guidelines': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 4,
                'placeholder': _('Content guidelines and requirements...')
            }),
            'hashtags': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': _('#hashtag1 #hashtag2 #hashtag3')
            }),
            'mentions': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': _('@mention1 @mention2')
            }),
            'status': forms.Select(attrs={
                'class': 'form-control'
            }),
            'brief_document': forms.FileInput(attrs={
                'class': 'form-control',
                'accept': '.pdf,.doc,.docx'
            }),
            'brand_assets': forms.FileInput(attrs={
                'class': 'form-control',
                'accept': '.zip,.rar,.pdf'
            })
        }
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Make some fields optional
        optional_fields = [
            'description', 'product_name', 'content_guidelines', 
            'hashtags', 'mentions', 'brief_document', 'brand_assets'
        ]
        for field in optional_fields:
            if field in self.fields:
                self.fields[field].required = False
    
    def clean(self):
        cleaned_data = super().clean()
        start_date = cleaned_data.get('start_date')
        end_date = cleaned_data.get('end_date')
        
        if start_date and end_date:
            if end_date <= start_date:
                raise ValidationError(_('End date must be after start date.'))
        
        return cleaned_data


class InfluencerCollaborationForm(forms.ModelForm):
    """Form for creating influencer collaborations"""
    
    influencer = forms.ModelChoiceField(
        queryset=Influencer.objects.filter(is_active=True),
        widget=forms.Select(attrs={
            'class': 'form-control'
        }),
        empty_label=_('Select an influencer')
    )
    
    class Meta:
        model = InfluencerCollaboration
        fields = [
            'influencer', 'content_type', 'deliverables_count', 'agreed_rate',
            'currency', 'deadline', 'specific_requirements'
        ]
        widgets = {
            'content_type': forms.Select(attrs={
                'class': 'form-control'
            }),
            'deliverables_count': forms.NumberInput(attrs={
                'class': 'form-control',
                'min': 1,
                'placeholder': _('Number of posts/videos')
            }),
            'agreed_rate': forms.NumberInput(attrs={
                'class': 'form-control',
                'min': 0,
                'step': 0.01,
                'placeholder': _('Agreed rate')
            }),
            'currency': forms.Select(attrs={
                'class': 'form-control'
            }, choices=[
                ('MAD', 'MAD'),
                ('EUR', 'EUR'),
                ('USD', 'USD'),
            ]),
            'deadline': forms.DateInput(attrs={
                'class': 'form-control',
                'type': 'date'
            }),
            'specific_requirements': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 3,
                'placeholder': _('Specific requirements for this collaboration...')
            })
        }
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['specific_requirements'].required = False
        
        # Customize the influencer display
        self.fields['influencer'].queryset = Influencer.objects.filter(
            is_active=True
        ).order_by('full_name')


class CampaignContentForm(forms.ModelForm):
    """Form for submitting campaign content"""
    
    class Meta:
        model = CampaignContent
        fields = ['title', 'caption', 'image', 'video', 'post_url']
        widgets = {
            'title': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': _('Content title (optional)')
            }),
            'caption': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 4,
                'placeholder': _('Post caption...')
            }),
            'image': forms.FileInput(attrs={
                'class': 'form-control',
                'accept': 'image/*'
            }),
            'video': forms.FileInput(attrs={
                'class': 'form-control',
                'accept': 'video/*'
            }),
            'post_url': forms.URLInput(attrs={
                'class': 'form-control',
                'placeholder': _('https://instagram.com/p/...')
            })
        }
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # All fields are optional as content can be submitted in different ways
        for field in self.fields.values():
            field.required = False
    
    def clean(self):
        cleaned_data = super().clean()
        image = cleaned_data.get('image')
        video = cleaned_data.get('video')
        post_url = cleaned_data.get('post_url')
        
        # At least one content source must be provided
        if not any([image, video, post_url]):
            raise ValidationError(
                _('Please provide at least one form of content: image, video, or post URL.')
            )
        
        return cleaned_data


class CampaignSearchForm(forms.Form):
    """Form for searching campaigns"""
    
    search = forms.CharField(
        max_length=200,
        required=False,
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': _('Search campaigns...')
        })
    )
    
    status = forms.ChoiceField(
        choices=[('', _('All Statuses'))] + list(Campaign.STATUS_CHOICES),
        required=False,
        widget=forms.Select(attrs={
            'class': 'form-control'
        })
    )
    
    campaign_type = forms.ChoiceField(
        choices=[('', _('All Types'))] + list(Campaign.CAMPAIGN_TYPES),
        required=False,
        widget=forms.Select(attrs={
            'class': 'form-control'
        })
    )
    
    date_from = forms.DateField(
        required=False,
        widget=forms.DateInput(attrs={
            'class': 'form-control',
            'type': 'date'
        })
    )
    
    date_to = forms.DateField(
        required=False,
        widget=forms.DateInput(attrs={
            'class': 'form-control',
            'type': 'date'
        })
    )


class CollaborationStatusForm(forms.Form):
    """Form for updating collaboration status"""
    
    status = forms.ChoiceField(
        choices=InfluencerCollaboration.STATUS_CHOICES,
        widget=forms.Select(attrs={
            'class': 'form-control'
        })
    )
    
    notes = forms.CharField(
        required=False,
        widget=forms.Textarea(attrs={
            'class': 'form-control',
            'rows': 3,
            'placeholder': _('Additional notes...')
        })
    )