'use client';

import { useState, useEffect, useRef } from 'react';
import { paymentService } from '@/lib/payment-service';
import type { Invoice, PaymentTransaction, InvoiceStatus } from '@/lib/payment-service';

const statusColors: Record<string, string> = {
  paid: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  overdue: 'bg-red-100 text-red-800',
  draft: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-gray-100 text-gray-600',
  refunded: 'bg-purple-100 text-purple-800',
};

function formatCurrency(amount: number, currency: string = 'MAD'): string {
  return new Intl.NumberFormat('fr-MA', { style: 'currency', currency }).format(amount);
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function PaymentsPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'invoices' | 'payments'>('invoices');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [paying, setPaying] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    totalPaid: 0,
    pendingAmount: 0,
    pendingCount: 0,
    overdueAmount: 0,
    overdueCount: 0,
  });

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  async function fetchData() {
    try {
      setLoading(true);
      setError(null);

      // Fetch invoices
      const invoiceData = await paymentService.getInvoices({
        status: statusFilter === 'all' ? undefined : statusFilter as InvoiceStatus,
      });
      setInvoices(invoiceData);

      // Fetch payments
      const paymentData = await paymentService.getPayments();
      setPayments(paymentData);

      // Fetch stats
      const statsData = await paymentService.getPaymentStats();
      setStats({
        totalPaid: statsData.totalPaid,
        pendingAmount: statsData.pendingInvoices.amount,
        pendingCount: statsData.pendingInvoices.count,
        overdueAmount: statsData.overdueInvoices.amount,
        overdueCount: statsData.overdueInvoices.count,
      });
    } catch (err) {
      console.error('Failed to fetch payment data:', err);
      setError('Failed to load payment data');
    } finally {
      setLoading(false);
    }
  }

  async function handlePayInvoice(invoiceId: number) {
    try {
      setPaying(true);
      await paymentService.payInvoice(invoiceId);
      await fetchData();
      setSelectedInvoice(null);
    } catch (err) {
      console.error('Payment failed:', err);
      alert('Payment failed. Please try again.');
    } finally {
      setPaying(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
          <button 
            onClick={fetchData} 
            className="ml-4 underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
        <p className="text-gray-600 mt-1">Manage invoices and payment transactions</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="text-sm text-gray-500 mb-1">Total Paid</div>
          <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalPaid)}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="text-sm text-gray-500 mb-1">Pending</div>
          <div className="text-2xl font-bold text-yellow-600">{formatCurrency(stats.pendingAmount)}</div>
          <div className="text-xs text-gray-400">{stats.pendingCount} invoices</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="text-sm text-gray-500 mb-1">Overdue</div>
          <div className="text-2xl font-bold text-red-600">{formatCurrency(stats.overdueAmount)}</div>
          <div className="text-xs text-gray-400">{stats.overdueCount} invoices</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="text-sm text-gray-500 mb-1">Total Invoices</div>
          <div className="text-2xl font-bold text-gray-900">{invoices.length}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('invoices')}
          className={`pb-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeTab === 'invoices'
              ? 'border-gray-900 text-gray-900'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Invoices
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={`pb-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeTab === 'payments'
              ? 'border-gray-900 text-gray-900'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Payment History
        </button>
      </div>

      {/* Filters */}
      {activeTab === 'invoices' && (
        <div className="flex gap-2 mb-6">
          {['all', 'pending', 'paid', 'overdue', 'cancelled'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors capitalize ${
                statusFilter === status
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      )}

      {/* Invoices Tab */}
      {activeTab === 'invoices' && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{invoice.invoiceNumber}</div>
                    <div className="text-sm text-gray-500">{formatDate(invoice.createdAt)}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600 capitalize">
                      {invoice.invoiceType.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                      invoice.isOverdue ? 'bg-red-100 text-red-800' : statusColors[invoice.status]
                    }`}>
                      {invoice.isOverdue ? 'overdue' : invoice.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{formatCurrency(invoice.totalAmount, invoice.currency)}</div>
                    {invoice.taxAmount > 0 && (
                      <div className="text-xs text-gray-500">Tax: {formatCurrency(invoice.taxAmount, invoice.currency)}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-600 text-sm">
                    {formatDate(invoice.dueDate)}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button 
                      onClick={() => setSelectedInvoice(invoice)}
                      className="text-sm font-medium text-gray-600 hover:text-gray-900"
                    >
                      View
                    </button>
                    {invoice.status === 'pending' && (
                      <button 
                        onClick={() => handlePayInvoice(invoice.id)}
                        disabled={paying}
                        className="text-sm font-medium text-green-600 hover:text-green-700 disabled:opacity-50"
                      >
                        Pay Now
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {invoices.length === 0 && (
            <div className="p-12 text-center text-gray-500">
              No invoices found
            </div>
          )}
        </div>
      )}

      {/* Payments Tab */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {payments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{payment.referenceNumber}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">{payment.invoiceNumber || '-'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600 capitalize">
                      {payment.paymentMethod.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                      payment.status === 'succeeded' ? 'bg-green-100 text-green-800' :
                      payment.status === 'failed' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {payment.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{formatCurrency(payment.amount, payment.currency)}</div>
                  </td>
                  <td className="px-6 py-4 text-gray-600 text-sm">
                    {formatDate(payment.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {payments.length === 0 && (
            <div className="p-12 text-center text-gray-500">
              No payment history found
            </div>
          )}
        </div>
      )}

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setSelectedInvoice(null)}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Invoice Details</h2>
                <p className="text-sm text-gray-500">{selectedInvoice.invoiceNumber}</p>
              </div>
              <button 
                onClick={() => setSelectedInvoice(null)} 
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Amount & Status */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500">Total Amount</div>
                  <div className="text-3xl font-bold text-gray-900">
                    {formatCurrency(selectedInvoice.totalAmount, selectedInvoice.currency)}
                  </div>
                </div>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium capitalize ${
                  selectedInvoice.isOverdue ? 'bg-red-100 text-red-800' : statusColors[selectedInvoice.status]
                }`}>
                  {selectedInvoice.isOverdue ? 'Overdue' : selectedInvoice.status}
                </span>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-500">Type</div>
                  <div className="text-sm font-medium text-gray-900 capitalize">
                    {selectedInvoice.invoiceType.replace('_', ' ')}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-500">Issue Date</div>
                  <div className="text-sm font-medium text-gray-900">{formatDate(selectedInvoice.issueDate)}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-500">Due Date</div>
                  <div className="text-sm font-medium text-gray-900">{formatDate(selectedInvoice.dueDate)}</div>
                </div>
                {selectedInvoice.paidDate && (
                  <div className="bg-green-50 rounded-lg p-3">
                    <div className="text-xs text-green-600">Paid Date</div>
                    <div className="text-sm font-medium text-green-700">{formatDate(selectedInvoice.paidDate)}</div>
                  </div>
                )}
              </div>

              {/* Line Items */}
              {selectedInvoice.lineItems && selectedInvoice.lineItems.length > 0 && (
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">Line Items</div>
                  <div className="bg-gray-50 rounded-lg divide-y divide-gray-200">
                    {selectedInvoice.lineItems.map((item) => (
                      <div key={item.id} className="p-3 flex justify-between">
                        <div>
                          <div className="text-sm text-gray-900">{item.description}</div>
                          <div className="text-xs text-gray-500">Qty: {item.quantity}</div>
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(item.totalPrice, selectedInvoice.currency)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Summary */}
              <div className="border-t border-gray-200 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="text-gray-900">{formatCurrency(selectedInvoice.subtotal, selectedInvoice.currency)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tax ({(selectedInvoice.taxRate * 100).toFixed(0)}%)</span>
                  <span className="text-gray-900">{formatCurrency(selectedInvoice.taxAmount, selectedInvoice.currency)}</span>
                </div>
                <div className="flex justify-between text-base font-bold pt-2 border-t border-gray-200">
                  <span className="text-gray-900">Total</span>
                  <span className="text-gray-900">{formatCurrency(selectedInvoice.totalAmount, selectedInvoice.currency)}</span>
                </div>
              </div>

              {/* Notes */}
              {selectedInvoice.notes && (
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">Notes</div>
                  <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{selectedInvoice.notes}</p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button 
                onClick={() => setSelectedInvoice(null)} 
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
              {selectedInvoice.status === 'pending' && (
                <button 
                  onClick={() => handlePayInvoice(selectedInvoice.id)}
                  disabled={paying}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {paying ? 'Processing...' : 'Pay Now'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
