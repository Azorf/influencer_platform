'use client';

import { useState } from 'react';

// Types based on Django models
type ReportType = 'campaign_performance' | 'influencer_analytics' | 'audience_insights' | 'roi_analysis' | 'competitive_analysis' | 'trend_analysis' | 'agency_dashboard' | 'custom';
type ReportStatus = 'generating' | 'completed' | 'failed' | 'scheduled';
type FileFormat = 'pdf' | 'excel' | 'csv' | 'json' | 'dashboard';
type SubscriptionFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly';
type DeliveryMethod = 'email' | 'slack' | 'webhook';

interface Report {
  id: number;
  title: string;
  description: string;
  reportType: ReportType;
  status: ReportStatus;
  fileFormat: FileFormat;
  createdAt: string;
  generationStartedAt: string | null;
  generationCompletedAt: string | null;
  errorMessage: string | null;
  isScheduled: boolean;
  scheduleFrequency: SubscriptionFrequency | null;
}

interface ReportTemplate {
  id: number;
  name: string;
  description: string;
  reportType: ReportType;
  isPublic: boolean;
}

interface ReportSubscription {
  id: number;
  name: string;
  templateName: string;
  frequency: SubscriptionFrequency;
  deliveryMethod: DeliveryMethod;
  emailRecipients: string;
  isActive: boolean;
  lastDelivered: string | null;
  nextDelivery: string;
}

// Mock data
const mockReports: Report[] = [
  { id: 1, title: 'Summer Campaign Performance Report', description: 'Comprehensive analysis of summer 2024 campaigns', reportType: 'campaign_performance', status: 'completed', fileFormat: 'pdf', createdAt: '2024-07-15T10:30:00', generationStartedAt: '2024-07-15T10:30:00', generationCompletedAt: '2024-07-15T10:32:15', errorMessage: null, isScheduled: false, scheduleFrequency: null },
  { id: 2, title: 'Q2 Influencer Analytics', description: 'Performance metrics for all influencer collaborations in Q2', reportType: 'influencer_analytics', status: 'completed', fileFormat: 'excel', createdAt: '2024-07-01T09:00:00', generationStartedAt: '2024-07-01T09:00:00', generationCompletedAt: '2024-07-01T09:05:30', errorMessage: null, isScheduled: false, scheduleFrequency: null },
  { id: 3, title: 'Monthly ROI Report - July', description: 'Return on investment analysis for July campaigns', reportType: 'roi_analysis', status: 'generating', fileFormat: 'pdf', createdAt: '2024-07-20T14:00:00', generationStartedAt: '2024-07-20T14:00:00', generationCompletedAt: null, errorMessage: null, isScheduled: true, scheduleFrequency: 'monthly' },
  { id: 4, title: 'Audience Insights - Fashion Segment', description: 'Deep dive into fashion audience demographics', reportType: 'audience_insights', status: 'completed', fileFormat: 'pdf', createdAt: '2024-07-18T11:00:00', generationStartedAt: '2024-07-18T11:00:00', generationCompletedAt: '2024-07-18T11:03:45', errorMessage: null, isScheduled: false, scheduleFrequency: null },
  { id: 5, title: 'Weekly Trend Analysis', description: 'Weekly trends in engagement and reach', reportType: 'trend_analysis', status: 'failed', fileFormat: 'csv', createdAt: '2024-07-19T16:00:00', generationStartedAt: '2024-07-19T16:00:00', generationCompletedAt: null, errorMessage: 'Data source temporarily unavailable', isScheduled: true, scheduleFrequency: 'weekly' },
];

const mockTemplates: ReportTemplate[] = [
  { id: 1, name: 'Campaign Performance Summary', description: 'Overview of campaign metrics including reach, engagement, and ROI', reportType: 'campaign_performance', isPublic: true },
  { id: 2, name: 'Influencer ROI Analysis', description: 'Detailed ROI breakdown by influencer', reportType: 'roi_analysis', isPublic: true },
  { id: 3, name: 'Weekly Engagement Report', description: 'Weekly summary of engagement metrics across all campaigns', reportType: 'trend_analysis', isPublic: true },
  { id: 4, name: 'Audience Demographics', description: 'Breakdown of audience demographics and interests', reportType: 'audience_insights', isPublic: true },
];

