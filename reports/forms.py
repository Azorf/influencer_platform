from django import forms
from django.utils.translation import gettext_lazy as _
from .models import Report, Dashboard, ReportTemplate, ReportSubscription


class ReportForm(forms.ModelForm):
    """Form for creating reports"""
    
    class Meta:
        model = Report
        fields = ['title', 'description', 'report_type', 'file_format', 'parameters', 'filters']
        widgets = {
            'title': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': _('Report Title')
            }),
            'description': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 3,
                'placeholder': _('Report description...')
            }),
            'report_type': forms.Select(attrs={
                'class': 'form-control'
            }),
            'file_format': forms.Select(attrs={
                'class': 'form-control'
            }),
            'parameters': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 4,
                'placeholder': _('JSON parameters (optional)')
            }),
            'filters': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 4,
                'placeholder': _('JSON filters (optional)')
            })
        }
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        optional_fields = ['description', 'parameters', 'filters']
        for field in optional_fields:
            if field in self.fields:
                self.fields[field].required = False


class DashboardForm(forms.ModelForm):
    """Form for creating dashboards"""
    
    class Meta:
        model = Dashboard
        fields = ['name', 'description', 'dashboard_type', 'auto_refresh_interval']
        widgets = {
            'name': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': _('Dashboard Name')
            }),
            'description': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 3,
                'placeholder': _('Dashboard description...')
            }),
            'dashboard_type': forms.Select(attrs={
                'class': 'form-control'
            }),
            'auto_refresh_interval': forms.NumberInput(attrs={
                'class': 'form-control',
                'min': 30,
                'placeholder': _('Auto-refresh interval (seconds)')
            })
        }
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['description'].required = False


class ReportTemplateForm(forms.ModelForm):
    """Form for creating report templates"""
    
    class Meta:
        model = ReportTemplate
        fields = ['name', 'description', 'report_type', 'is_public']
        widgets = {
            'name': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': _('Template Name')
            }),
            'description': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 3,
                'placeholder': _('Template description...')
            }),
            'report_type': forms.Select(attrs={
                'class': 'form-control'
            }),
            'is_public': forms.CheckboxInput(attrs={
                'class': 'form-check-input'
            })
        }


class ReportSubscriptionForm(forms.ModelForm):
    """Form for creating report subscriptions"""
    
    class Meta:
        model = ReportSubscription
        fields = [
            'name', 'report_template', 'frequency', 'delivery_method',
            'email_recipients', 'delivery_time', 'delivery_day_of_week',
            'delivery_day_of_month'
        ]
        widgets = {
            'name': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': _('Subscription Name')
            }),
            'report_template': forms.Select(attrs={
                'class': 'form-control'
            }),
            'frequency': forms.Select(attrs={
                'class': 'form-control'
            }),
            'delivery_method': forms.Select(attrs={
                'class': 'form-control'
            }),
            'email_recipients': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 3,
                'placeholder': _('email1@example.com, email2@example.com')
            }),
            'delivery_time': forms.TimeInput(attrs={
                'class': 'form-control',
                'type': 'time'
            }),
            'delivery_day_of_week': forms.Select(attrs={
                'class': 'form-control'
            }, choices=[
                ('', _('Select day...')),
                (0, _('Monday')),
                (1, _('Tuesday')),
                (2, _('Wednesday')),
                (3, _('Thursday')),
                (4, _('Friday')),
                (5, _('Saturday')),
                (6, _('Sunday')),
            ]),
            'delivery_day_of_month': forms.NumberInput(attrs={
                'class': 'form-control',
                'min': 1,
                'max': 28,
                'placeholder': _('Day of month (1-28)')
            })
        }
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        optional_fields = ['delivery_day_of_week', 'delivery_day_of_month']
        for field in optional_fields:
            if field in self.fields:
                self.fields[field].required = False


class ReportFilterForm(forms.Form):
    """Form for filtering reports"""
    
    report_type = forms.ChoiceField(
        choices=[('', _('All Types'))] + list(Report.REPORT_TYPES),
        required=False,
        widget=forms.Select(attrs={
            'class': 'form-control'
        })
    )
    
    status = forms.ChoiceField(
        choices=[('', _('All Statuses'))] + list(Report.STATUS_CHOICES),
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