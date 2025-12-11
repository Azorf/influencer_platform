'use client';

import { useState } from 'react';

// Mock data
const mockReports = [
  { id: 1, name: 'Summer Campaign Performance', type: 'campaign_performance', status: 'completed', createdAt: '2024-07-15', format: 'pdf' },
  { id: 2, name: 'Q2 Influencer Analytics', type: 'influencer_analytics', status: 'completed', createdAt: '2024-07-01', format: 'pdf' },
  { id: 3, name: 'Monthly ROI Report', type: 'roi_analysis', status: 'generating', createdAt: '2024-07-20', format: 'pdf' },
];

const mockDashboardStats = {
  totalReach: 1250000,
  totalEngagement: 45600,
  avgEngagementRate: 3.8,
  totalCampaigns: 12,
  activeCampaigns: 4,
  totalSpent: 125000,
  totalInfluencers: 28,
};

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD' }).format(amount);
}

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'reports'>('dashboard');

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600 mt-1">Track your campaign performance and insights</p>
        </div>
        <button className="px-4 py-2.5 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors">
          Generate Report
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-8 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`pb-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeTab === 'dashboard'
              ? 'border-gray-900 text-gray-900'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Dashboard
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`pb-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeTab === 'reports'
              ? 'border-gray-900 text-gray-900'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Reports
        </button>
      </div>

      {activeTab === 'dashboard' ? (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <div className="text-sm text-gray-500 mb-1">Total Reach</div>
              <div className="text-2xl font-bold text-gray-900">{formatNumber(mockDashboardStats.totalReach)}</div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <div className="text-sm text-gray-500 mb-1">Total Engagement</div>
              <div className="text-2xl font-bold text-gray-900">{formatNumber(mockDashboardStats.totalEngagement)}</div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <div className="text-sm text-gray-500 mb-1">Avg. Engagement Rate</div>
              <div className="text-2xl font-bold text-gray-900">{mockDashboardStats.avgEngagementRate}%</div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <div className="text-sm text-gray-500 mb-1">Total Spent</div>
              <div className="text-2xl font-bold text-gray-900">{formatCurrency(mockDashboardStats.totalSpent)}</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            {/* Campaign Overview */}
            <div className="col-span-2 bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Campaign Performance</h3>
              <div className="h-64 flex items-center justify-center text-gray-400 border border-dashed border-gray-200 rounded-lg">
                Chart placeholder - Performance over time
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Quick Stats</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-600">Active Campaigns</span>
                  <span className="font-semibold text-gray-900">{mockDashboardStats.activeCampaigns}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-600">Total Campaigns</span>
                  <span className="font-semibold text-gray-900">{mockDashboardStats.totalCampaigns}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-600">Influencers Worked With</span>
                  <span className="font-semibold text-gray-900">{mockDashboardStats.totalInfluencers}</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-gray-600">Total Investment</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(mockDashboardStats.totalSpent)}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Reports List */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Report Name</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {mockReports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{report.name}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 capitalize">
                      {report.type.replace('_', ' ')}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                        report.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {report.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {report.createdAt}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {report.status === 'completed' && (
                        <button className="text-sm font-medium text-gray-900 hover:text-gray-600">
                          Download
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
