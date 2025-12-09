import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from '@tanstack/react-query';
import { paymentsApi } from '@/lib/api/payments';
import { paymentKeys } from '@/lib/query-keys';
import type {
  ApiError,
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
// Query Hooks
// =============================================================================

/**
 * Hook to list payment methods
 * Maps to GET /payments/methods/
 */
export const usePaymentMethods = (
  options?: Omit<
    UseQueryOptions<PaymentMethod[], ApiError>,
    'queryKey' | 'queryFn'
  >
) => {
  return useQuery<PaymentMethod[], ApiError>({
    queryKey: paymentKeys.methods(),
    queryFn: paymentsApi.listPaymentMethods,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

/**
 * Hook to list invoices
 * Maps to GET /payments/invoices/
 */
export const useInvoices = (
  params?: InvoiceListParams,
  options?: Omit<
    UseQueryOptions<PaginatedResponse<Invoice>, ApiError>,
    'queryKey' | 'queryFn'
  >
) => {
  return useQuery<PaginatedResponse<Invoice>, ApiError>({
    queryKey: paymentKeys.invoiceList(params as Record<string, unknown>),
    queryFn: () => paymentsApi.listInvoices(params),
    ...options,
  });
};

/**
 * Hook to get invoice details
 * Maps to GET /payments/invoices/:pk/
 */
export const useInvoice = (
  id: number,
  options?: Omit<
    UseQueryOptions<InvoiceWithLineItems, ApiError>,
    'queryKey' | 'queryFn'
  >
) => {
  return useQuery<InvoiceWithLineItems, ApiError>({
    queryKey: paymentKeys.invoice(id),
    queryFn: () => paymentsApi.getInvoice(id),
    enabled: id > 0,
    ...options,
  });
};

/**
 * Hook to get payment history
 * Maps to GET /payments/history/
 */
export const usePaymentHistory = (
  params?: PaymentHistoryParams,
  options?: Omit<
    UseQueryOptions<PaginatedResponse<PaymentWithInvoice>, ApiError>,
    'queryKey' | 'queryFn'
  >
) => {
  return useQuery<PaginatedResponse<PaymentWithInvoice>, ApiError>({
    queryKey: paymentKeys.history(params as Record<string, unknown>),
    queryFn: () => paymentsApi.getPaymentHistory(params),
    ...options,
  });
};

/**
 * Hook to get payment details
 * Maps to GET /payments/:pk/
 */
export const usePayment = (
  id: number,
  options?: Omit<
    UseQueryOptions<PaymentWithInvoice, ApiError>,
    'queryKey' | 'queryFn'
  >
) => {
  return useQuery<PaymentWithInvoice, ApiError>({
    queryKey: paymentKeys.payment(id),
    queryFn: () => paymentsApi.getPayment(id),
    enabled: id > 0,
    ...options,
  });
};

/**
 * Hook to list payouts (for influencers)
 * Maps to GET /payments/payouts/
 */
export const usePayouts = (
  params?: PayoutListParams,
  options?: Omit<
    UseQueryOptions<PaginatedResponse<PayoutWithDetails>, ApiError>,
    'queryKey' | 'queryFn'
  >
) => {
  return useQuery<PaginatedResponse<PayoutWithDetails>, ApiError>({
    queryKey: paymentKeys.payoutList(params as Record<string, unknown>),
    queryFn: () => paymentsApi.listPayouts(params),
    ...options,
  });
};

/**
 * Hook to get payout details
 * Maps to GET /payments/payouts/:pk/
 */
export const usePayout = (
  id: number,
  options?: Omit<
    UseQueryOptions<PayoutWithDetails, ApiError>,
    'queryKey' | 'queryFn'
  >
) => {
  return useQuery<PayoutWithDetails, ApiError>({
    queryKey: paymentKeys.payout(id),
    queryFn: () => paymentsApi.getPayout(id),
    enabled: id > 0,
    ...options,
  });
};

// =============================================================================
// Mutation Hooks
// =============================================================================

/**
 * Hook for adding a payment method
 * Maps to POST /payments/methods/add/
 */
export const useAddPaymentMethod = (
  options?: UseMutationOptions<PaymentMethod, ApiError, AddPaymentMethodRequest>
) => {
  const queryClient = useQueryClient();

  return useMutation<PaymentMethod, ApiError, AddPaymentMethodRequest>({
    mutationFn: paymentsApi.addPaymentMethod,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.methods() });
    },
    ...options,
  });
};

/**
 * Hook for deleting a payment method
 * Maps to DELETE /payments/methods/:pk/delete/
 */
export const useDeletePaymentMethod = (
  options?: UseMutationOptions<void, ApiError, number>
) => {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, number>({
    mutationFn: paymentsApi.deletePaymentMethod,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.methods() });
    },
    ...options,
  });
};

/**
 * Hook for setting default payment method
 * Maps to POST /payments/methods/:pk/set-default/
 */
