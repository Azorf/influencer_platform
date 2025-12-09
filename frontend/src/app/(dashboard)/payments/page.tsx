'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useInvoices, usePaymentHistory } from '@/lib/hooks';
import { formatDate, formatCurrency, cn } from '@/lib/utils';
import { INVOICE_STATUS, PAYMENT_STATUS } from '@/lib/utils/constants';
import type { InvoiceStatus } from '@/types';

export default function PaymentsPage() {
  const [activeTab, setActiveTab] = useState<'invoices' | 'history'>('invoices');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | ''>('');
  const [page, setPage] = useState(1);

  const {
    data: invoicesData,
    isLoading: isLoadingInvoices,
  } = useInvoices(
    {
      status: statusFilter || undefined,
      page,
      page_size: 10,
    },
    { enabled: activeTab === 'invoices' }
  );

  const {
    data: historyData,
    isLoading: isLoadingHistory,
  } = usePaymentHistory(
    { page, page_size: 10 },
    { enabled: activeTab === 'history' }
  );

  const isLoading = activeTab === 'invoices' ? isLoadingInvoices : isLoadingHistory;
  const invoices = invoicesData?.results || [];
  const payments = historyData?.results || [];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
        <Link
          href="/payments/methods"
          className="px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
        >
          Payment Methods
        </Link>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex gap-8">
          <button
            onClick={() => {
              setActiveTab('invoices');
              setPage(1);
            }}
            className={cn(
              'py-4 px-1 border-b-2 font-medium text-sm',
              activeTab === 'invoices'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            )}
          >
            Invoices
          </button>
          <button
            onClick={() => {
              setActiveTab('history');
              setPage(1);
            }}
            className={cn(
              'py-4 px-1 border-b-2 font-medium text-sm',
              activeTab === 'history'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            )}
          >
            Payment History
          </button>
        </nav>
      </div>

      {/* Filters (Invoices only) */}
      {activeTab === 'invoices' && (
        <div className="flex gap-4 mb-6">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as InvoiceStatus | '');
              setPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">All Statuses</option>
            {Object.entries(INVOICE_STATUS).map(([value, { label }]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center h-64">
          <div className="spinner" />
        </div>
      )}

      {/* Invoices Tab */}
      {!isLoading && activeTab === 'invoices' && (
        <>
          {invoices.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-gray-500">No invoices found</p>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Invoice
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Due Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          href={`/payments/invoices/${invoice.id}`}
                          className="text-primary-600 hover:underline font-medium"
                        >
                          {invoice.invoice_number}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {invoice.invoice_type.replace('_', ' ')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(invoice.total_amount, invoice.currency)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(invoice.due_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={cn(
                            'badge',
                            `badge-${INVOICE_STATUS[invoice.status]?.color || 'gray'}`
                          )}
                        >
                          {INVOICE_STATUS[invoice.status]?.label || invoice.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        {invoice.status === 'pending' && (
                          <Link
                            href={`/payments/invoices/${invoice.id}/pay`}
                            className="text-primary-600 hover:underline"
                          >
                            Pay Now
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Payment History Tab */}
      {!isLoading && activeTab === 'history' && (
        <>
          {payments.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-gray-500">No payment history found</p>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reference
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Invoice
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {payments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                        {payment.reference_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {payment.invoice_details?.invoice_number || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(payment.amount, payment.currency)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(payment.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={cn(
                            'badge',
                            `badge-${PAYMENT_STATUS[payment.status]?.color || 'gray'}`
                          )}
                        >
                          {PAYMENT_STATUS[payment.status]?.label || payment.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
