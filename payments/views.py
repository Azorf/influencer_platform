from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.utils.translation import gettext as _
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import stripe
import json

from .models import PaymentMethod, Invoice, Payment, InfluencerPayout
from .forms import PaymentMethodForm


@login_required
def payment_methods_view(request):
    """View user's payment methods"""
    payment_methods = request.user.payment_methods.filter(is_active=True)
    
    context = {
        'payment_methods': payment_methods,
    }
    
    return render(request, 'payments/payment_methods.html', context)


@login_required
def add_payment_method_view(request):
    """Add new payment method"""
    if request.method == 'POST':
        form = PaymentMethodForm(request.POST)
        if form.is_valid():
            payment_method = form.save(commit=False)
            payment_method.user = request.user
            payment_method.save()
            messages.success(request, _('Payment method added successfully!'))
            return redirect('payments:payment_methods')
    else:
        form = PaymentMethodForm()
    
    return render(request, 'payments/add_payment_method.html', {'form': form})


@require_http_methods(["POST"])
@login_required
def delete_payment_method_view(request, pk):
    """Delete payment method"""
    payment_method = get_object_or_404(PaymentMethod, pk=pk, user=request.user)
    payment_method.is_active = False
    payment_method.save()
    
    messages.success(request, _('Payment method removed.'))
    return redirect('payments:payment_methods')


@login_required
def invoice_list_view(request):
    """List user's invoices"""
    invoices = request.user.invoices.all().order_by('-created_at')
    
    context = {
        'invoices': invoices,
    }
    
    return render(request, 'payments/invoice_list.html', context)


@login_required
def invoice_detail_view(request, pk):
    """Invoice detail view"""
    invoice = get_object_or_404(Invoice, pk=pk, billed_to=request.user)
    
    context = {
        'invoice': invoice,
    }
    
    return render(request, 'payments/invoice_detail.html', context)


@login_required
def pay_invoice_view(request, pk):
    """Pay invoice"""
    invoice = get_object_or_404(Invoice, pk=pk, billed_to=request.user)
    
    if invoice.status == 'paid':
        messages.info(request, _('This invoice has already been paid.'))
        return redirect('payments:invoice_detail', pk=pk)
    
    # TODO: Implement Stripe payment processing
    
    context = {
        'invoice': invoice,
    }
    
    return render(request, 'payments/pay_invoice.html', context)


@login_required
def payment_history_view(request):
    """Payment history"""
    payments = Payment.objects.filter(
        invoice__billed_to=request.user
    ).order_by('-created_at')
    
    context = {
        'payments': payments,
    }
    
    return render(request, 'payments/payment_history.html', context)


@login_required
def payment_detail_view(request, pk):
    """Payment detail view"""
    payment = get_object_or_404(
        Payment, 
        pk=pk, 
        invoice__billed_to=request.user
    )
    
    context = {
        'payment': payment,
    }
    
    return render(request, 'payments/payment_detail.html', context)


@csrf_exempt
def stripe_webhook_view(request):
    """Stripe webhook handler"""
    # TODO: Implement Stripe webhook processing
    return HttpResponse('OK')


@login_required
def payout_list_view(request):
    """List payouts for influencers"""
    if request.user.user_type != 'influencer':
        messages.error(request, _('Only influencers can view payouts.'))
        return redirect('accounts:dashboard')
    
    try:
        influencer = request.user.influencer_profile
        payouts = influencer.payouts.all().order_by('-created_at')
    except:
        payouts = []
    
    context = {
        'payouts': payouts,
    }
    
    return render(request, 'payments/payout_list.html', context)


@login_required
def payout_detail_view(request, pk):
    """Payout detail view"""
    payout = get_object_or_404(InfluencerPayout, pk=pk)
    
    # Check permissions
    if request.user.user_type != 'influencer' or request.user.influencer_profile != payout.influencer:
        messages.error(request, _('You do not have permission to view this payout.'))
        return redirect('accounts:dashboard')
    
    context = {
        'payout': payout,
    }
    
    return render(request, 'payments/payout_detail.html', context)