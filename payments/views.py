# payments/views.py
"""
REST API views for payments app
Returns JSON for frontend consumption
"""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Q, Sum
from django.utils import timezone
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
import uuid

from .models import PaymentMethod, Invoice, Payment, InfluencerPayout
from .serializers import (
    PaymentMethodSerializer,
    InvoiceListSerializer,
    InvoiceDetailSerializer,
    PaymentSerializer,
    InfluencerPayoutSerializer,
)


# =============================================================================
# Payment Methods
# =============================================================================

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def payment_methods(request):
    """List or create payment methods"""
    if request.method == 'GET':
        methods = request.user.payment_methods.filter(is_active=True)
        serializer = PaymentMethodSerializer(methods, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = PaymentMethodSerializer(data=request.data)
        if serializer.is_valid():
            if serializer.validated_data.get('is_default'):
                request.user.payment_methods.filter(is_default=True).update(is_default=False)
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def payment_method_detail(request, pk):
    """Get, update or delete a payment method"""
    method = get_object_or_404(PaymentMethod, pk=pk, user=request.user, is_active=True)
    
    if request.method == 'GET':
        serializer = PaymentMethodSerializer(method)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        serializer = PaymentMethodSerializer(method, data=request.data, partial=True)
        if serializer.is_valid():
            if serializer.validated_data.get('is_default'):
                request.user.payment_methods.filter(is_default=True).update(is_default=False)
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        method.is_active = False
        method.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def set_default_payment_method(request, pk):
    """Set a payment method as default"""
    method = get_object_or_404(PaymentMethod, pk=pk, user=request.user, is_active=True)
    request.user.payment_methods.filter(is_default=True).update(is_default=False)
    method.is_default = True
    method.save()
    return Response({'status': 'success', 'message': 'Default payment method updated'})


# =============================================================================
# Invoices
# =============================================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def invoice_list(request):
    """List invoices with filters"""
    invoices = Invoice.objects.filter(billed_to=request.user)
    
    # Filters
    status_filter = request.query_params.get('status')
    if status_filter:
        invoices = invoices.filter(status=status_filter)
    
    invoice_type = request.query_params.get('type')
    if invoice_type:
        invoices = invoices.filter(invoice_type=invoice_type)
    
    search = request.query_params.get('search')
    if search:
        invoices = invoices.filter(
            Q(invoice_number__icontains=search) | Q(notes__icontains=search)
        )
    
    serializer = InvoiceListSerializer(invoices.order_by('-created_at'), many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def invoice_detail(request, pk):
    """Get invoice detail with line items"""
    invoice = get_object_or_404(Invoice, pk=pk, billed_to=request.user)
    serializer = InvoiceDetailSerializer(invoice)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def pay_invoice(request, pk):
    """Pay an invoice"""
    invoice = get_object_or_404(Invoice, pk=pk, billed_to=request.user)
    
    if invoice.status == 'paid':
        return Response({'error': 'Invoice already paid'}, status=status.HTTP_400_BAD_REQUEST)
    
    payment_method_id = request.data.get('paymentMethodId')
    
    if payment_method_id:
        payment_method = get_object_or_404(
            PaymentMethod, pk=payment_method_id, user=request.user, is_active=True
        )
    else:
        payment_method = request.user.payment_methods.filter(is_active=True, is_default=True).first()
        if not payment_method:
            return Response(
                {'error': 'No payment method specified or default set'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    # Create payment record
    reference = f"PAY-{uuid.uuid4().hex[:8].upper()}"
    payment = Payment.objects.create(
        invoice=invoice,
        payment_method=payment_method.method_type,
        amount=invoice.total_amount,
        currency=invoice.currency,
        reference_number=reference,
        status='processing'
    )
    
    # TODO: Process via Stripe in production
    # For now, mark as succeeded
    payment.status = 'succeeded'
    payment.processed_at = timezone.now()
    payment.save()
    
    invoice.status = 'paid'
    invoice.paid_date = timezone.now()
    invoice.save()
    
    return Response({
        'status': 'success',
        'paymentId': payment.id,
        'referenceNumber': payment.reference_number
    })


# =============================================================================
# Payments (Transactions)
# =============================================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def payment_list(request):
    """List payment transactions"""
    payments = Payment.objects.filter(invoice__billed_to=request.user)
    
    status_filter = request.query_params.get('status')
    if status_filter:
        payments = payments.filter(status=status_filter)
    
    serializer = PaymentSerializer(payments.order_by('-created_at'), many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def payment_detail(request, pk):
    """Get payment detail"""
    payment = get_object_or_404(Payment, pk=pk, invoice__billed_to=request.user)
    serializer = PaymentSerializer(payment)
    return Response(serializer.data)


# =============================================================================
# Influencer Payouts
# =============================================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def payout_list(request):
    """List payouts for influencer"""
    if request.user.user_type != 'influencer':
        return Response({'error': 'Only influencers can view payouts'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        influencer = request.user.influencer_profile
        payouts = influencer.payouts.all().order_by('-created_at')
        serializer = InfluencerPayoutSerializer(payouts, many=True)
        return Response(serializer.data)
    except Exception:
        return Response([])


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def payout_detail(request, pk):
    """Get payout detail"""
    payout = get_object_or_404(InfluencerPayout, pk=pk)
    
    if request.user.user_type != 'influencer':
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        if request.user.influencer_profile != payout.influencer:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    except Exception:
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    
    serializer = InfluencerPayoutSerializer(payout)
    return Response(serializer.data)


# =============================================================================
# Statistics
# =============================================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def payment_stats(request):
    """Get payment statistics for dashboard"""
    invoices = Invoice.objects.filter(billed_to=request.user)
    payments = Payment.objects.filter(invoice__billed_to=request.user)
    
    total_paid = payments.filter(status='succeeded').aggregate(total=Sum('amount'))['total'] or 0
    pending = invoices.filter(status='pending').aggregate(total=Sum('total_amount'), count=Sum(1))
    overdue = invoices.filter(status='overdue').aggregate(total=Sum('total_amount'), count=Sum(1))
    
    return Response({
        'totalPaid': float(total_paid),
        'pendingInvoices': {'amount': float(pending['total'] or 0), 'count': pending['count'] or 0},
        'overdueInvoices': {'amount': float(overdue['total'] or 0), 'count': overdue['count'] or 0},
        'totalInvoices': invoices.count(),
        'totalPayments': payments.count(),
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def payout_stats(request):
    """Get payout statistics for influencers"""
    if request.user.user_type != 'influencer':
        return Response({'error': 'Only influencers can view payout stats'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        influencer = request.user.influencer_profile
        payouts = influencer.payouts.all()
        
        total_earned = payouts.filter(status='completed').aggregate(total=Sum('net_amount'))['total'] or 0
        pending = payouts.filter(status='pending').aggregate(total=Sum('net_amount'), count=Sum(1))
        
        return Response({
            'totalEarned': float(total_earned),
            'pendingPayouts': {'amount': float(pending['total'] or 0), 'count': pending['count'] or 0},
            'totalPayouts': payouts.count(),
            'completedPayouts': payouts.filter(status='completed').count(),
        })
    except Exception:
        return Response({
            'totalEarned': 0,
            'pendingPayouts': {'amount': 0, 'count': 0},
            'totalPayouts': 0,
            'completedPayouts': 0,
        })


# =============================================================================
# Stripe Webhook
# =============================================================================

@csrf_exempt
def stripe_webhook(request):
    """Stripe webhook handler"""
    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
    webhook_secret = getattr(settings, 'STRIPE_WEBHOOK_SECRET', None)
    
    if not webhook_secret:
        return HttpResponse('Webhook secret not configured', status=500)
    
    try:
        import stripe
        event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
    except ValueError:
        return HttpResponse('Invalid payload', status=400)
    except stripe.error.SignatureVerificationError:
        return HttpResponse('Invalid signature', status=400)
    except ImportError:
        return HttpResponse('Stripe not configured', status=500)
    
    # Handle events
    event_type = event['type']
    data = event['data']['object']
    
    if event_type == 'payment_intent.succeeded':
        _handle_payment_succeeded(data)
    elif event_type == 'payment_intent.payment_failed':
        _handle_payment_failed(data)
    elif event_type == 'invoice.paid':
        _handle_invoice_paid(data)
    
    return HttpResponse('OK')


def _handle_payment_succeeded(payment_intent):
    """Handle successful Stripe payment"""
    try:
        payment = Payment.objects.get(stripe_payment_intent_id=payment_intent['id'])
        payment.status = 'succeeded'
        payment.processed_at = timezone.now()
        payment.stripe_charge_id = payment_intent.get('latest_charge')
        payment.save()
        
        payment.invoice.status = 'paid'
        payment.invoice.paid_date = timezone.now()
        payment.invoice.save()
    except Payment.DoesNotExist:
        pass


def _handle_payment_failed(payment_intent):
    """Handle failed Stripe payment"""
    try:
        payment = Payment.objects.get(stripe_payment_intent_id=payment_intent['id'])
        payment.status = 'failed'
        payment.failure_reason = payment_intent.get('last_payment_error', {}).get('message', 'Unknown error')
        payment.save()
    except Payment.DoesNotExist:
        pass


def _handle_invoice_paid(stripe_invoice):
    """Handle Stripe invoice.paid webhook"""
    try:
        invoice = Invoice.objects.get(stripe_invoice_id=stripe_invoice['id'])
        invoice.status = 'paid'
        invoice.paid_date = timezone.now()
        invoice.save()
    except Invoice.DoesNotExist:
        pass
