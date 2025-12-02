from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from .models import PaymentMethod, Invoice, InvoiceLineItem, Payment, Refund, InfluencerPayout


@admin.register(PaymentMethod)
class PaymentMethodAdmin(admin.ModelAdmin):
    list_display = ('user', 'method_type', 'last_four_digits', 'card_brand', 'is_default', 'is_active', 'created_at')
    list_filter = ('method_type', 'is_default', 'is_active', 'created_at')
    search_fields = ('user__email', 'user__username', 'account_holder_name')


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ('invoice_number', 'billed_to', 'invoice_type', 'total_amount', 'currency', 'status', 'issue_date', 'due_date')
    list_filter = ('invoice_type', 'status', 'currency', 'issue_date', 'due_date')
    search_fields = ('invoice_number', 'billed_to__email', 'agency__name')
    readonly_fields = ('created_at', 'updated_at', 'paid_date')
    
    fieldsets = (
        (_('Invoice Details'), {
            'fields': ('invoice_number', 'invoice_type', 'billed_to', 'agency')
        }),
        (_('Related Objects'), {
            'fields': ('subscription', 'campaign')
        }),
        (_('Financial Details'), {
            'fields': ('subtotal', 'tax_rate', 'tax_amount', 'total_amount', 'currency')
        }),
        (_('Status and Dates'), {
            'fields': ('status', 'issue_date', 'due_date', 'paid_date')
        }),
        (_('Stripe Integration'), {
            'fields': ('stripe_invoice_id', 'stripe_payment_intent_id'),
            'classes': ('collapse',)
        }),
        (_('Additional Information'), {
            'fields': ('notes',)
        }),
        (_('Timestamps'), {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(InvoiceLineItem)
class InvoiceLineItemAdmin(admin.ModelAdmin):
    list_display = ('invoice', 'description', 'quantity', 'unit_price', 'total_price')
    search_fields = ('invoice__invoice_number', 'description')


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('reference_number', 'invoice', 'amount', 'currency', 'payment_method', 'status', 'created_at', 'processed_at')
    list_filter = ('payment_method', 'status', 'currency', 'created_at')
    search_fields = ('reference_number', 'invoice__invoice_number', 'stripe_charge_id')
    readonly_fields = ('created_at', 'processed_at')


@admin.register(Refund)
class RefundAdmin(admin.ModelAdmin):
    list_display = ('payment', 'amount', 'status', 'requested_by', 'approved_by', 'requested_at', 'processed_at')
    list_filter = ('status', 'requested_at')
    search_fields = ('payment__reference_number', 'reason')
    readonly_fields = ('requested_at', 'processed_at')


@admin.register(InfluencerPayout)
class InfluencerPayoutAdmin(admin.ModelAdmin):
    list_display = ('influencer', 'collaboration', 'amount', 'net_amount', 'status', 'payout_method', 'created_at')
    list_filter = ('status', 'payout_method', 'created_at')
    search_fields = ('influencer__full_name', 'collaboration__campaign__name')
    readonly_fields = ('created_at', 'processed_at')