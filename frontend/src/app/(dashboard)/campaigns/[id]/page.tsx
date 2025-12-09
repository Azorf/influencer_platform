'use client';

import { use } from 'react';
import Link from 'next/link';
import { useCampaign, useCampaignAnalytics, useCollaborations } from '@/lib/hooks';
import { formatDate, formatCurrency, formatCompactNumber, cn } from '@/lib/utils';
import { CAMPAIGN_STATUS, COLLABORATION_STATUS } from '@/lib/utils/constants';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function CampaignDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const campaignId = parseInt(id, 10);

  const { data: campaign, isLoading, error } = useCampaign(campaignId);
  const { data: analytics } = useCampaignAnalytics(campaignId);
  const { data: collaborations } = useCollaborations(campaignId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner" />
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
        Campaign not found or failed to load.
      </div>
    );
  }

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="mb-4">
        <ol className="flex items-center gap-2 text-sm text-gray-500">
          <li>
            <Link href="/campaigns" className="hover:text-primary-600">
              Campaigns
            </Link>
          </li>
          <li>/</li>
          <li className="text-gray-900">{campaign.name}</li>
        </ol>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-gray-900">{campaign.name}</h1>
            <span
              className={cn(
                'badge',
                `badge-${CAMPAIGN_STATUS[campaign.status]?.color || 'gray'}`
              )}
            >
              {CAMPAIGN_STATUS[campaign.status]?.label || campaign.status}
            </span>
          </div>
          <p className="text-gray-600">
            {campaign.brand_name}
            {campaign.product_name && ` • ${campaign.product_name}`}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/campaigns/${campaign.id}/edit`}
            className="px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Edit
          </Link>
          <button className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors">
            Invite Influencer
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="card">
          <p className="text-sm text-gray-500">Budget</p>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(campaign.total_budget, campaign.budget_currency)}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Total Reach</p>
          <p className="text-2xl font-bold text-gray-900">
            {formatCompactNumber(analytics?.total_reach || 0)}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Engagement Rate</p>
          <p className="text-2xl font-bold text-gray-900">
            {analytics?.avg_engagement_rate?.toFixed(2) || '0'}%
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Collaborations</p>
          <p className="text-2xl font-bold text-gray-900">
            {collaborations?.length || 0}
          </p>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Campaign Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Details</h2>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm text-gray-500">Timeline</dt>
                <dd className="text-gray-900">
                  {formatDate(campaign.start_date)} - {formatDate(campaign.end_date)}
                </dd>
              </div>
              {campaign.description && (
                <div>
                  <dt className="text-sm text-gray-500">Description</dt>
                  <dd className="text-gray-900">{campaign.description}</dd>
                </div>
              )}
              <div>
                <dt className="text-sm text-gray-500">Target Audience</dt>
                <dd className="text-gray-900">{campaign.target_audience}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Objectives</dt>
                <dd className="text-gray-900">{campaign.campaign_objectives}</dd>
              </div>
              {campaign.hashtags && (
                <div>
                  <dt className="text-sm text-gray-500">Hashtags</dt>
                  <dd className="text-gray-900">{campaign.hashtags}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Collaborations */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Collaborations
            </h2>
            {collaborations && collaborations.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {collaborations.map((collab) => (
                  <li key={collab.id} className="py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          {collab.influencer_details?.full_name || `Influencer #${collab.influencer}`}
                        </p>
                        <p className="text-sm text-gray-500">
                          {collab.content_type} • Due {formatDate(collab.deadline)}
                        </p>
                      </div>
                      <span
                        className={cn(
                          'badge',
                          `badge-${COLLABORATION_STATUS[collab.status]?.color || 'gray'}`
                        )}
                      >
                        {COLLABORATION_STATUS[collab.status]?.label || collab.status}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-center py-8">
                No collaborations yet. Invite influencers to get started.
              </p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">Performance</h3>
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-gray-500">Total Likes</dt>
                <dd className="font-medium">{formatCompactNumber(analytics?.total_likes || 0)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Total Comments</dt>
                <dd className="font-medium">{formatCompactNumber(analytics?.total_comments || 0)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Total Shares</dt>
                <dd className="font-medium">{formatCompactNumber(analytics?.total_shares || 0)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Conversions</dt>
                <dd className="font-medium">{analytics?.conversions || 0}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">ROI</dt>
                <dd className="font-medium text-green-600">
                  {analytics?.roi_percentage?.toFixed(1) || 0}%
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