const mockSubscriptions: ReportSubscription[] = [
  { id: 1, name: 'Weekly Performance Digest', templateName: 'Campaign Performance Summary', frequency: 'weekly', deliveryMethod: 'email', emailRecipients: 'team@agency.ma', isActive: true, lastDelivered: '2024-07-15T09:00:00', nextDelivery: '2024-07-22T09:00:00' },
  { id: 2, name: 'Monthly ROI Report', templateName: 'Influencer ROI Analysis', frequency: 'monthly', deliveryMethod: 'email', emailRecipients: 'ceo@agency.ma', isActive: true, lastDelivered: '2024-07-01T09:00:00', nextDelivery: '2024-08-01T09:00:00' },
];

const mockDashboardStats = {
  totalReach: 2850000, totalImpressions: 4560000, totalEngagement: 156800, avgEngagementRate: 4.2,
  totalCampaigns: 12, activeCampaigns: 4, completedCampaigns: 7, totalSpent: 185000, totalBudget: 250000,
  totalInfluencers: 34, activeCollaborations: 18, contentPieces: 89, websiteClicks: 12500, conversions: 342, roiPercentage: 145,
};

const reportTypeLabels: Record<ReportType, string> = {
  campaign_performance: 'Campaign Performance', influencer_analytics: 'Influencer Analytics',
  audience_insights: 'Audience Insights', roi_analysis: 'ROI Analysis',
  competitive_analysis: 'Competitive Analysis', trend_analysis: 'Trend Analysis',
  agency_dashboard: 'Agency Dashboard', custom: 'Custom Report',
};

const reportTypeIcons: Record<ReportType, string> = {
  campaign_performance: '📊', influencer_analytics: '👥', audience_insights: '🎯', roi_analysis: '💰',
  competitive_analysis: '⚔️', trend_analysis: '📈', agency_dashboard: '🏢', custom: '⚙️',
};

const statusColors: Record<ReportStatus, string> = {
  generating: 'bg-yellow-100 text-yellow-800', completed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800', scheduled: 'bg-blue-100 text-blue-800',
};

