'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCampaigns } from '@/lib/hooks';
import { formatDate, formatCurrency, cn } from '@/lib/utils';
import { CAMPAIGN_STATUS, CAMPAIGN_TYPES } from '@/lib/utils/constants';
import type { CampaignStatus } from '@/types';

export default function CampaignsPage() {
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | ''>('');
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useCampaigns({
    status: statusFilter || undefined,
    page,
    page_size: 10,
  });

  const campaigns = data?.results || [];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Campaigns</h1>
        <Link
          href="/campaigns/create"
          className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
        >
          Create Campaign
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as CampaignStatus | '');
            setPage(1);
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value="">All Statuses</option>
          {Object.entries(CAMPAIGN_STATUS).map(([value, { label }]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center h-64">
          <div className="spinner" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
          Failed to load campaigns. Please try again.
        </div>
      )}

      {/* Campaigns List */}
      {!isLoading && !error && (
        <>
          {campaigns.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-gray-500 mb-4">No campaigns found</p>
              <Link
                href="/campaigns/create"
                className="text-primary-600 hover:underline font-medium"
              >
                Create your first campaign
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {campaigns.map((campaign) => (
                <Link
                  key={campaign.id}
                  href={`/campaigns/${campaign.id}`}
                  className="card block hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {campaign.name}
                        </h3>
                        <span
                          className={cn(
                            'badge',
                            `badge-${CAMPAIGN_STATUS[campaign.status]?.color || 'gray'}`
                          )}
                        >
                          {CAMPAIGN_STATUS[campaign.status]?.label || campaign.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {campaign.brand_name} • {CAMPAIGN_TYPES[campaign.campaign_type]}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDate(campaign.start_date)} - {formatDate(campaign.end_date)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-gray-900">
                        {formatCurrency(campaign.total_budget, campaign.budget_currency)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {campaign.collaborations_count || 0} collaborations
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Pagination */}
          {data && data.count > 10 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-gray-500">
                Showing {(page - 1) * 10 + 1} to{' '}
                {Math.min(page * 10, data.count)} of {data.count} campaigns
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={!data.previous}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!data.next}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
