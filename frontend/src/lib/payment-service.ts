// ===========================================
// Payment Types - Matching existing backend models
// ===========================================

// Payment Method
export interface PaymentMethod {
  id: number;
  methodType: 'credit_card' | 'bank_transfer' | 'paypal' | 'stripe';
  lastFourDigits?: string;
  cardBrand?: string;
  bankName?: string;
  accountHolderName?: string;
  iban?: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
}

// Invoice Line Item
export interface InvoiceLineItem {
  id: number;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  collaborationId?: number;
}

// Invoice
export type InvoiceStatus = 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled' | 'refunded';
export type InvoiceType = 'subscription' | 'campaign_payment' | 'one_time';

export interface Invoice {
  id: number;
  invoiceNumber: string;
  invoiceType: InvoiceType;
  status: InvoiceStatus;
  agencyId?: number;
  subscriptionId?: number;
  campaignId?: number;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  issueDate: string;
  dueDate: string;
  paidDate?: string;
  stripeInvoiceId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  lineItems?: InvoiceLineItem[];
  payments?: PaymentTransaction[];
  isOverdue?: boolean;
}

// Payment Transaction
export type PaymentTransactionStatus = 'pending' | 'processing' | 'succeeded' | 'failed' | 'cancelled' | 'refunded';
export type PaymentMethodType = 'credit_card' | 'bank_transfer' | 'paypal' | 'cash';

export interface PaymentTransaction {
  id: number;
  invoiceId: number;
  invoiceNumber?: string;
  paymentMethod: PaymentMethodType;
  amount: number;
  currency: string;
  status: PaymentTransactionStatus;
  referenceNumber: string;
  stripePaymentIntentId?: string;
  stripeChargeId?: string;
  createdAt: string;
  processedAt?: string;
  failureReason?: string;
  notes?: string;
}

// Refund
export type RefundStatus = 'pending' | 'processing' | 'succeeded' | 'failed' | 'cancelled';

export interface Refund {
  id: number;
  paymentId: number;
  amount: number;
  reason: string;
  status: RefundStatus;
  stripeRefundId?: string;
  requestedById: number;
  approvedById?: number;
  requestedAt: string;
  processedAt?: string;
}

// Influencer Payout
export type PayoutStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type PayoutMethod = 'bank_transfer' | 'paypal' | 'check';

export interface InfluencerPayout {
  id: number;
  collaborationId: number;
  influencerId: number;
  influencerName?: string;
  campaignName?: string;
  amount: number;
  currency: string;
  platformFeePercentage: number;
  platformFeeAmount: number;
  netAmount: number;
  status: PayoutStatus;
  payoutMethod: PayoutMethod;
  bankName?: string;
  accountHolderName?: string;
  iban?: string;
  processedAt?: string;
  createdAt: string;
}

// Stats
export interface PaymentStats {
  totalPaid: number;
  pendingInvoices: { amount: number; count: number };
  overdueInvoices: { amount: number; count: number };
  totalInvoices: number;
  totalPayments: number;
}

export interface PayoutStats {
  totalEarned: number;
  pendingPayouts: { amount: number; count: number };
  totalPayouts: number;
  completedPayouts: number;
}


// ===========================================
// Payment Service - For existing backend
// ===========================================

import apiClient from './api-client';

export const paymentService = {
  // =====================
  // Payment Methods
  // =====================
  
  async getPaymentMethods(): Promise<PaymentMethod[]> {
    return apiClient.get<PaymentMethod[]>('/payments/api/methods/');
  },

  async addPaymentMethod(data: {
    methodType: PaymentMethod['methodType'];
    bankName?: string;
    accountHolderName?: string;
    iban?: string;
    isDefault?: boolean;
  }): Promise<PaymentMethod> {
    return apiClient.post<PaymentMethod>('/payments/api/methods/', {
      method_type: data.methodType,
      bank_name: data.bankName,
      account_holder_name: data.accountHolderName,
      iban: data.iban,
      is_default: data.isDefault,
    });
  },

  async deletePaymentMethod(id: number): Promise<void> {
    return apiClient.delete(`/payments/api/methods/${id}/`);
  },

  async setDefaultPaymentMethod(id: number): Promise<void> {
    return apiClient.post(`/payments/api/methods/${id}/set-default/`);
  },

  // =====================
  // Invoices
  // =====================
  
  async getInvoices(params?: {
    status?: InvoiceStatus;
    type?: InvoiceType;
    search?: string;
  }): Promise<Invoice[]> {
    return apiClient.get<Invoice[]>('/payments/api/invoices/', {
      status: params?.status,
      type: params?.type,
      search: params?.search,
    });
  },

  async getInvoice(id: number): Promise<Invoice> {
    return apiClient.get<Invoice>(`/payments/api/invoices/${id}/`);
  },

  async payInvoice(id: number, paymentMethodId?: number): Promise<{
    status: string;
    payment_id: number;
    reference_number: string;
  }> {
    return apiClient.post(`/payments/api/invoices/${id}/pay/`, {
      payment_method_id: paymentMethodId,
    });
  },

  // =====================
  // Payments (Transactions)
  // =====================
  
  async getPayments(params?: {
    status?: PaymentTransactionStatus;
  }): Promise<PaymentTransaction[]> {
    return apiClient.get<PaymentTransaction[]>('/payments/api/payments/', {
      status: params?.status,
    });
  },

  async getPayment(id: number): Promise<PaymentTransaction> {
    return apiClient.get<PaymentTransaction>(`/payments/api/payments/${id}/`);
  },

  // =====================
  // Payouts (Influencers)
  // =====================
  
  async getPayouts(): Promise<InfluencerPayout[]> {
    return apiClient.get<InfluencerPayout[]>('/payments/api/payouts/');
  },

  async getPayout(id: number): Promise<InfluencerPayout> {
    return apiClient.get<InfluencerPayout>(`/payments/api/payouts/${id}/`);
  },

  // =====================
  // Statistics
  // =====================
  
  async getPaymentStats(): Promise<PaymentStats> {
    return apiClient.get<PaymentStats>('/payments/api/stats/');
  },

  async getPayoutStats(): Promise<PayoutStats> {
    return apiClient.get<PayoutStats>('/payments/api/payout-stats/');
  },
};


// ===========================================
// Legacy Payment Record Support
// For the frontend Payments page tracking workflow
// ===========================================

// This is the simpler "payment tracking" model used in the frontend
// It tracks payments to influencers with receipts
export interface PaymentRecord {
  id: number;
  influencerId: number;
  influencer: {
    id: number;
    fullName: string;
    username: string;
    avatar?: string;
  };
  campaignId?: number;
  campaign?: {
    id: number;
    name: string;
  };
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'cancelled';
  paymentMethod: 'bank_transfer' | 'cash' | 'check' | 'mobile_money' | 'other';
  paymentDate?: string;
  dueDate: string;
  reference: string;
  notes?: string;
  receiptUrl?: string;
  receiptFileName?: string;
  createdAt: string;
}

// If you want to use a simple payment tracking system (separate from invoices)
// you'd create a separate PaymentRecord model in Django
// For now, you can either:
// 1. Use the Invoice system for all payments
// 2. Create a simpler PaymentRecord model for tracking influencer payments
