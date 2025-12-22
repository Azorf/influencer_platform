# payments/serializers.py
"""
REST API serializers for payment models
"""
from rest_framework import serializers
from .models import PaymentMethod, Invoice, InvoiceLineItem, Payment, Refund, InfluencerPayout


class PaymentMethodSerializer(serializers.ModelSerializer):
    """Serializer for PaymentMethod"""
    
    methodType = serializers.CharField(source='method_type')
    lastFourDigits = serializers.CharField(source='last_four_digits', read_only=True)
    cardBrand = serializers.CharField(source='card_brand', read_only=True)
    bankName = serializers.CharField(source='bank_name', required=False, allow_blank=True)
    accountHolderName = serializers.CharField(source='account_holder_name', required=False, allow_blank=True)
    isDefault = serializers.BooleanField(source='is_default', required=False)
    isActive = serializers.BooleanField(source='is_active', read_only=True)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    
    class Meta:
        model = PaymentMethod
        fields = [
            'id', 'methodType', 'lastFourDigits', 'cardBrand',
            'bankName', 'accountHolderName', 'iban',
            'isDefault', 'isActive', 'createdAt',
        ]
        read_only_fields = ['id', 'lastFourDigits', 'cardBrand', 'isActive', 'createdAt']


class InvoiceLineItemSerializer(serializers.ModelSerializer):
    """Serializer for InvoiceLineItem"""
    
    unitPrice = serializers.DecimalField(source='unit_price', max_digits=10, decimal_places=2)
    totalPrice = serializers.DecimalField(source='total_price', max_digits=12, decimal_places=2)
    collaborationId = serializers.IntegerField(source='collaboration_id', read_only=True, allow_null=True)
    
    class Meta:
        model = InvoiceLineItem
        fields = ['id', 'description', 'quantity', 'unitPrice', 'totalPrice', 'collaborationId']


class InvoiceListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for invoice list"""
    
    invoiceNumber = serializers.CharField(source='invoice_number')
    invoiceType = serializers.CharField(source='invoice_type')
    totalAmount = serializers.DecimalField(source='total_amount', max_digits=12, decimal_places=2)
    issueDate = serializers.DateField(source='issue_date')
    dueDate = serializers.DateField(source='due_date')
    paidDate = serializers.DateTimeField(source='paid_date', read_only=True, allow_null=True)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    
    # Computed fields
    isOverdue = serializers.SerializerMethodField()
    
    class Meta:
        model = Invoice
        fields = [
            'id', 'invoiceNumber', 'invoiceType', 'status',
            'totalAmount', 'currency', 'issueDate', 'dueDate',
            'paidDate', 'createdAt', 'isOverdue',
        ]
    
    def get_isOverdue(self, obj):
        from django.utils import timezone
        if obj.status in ['paid', 'cancelled', 'refunded']:
            return False
        return obj.due_date < timezone.now().date()


class InvoiceDetailSerializer(serializers.ModelSerializer):
    """Full serializer for invoice detail"""
    
    invoiceNumber = serializers.CharField(source='invoice_number')
    invoiceType = serializers.CharField(source='invoice_type')
    agencyId = serializers.IntegerField(source='agency_id', read_only=True, allow_null=True)
    subscriptionId = serializers.IntegerField(source='subscription_id', read_only=True, allow_null=True)
    campaignId = serializers.IntegerField(source='campaign_id', read_only=True, allow_null=True)
    taxRate = serializers.DecimalField(source='tax_rate', max_digits=5, decimal_places=4)
    taxAmount = serializers.DecimalField(source='tax_amount', max_digits=12, decimal_places=2)
    totalAmount = serializers.DecimalField(source='total_amount', max_digits=12, decimal_places=2)
    issueDate = serializers.DateField(source='issue_date')
    dueDate = serializers.DateField(source='due_date')
    paidDate = serializers.DateTimeField(source='paid_date', read_only=True, allow_null=True)
    stripeInvoiceId = serializers.CharField(source='stripe_invoice_id', read_only=True, allow_null=True)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    updatedAt = serializers.DateTimeField(source='updated_at', read_only=True)
    
    # Nested serializers
    lineItems = InvoiceLineItemSerializer(source='line_items', many=True, read_only=True)
    payments = serializers.SerializerMethodField()
    
    class Meta:
        model = Invoice
        fields = [
            'id', 'invoiceNumber', 'invoiceType', 'status',
            'agencyId', 'subscriptionId', 'campaignId',
            'subtotal', 'taxRate', 'taxAmount', 'totalAmount', 'currency',
            'issueDate', 'dueDate', 'paidDate',
            'stripeInvoiceId', 'notes',
            'createdAt', 'updatedAt',
            'lineItems', 'payments',
        ]
    
    def get_payments(self, obj):
        payments = obj.payments.all()
        return PaymentSerializer(payments, many=True).data


class PaymentSerializer(serializers.ModelSerializer):
    """Serializer for Payment transactions"""
    
    invoiceId = serializers.IntegerField(source='invoice_id', read_only=True)
    invoiceNumber = serializers.SerializerMethodField()
    paymentMethod = serializers.CharField(source='payment_method')
    referenceNumber = serializers.CharField(source='reference_number')
    stripePaymentIntentId = serializers.CharField(source='stripe_payment_intent_id', read_only=True, allow_null=True)
    stripeChargeId = serializers.CharField(source='stripe_charge_id', read_only=True, allow_null=True)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    processedAt = serializers.DateTimeField(source='processed_at', read_only=True, allow_null=True)
    failureReason = serializers.CharField(source='failure_reason', read_only=True, allow_null=True)
    
    class Meta:
        model = Payment
        fields = [
            'id', 'invoiceId', 'invoiceNumber', 'paymentMethod',
            'amount', 'currency', 'status', 'referenceNumber',
            'stripePaymentIntentId', 'stripeChargeId',
            'createdAt', 'processedAt', 'failureReason', 'notes',
        ]
    
    def get_invoiceNumber(self, obj):
        return obj.invoice.invoice_number if obj.invoice else None


class RefundSerializer(serializers.ModelSerializer):
    """Serializer for Refund"""
    
    paymentId = serializers.IntegerField(source='payment_id', read_only=True)
    stripeRefundId = serializers.CharField(source='stripe_refund_id', read_only=True, allow_null=True)
    requestedById = serializers.IntegerField(source='requested_by_id', read_only=True)
    approvedById = serializers.IntegerField(source='approved_by_id', read_only=True, allow_null=True)
    requestedAt = serializers.DateTimeField(source='requested_at', read_only=True)
    processedAt = serializers.DateTimeField(source='processed_at', read_only=True, allow_null=True)
    
    class Meta:
        model = Refund
        fields = [
            'id', 'paymentId', 'amount', 'reason', 'status',
            'stripeRefundId', 'requestedById', 'approvedById',
            'requestedAt', 'processedAt',
        ]


class InfluencerPayoutSerializer(serializers.ModelSerializer):
    """Serializer for InfluencerPayout"""
    
    collaborationId = serializers.IntegerField(source='collaboration_id', read_only=True)
    influencerId = serializers.IntegerField(source='influencer_id', read_only=True)
    influencerName = serializers.SerializerMethodField()
    campaignName = serializers.SerializerMethodField()
    platformFeePercentage = serializers.DecimalField(source='platform_fee_percentage', max_digits=5, decimal_places=2)
    platformFeeAmount = serializers.DecimalField(source='platform_fee_amount', max_digits=10, decimal_places=2)
    netAmount = serializers.DecimalField(source='net_amount', max_digits=10, decimal_places=2)
    payoutMethod = serializers.CharField(source='payout_method')
    bankName = serializers.CharField(source='bank_name', allow_null=True)
    accountHolderName = serializers.CharField(source='account_holder_name', allow_null=True)
    processedAt = serializers.DateTimeField(source='processed_at', read_only=True, allow_null=True)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    
    class Meta:
        model = InfluencerPayout
        fields = [
            'id', 'collaborationId', 'influencerId', 'influencerName',
            'campaignName', 'amount', 'currency',
            'platformFeePercentage', 'platformFeeAmount', 'netAmount',
            'status', 'payoutMethod',
            'bankName', 'accountHolderName', 'iban',
            'processedAt', 'createdAt',
        ]
    
    def get_influencerName(self, obj):
        return obj.influencer.full_name if obj.influencer else None
    
    def get_campaignName(self, obj):
        return obj.collaboration.campaign.name if obj.collaboration and obj.collaboration.campaign else None
