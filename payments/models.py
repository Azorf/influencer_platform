from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from decimal import Decimal


class PaymentMethod(models.Model):
    """Payment methods for users"""
    
    METHOD_TYPES = (
        ('credit_card', _('Credit Card')),
        ('bank_transfer', _('Bank Transfer')),
        ('paypal', _('PayPal')),
        ('stripe', _('Stripe')),
    )
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='payment_methods')
    method_type = models.CharField(max_length=20, choices=METHOD_TYPES)
    
    # Card details (encrypted/tokenized)
    stripe_payment_method_id = models.CharField(max_length=200, blank=True, null=True)
    last_four_digits = models.CharField(max_length=4, blank=True, null=True)
    card_brand = models.CharField(max_length=20, blank=True, null=True)
    
    # Bank details
    bank_name = models.CharField(max_length=200, blank=True, null=True)
    account_holder_name = models.CharField(max_length=200, blank=True, null=True)
    iban = models.CharField(max_length=34, blank=True, null=True)
    
    # Status
    is_default = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'payments_paymentmethod'
        verbose_name = _('Payment Method')
        verbose_name_plural = _('Payment Methods')
    
    def __str__(self):
        if self.method_type == 'credit_card' and self.last_four_digits:
            return f"{self.get_method_type_display()} ending in {self.last_four_digits}"
        return self.get_method_type_display()


class Invoice(models.Model):
    """Invoice model for subscription billing and campaign payments"""
    
    STATUS_CHOICES = (
        ('draft', _('Draft')),
        ('pending', _('Pending')),
        ('paid', _('Paid')),
        ('overdue', _('Overdue')),
        ('cancelled', _('Cancelled')),
        ('refunded', _('Refunded')),
    )
    
    INVOICE_TYPES = (
        ('subscription', _('Subscription')),
        ('campaign_payment', _('Campaign Payment')),
        ('one_time', _('One-time Payment')),
    )
    
    # Invoice Details
    invoice_number = models.CharField(max_length=50, unique=True)
    invoice_type = models.CharField(max_length=20, choices=INVOICE_TYPES)
    
    # Billing Information
    billed_to = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='invoices')
    agency = models.ForeignKey('agencies.Agency', on_delete=models.SET_NULL, blank=True, null=True)
    
    # Related Objects
    subscription = models.ForeignKey('agencies.AgencySubscription', on_delete=models.SET_NULL, blank=True, null=True)
    campaign = models.ForeignKey('campaigns.Campaign', on_delete=models.SET_NULL, blank=True, null=True)
    
    # Financial Details
    subtotal = models.DecimalField(max_digits=12, decimal_places=2)
    tax_rate = models.DecimalField(max_digits=5, decimal_places=4, default=Decimal('0.20'))  # 20% VAT
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=3, default='MAD')
    
    # Payment Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    
    # Important Dates
    issue_date = models.DateField()
    due_date = models.DateField()
    paid_date = models.DateTimeField(blank=True, null=True)
    
    # Stripe Integration
    stripe_invoice_id = models.CharField(max_length=200, blank=True, null=True)
    stripe_payment_intent_id = models.CharField(max_length=200, blank=True, null=True)
    
    # Metadata
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'payments_invoice'
        verbose_name = _('Invoice')
        verbose_name_plural = _('Invoices')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Invoice {self.invoice_number}"
    
    def save(self, *args, **kwargs):
        # Calculate tax amount and total
        if not self.tax_amount:
            self.tax_amount = self.subtotal * self.tax_rate
        if not self.total_amount:
            self.total_amount = self.subtotal + self.tax_amount
        super().save(*args, **kwargs)


class InvoiceLineItem(models.Model):
    """Line items for invoices"""
    
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='line_items')
    description = models.CharField(max_length=500)
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    total_price = models.DecimalField(max_digits=12, decimal_places=2)
    
    # Optional reference to collaboration
    collaboration = models.ForeignKey(
        'campaigns.InfluencerCollaboration', 
        on_delete=models.SET_NULL, 
        blank=True, null=True
    )
    
    class Meta:
        db_table = 'payments_invoicelineitem'
        verbose_name = _('Invoice Line Item')
        verbose_name_plural = _('Invoice Line Items')
    
    def __str__(self):
        return f"{self.description} - {self.total_price} {self.invoice.currency}"
    
    def save(self, *args, **kwargs):
        if not self.total_price:
            self.total_price = self.quantity * self.unit_price
        super().save(*args, **kwargs)