const formatColors: Record<FileFormat, string> = {
  pdf: 'bg-red-50 text-red-700', excel: 'bg-green-50 text-green-700',
  csv: 'bg-blue-50 text-blue-700', json: 'bg-purple-50 text-purple-700', dashboard: 'bg-gray-50 text-gray-700',
};

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD' }).format(amount);
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateTime(date: string): string {
  return new Date(date).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'reports' | 'templates' | 'subscriptions'>('dashboard');
  const [reports, setReports] = useState<Report[]>(mockReports);
  const [subscriptions, setSubscriptions] = useState<ReportSubscription[]>(mockSubscriptions);
  const [typeFilter, setTypeFilter] = useState<ReportType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<ReportStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState<Report | null>(null);
  const [createForm, setCreateForm] = useState({ title: '', description: '', reportType: 'campaign_performance' as ReportType, fileFormat: 'pdf' as FileFormat, dateRange: '30d' });
  const [subscriptionForm, setSubscriptionForm] = useState({ name: '', templateId: '', frequency: 'weekly' as SubscriptionFrequency, deliveryMethod: 'email' as DeliveryMethod, emailRecipients: '', deliveryTime: '09:00' });
  const [shareEmail, setShareEmail] = useState('');
  const [shareMessage, setShareMessage] = useState('');

  const filteredReports = reports.filter(r => {
    const matchesType = typeFilter === 'all' || r.reportType === typeFilter;
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesStatus && matchesSearch;
  });

  const handleCreateReport = () => {
    const newReport: Report = {
      id: Date.now(), title: createForm.title, description: createForm.description, reportType: createForm.reportType,
      status: 'generating', fileFormat: createForm.fileFormat, createdAt: new Date().toISOString(),
      generationStartedAt: new Date().toISOString(), generationCompletedAt: null, errorMessage: null, isScheduled: false, scheduleFrequency: null,
    };
    setReports([newReport, ...reports]);
    setShowCreateModal(false);
    setCreateForm({ title: '', description: '', reportType: 'campaign_performance', fileFormat: 'pdf', dateRange: '30d' });
    setTimeout(() => { setReports(prev => prev.map(r => r.id === newReport.id ? { ...r, status: 'completed', generationCompletedAt: new Date().toISOString() } : r)); }, 3000);
  };

  const handleCreateSubscription = () => {
    const template = mockTemplates.find(t => t.id === parseInt(subscriptionForm.templateId));
    if (!template) return;
    const newSubscription: ReportSubscription = {
      id: Date.now(), name: subscriptionForm.name, templateName: template.name, frequency: subscriptionForm.frequency,
      deliveryMethod: subscriptionForm.deliveryMethod, emailRecipients: subscriptionForm.emailRecipients,
      isActive: true, lastDelivered: null, nextDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };
    setSubscriptions([...subscriptions, newSubscription]);
    setShowSubscriptionModal(false);
    setSubscriptionForm({ name: '', templateId: '', frequency: 'weekly', deliveryMethod: 'email', emailRecipients: '', deliveryTime: '09:00' });
  };

  const handleDownload = (report: Report) => { alert(`Downloading ${report.title}.${report.fileFormat}`); };
  const handleShare = () => { alert(`Report shared with ${shareEmail}`); setShowShareModal(null); setShareEmail(''); setShareMessage(''); };
  const handleRegenerateReport = (reportId: number) => {
    setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'generating', errorMessage: null } : r));
    setTimeout(() => { setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'completed', generationCompletedAt: new Date().toISOString() } : r)); }, 3000);
  };
  const handleDeleteReport = (reportId: number) => { if (confirm('Delete this report?')) setReports(prev => prev.filter(r => r.id !== reportId)); };
  const toggleSubscription = (subscriptionId: number) => { setSubscriptions(prev => prev.map(s => s.id === subscriptionId ? { ...s, isActive: !s.isActive } : s)); };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600 mt-1">Track performance, generate reports, and gain insights</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowSubscriptionModal(true)} className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">Schedule Report</button>
          <button onClick={() => setShowCreateModal(true)} className="px-4 py-2.5 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800">Generate Report</button>
        </div>
      </div>

      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {(['dashboard', 'reports', 'templates', 'subscriptions'] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px capitalize ${activeTab === tab ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>{tab}</button>
        ))}
      </div>

      {activeTab === 'dashboard' && (
        <>
          <div className="grid grid-cols-5 gap-4 mb-6">
            <div className="bg-white rounded-lg border border-gray-200 p-5"><div className="text-sm text-gray-500 mb-1">Total Reach</div><div className="text-2xl font-bold text-gray-900">{formatNumber(mockDashboardStats.totalReach)}</div><div className="text-xs text-green-600 mt-1">+12% vs last month</div></div>
            <div className="bg-white rounded-lg border border-gray-200 p-5"><div className="text-sm text-gray-500 mb-1">Total Engagement</div><div className="text-2xl font-bold text-gray-900">{formatNumber(mockDashboardStats.totalEngagement)}</div><div className="text-xs text-green-600 mt-1">{mockDashboardStats.avgEngagementRate}% rate</div></div>
            <div className="bg-white rounded-lg border border-gray-200 p-5"><div className="text-sm text-gray-500 mb-1">Conversions</div><div className="text-2xl font-bold text-gray-900">{mockDashboardStats.conversions}</div><div className="text-xs text-gray-500 mt-1">{formatNumber(mockDashboardStats.websiteClicks)} clicks</div></div>
            <div className="bg-white rounded-lg border border-gray-200 p-5"><div className="text-sm text-gray-500 mb-1">Total Spent</div><div className="text-2xl font-bold text-gray-900">{formatCurrency(mockDashboardStats.totalSpent)}</div><div className="text-xs text-gray-500 mt-1">of {formatCurrency(mockDashboardStats.totalBudget)}</div></div>
            <div className="bg-white rounded-lg border border-gray-200 p-5"><div className="text-sm text-gray-500 mb-1">ROI</div><div className="text-2xl font-bold text-green-600">+{mockDashboardStats.roiPercentage}%</div><div className="text-xs text-gray-500 mt-1">return on investment</div></div>
          </div>
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4"><h3 className="font-semibold text-gray-900">Performance Over Time</h3><select className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white"><option>Last 30 days</option><option>Last 90 days</option></select></div>
              <div className="h-64 flex items-center justify-center text-gray-400 border border-dashed border-gray-200 rounded-lg"><div className="text-center"><div className="text-4xl mb-2">📈</div><div>Performance chart would render here</div></div></div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Campaign Summary</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-100"><span className="text-gray-600">Active Campaigns</span><span className="font-semibold text-gray-900">{mockDashboardStats.activeCampaigns}</span></div>
                <div className="flex items-center justify-between py-3 border-b border-gray-100"><span className="text-gray-600">Total Influencers</span><span className="font-semibold text-gray-900">{mockDashboardStats.totalInfluencers}</span></div>
                <div className="flex items-center justify-between py-3 border-b border-gray-100"><span className="text-gray-600">Content Pieces</span><span className="font-semibold text-gray-900">{mockDashboardStats.contentPieces}</span></div>
                <div className="flex items-center justify-between py-3"><span className="text-gray-600">Total Investment</span><span className="font-semibold text-gray-900">{formatCurrency(mockDashboardStats.totalSpent)}</span></div>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'reports' && (
        <>
          <div className="flex items-center gap-4 mb-6">
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search reports..." className="flex-1 max-w-xs px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900" />
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as ReportType | 'all')} className="px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm"><option value="all">All Types</option>{Object.entries(reportTypeLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as ReportStatus | 'all')} className="px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm"><option value="all">All Status</option><option value="completed">Completed</option><option value="generating">Generating</option><option value="failed">Failed</option></select>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead><tr className="bg-gray-50 border-b border-gray-200"><th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Report</th><th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Type</th><th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Format</th><th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th><th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Created</th><th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th></tr></thead>
              <tbody className="divide-y divide-gray-200">
                {filteredReports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4"><div className="flex items-center gap-3"><span className="text-2xl">{reportTypeIcons[report.reportType]}</span><div><div className="font-medium text-gray-900">{report.title}</div><div className="text-sm text-gray-500">{report.description}</div></div></div></td>
                    <td className="px-6 py-4 text-sm text-gray-600">{reportTypeLabels[report.reportType]}</td>
                    <td className="px-6 py-4"><span className={`px-2 py-0.5 rounded text-xs font-medium uppercase ${formatColors[report.fileFormat]}`}>{report.fileFormat}</span></td>
                    <td className="px-6 py-4"><span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${statusColors[report.status]}`}>{report.status}</span></td>
                    <td className="px-6 py-4 text-sm text-gray-600">{formatDateTime(report.createdAt)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {report.status === 'completed' && <><button onClick={() => handleDownload(report)} className="px-3 py-1 text-sm font-medium text-gray-700 hover:text-gray-900">Download</button><button onClick={() => setShowShareModal(report)} className="px-3 py-1 text-sm font-medium text-gray-700 hover:text-gray-900">Share</button></>}
                        {report.status === 'failed' && <button onClick={() => handleRegenerateReport(report.id)} className="px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-700">Retry</button>}
                        {report.status === 'generating' && <span className="text-sm text-gray-500">Processing...</span>}
                        <button onClick={() => handleDeleteReport(report.id)} className="px-3 py-1 text-sm font-medium text-red-600 hover:text-red-700">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredReports.length === 0 && <div className="text-center py-12 text-gray-500">No reports found</div>}
          </div>
        </>
      )}

      {activeTab === 'templates' && (
        <div className="grid grid-cols-3 gap-6">
          {mockTemplates.map((template) => (
            <div key={template.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:border-gray-300 transition-colors">
              <div className="flex items-start justify-between mb-4"><span className="text-3xl">{reportTypeIcons[template.reportType]}</span>{template.isPublic && <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">Public</span>}</div>
              <h3 className="font-semibold text-gray-900 mb-2">{template.name}</h3>
              <p className="text-sm text-gray-600 mb-4">{template.description}</p>
              <button onClick={() => { setCreateForm(prev => ({ ...prev, reportType: template.reportType, title: template.name })); setShowCreateModal(true); }} className="w-full py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Use Template</button>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'subscriptions' && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead><tr className="bg-gray-50 border-b border-gray-200"><th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Subscription</th><th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Frequency</th><th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Delivery</th><th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Next</th><th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th><th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th></tr></thead>
            <tbody className="divide-y divide-gray-200">
              {subscriptions.map((sub) => (
                <tr key={sub.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4"><div className="font-medium text-gray-900">{sub.name}</div><div className="text-sm text-gray-500">{sub.templateName}</div></td>
                  <td className="px-6 py-4"><span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 capitalize">{sub.frequency}</span></td>
                  <td className="px-6 py-4 text-sm text-gray-600 capitalize">{sub.deliveryMethod}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{formatDate(sub.nextDelivery)}</td>
                  <td className="px-6 py-4"><span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${sub.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>{sub.isActive ? 'Active' : 'Paused'}</span></td>
                  <td className="px-6 py-4 text-right"><button onClick={() => toggleSubscription(sub.id)} className={`px-3 py-1 text-sm font-medium ${sub.isActive ? 'text-yellow-600' : 'text-green-600'}`}>{sub.isActive ? 'Pause' : 'Resume'}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowCreateModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between"><h2 className="text-lg font-bold text-gray-900">Generate New Report</h2><button onClick={() => setShowCreateModal(false)} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500">✕</button></div>
            <div className="p-6 space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Report Title</label><input type="text" value={createForm.title} onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })} placeholder="e.g., Q3 Campaign Performance" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><textarea value={createForm.description} onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })} rows={2} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label><select value={createForm.reportType} onChange={(e) => setCreateForm({ ...createForm, reportType: e.target.value as ReportType })} className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white">{Object.entries(reportTypeLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Format</label><select value={createForm.fileFormat} onChange={(e) => setCreateForm({ ...createForm, fileFormat: e.target.value as FileFormat })} className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white"><option value="pdf">PDF</option><option value="excel">Excel</option><option value="csv">CSV</option><option value="json">JSON</option></select></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label><select value={createForm.dateRange} onChange={(e) => setCreateForm({ ...createForm, dateRange: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white"><option value="7d">Last 7 days</option><option value="30d">Last 30 days</option><option value="90d">Last 90 days</option><option value="all">All time</option></select></div>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3"><button onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button><button onClick={handleCreateReport} disabled={!createForm.title} className="px-4 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 disabled:opacity-50">Generate Report</button></div>
          </div>
        </div>
      )}

      {showSubscriptionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowSubscriptionModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between"><h2 className="text-lg font-bold text-gray-900">Schedule Automated Report</h2><button onClick={() => setShowSubscriptionModal(false)} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500">✕</button></div>
            <div className="p-6 space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Subscription Name</label><input type="text" value={subscriptionForm.name} onChange={(e) => setSubscriptionForm({ ...subscriptionForm, name: e.target.value })} placeholder="e.g., Weekly Performance Digest" className="w-full px-3 py-2 border border-gray-200 rounded-lg" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Report Template</label><select value={subscriptionForm.templateId} onChange={(e) => setSubscriptionForm({ ...subscriptionForm, templateId: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white"><option value="">Select template...</option>{mockTemplates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label><select value={subscriptionForm.frequency} onChange={(e) => setSubscriptionForm({ ...subscriptionForm, frequency: e.target.value as SubscriptionFrequency })} className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white"><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option></select></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Delivery</label><select value={subscriptionForm.deliveryMethod} onChange={(e) => setSubscriptionForm({ ...subscriptionForm, deliveryMethod: e.target.value as DeliveryMethod })} className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white"><option value="email">Email</option><option value="slack">Slack</option></select></div>
              </div>
              {subscriptionForm.deliveryMethod === 'email' && <div><label className="block text-sm font-medium text-gray-700 mb-1">Email Recipients</label><input type="text" value={subscriptionForm.emailRecipients} onChange={(e) => setSubscriptionForm({ ...subscriptionForm, emailRecipients: e.target.value })} placeholder="email1@example.com, email2@example.com" className="w-full px-3 py-2 border border-gray-200 rounded-lg" /></div>}
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3"><button onClick={() => setShowSubscriptionModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button><button onClick={handleCreateSubscription} disabled={!subscriptionForm.name || !subscriptionForm.templateId} className="px-4 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 disabled:opacity-50">Create Subscription</button></div>
          </div>
        </div>
      )}

      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowShareModal(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between"><h2 className="text-lg font-bold text-gray-900">Share Report</h2><button onClick={() => setShowShareModal(null)} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500">✕</button></div>
            <div className="p-6 space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg"><div className="font-medium text-gray-900">{showShareModal.title}</div><div className="text-sm text-gray-500">{reportTypeLabels[showShareModal.reportType]} • {showShareModal.fileFormat.toUpperCase()}</div></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label><input type="email" value={shareEmail} onChange={(e) => setShareEmail(e.target.value)} placeholder="colleague@company.com" className="w-full px-3 py-2 border border-gray-200 rounded-lg" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Message (optional)</label><textarea value={shareMessage} onChange={(e) => setShareMessage(e.target.value)} rows={3} className="w-full px-3 py-2 border border-gray-200 rounded-lg" /></div>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3"><button onClick={() => setShowShareModal(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button><button onClick={handleShare} disabled={!shareEmail} className="px-4 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 disabled:opacity-50">Send Report</button></div>
          </div>
        </div>
      )}
    </div>
  );
}