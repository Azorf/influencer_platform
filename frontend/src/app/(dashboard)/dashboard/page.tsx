'use client';

import { useDashboard } from '@/lib/hooks';
import { formatCompactNumber, formatRelativeTime } from '@/lib/utils';

// Stat Card Component
function StatCard({
  title,
  value,
  change,
  changeType,
}: {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
}) {
  return (
    <div className="card">
      <p className="text-sm text-gray-500 mb-1">{title}</p>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      {change && (
        <p
          className={`text-sm mt-1 ${
            changeType === 'positive'
              ? 'text-green-600'
              : changeType === 'negative'
              ? 'text-red-600'
              : 'text-gray-500'
          }`}
        >
          {change} from last month
        </p>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { data, isLoading, error } = useDashboard();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
        Failed to load dashboard data. Please try again.
      </div>
    );
  }

  const stats = data?.stats || {};

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">
          Welcome back, {data?.user?.email || 'User'}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Active Campaigns"
          value={formatCompactNumber(stats.active_campaigns || 0)}
          change="+12%"
          changeType="positive"
        />
        <StatCard
          title="Total Campaigns"
          value={formatCompactNumber(stats.total_campaigns || 0)}
          change="+5%"
          changeType="positive"
        />
        <StatCard
          title="Collaborations"
          value={formatCompactNumber(stats.total_collaborations || 0)}
          change="+8%"
          changeType="positive"
        />
        <StatCard
          title="Pending Payments"
          value={stats.pending_payments?.toString() || '0'}
          change=""
          changeType="neutral"
        />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Activity
          </h2>
          {data?.recent_activity && data.recent_activity.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {data.recent_activity.map((activity) => (
                <li key={activity.id} className="py-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-900">{activity.message}</p>
                    <span className="text-xs text-gray-500">
                      {formatRelativeTime(activity.timestamp)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500 text-center py-8">
              No recent activity
            </p>
          )}
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Actions
          </h2>
          <div className="space-y-3">
            <a
              href="/campaigns/create"
              className="block p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
            >
              <h3 className="font-medium text-gray-900">Create Campaign</h3>
              <p className="text-sm text-gray-500">
                Launch a new influencer marketing campaign
              </p>
            </a>
            <a
              href="/influencers"
              className="block p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
            >
              <h3 className="font-medium text-gray-900">Find Influencers</h3>
              <p className="text-sm text-gray-500">
                Search and discover influencers for your campaigns
              </p>
            </a>
            <a
              href="/reports"
              className="block p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
            >
              <h3 className="font-medium text-gray-900">View Reports</h3>
              <p className="text-sm text-gray-500">
                Analyze campaign performance and ROI
              </p>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
