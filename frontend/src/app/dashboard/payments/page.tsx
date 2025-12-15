'use client';

import { useState, useRef } from 'react';

// Types based on Django models
type PaymentStatus = 'pending' | 'paid' | 'cancelled';
type PaymentMethod = 'bank_transfer' | 'cash' | 'check' | 'mobile_money' | 'other';

interface PaymentRecord {
  id: number;
  influencer: {
    id: number;
    name: string;
    handle: string;
    avatar: string;
  };
  campaign: {
    id: number;
    name: string;
  };
  amount: number;
  status: PaymentStatus;
  paymentMethod: PaymentMethod;
  paymentDate: string | null;
  dueDate: string;
  reference: string;
  notes: string;
  receiptUrl: string | null;
  receiptFileName: string | null;
  createdAt: string;
}

// Mock data
const mockPayments: PaymentRecord[] = [
  {
    id: 1,
    influencer: { id: 1, name: 'Sarah Lifestyle', handle: '@sarahlifestyle', avatar: 'S' },
    campaign: { id: 1, name: 'Summer Collection Launch 2024' },
    amount: 8000,
    status: 'paid',
    paymentMethod: 'bank_transfer',
    paymentDate: '2024-07-10',
    dueDate: '2024-07-15',
    reference: 'PAY-2024-001',
    notes: 'Full payment for 3 posts + 5 stories + 1 reel',
    receiptUrl: '/receipts/pay-001.pdf',
    receiptFileName: 'receipt-sarah-july2024.pdf',
    createdAt: '2024-06-28',
  },
  {
    id: 2,
    influencer: { id: 3, name: 'Fatima Beauty', handle: '@fatimabeauty', avatar: 'F' },
    campaign: { id: 1, name: 'Summer Collection Launch 2024' },
    amount: 12000,
    status: 'paid',
    paymentMethod: 'bank_transfer',
    paymentDate: '2024-07-18',
    dueDate: '2024-07-20',
    reference: 'PAY-2024-002',
    notes: 'First installment - 50% upfront',
    receiptUrl: '/receipts/pay-002.pdf',
    receiptFileName: 'receipt-fatima-july2024.pdf',
    createdAt: '2024-07-01',
  },
  {
    id: 3,
    influencer: { id: 3, name: 'Fatima Beauty', handle: '@fatimabeauty', avatar: 'F' },
    campaign: { id: 1, name: 'Summer Collection Launch 2024' },
    amount: 12000,
    status: 'pending',
    paymentMethod: 'bank_transfer',
    paymentDate: null,
    dueDate: '2024-08-15',
    reference: 'PAY-2024-003',
    notes: 'Final payment - 50% on completion',
    receiptUrl: null,
    receiptFileName: null,
    createdAt: '2024-07-01',
  },
  {
    id: 4,
    influencer: { id: 2, name: 'Youssef Tech', handle: '@yousseftech', avatar: 'Y' },
    campaign: { id: 2, name: 'Tech Review Campaign' },
    amount: 5000,
    status: 'pending',
    paymentMethod: 'mobile_money',
    paymentDate: null,
    dueDate: '2024-07-25',
    reference: 'PAY-2024-004',
    notes: 'Payment for YouTube review',
    receiptUrl: null,
    receiptFileName: null,
    createdAt: '2024-07-10',
  },
  {
    id: 5,
    influencer: { id: 4, name: 'Amina Food', handle: '@aminafood', avatar: 'A' },
    campaign: { id: 3, name: 'Ramadan Food Series' },
    amount: 15000,
    status: 'paid',
    paymentMethod: 'cash',
    paymentDate: '2024-03-20',
    dueDate: '2024-03-25',
    reference: 'PAY-2024-005',
    notes: 'Full campaign payment',
    receiptUrl: '/receipts/pay-005.pdf',
    receiptFileName: 'receipt-amina-march2024.pdf',
    createdAt: '2024-03-01',
  },
];

const statusColors: Record<PaymentStatus, string> = {
  paid: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  cancelled: 'bg-red-100 text-red-800',
};

const paymentMethodLabels: Record<PaymentMethod, string> = {
  bank_transfer: 'Bank Transfer',
  cash: 'Cash',
  check: 'Check',
  mobile_money: 'Mobile Money',
  other: 'Other',
};

