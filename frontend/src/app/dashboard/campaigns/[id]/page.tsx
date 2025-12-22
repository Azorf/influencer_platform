'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { campaignService } from '@/lib/api';
import type { Campaign, Collaboration, CampaignContent } from '@/types';

// Types
type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
type CollaborationStatus = 'invited' | 'accepted' | 'declined' | 'in_progress' | 'content_submitted' | 'approved' | 'published' | 'completed' | 'cancelled';
type ContentStatus = 'draft' | 'submitted' | 'revision_requested' | 'approved' | 'published' | 'rejected';
type CampaignType = 'awareness' | 'engagement' | 'conversion' | 'product_launch' | 'events' | 'ugc';

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  active: 'bg-green-100 text-green-800',
  paused: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-blue-100 text-blue-800',
  cancelled: 'bg-red-100 text-red-800',
};

const collabStatusColors: Record<string, string> = {
  invited: 'bg-yellow-100 text-yellow-800',
  accepted: 'bg-blue-100 text-blue-800',
  declined: 'bg-red-100 text-red-800',
  in_progress: 'bg-purple-100 text-purple-800',
  content_submitted: 'bg-orange-100 text-orange-800',
  approved: 'bg-teal-100 text-teal-800',
  published: 'bg-green-100 text-green-800',
  completed: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
};

const contentStatusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  submitted: 'bg-yellow-100 text-yellow-700',
  revision_requested: 'bg-orange-100 text-orange-700',
  approved: 'bg-blue-100 text-blue-700',
  published: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

const campaignTypeLabels: Record<string, string> = {
  awareness: 'Brand Awareness',
  engagement: 'Engagement',
  conversion: 'Conversion',
  product_launch: 'Product Launch',
  events: 'Events',
  ugc: 'User Generated Content',
};

