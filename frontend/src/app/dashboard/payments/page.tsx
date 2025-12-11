'use client';

import { useState } from 'react';

// Mock data
const mockInvoices = [
  { id: 1, number: 'INV-001', campaign: 'Summer Collection Launch', amount: 3500, status: 'paid', dueDate: '2024-07-15', paidDate: '2024-07-10' },
  { id: 2, number: 'INV-002', campaign: 'Summer Collection Launch', amount: 3000, status: 'paid', dueDate: '2024-07-20', paidDate: '2024-07-18' },
  { id: 3, number: 'INV-003', campaign: 'Holiday Promotions', amount: 5000, status: 'pending', dueDate: '2024-08-01', paidDate: null },
  { id: 4, number: 'INV-004', campaign: 'Holiday Promotions', amount: 2500, status: 'overdue', dueDate: '2024-07-25', paidDate: null },
];

const mockPaymentMethods = [
  { id: 1, type: 'card', last4: '4242', brand: 'Visa', isDefault: true },
];

const statusColors: Record<string, string> = {
  paid: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  overdue: 'bg-red-100 text-red-800',
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD' }).format(amount);
}

export default function PaymentsPage() {
  const [activeTab, setActiveTab] = useState<'invoices' | 'methods'>('invoices');

  const totalPaid = mockInvoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.amount, 0);
  const totalPending = mockInvoices.filter(i => i.status === 'pending').reduce((sum, i) => sum + i.amount, 0);
  const totalOverdue = mockInvoices.filter(i => i.status === 'overdue').reduce((sum, i) => sum + i.amount, 0);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-600 mt-1">Manage invoices and payment methods</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="text-sm text-gray-500 mb-1">Total Paid</div>
          <div className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="text-sm text-gray-500 mb-1">Pending</div>
          <div className="text-2xl font-bold text-yellow-600">{formatCurrency(totalPending)}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="text-sm text-gray-500 mb-1">Overdue</div>
          <div className="text-2xl font-bold text-red-600">{formatCurrency(totalOverdue)}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="text-sm text-gray-500 mb-1">Total Invoices</div>
          <div className="text-2xl font-bold text-gray-900">{mockInvoices.length}</div>
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
          onClick={() => setActiveTab('methods')}
          className={`pb-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeTab === 'methods'
              ? 'border-gray-900 text-gray-900'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Payment Methods
        </button>
      </div>

      {activeTab === 'invoices' ? (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Campaign</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {mockInvoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{invoice.number}</div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {invoice.campaign}
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {formatCurrency(invoice.amount)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${statusColors[invoice.status]}`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {invoice.dueDate}
                  </td>
                  <td className="px-6 py-4 text-right space-x-3">
                    <button className="text-sm text-gray-500 hover:text-gray-900">View</button>
                    {invoice.status !== 'paid' && (
                      <button className="text-sm font-medium text-gray-900 hover:text-gray-600">Pay Now</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Existing Payment Methods */}
          {mockPaymentMethods.map((method) => (
            <div key={method.id} className="bg-white rounded-lg border border-gray-200 p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-8 bg-gray-100 rounded flex items-center justify-center text-xs font-medium text-gray-600">
                  {method.brand}
                </div>
                <div>
                  <div className="font-medium text-gray-900">•••• •••• •••• {method.last4}</div>
                  <div className="text-sm text-gray-500">
                    {method.isDefault && (
                      <span className="text-green-600">Default payment method</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <button className="text-sm text-gray-500 hover:text-gray-900">Edit</button>
                <button className="text-sm text-red-600 hover:text-red-700">Remove</button>
              </div>
            </div>
          ))}

          {/* Add Payment Method */}
          <button className="w-full bg-white rounded-lg border border-dashed border-gray-300 p-6 text-center hover:bg-gray-50 transition-colors">
            <div className="text-gray-500">+ Add Payment Method</div>
          </button>
        </div>
      )}
    </div>
  );
}