const paymentMethodIcons: Record<PaymentMethod, string> = {
  bank_transfer: '🏦',
  cash: '💵',
  check: '📄',
  mobile_money: '📱',
  other: '💳',
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD' }).format(amount);
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function isOverdue(dueDate: string, status: PaymentStatus): boolean {
  if (status === 'paid' || status === 'cancelled') return false;
  return new Date(dueDate) < new Date();
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentRecord[]>(mockPayments);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'paid'>('all');
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [showPaymentDetailModal, setShowPaymentDetailModal] = useState<PaymentRecord | null>(null);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingFor, setUploadingFor] = useState<number | null>(null);

  // New payment form
  const [paymentForm, setPaymentForm] = useState({
    influencerName: '',
    influencerHandle: '',
    campaignName: '',
    amount: '',
    paymentMethod: 'bank_transfer' as PaymentMethod,
    dueDate: '',
    notes: '',
  });

  // Filter payments
  const filteredPayments = payments.filter(p => {
    const matchesTab = activeTab === 'all' || p.status === activeTab;
    const matchesSearch = searchQuery === '' || 
      p.influencer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.influencer.handle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.reference.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  // Stats
  const totalPaid = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
  const totalPending = payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0);
  const overdueCount = payments.filter(p => isOverdue(p.dueDate, p.status)).length;
  const overdueAmount = payments.filter(p => isOverdue(p.dueDate, p.status)).reduce((sum, p) => sum + p.amount, 0);

  const handleAddPayment = () => {
    const newPayment: PaymentRecord = {
      id: Date.now(),
      influencer: {
        id: Date.now(),
        name: paymentForm.influencerName,
        handle: paymentForm.influencerHandle,
        avatar: paymentForm.influencerName.charAt(0).toUpperCase(),
      },
      campaign: {
        id: Date.now(),
        name: paymentForm.campaignName,
      },
      amount: parseFloat(paymentForm.amount) || 0,
      status: 'pending',
      paymentMethod: paymentForm.paymentMethod,
      paymentDate: null,
      dueDate: paymentForm.dueDate,
      reference: `PAY-${new Date().getFullYear()}-${String(payments.length + 1).padStart(3, '0')}`,
      notes: paymentForm.notes,
      receiptUrl: null,
      receiptFileName: null,
      createdAt: new Date().toISOString().split('T')[0],
    };

    setPayments([newPayment, ...payments]);
    setPaymentForm({
      influencerName: '',
      influencerHandle: '',
      campaignName: '',
      amount: '',
      paymentMethod: 'bank_transfer',
      dueDate: '',
      notes: '',
    });
    setShowAddPaymentModal(false);
  };

  const handleUploadReceipt = (paymentId: number, file: File) => {
    // Simulate file upload - uploading receipt automatically marks payment as paid
    const fileName = file.name;
    const fakeUrl = `/receipts/${fileName}`;
    
    setPayments(payments.map(p => 
      p.id === paymentId
        ? { 
            ...p, 
            receiptUrl: fakeUrl, 
            receiptFileName: fileName,
            status: 'paid' as PaymentStatus,
            paymentDate: new Date().toISOString().split('T')[0]
          }
        : p
    ));
    
    if (showPaymentDetailModal?.id === paymentId) {
      setShowPaymentDetailModal({ 
        ...showPaymentDetailModal, 
        receiptUrl: fakeUrl, 
        receiptFileName: fileName,
        status: 'paid',
        paymentDate: new Date().toISOString().split('T')[0]
      });
    }
    
    setUploadingFor(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && uploadingFor) {
      handleUploadReceipt(uploadingFor, file);
    }
    e.target.value = '';
  };

  const triggerFileUpload = (paymentId: number) => {
    setUploadingFor(paymentId);
    fileInputRef.current?.click();
  };

  const handleDownloadReceipt = (payment: PaymentRecord) => {
    // In real app, this would download the actual file
    alert(`Downloading: ${payment.receiptFileName}`);
  };

  const handleDeletePayment = (paymentId: number) => {
    setPayments(payments.filter(p => p.id !== paymentId));
    setShowPaymentDetailModal(null);
    setShowDeleteConfirmModal(null);
  };

  return (
    <div className="p-8">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept=".pdf,.jpg,.jpeg,.png"
        className="hidden"
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment Records</h1>
          <p className="text-gray-600 mt-1">Track influencer payments and manage receipts</p>
        </div>
        <button
          onClick={() => setShowAddPaymentModal(true)}
          className="px-4 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800"
        >
          + Record Payment
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500 mb-1">Total Paid</div>
            <span className="text-green-500 text-lg">✓</span>
          </div>
          <div className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</div>
          <div className="text-xs text-gray-400 mt-1">{payments.filter(p => p.status === 'paid').length} payments</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500 mb-1">Pending</div>
            <span className="text-yellow-500 text-lg">⏳</span>
          </div>
          <div className="text-2xl font-bold text-yellow-600">{formatCurrency(totalPending)}</div>
          <div className="text-xs text-gray-400 mt-1">{payments.filter(p => p.status === 'pending').length} payments</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500 mb-1">Overdue</div>
            <span className="text-red-500 text-lg">⚠️</span>
          </div>
          <div className="text-2xl font-bold text-red-600">{formatCurrency(overdueAmount)}</div>
          <div className="text-xs text-gray-400 mt-1">{overdueCount} payments overdue</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500 mb-1">Total Records</div>
            <span className="text-gray-400 text-lg">📋</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{payments.length}</div>
          <div className="text-xs text-gray-400 mt-1">{payments.filter(p => p.receiptUrl).length} with receipts</div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-2">
          {(['all', 'pending', 'paid'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium rounded-lg capitalize ${
                activeTab === tab
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="Search by name, campaign, reference..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-80 pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200"
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Payment Records Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Influencer</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Campaign</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Receipt</th>
              <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredPayments.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                  <div className="text-4xl mb-3">💸</div>
                  <div className="font-medium">No payment records found</div>
                  <div className="text-sm">Try adjusting your filters or add a new payment record</div>
                </td>
              </tr>
            ) : (
              filteredPayments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-white font-medium">
                        {payment.influencer.avatar}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{payment.influencer.name}</div>
                        <div className="text-sm text-gray-500">{payment.influencer.handle}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{payment.campaign.name}</div>
                    <div className="text-xs text-gray-400">{payment.reference}</div>
                  </td>
                  <td className="px-6 py-4 font-semibold text-gray-900">
                    {formatCurrency(payment.amount)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                      <span>{paymentMethodIcons[payment.paymentMethod]}</span>
                      <span>{paymentMethodLabels[payment.paymentMethod]}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                      isOverdue(payment.dueDate, payment.status)
                        ? 'bg-red-100 text-red-800'
                        : statusColors[payment.status]
                    }`}>
                      {isOverdue(payment.dueDate, payment.status) ? 'Overdue' : payment.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {formatDate(payment.dueDate)}
                    {payment.paymentDate && (
                      <div className="text-xs text-green-600">Paid: {formatDate(payment.paymentDate)}</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {payment.receiptUrl ? (
                      <button
                        onClick={() => handleDownloadReceipt(payment)}
                        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Download
                      </button>
                    ) : (
                      <button
                        onClick={() => triggerFileUpload(payment.id)}
                        className="inline-flex items-center gap-1 text-sm text-green-600 hover:text-green-700 font-medium"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        Upload & Mark Paid
                      </button>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setShowPaymentDetailModal(payment)}
                        className="text-sm text-gray-500 hover:text-gray-900"
                      >
                        View
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Payment Modal */}
      {showAddPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowAddPaymentModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Record Payment</h2>
              <button onClick={() => setShowAddPaymentModal(false)} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500">✕</button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Influencer Name</label>
                  <input
                    type="text"
                    value={paymentForm.influencerName}
                    onChange={(e) => setPaymentForm({ ...paymentForm, influencerName: e.target.value })}
                    placeholder="Sarah Lifestyle"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Handle</label>
                  <input
                    type="text"
                    value={paymentForm.influencerHandle}
                    onChange={(e) => setPaymentForm({ ...paymentForm, influencerHandle: e.target.value })}
                    placeholder="@sarahlifestyle"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Campaign</label>
                <input
                  type="text"
                  value={paymentForm.campaignName}
                  onChange={(e) => setPaymentForm({ ...paymentForm, campaignName: e.target.value })}
                  placeholder="Summer Collection Launch 2024"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount (MAD)</label>
                  <input
                    type="number"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                    placeholder="5000"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={paymentForm.dueDate}
                    onChange={(e) => setPaymentForm({ ...paymentForm, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                <select
                  value={paymentForm.paymentMethod}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value as PaymentMethod })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
                >
                  <option value="bank_transfer">🏦 Bank Transfer</option>
                  <option value="cash">💵 Cash</option>
                  <option value="check">📄 Check</option>
                  <option value="mobile_money">📱 Mobile Money (CashPlus, etc.)</option>
                  <option value="other">💳 Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  placeholder="Payment details, deliverables covered, etc."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowAddPaymentModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
                Cancel
              </button>
              <button
                onClick={handleAddPayment}
                disabled={!paymentForm.influencerName || !paymentForm.amount || !paymentForm.dueDate}
                className="px-4 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 disabled:opacity-50"
              >
                Add Payment Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Detail Modal */}
      {showPaymentDetailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowPaymentDetailModal(null)}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Payment Details</h2>
                <p className="text-sm text-gray-500">{showPaymentDetailModal.reference}</p>
              </div>
              <button onClick={() => setShowPaymentDetailModal(null)} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500">✕</button>
            </div>

            <div className="p-6 space-y-6">
              {/* Influencer & Campaign */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-14 h-14 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-white font-medium text-xl">
                  {showPaymentDetailModal.influencer.avatar}
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{showPaymentDetailModal.influencer.name}</div>
                  <div className="text-sm text-gray-500">{showPaymentDetailModal.influencer.handle}</div>
                  <div className="text-sm text-gray-400">{showPaymentDetailModal.campaign.name}</div>
                </div>
              </div>

              {/* Amount & Status */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500">Amount</div>
                  <div className="text-3xl font-bold text-gray-900">{formatCurrency(showPaymentDetailModal.amount)}</div>
                </div>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium capitalize ${
                  isOverdue(showPaymentDetailModal.dueDate, showPaymentDetailModal.status)
                    ? 'bg-red-100 text-red-800'
                    : statusColors[showPaymentDetailModal.status]
                }`}>
                  {isOverdue(showPaymentDetailModal.dueDate, showPaymentDetailModal.status) ? 'Overdue' : showPaymentDetailModal.status}
                </span>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-500">Payment Method</div>
                  <div className="text-sm font-medium text-gray-900 flex items-center gap-1">
                    <span>{paymentMethodIcons[showPaymentDetailModal.paymentMethod]}</span>
                    {paymentMethodLabels[showPaymentDetailModal.paymentMethod]}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-500">Due Date</div>
                  <div className="text-sm font-medium text-gray-900">{formatDate(showPaymentDetailModal.dueDate)}</div>
                </div>
                {showPaymentDetailModal.paymentDate && (
                  <div className="bg-green-50 rounded-lg p-3">
                    <div className="text-xs text-green-600">Payment Date</div>
                    <div className="text-sm font-medium text-green-700">{formatDate(showPaymentDetailModal.paymentDate)}</div>
                  </div>
                )}
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-500">Created</div>
                  <div className="text-sm font-medium text-gray-900">{formatDate(showPaymentDetailModal.createdAt)}</div>
                </div>
              </div>

              {/* Notes */}
              {showPaymentDetailModal.notes && (
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">Notes</div>
                  <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{showPaymentDetailModal.notes}</p>
                </div>
              )}

              {/* Receipt */}
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">Receipt</div>
                {showPaymentDetailModal.receiptUrl ? (
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{showPaymentDetailModal.receiptFileName}</div>
                        <div className="text-xs text-gray-500">PDF Document</div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDownloadReceipt(showPaymentDetailModal)}
                      className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-white rounded-lg hover:bg-blue-50"
                    >
                      Download
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => triggerFileUpload(showPaymentDetailModal.id)}
                    className="w-full p-4 border-2 border-dashed border-green-300 rounded-lg text-center hover:bg-green-50 transition-colors"
                  >
                    <svg className="w-8 h-8 text-green-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    <div className="text-sm font-medium text-green-700">Upload Receipt to Mark as Paid</div>
                    <div className="text-xs text-green-600/70">PDF, JPG, PNG up to 10MB</div>
                  </button>
                )}
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-between">
              <button
                onClick={() => setShowDeleteConfirmModal(showPaymentDetailModal.id)}
                className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700"
              >
                Delete Record
              </button>
              <div className="flex gap-3">
                {showPaymentDetailModal.status === 'pending' && !showPaymentDetailModal.receiptUrl && (
                  <button
                    onClick={() => triggerFileUpload(showPaymentDetailModal.id)}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
                  >
                    📎 Upload Receipt
                  </button>
                )}
                <button onClick={() => setShowPaymentDetailModal(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50" onClick={() => setShowDeleteConfirmModal(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Payment Record?</h3>
              <p className="text-gray-600 mb-6">Are you sure you want to delete this payment record? This action cannot be undone.</p>
              <div className="flex gap-3 justify-center">
                <button 
                  onClick={() => setShowDeleteConfirmModal(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleDeletePayment(showDeleteConfirmModal)}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}