function formatCurrency(amount: number, currency: string = 'MAD'): string {
  return new Intl.NumberFormat('fr-MA', { style: 'currency', currency }).format(amount);
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getDaysRemaining(endDate: string): number {
  const end = new Date(endDate);
  const today = new Date();
  const diff = end.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function CampaignDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'collaborations' | 'content' | 'analytics'>('overview');
  const [selectedCollaboration, setSelectedCollaboration] = useState<Collaboration | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddInfluencerModal, setShowAddInfluencerModal] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCampaign();
  }, [id]);

  async function fetchCampaign() {
    try {
      setLoading(true);
      setError(null);
      const data = await campaignService.getCampaign(parseInt(id));
      setCampaign(data);
    } catch (err) {
      console.error('Failed to fetch campaign:', err);
      setError('Failed to load campaign');
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateStatus(newStatus: CampaignStatus) {
    if (!campaign) return;
    try {
      setSaving(true);
      await campaignService.updateCampaign(campaign.id, { status: newStatus });
      setCampaign({ ...campaign, status: newStatus });
    } catch (err) {
      console.error('Failed to update status:', err);
      alert('Failed to update status');
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateCollaborationStatus(collaborationId: number, newStatus: CollaborationStatus) {
    if (!campaign) return;
    try {
      await campaignService.updateCollaboration(campaign.id, collaborationId, { status: newStatus });
      setCampaign({
        ...campaign,
        collaborations: campaign.collaborations?.map(c =>
          c.id === collaborationId ? { ...c, status: newStatus } : c
        ),
      });
    } catch (err) {
      console.error('Failed to update collaboration:', err);
      alert('Failed to update collaboration');
    }
  }

  async function handleUpdateContentStatus(collaborationId: number, contentId: number, newStatus: ContentStatus) {
    if (!campaign) return;
    try {
      await campaignService.updateContent(campaign.id, contentId, { status: newStatus });
      setCampaign({
        ...campaign,
        collaborations: campaign.collaborations?.map(c => {
          if (c.id !== collaborationId) return c;
          return {
            ...c,
            content: c.content?.map(ct =>
              ct.id === contentId ? { ...ct, status: newStatus } : ct
            ),
          };
        }),
      });
    } catch (err) {
      console.error('Failed to update content:', err);
      alert('Failed to update content');
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

  if (error || !campaign) {
    return (
      <div className="p-8">
        <div className="mb-6">
          <Link href="/dashboard/campaigns" className="text-sm text-gray-500 hover:text-gray-900">← Back to Campaigns</Link>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error || 'Campaign not found'}
          <button onClick={fetchCampaign} className="ml-4 underline hover:no-underline">Retry</button>
        </div>
      </div>
    );
  }

  const collaborations = campaign.collaborations || [];
  const analytics = campaign.analytics || { totalReach: 0, totalImpressions: 0, totalLikes: 0, totalComments: 0, totalShares: 0, totalSaves: 0, avgEngagementRate: 0, costPerEngagement: 0, websiteClicks: 0, conversions: 0, conversionRate: 0, totalSpent: 0, estimatedValue: 0, roiPercentage: 0 };
  const totalDeliverables = collaborations.reduce((sum, c) => sum + (c.deliverables?.reduce((s, d) => s + d.quantity, 0) || 0), 0);
  const completedContent = collaborations.reduce((sum, c) => sum + (c.content?.filter(ct => ct.status === 'published').length || 0), 0);
  const pendingContent = collaborations.reduce((sum, c) => sum + (c.content?.filter(ct => ct.status === 'submitted' || ct.status === 'revision_requested').length || 0), 0);
  const daysRemaining = getDaysRemaining(campaign.endDate);
  const budgetProgress = campaign.totalBudget > 0 ? (analytics.totalSpent / campaign.totalBudget) * 100 : 0;

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link href="/dashboard/campaigns" className="text-sm text-gray-500 hover:text-gray-900">← Back to Campaigns</Link>
      </div>

      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-gray-900">{campaign.name}</h1>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${statusColors[campaign.status] || 'bg-gray-100 text-gray-800'}`}>{campaign.status}</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">{campaignTypeLabels[campaign.campaignType] || campaign.campaignType}</span>
          </div>
          <p className="text-gray-600">{campaign.brandName} • {formatDate(campaign.startDate)} - {formatDate(campaign.endDate)}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowEditModal(true)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">Edit Campaign</button>
          <button onClick={() => setShowAddInfluencerModal(true)} className="px-4 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800">+ Add Influencer</button>
        </div>
      </div>

      <div className="grid grid-cols-6 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-500">Budget</div>
          <div className="text-xl font-bold text-gray-900 mt-1">{formatCurrency(campaign.totalBudget)}</div>
          <div className="w-full h-1.5 bg-gray-200 rounded-full mt-2"><div className="h-full bg-gray-900 rounded-full" style={{ width: `${Math.min(budgetProgress, 100)}%` }}></div></div>
          <div className="text-xs text-gray-500 mt-1">{formatCurrency(analytics.totalSpent)} spent</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-500">Influencers</div>
          <div className="text-xl font-bold text-gray-900 mt-1">{collaborations.length}</div>
          <div className="text-xs text-gray-500 mt-1">{collaborations.filter(c => c.status === 'published' || c.status === 'completed').length} completed</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-500">Content</div>
          <div className="text-xl font-bold text-gray-900 mt-1">{completedContent}/{totalDeliverables}</div>
          <div className="text-xs text-gray-500 mt-1">{pendingContent} pending</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-500">Reach</div>
          <div className="text-xl font-bold text-gray-900 mt-1">{formatNumber(analytics.totalReach)}</div>
          <div className="text-xs text-gray-500 mt-1">{formatNumber(analytics.totalImpressions)} impressions</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-500">Engagement</div>
          <div className="text-xl font-bold text-gray-900 mt-1">{analytics.avgEngagementRate.toFixed(1)}%</div>
          <div className="text-xs text-gray-500 mt-1">{formatNumber(analytics.totalLikes + analytics.totalComments)} interactions</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-500">Days Left</div>
          <div className={`text-xl font-bold mt-1 ${daysRemaining < 0 ? 'text-gray-400' : daysRemaining <= 7 ? 'text-red-600' : 'text-gray-900'}`}>{daysRemaining < 0 ? 'Ended' : daysRemaining}</div>
          <div className="text-xs text-gray-500 mt-1">{daysRemaining < 0 ? Math.abs(daysRemaining) + ' days ago' : 'remaining'}</div>
        </div>
      </div>

      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {(['overview', 'collaborations', 'content', 'analytics'] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px capitalize ${activeTab === tab ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>{tab}</button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Campaign Details</h3>
              <div className="space-y-4">
                <div><div className="text-sm text-gray-500">Description</div><div className="text-gray-900 mt-1">{campaign.description || 'No description'}</div></div>
                <div><div className="text-sm text-gray-500">Objective</div><div className="text-gray-900 mt-1">{campaign.objective || 'No objective'}</div></div>
                {campaign.contentGuidelines && <div><div className="text-sm text-gray-500">Content Guidelines</div><div className="text-gray-900 mt-1">{campaign.contentGuidelines}</div></div>}
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Hashtags & Mentions</h3>
              <div className="flex flex-wrap gap-2">
                {campaign.hashtags?.map((tag, i) => <span key={i} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">{tag}</span>)}
                {campaign.mentions?.map((mention, i) => <span key={i} className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm">{mention}</span>)}
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Target Audience</h3>
              {campaign.targetAudience && (
                <div className="space-y-3">
                  <div className="flex justify-between"><span className="text-gray-500">Age Range</span><span className="text-gray-900">{campaign.targetAudience.ageRange || '-'}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Gender</span><span className="text-gray-900">{campaign.targetAudience.gender || '-'}</span></div>
                  <div><span className="text-gray-500">Locations</span><div className="flex flex-wrap gap-1 mt-1">{campaign.targetAudience.locations?.map((loc, i) => <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">{loc}</span>)}</div></div>
                </div>
              )}
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                {campaign.status === 'draft' && <button onClick={() => handleUpdateStatus('active')} disabled={saving} className="w-full px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50">Launch Campaign</button>}
                {campaign.status === 'active' && <button onClick={() => handleUpdateStatus('paused')} disabled={saving} className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50">Pause Campaign</button>}
                {campaign.status === 'paused' && <button onClick={() => handleUpdateStatus('active')} disabled={saving} className="w-full px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50">Resume Campaign</button>}
                {(campaign.status === 'active' || campaign.status === 'paused') && <button onClick={() => handleUpdateStatus('completed')} disabled={saving} className="w-full px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 disabled:opacity-50">Mark as Completed</button>}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'collaborations' && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead><tr className="bg-gray-50 border-b border-gray-200"><th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Influencer</th><th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th><th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Rate</th><th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Deliverables</th><th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Deadline</th><th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th></tr></thead>
            <tbody className="divide-y divide-gray-200">
              {collaborations.map((collab) => (
                <tr key={collab.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-white font-medium">{collab.influencer?.fullName?.charAt(0) || '?'}</div><div><div className="font-medium text-gray-900">{collab.influencer?.fullName || 'Unknown'}</div><div className="text-sm text-gray-500">@{collab.influencer?.username || 'unknown'}</div></div></div></td>
                  <td className="px-6 py-4"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${collabStatusColors[collab.status] || 'bg-gray-100 text-gray-800'}`}>{collab.status?.replace('_', ' ')}</span></td>
                  <td className="px-6 py-4 font-medium text-gray-900">{formatCurrency(collab.agreedRate || 0)}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{collab.deliverables?.map(d => `${d.quantity} ${d.type}`).join(', ') || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{collab.deadline ? formatDate(collab.deadline) : '-'}</td>
                  <td className="px-6 py-4 text-right"><button onClick={() => setSelectedCollaboration(collab)} className="text-sm font-medium text-gray-900 hover:text-gray-600">View Details</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {collaborations.length === 0 && <div className="p-12 text-center text-gray-500">No collaborations yet. Click "Add Influencer" to get started.</div>}
        </div>
      )}

      {activeTab === 'content' && (
        <div className="space-y-6">
          {collaborations.map((collab) => (
            <div key={collab.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-3"><div className="w-8 h-8 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-medium">{collab.influencer?.fullName?.charAt(0) || '?'}</div><div><div className="font-medium text-gray-900">{collab.influencer?.fullName}</div><div className="text-xs text-gray-500">{collab.content?.length || 0} pieces</div></div></div>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${collabStatusColors[collab.status] || 'bg-gray-100'}`}>{collab.status?.replace('_', ' ')}</span>
              </div>
              {collab.content && collab.content.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {collab.content.map((content) => (
                    <div key={content.id} className="px-6 py-4 flex items-center justify-between">
                      <div className="flex items-center gap-4"><div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center"><span className="text-lg">{content.type === 'post' ? '📷' : content.type === 'story' ? '📱' : content.type === 'reel' ? '🎬' : '📹'}</span></div><div><div className="font-medium text-gray-900 capitalize">{content.type}</div><div className="text-sm text-gray-500 max-w-md truncate">{content.caption || 'No caption'}</div></div></div>
                      <div className="flex items-center gap-4">
                        {content.status === 'published' && <div className="text-right text-sm"><div className="text-gray-900">{formatNumber(content.views || 0)} views</div><div className="text-gray-500">{formatNumber(content.likes || 0)} likes</div></div>}
                        <select value={content.status} onChange={(e) => handleUpdateContentStatus(collab.id, content.id, e.target.value as ContentStatus)} className={`text-xs font-medium px-2.5 py-1 rounded-full border-0 ${contentStatusColors[content.status] || 'bg-gray-100'}`}><option value="draft">Draft</option><option value="submitted">Submitted</option><option value="revision_requested">Revision</option><option value="approved">Approved</option><option value="published">Published</option><option value="rejected">Rejected</option></select>
                      </div>
                    </div>
                  ))}
                </div>
              ) : <div className="px-6 py-8 text-center text-gray-500">No content submitted yet</div>}
            </div>
          ))}
          {collaborations.length === 0 && <div className="bg-white rounded-lg border border-gray-200 p-12 text-center text-gray-500">No collaborations yet</div>}
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Performance Overview</h3>
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg"><div className="text-2xl font-bold text-gray-900">{formatNumber(analytics.totalReach)}</div><div className="text-sm text-gray-500">Total Reach</div></div>
                <div className="text-center p-4 bg-gray-50 rounded-lg"><div className="text-2xl font-bold text-gray-900">{formatNumber(analytics.totalImpressions)}</div><div className="text-sm text-gray-500">Impressions</div></div>
                <div className="text-center p-4 bg-gray-50 rounded-lg"><div className="text-2xl font-bold text-gray-900">{formatNumber(analytics.totalLikes)}</div><div className="text-sm text-gray-500">Likes</div></div>
                <div className="text-center p-4 bg-gray-50 rounded-lg"><div className="text-2xl font-bold text-gray-900">{formatNumber(analytics.totalComments)}</div><div className="text-sm text-gray-500">Comments</div></div>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Engagement Metrics</h3>
              <div className="h-64 flex items-center justify-center text-gray-400 border border-dashed border-gray-200 rounded-lg"><div className="text-center"><div className="text-4xl mb-2">📊</div><div>Engagement chart would render here</div></div></div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">ROI Summary</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-100"><span className="text-gray-500">Total Spent</span><span className="font-semibold text-gray-900">{formatCurrency(analytics.totalSpent)}</span></div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100"><span className="text-gray-500">Est. Value</span><span className="font-semibold text-gray-900">{formatCurrency(analytics.estimatedValue)}</span></div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100"><span className="text-gray-500">ROI</span><span className={`font-bold ${analytics.roiPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>{analytics.roiPercentage >= 0 ? '+' : ''}{analytics.roiPercentage.toFixed(0)}%</span></div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100"><span className="text-gray-500">Cost/Engagement</span><span className="font-semibold text-gray-900">{formatCurrency(analytics.costPerEngagement)}</span></div>
                <div className="flex justify-between items-center py-2"><span className="text-gray-500">Conversions</span><span className="font-semibold text-gray-900">{analytics.conversions} ({analytics.conversionRate.toFixed(1)}%)</span></div>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Traffic</h3>
              <div className="space-y-3">
                <div className="flex justify-between"><span className="text-gray-500">Website Clicks</span><span className="font-semibold text-gray-900">{formatNumber(analytics.websiteClicks)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Saves</span><span className="font-semibold text-gray-900">{formatNumber(analytics.totalSaves)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Shares</span><span className="font-semibold text-gray-900">{formatNumber(analytics.totalShares)}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedCollaboration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setSelectedCollaboration(null)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3"><div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-white font-medium text-lg">{selectedCollaboration.influencer?.fullName?.charAt(0) || '?'}</div><div><div className="font-semibold text-gray-900">{selectedCollaboration.influencer?.fullName}</div><div className="text-sm text-gray-500">@{selectedCollaboration.influencer?.username}</div></div></div>
              <button onClick={() => setSelectedCollaboration(null)} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500">✕</button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4"><div className="text-sm text-gray-500">Status</div><select value={selectedCollaboration.status} onChange={(e) => { handleUpdateCollaborationStatus(selectedCollaboration.id, e.target.value as CollaborationStatus); setSelectedCollaboration({ ...selectedCollaboration, status: e.target.value as CollaborationStatus }); }} className={`mt-1 text-sm font-medium px-3 py-1.5 rounded-full border-0 ${collabStatusColors[selectedCollaboration.status] || 'bg-gray-100'}`}><option value="invited">Invited</option><option value="accepted">Accepted</option><option value="declined">Declined</option><option value="in_progress">In Progress</option><option value="content_submitted">Content Submitted</option><option value="approved">Approved</option><option value="published">Published</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></div>
                <div className="bg-gray-50 rounded-lg p-4"><div className="text-sm text-gray-500">Agreed Rate</div><div className="text-lg font-semibold text-gray-900 mt-1">{formatCurrency(selectedCollaboration.agreedRate || 0)}</div></div>
              </div>
              <div><div className="text-sm font-medium text-gray-700 mb-2">Deliverables</div><div className="flex flex-wrap gap-2">{selectedCollaboration.deliverables?.map((d, i) => <span key={i} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm">{d.quantity} {d.type}{d.quantity > 1 ? 's' : ''}</span>)}</div></div>
              <div className="grid grid-cols-2 gap-4"><div><div className="text-sm text-gray-500">Deadline</div><div className="text-gray-900 mt-1">{selectedCollaboration.deadline ? formatDate(selectedCollaboration.deadline) : '-'}</div></div><div><div className="text-sm text-gray-500">Invited</div><div className="text-gray-900 mt-1">{selectedCollaboration.invitedAt ? formatDate(selectedCollaboration.invitedAt) : '-'}</div></div></div>
              {selectedCollaboration.notes && <div><div className="text-sm font-medium text-gray-700 mb-2">Notes</div><div className="text-gray-600 bg-gray-50 rounded-lg p-3">{selectedCollaboration.notes}</div></div>}
              <div><div className="text-sm font-medium text-gray-700 mb-3">Content ({selectedCollaboration.content?.length || 0})</div>{selectedCollaboration.content && selectedCollaboration.content.length > 0 ? <div className="space-y-2">{selectedCollaboration.content.map((content) => <div key={content.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"><div className="flex items-center gap-3"><span className="text-lg">{content.type === 'post' ? '📷' : content.type === 'story' ? '📱' : content.type === 'reel' ? '🎬' : '📹'}</span><div><div className="text-sm font-medium text-gray-900 capitalize">{content.type}</div><div className="text-xs text-gray-500">{content.status}</div></div></div>{content.status === 'published' && <div className="text-right text-sm"><div className="text-gray-900">{formatNumber(content.views || 0)} views</div></div>}</div>)}</div> : <div className="text-center text-gray-500 py-4 bg-gray-50 rounded-lg">No content yet</div>}</div>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end"><button onClick={() => setSelectedCollaboration(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">Close</button></div>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowEditModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Edit Campaign</h2>
            <p className="text-gray-600 mb-4">Campaign editing form would go here with fields for name, description, dates, budget, etc.</p>
            <div className="flex justify-end gap-3"><button onClick={() => setShowEditModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button><button onClick={() => setShowEditModal(false)} className="px-4 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800">Save Changes</button></div>
          </div>
        </div>
      )}

      {showAddInfluencerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowAddInfluencerModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Add Influencer</h2>
            <p className="text-gray-600 mb-4">Influencer search and invitation form would go here with deliverables, rate, and deadline fields.</p>
            <div className="flex justify-end gap-3"><button onClick={() => setShowAddInfluencerModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button><button onClick={() => setShowAddInfluencerModal(false)} className="px-4 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800">Send Invitation</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
