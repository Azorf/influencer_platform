from django import forms
from django.utils.translation import gettext_lazy as _
from .models import PaymentMethod, Invoice


class PaymentMethodForm(forms.ModelForm):
    """Form for adding payment methods"""
    
    class Meta:
        model = PaymentMethod
        fields = ['method_type', 'bank_name', 'account_holder_name', 'iban']
        widgets = {
            'method_type': forms.Select(attrs={
                'class': 'form-control'
            }),
            'bank_name': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': _('Bank Name')
            }),
            'account_holder_name': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': _('Account Holder Name')
            }),
            'iban': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': _('IBAN')
            })
        }
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Make bank fields optional for non-bank-transfer methods
        optional_fields = ['bank_name', 'account_holder_name', 'iban']
        for field in optional_fields:
            if field in self.fields:
                self.fields[field].required = False


class InvoicePaymentForm(forms.Form):
    """Form for paying invoices"""
    
    payment_method = forms.ModelChoiceField(
        queryset=PaymentMethod.objects.none(),
        widget=forms.Select(attrs={
            'class': 'form-control'
        }),
        empty_label=_('Select payment method')
    )
    
    def __init__(self, user, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['payment_method'].queryset = user.payment_methods.filter(is_active=True)


class StripePaymentForm(forms.Form):
    """Form for Stripe payment processing"""
    
    stripe_token = forms.CharField(widget=forms.HiddenInput())
    amount = forms.DecimalField(widget=forms.HiddenInput())
    currency = forms.CharField(widget=forms.HiddenInput())


class PayoutRequestForm(forms.Form):
    """Form for requesting payouts"""
    
    bank_name = forms.CharField(
        max_length=200,
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': _('Bank Name')
        })
    )
    
    account_holder_name = forms.CharField(
        max_length=200,
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': _('Account Holder Name')
        })
    )
    
    iban = forms.CharField(
        max_length=34,
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': _('IBAN')
        })
    )