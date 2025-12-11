'use client';

import { useState } from 'react';
import Link from 'next/link';

// Mock data - will connect to API later
const mockCampaigns = [
  { id: 1, name: 'Summer Collection Launch', brand: 'Fashion Brand', status: 'active', influencers: 5, budget: 15000, spent: 8500, startDate: '2024-06-01', endDate: '2024-07-31' },
  { id: 2, name: 'Ramadan Special', brand: 'Food Company', status: 'completed', influencers: 8, budget: 25000, spent: 24500, startDate: '2024-03-10', endDate: '2024-04-09' },
  { id: 3, name: 'Back to School', brand: 'Education Platform', status: 'draft', influencers: 0, budget: 10000, spent: 0, startDate: '2024-09-01', endDate: '2024-09-30' },
  { id: 4, name: 'Holiday Promotions', brand: 'E-commerce Store', status: 'active', influencers: 12, budget: 50000, spent: 22000, startDate: '2024-11-15', endDate: '2024-12-31' },
];

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  completed: 'bg-gray-100 text-gray-800',
  draft: 'bg-yellow-100 text-yellow-800',
  paused: 'bg-orange-100 text-orange-800',
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD' }).format(amount);
}

export default function CampaignsPage() {
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredCampaigns = statusFilter === 'all' 
    ? mockCampaigns 
    : mockCampaigns.filter(c => c.status === statusFilter);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Campaigns</h1>
          <p className="text-gray-600 mt-1">Manage your influencer marketing campaigns</p>
        </div>
        <Link
          href="/dashboard/campaigns/new"
          className="px-4 py-2.5 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
        >
          Create Campaign
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="text-sm text-gray-500 mb-1">Total Campaigns</div>
          <div className="text-2xl font-bold text-gray-900">{mockCampaigns.length}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="text-sm text-gray-500 mb-1">Active</div>
          <div className="text-2xl font-bold text-gray-900">{mockCampaigns.filter(c => c.status === 'active').length}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="text-sm text-gray-500 mb-1">Total Budget</div>
          <div className="text-2xl font-bold text-gray-900">{formatCurrency(mockCampaigns.reduce((sum, c) => sum + c.budget, 0))}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="text-sm text-gray-500 mb-1">Total Spent</div>
          <div className="text-2xl font-bold text-gray-900">{formatCurrency(mockCampaigns.reduce((sum, c) => sum + c.spent, 0))}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {['all', 'active', 'draft', 'completed', 'paused'].map((status) => (
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

      {/* Campaigns List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Campaign</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Influencers</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Budget</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Spent</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
              <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredCampaigns.map((campaign) => (
              <tr key={campaign.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div>
                    <div className="font-medium text-gray-900">{campaign.name}</div>
                    <div className="text-sm text-gray-500">{campaign.brand}</div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${statusColors[campaign.status]}`}>
                    {campaign.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-900">
                  {campaign.influencers}
                </td>
                <td className="px-6 py-4 text-gray-900">
                  {formatCurrency(campaign.budget)}
                </td>
                <td className="px-6 py-4">
                  <div className="text-gray-900">{formatCurrency(campaign.spent)}</div>
                  <div className="w-24 h-1.5 bg-gray-200 rounded-full mt-1">
                    <div 
                      className="h-full bg-gray-900 rounded-full" 
                      style={{ width: `${(campaign.spent / campaign.budget) * 100}%` }}
                    ></div>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-600 text-sm">
                  {campaign.startDate} - {campaign.endDate}
                </td>
                <td className="px-6 py-4 text-right">
                  <Link 
                    href={`/dashboard/campaigns/${campaign.id}`}
                    className="text-sm font-medium text-gray-900 hover:text-gray-600"
                  >
                    View Details
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredCampaigns.length === 0 && (
          <div className="p-12 text-center text-gray-500">
            No campaigns found
          </div>
        )}
      </div>
    </div>
  );
}
