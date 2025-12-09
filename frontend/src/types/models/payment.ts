import type { ID, ISODateString, CurrencyCode } from '../api';

// =============================================================================
// Payment Method Types (maps to payments.PaymentMethod)
// =============================================================================

/**
 * Payment method type choices
 */
export type PaymentMethodType = 'credit_card' | 'bank_transfer' | 'paypal' | 'stripe';

/**
 * Card brand types
 */
export type CardBrand = 'visa' | 'mastercard' | 'amex' | 'discover' | 'other';

/**
 * Payment method interface
 */
export interface PaymentMethod {
  id: ID;
  user: ID;
  method_type: PaymentMethodType;
  stripe_payment_method_id: string | null;
  last_four_digits: string | null;
  card_brand: CardBrand | null;
  bank_name: string | null;
  account_holder_name: string | null;
  iban: string | null;
  is_default: boolean;
  is_active: boolean;
  created_at: ISODateString;
}

// =============================================================================
// Invoice Types (maps to payments.Invoice)
// =============================================================================

/**
 * Invoice status choices
 */
export type InvoiceStatus = 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled' | 'refunded';

/**
 * Invoice type choices
 */
export type InvoiceType = 'subscription' | 'campaign_payment' | 'one_time';

/**
 * Invoice interface
 */
export interface Invoice {
  id: ID;
  invoice_number: string;
  invoice_type: InvoiceType;
  billed_to: ID;
  agency: ID | null;
  subscription: ID | null;
  campaign: ID | null;
  subtotal: string;
  tax_rate: string;
  tax_amount: string;
  total_amount: string;
  currency: CurrencyCode;
  status: InvoiceStatus;
  issue_date: string;
  due_date: string;
  paid_date: ISODateString | null;
  stripe_invoice_id: string | null;
  stripe_payment_intent_id: string | null;
  notes: string | null;
  created_at: ISODateString;
  updated_at: ISODateString;
}

/**
 * Invoice with line items
 */
export interface InvoiceWithLineItems extends Invoice {
  line_items: InvoiceLineItem[];
}

// =============================================================================
// Invoice Line Item Types (maps to payments.InvoiceLineItem)
// =============================================================================

/**
 * Invoice line item interface
 */
export interface InvoiceLineItem {
  id: ID;
  invoice: ID;
  description: string;
  quantity: number;
  unit_price: string;
  total_price: string;
  collaboration: ID | null;
}

// =============================================================================
// Payment Types (maps to payments.Payment)
// =============================================================================

/**
 * Payment status choices
 */
export type PaymentStatus = 'pending' | 'processing' | 'succeeded' | 'failed' | 'cancelled' | 'refunded';

/**
 * Payment method choices for transactions
 */
export type TransactionPaymentMethod = 'credit_card' | 'bank_transfer' | 'paypal' | 'cash';

/**
 * Payment interface
 */
export interface Payment {
  id: ID;
  invoice: ID;
  payment_method: TransactionPaymentMethod;
  amount: string;
  currency: CurrencyCode;
  status: PaymentStatus;
  reference_number: string;
  stripe_payment_intent_id: string | null;
  stripe_charge_id: string | null;
  created_at: ISODateString;
  processed_at: ISODateString | null;
  failure_reason: string | null;
  notes: string | null;
}

/**
 * Payment with invoice details
 */
export interface PaymentWithInvoice extends Payment {
  invoice_details: Invoice;
}

// =============================================================================
// Refund Types (maps to payments.Refund)
// =============================================================================

/**
 * Refund status choices
 */
export type RefundStatus = 'pending' | 'processing' | 'succeeded' | 'failed' | 'cancelled';

/**
 * Refund interface
 */
export interface Refund {
  id: ID;
  payment: ID;
  amount: string;
  reason: string;
  status: RefundStatus;
  stripe_refund_id: string | null;
  requested_by: ID;
  approved_by: ID | null;
  requested_at: ISODateString;
  processed_at: ISODateString | null;
}

// =============================================================================
// Influencer Payout Types (maps to payments.InfluencerPayout)
// =============================================================================

/**
 * Payout status choices
 */
export type PayoutStatus = 'pending' | 'processing' | 'completed' | 'failed';

/**
 * Payout method choices
 */
export type PayoutMethod = 'bank_transfer' | 'paypal' | 'check';

/**
 * Influencer payout interface
 */
export interface InfluencerPayout {
  id: ID;
  collaboration: ID;
  influencer: ID;
  amount: string;
  currency: CurrencyCode;
  platform_fee_percentage: string;
  platform_fee_amount: string;
  net_amount: string;
  status: PayoutStatus;
  processed_at: ISODateString | null;
  payout_method: PayoutMethod;
  bank_name: string | null;
  account_holder_name: string | null;
  iban: string | null;
  created_at: ISODateString;
}

/**
 * Payout with collaboration details
 */
export interface PayoutWithDetails extends InfluencerPayout {
  collaboration_details: {
    campaign_name: string;
    content_type: string;
    completed_at: ISODateString;
  };
  influencer_details: {
    full_name: string;
    email: string;
  };
}

// =============================================================================
// Request/Response Types
// =============================================================================

/**
 * Add payment method request
 */
export interface AddPaymentMethodRequest {
  method_type: PaymentMethodType;
  stripe_payment_method_id?: string;
  is_default?: boolean;
  // For bank transfer
  bank_name?: string;
  account_holder_name?: string;
  iban?: string;
}

/**
 * Pay invoice request
 */
export interface PayInvoiceRequest {
  payment_method_id: ID;
  payment_method_type?: TransactionPaymentMethod;
}

/**
 * Create payment intent response (Stripe)
 */
export interface CreatePaymentIntentResponse {
  client_secret: string;
  payment_intent_id: string;
  amount: number;
  currency: string;
}

/**
 * Stripe webhook event
 */
export interface StripeWebhookEvent {
  id: string;
  type: string;
  data: {
    object: Record<string, unknown>;
  };
}

/**
 * Payment history filters
 */
export interface PaymentHistoryParams {
  status?: PaymentStatus;
  payment_method?: TransactionPaymentMethod;
  start_date?: string;
  end_date?: string;
  min_amount?: string;
  max_amount?: string;
  page?: number;
  page_size?: number;
}

/**
 * Invoice list filters
 */
export interface InvoiceListParams {
  status?: InvoiceStatus;
  invoice_type?: InvoiceType;
  start_date?: string;
  end_date?: string;
  page?: number;
  page_size?: number;
}

/**
 * Payout list filters
 */
export interface PayoutListParams {
  status?: PayoutStatus;
  payout_method?: PayoutMethod;
  start_date?: string;
  end_date?: string;
  page?: number;
  page_size?: number;
}
