from django.urls import path
from . import views

app_name = 'payments'

urlpatterns = [
    # Payment methods
    path('methods/', views.payment_methods_view, name='payment_methods'),
    path('methods/add/', views.add_payment_method_view, name='add_payment_method'),
    path('methods/<int:pk>/delete/', views.delete_payment_method_view, name='delete_payment_method'),
    
    # Invoices
    path('invoices/', views.invoice_list_view, name='invoice_list'),
    path('invoices/<int:pk>/', views.invoice_detail_view, name='invoice_detail'),
    path('invoices/<int:pk>/pay/', views.pay_invoice_view, name='pay_invoice'),
    
    # Payments
    path('history/', views.payment_history_view, name='payment_history'),
    path('<int:pk>/', views.payment_detail_view, name='payment_detail'),
    
    # Stripe webhooks
    path('stripe/webhook/', views.stripe_webhook_view, name='stripe_webhook'),
    
    # Payouts (for influencers)
    path('payouts/', views.payout_list_view, name='payout_list'),
    path('payouts/<int:pk>/', views.payout_detail_view, name='payout_detail'),
]