'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useInfluencers, useCategories } from '@/lib/hooks';
import { formatFollowerCount, formatEngagementRate, cn } from '@/lib/utils';
import { SOCIAL_PLATFORMS, INFLUENCER_TIERS } from '@/lib/utils/constants';
import type { SocialPlatform, InfluencerTier } from '@/types';

export default function InfluencersPage() {
  const [search, setSearch] = useState('');
  const [platform, setPlatform] = useState<SocialPlatform | ''>('');
  const [tier, setTier] = useState<InfluencerTier | ''>('');
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useInfluencers({
    search: search || undefined,
    platform: platform || undefined,
    tier: tier || undefined,
    page,
    page_size: 12,
  });

  const { data: categories } = useCategories();

  const influencers = data?.results || [];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Influencers</h1>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex flex-wrap gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search influencers..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Platform Filter */}
          <select
            value={platform}
            onChange={(e) => {
              setPlatform(e.target.value as SocialPlatform | '');
              setPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">All Platforms</option>
            {Object.entries(SOCIAL_PLATFORMS).map(([value, { label }]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>

          {/* Tier Filter */}
          <select
            value={tier}
            onChange={(e) => {
              setTier(e.target.value as InfluencerTier | '');
              setPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">All Tiers</option>
            {Object.entries(INFLUENCER_TIERS).map(([value, { label, range }]) => (
              <option key={value} value={value}>
                {label} ({range})
              </option>
            ))}
          </select>
        </div>
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
          Failed to load influencers. Please try again.
        </div>
      )}

      {/* Influencers Grid */}
      {!isLoading && !error && (
        <>
          {influencers.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-gray-500">No influencers found matching your criteria</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {influencers.map((influencer) => (
                <Link
                  key={influencer.id}
                  href={`/influencers/${influencer.id}`}
                  className="card hover:shadow-md transition-shadow"
                >
                  {/* Profile Image */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold text-xl">
                      {influencer.full_name?.charAt(0) || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {influencer.full_name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {influencer.city}, {influencer.country}
                      </p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-500">Followers</p>
                      <p className="font-semibold text-gray-900">
                        {formatFollowerCount(influencer.total_followers)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Engagement</p>
                      <p className="font-semibold text-gray-900">
                        {formatEngagementRate(influencer.avg_engagement_rate)}
                      </p>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'badge',
                        `badge-${INFLUENCER_TIERS[influencer.tier]?.color || 'gray'}`
                      )}
                    >
                      {INFLUENCER_TIERS[influencer.tier]?.label || influencer.tier}
                    </span>
                    {influencer.primary_platform && (
                      <span className="badge badge-gray">
                        {SOCIAL_PLATFORMS[influencer.primary_platform]?.label ||
                          influencer.primary_platform}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Pagination */}
          {data && data.count > 12 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-gray-500">
                Showing {(page - 1) * 12 + 1} to{' '}
                {Math.min(page * 12, data.count)} of {data.count} influencers
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
