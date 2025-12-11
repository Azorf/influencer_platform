'use client';

import { use } from 'react';
import Link from 'next/link';

// Mock data
const mockCampaign = {
  id: 1,
  name: 'Summer Collection Launch',
  brand: 'Fashion Brand',
  status: 'active',
  description: 'Promote our new summer collection through lifestyle and fashion influencers across Morocco.',
  budget: 15000,
  spent: 8500,
  startDate: '2024-06-01',
  endDate: '2024-07-31',
  objectives: 'Brand awareness, Product sales',
  targetAudience: 'Women 18-35, Fashion enthusiasts',
  collaborations: [
    { id: 1, influencer: 'Sarah Lifestyle', handle: '@sarahlifestyle', status: 'published', payment: 3000, content: 2 },
    { id: 2, influencer: 'Fatima Beauty', handle: '@fatimabeauty', status: 'in_progress', payment: 3500, content: 1 },
    { id: 3, influencer: 'Meryem Fashion', handle: '@meryemfashion', status: 'invited', payment: 2000, content: 0 },
  ],
};

const collabStatusColors: Record<string, string> = {
  invited: 'bg-yellow-100 text-yellow-800',
  accepted: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-purple-100 text-purple-800',
  published: 'bg-green-100 text-green-800',
  completed: 'bg-gray-100 text-gray-800',
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD' }).format(amount);
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function CampaignDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const campaign = mockCampaign; // Would fetch based on ID

  return (
    <div className="p-8">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link href="/dashboard/campaigns" className="text-sm text-gray-500 hover:text-gray-900">
          ← Back to Campaigns
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-gray-900">{campaign.name}</h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 capitalize">
              {campaign.status}
            </span>
          </div>
          <p className="text-gray-600">{campaign.brand}</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
            Edit Campaign
          </button>
          <button className="px-4 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800">
            Add Influencer
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="text-sm text-gray-500 mb-1">Budget</div>
          <div className="text-2xl font-bold text-gray-900">{formatCurrency(campaign.budget)}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="text-sm text-gray-500 mb-1">Spent</div>
          <div className="text-2xl font-bold text-gray-900">{formatCurrency(campaign.spent)}</div>
          <div className="w-full h-1.5 bg-gray-200 rounded-full mt-2">
            <div className="h-full bg-gray-900 rounded-full" style={{ width: `${(campaign.spent / campaign.budget) * 100}%` }}></div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="text-sm text-gray-500 mb-1">Influencers</div>
          <div className="text-2xl font-bold text-gray-900">{campaign.collaborations.length}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="text-sm text-gray-500 mb-1">Content Pieces</div>
          <div className="text-2xl font-bold text-gray-900">{campaign.collaborations.reduce((sum, c) => sum + c.content, 0)}</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Campaign Details */}
        <div className="col-span-2">
          {/* Collaborations */}
          <div className="bg-white rounded-lg border border-gray-200 mb-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">Collaborations</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {campaign.collaborations.map((collab) => (
                <div key={collab.id} className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-medium">
                      {collab.influencer.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{collab.influencer}</div>
                      <div className="text-sm text-gray-500">{collab.handle}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${collabStatusColors[collab.status]}`}>
                      {collab.status.replace('_', ' ')}
                    </span>
                    <div className="text-sm text-gray-500">{collab.content} posts</div>
                    <div className="text-sm font-medium text-gray-900">{formatCurrency(collab.payment)}</div>
                    <button className="text-sm text-gray-500 hover:text-gray-900">View</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Campaign Info */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Campaign Details</h3>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm text-gray-500">Duration</dt>
                <dd className="text-sm text-gray-900 mt-1">{campaign.startDate} - {campaign.endDate}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Description</dt>
                <dd className="text-sm text-gray-900 mt-1">{campaign.description}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Objectives</dt>
                <dd className="text-sm text-gray-900 mt-1">{campaign.objectives}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Target Audience</dt>
                <dd className="text-sm text-gray-900 mt-1">{campaign.targetAudience}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