export const useSetDefaultPaymentMethod = (
  options?: UseMutationOptions<PaymentMethod, ApiError, number>
) => {
  const queryClient = useQueryClient();

  return useMutation<PaymentMethod, ApiError, number>({
    mutationFn: paymentsApi.setDefaultPaymentMethod,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.methods() });
    },
    ...options,
  });
};

/**
 * Hook for paying an invoice
 * Maps to POST /payments/invoices/:pk/pay/
 */
export const usePayInvoice = (
  options?: UseMutationOptions<
    Payment,
    ApiError,
    { invoiceId: number; data: PayInvoiceRequest }
  >
) => {
  const queryClient = useQueryClient();

  return useMutation<Payment, ApiError, { invoiceId: number; data: PayInvoiceRequest }>({
    mutationFn: ({ invoiceId, data }: { invoiceId: number; data: PayInvoiceRequest }) =>
      paymentsApi.payInvoice(invoiceId, data),
    onSuccess: (_data: Payment, variables: { invoiceId: number; data: PayInvoiceRequest }) => {
      queryClient.invalidateQueries({
        queryKey: paymentKeys.invoice(variables.invoiceId),
      });
      queryClient.invalidateQueries({ queryKey: paymentKeys.invoices() });
      queryClient.invalidateQueries({ queryKey: paymentKeys.history() });
    },
    ...options,
  });
};

/**
 * Hook for creating a payment intent (Stripe)
 * Maps to POST /payments/invoices/:pk/create-payment-intent/
 */
export const useCreatePaymentIntent = (
  options?: UseMutationOptions<CreatePaymentIntentResponse, ApiError, number>
) => {
  return useMutation<CreatePaymentIntentResponse, ApiError, number>({
    mutationFn: paymentsApi.createPaymentIntent,
    ...options,
  });
};

/**
 * Hook for requesting a refund
 * Maps to POST /payments/:pk/request-refund/
 */
export const useRequestRefund = (
  options?: UseMutationOptions<
    { success: boolean; message: string },
    ApiError,
    { paymentId: number; reason: string }
  >
) => {
  const queryClient = useQueryClient();

  return useMutation<
    { success: boolean; message: string },
    ApiError,
    { paymentId: number; reason: string }
  >({
    mutationFn: ({ paymentId, reason }: { paymentId: number; reason: string }) =>
      paymentsApi.requestRefund(paymentId, reason),
    onSuccess: (_data: { success: boolean; message: string }, variables: { paymentId: number; reason: string }) => {
      queryClient.invalidateQueries({
        queryKey: paymentKeys.payment(variables.paymentId),
      });
      queryClient.invalidateQueries({ queryKey: paymentKeys.history() });
    },
    ...options,
  });
};

/**
 * Hook for creating a setup intent (Stripe)
 * Maps to POST /payments/stripe/setup-intent/
 */
export const useCreateSetupIntent = (
  options?: UseMutationOptions<{ client_secret: string }, ApiError, void>
) => {
  return useMutation<{ client_secret: string }, ApiError, void>({
    mutationFn: paymentsApi.createSetupIntent,
    ...options,
  });
};

/**
 * Hook for updating payout bank details
 * Maps to POST /payments/payouts/:pk/update-bank-details/
 */
export const useUpdatePayoutBankDetails = (
  options?: UseMutationOptions<
    InfluencerPayout,
    ApiError,
    {
      payoutId: number;
      data: { bank_name: string; account_holder_name: string; iban: string };
    }
  >
) => {
  const queryClient = useQueryClient();

  return useMutation<
    InfluencerPayout,
    ApiError,
    {
      payoutId: number;
      data: { bank_name: string; account_holder_name: string; iban: string };
    }
  >({
    mutationFn: ({ payoutId, data }: { payoutId: number; data: { bank_name: string; account_holder_name: string; iban: string } }) =>
      paymentsApi.updatePayoutBankDetails(payoutId, data),
    onSuccess: (_data: InfluencerPayout, variables: { payoutId: number; data: { bank_name: string; account_holder_name: string; iban: string } }) => {
      queryClient.invalidateQueries({
        queryKey: paymentKeys.payout(variables.payoutId),
      });
      queryClient.invalidateQueries({ queryKey: paymentKeys.payouts() });
    },
    ...options,
  });
};

// =============================================================================
// Export All Hooks
// =============================================================================

export const paymentHooks = {
  // Queries
  usePaymentMethods,
  useInvoices,
  useInvoice,
  usePaymentHistory,
  usePayment,
  usePayouts,
  usePayout,
  // Mutations
  useAddPaymentMethod,
  useDeletePaymentMethod,
  useSetDefaultPaymentMethod,
  usePayInvoice,
  useCreatePaymentIntent,
  useRequestRefund,
  useCreateSetupIntent,
  useUpdatePayoutBankDetails,
};

export default paymentHooks;
