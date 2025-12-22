# payments/urls.py
"""
URL patterns for payments REST API
"""
from django.urls import path
from . import views

app_name = 'payments'

urlpatterns = [
    # Payment Methods
    path('methods/', views.payment_methods, name='payment_methods'),
    path('methods/<int:pk>/', views.payment_method_detail, name='payment_method_detail'),
    path('methods/<int:pk>/set-default/', views.set_default_payment_method, name='set_default'),
    
    # Invoices
    path('invoices/', views.invoice_list, name='invoice_list'),
    path('invoices/<int:pk>/', views.invoice_detail, name='invoice_detail'),
    path('invoices/<int:pk>/pay/', views.pay_invoice, name='pay_invoice'),
    
    # Payments (Transactions)
    path('payments/', views.payment_list, name='payment_list'),
    path('payments/<int:pk>/', views.payment_detail, name='payment_detail'),
    
    # Payouts (Influencers)
    path('payouts/', views.payout_list, name='payout_list'),
    path('payouts/<int:pk>/', views.payout_detail, name='payout_detail'),
    
    # Statistics
    path('stats/', views.payment_stats, name='payment_stats'),
    path('payout-stats/', views.payout_stats, name='payout_stats'),
    
    # Stripe Webhook
    path('stripe/webhook/', views.stripe_webhook, name='stripe_webhook'),
]
