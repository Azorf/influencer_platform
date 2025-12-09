import { get, post, del } from './axios';
import type {
  PaginatedResponse,
  PaymentMethod,
  Invoice,
  InvoiceWithLineItems,
  Payment,
  PaymentWithInvoice,
  InfluencerPayout,
  PayoutWithDetails,
  AddPaymentMethodRequest,
  PayInvoiceRequest,
  CreatePaymentIntentResponse,
  PaymentHistoryParams,
  InvoiceListParams,
  PayoutListParams,
} from '@/types';

// =============================================================================
// API Endpoints (maps to payments/urls.py)
// =============================================================================

const ENDPOINTS = {
  // Payment methods
  methods: '/payments/methods/',
  addMethod: '/payments/methods/add/',
  deleteMethod: (pk: number) => `/payments/methods/${pk}/delete/`,
  
  // Invoices
  invoices: '/payments/invoices/',
  invoiceDetail: (pk: number) => `/payments/invoices/${pk}/`,
  payInvoice: (pk: number) => `/payments/invoices/${pk}/pay/`,
  
  // Payments
  history: '/payments/history/',
  paymentDetail: (pk: number) => `/payments/${pk}/`,
  
  // Stripe webhooks
  stripeWebhook: '/payments/stripe/webhook/',
  
  // Payouts
  payouts: '/payments/payouts/',
  payoutDetail: (pk: number) => `/payments/payouts/${pk}/`,
} as const;

// =============================================================================
// Payment Method Functions
// =============================================================================

/**
 * List payment methods for current user
 * GET /payments/methods/
 */
export const listPaymentMethods = async (): Promise<PaymentMethod[]> => {
  return get<PaymentMethod[]>(ENDPOINTS.methods);
};

/**
 * Add a new payment method
 * POST /payments/methods/add/
 */
export const addPaymentMethod = async (
  data: AddPaymentMethodRequest
): Promise<PaymentMethod> => {
  return post<PaymentMethod>(ENDPOINTS.addMethod, data);
};

/**
 * Delete a payment method
 * DELETE /payments/methods/:pk/delete/
 */
export const deletePaymentMethod = async (pk: number): Promise<void> => {
  return del<void>(ENDPOINTS.deleteMethod(pk));
};

/**
 * Set payment method as default
 * POST /payments/methods/:pk/set-default/
 */
export const setDefaultPaymentMethod = async (
  pk: number
): Promise<PaymentMethod> => {
  return post<PaymentMethod>(`/payments/methods/${pk}/set-default/`);
};

// =============================================================================
// Invoice Functions
// =============================================================================

/**
 * List invoices for current user
 * GET /payments/invoices/
 */
export const listInvoices = async (
  params?: InvoiceListParams
): Promise<PaginatedResponse<Invoice>> => {
  return get<PaginatedResponse<Invoice>>(ENDPOINTS.invoices, params as Record<string, unknown>);
};

/**
 * Get invoice details with line items
 * GET /payments/invoices/:pk/
 */
export const getInvoice = async (pk: number): Promise<InvoiceWithLineItems> => {
  return get<InvoiceWithLineItems>(ENDPOINTS.invoiceDetail(pk));
};

/**
 * Pay an invoice
 * POST /payments/invoices/:pk/pay/
 */
export const payInvoice = async (
  pk: number,
  data: PayInvoiceRequest
): Promise<Payment> => {
  return post<Payment>(ENDPOINTS.payInvoice(pk), data);
};

/**
 * Create Stripe payment intent for invoice
 * POST /payments/invoices/:pk/create-payment-intent/
 */
export const createPaymentIntent = async (
  pk: number
): Promise<CreatePaymentIntentResponse> => {
  return post<CreatePaymentIntentResponse>(
    `/payments/invoices/${pk}/create-payment-intent/`
  );
};

/**
 * Download invoice PDF
 * GET /payments/invoices/:pk/download/
 */
export const downloadInvoice = async (pk: number): Promise<Blob> => {
  const response = await get<Blob>(`/payments/invoices/${pk}/download/`);
  return response;
};

// =============================================================================
// Payment Functions
// =============================================================================

/**
 * Get payment history
 * GET /payments/history/
 */
export const getPaymentHistory = async (
  params?: PaymentHistoryParams
): Promise<PaginatedResponse<PaymentWithInvoice>> => {
  return get<PaginatedResponse<PaymentWithInvoice>>(ENDPOINTS.history, params as Record<string, unknown>);
};

/**
 * Get payment details
 * GET /payments/:pk/
 */
export const getPayment = async (pk: number): Promise<PaymentWithInvoice> => {
  return get<PaymentWithInvoice>(ENDPOINTS.paymentDetail(pk));
};

/**
 * Request a refund
 * POST /payments/:pk/request-refund/
 */
export const requestRefund = async (
  pk: number,
  reason: string
): Promise<{ success: boolean; message: string }> => {
  return post<{ success: boolean; message: string }>(
    `/payments/${pk}/request-refund/`,
    { reason }
  );
};

// =============================================================================
// Payout Functions (for influencers)
// =============================================================================

/**
 * List payouts for current influencer
 * GET /payments/payouts/
 */
export const listPayouts = async (
  params?: PayoutListParams
): Promise<PaginatedResponse<PayoutWithDetails>> => {
  return get<PaginatedResponse<PayoutWithDetails>>(ENDPOINTS.payouts, params as Record<string, unknown>);
};

/**
 * Get payout details
 * GET /payments/payouts/:pk/
 */
export const getPayout = async (pk: number): Promise<PayoutWithDetails> => {
  return get<PayoutWithDetails>(ENDPOINTS.payoutDetail(pk));
};

/**
 * Update payout bank details
 * POST /payments/payouts/:pk/update-bank-details/
 */
export const updatePayoutBankDetails = async (
  pk: number,
  data: {
    bank_name: string;
    account_holder_name: string;
    iban: string;
  }
): Promise<InfluencerPayout> => {
  return post<InfluencerPayout>(
    `/payments/payouts/${pk}/update-bank-details/`,
    data
  );
};

// =============================================================================
// Stripe Integration Functions
// =============================================================================

/**
 * Create Stripe setup intent for saving payment method
 * POST /payments/stripe/setup-intent/
 */
export const createSetupIntent = async (): Promise<{
  client_secret: string;
}> => {
  return post<{ client_secret: string }>('/payments/stripe/setup-intent/');
};

/**
 * Verify Stripe webhook signature (server-side)
 * This is typically not called from frontend, but included for completeness
 */
export const verifyStripeWebhook = async (
  payload: string,
  signature: string
): Promise<{ verified: boolean }> => {
  return post<{ verified: boolean }>(ENDPOINTS.stripeWebhook, {
    payload,
    signature,
  });
};

// =============================================================================
// Export all functions
// =============================================================================

export const paymentsApi = {
  // Payment Methods
  listPaymentMethods,
  addPaymentMethod,
  deletePaymentMethod,
  setDefaultPaymentMethod,
  
  // Invoices
  listInvoices,
  getInvoice,
  payInvoice,
  createPaymentIntent,
  downloadInvoice,
  
  // Payments
  getPaymentHistory,
  getPayment,
  requestRefund,
  
  // Payouts
  listPayouts,
  getPayout,
  updatePayoutBankDetails,
  
  // Stripe
  createSetupIntent,
  verifyStripeWebhook,
};

export default paymentsApi;