class Payment(models.Model):
    """Payment transactions"""
    
    STATUS_CHOICES = (
        ('pending', _('Pending')),
        ('processing', _('Processing')),
        ('succeeded', _('Succeeded')),
        ('failed', _('Failed')),
        ('cancelled', _('Cancelled')),
        ('refunded', _('Refunded')),
    )
    
    PAYMENT_METHODS = (
        ('credit_card', _('Credit Card')),
        ('bank_transfer', _('Bank Transfer')),
        ('paypal', _('PayPal')),
        ('cash', _('Cash')),
    )
    
    # Payment Details
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='payments')
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHODS)
    
    # Amount Information
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=3, default='MAD')
    
    # Status and Tracking
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    reference_number = models.CharField(max_length=100, unique=True)
    
    # Stripe Integration
    stripe_payment_intent_id = models.CharField(max_length=200, blank=True, null=True)
    stripe_charge_id = models.CharField(max_length=200, blank=True, null=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(blank=True, null=True)
    
    # Additional Information
    failure_reason = models.TextField(blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    
    class Meta:
        db_table = 'payments_payment'
        verbose_name = _('Payment')
        verbose_name_plural = _('Payments')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Payment {self.reference_number} - {self.amount} {self.currency}"


class Refund(models.Model):
    """Refund transactions"""
    
    STATUS_CHOICES = (
        ('pending', _('Pending')),
        ('processing', _('Processing')),
        ('succeeded', _('Succeeded')),
        ('failed', _('Failed')),
        ('cancelled', _('Cancelled')),
    )
    
    payment = models.ForeignKey(Payment, on_delete=models.CASCADE, related_name='refunds')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    reason = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Stripe Integration
    stripe_refund_id = models.CharField(max_length=200, blank=True, null=True)
    
    # Approval Process
    requested_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        blank=True, null=True,
        related_name='approved_refunds'
    )
    
    # Timestamps
    requested_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(blank=True, null=True)
    
    class Meta:
        db_table = 'payments_refund'
        verbose_name = _('Refund')
        verbose_name_plural = _('Refunds')
        ordering = ['-requested_at']
    
    def __str__(self):
        return f"Refund for {self.payment.reference_number} - {self.amount}"


class InfluencerPayout(models.Model):
    """Payouts to influencers for completed collaborations"""
    
    STATUS_CHOICES = (
        ('pending', _('Pending')),
        ('processing', _('Processing')),
        ('completed', _('Completed')),
        ('failed', _('Failed')),
    )
    
    collaboration = models.OneToOneField(
        'campaigns.InfluencerCollaboration', 
        on_delete=models.CASCADE, 
        related_name='payout'
    )
    influencer = models.ForeignKey(
        'influencers.Influencer', 
        on_delete=models.CASCADE, 
        related_name='payouts'
    )
    
    # Payout Details
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='MAD')
    
    # Platform fee (percentage taken by platform)
    platform_fee_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('10.00'))
    platform_fee_amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    net_amount = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Status and Processing
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    processed_at = models.DateTimeField(blank=True, null=True)
    
    # Payment Method
    payout_method = models.CharField(
        max_length=20,
        choices=[
            ('bank_transfer', _('Bank Transfer')),
            ('paypal', _('PayPal')),
            ('check', _('Check')),
        ],
        default='bank_transfer'
    )
    
    # Bank details for payout
    bank_name = models.CharField(max_length=200, blank=True, null=True)
    account_holder_name = models.CharField(max_length=200, blank=True, null=True)
    iban = models.CharField(max_length=34, blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'payments_influencerpayout'
        verbose_name = _('Influencer Payout')
        verbose_name_plural = _('Influencer Payouts')
    
    def __str__(self):
        return f"Payout to {self.influencer.full_name} - {self.net_amount} {self.currency}"
    
    def save(self, *args, **kwargs):
        if not self.platform_fee_amount:
            self.platform_fee_amount = self.amount * (self.platform_fee_percentage / 100)
        if not self.net_amount:
            self.net_amount = self.amount - self.platform_fee_amount
        super().save(*args, **kwargs)