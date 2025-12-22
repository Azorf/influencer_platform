'use client';

import { useState, useEffect } from 'react';
import { reportService, type Report, type ReportTemplate, type ReportSubscription, type ReportType, type ReportStatus, type FileFormat, type SubscriptionFrequency, type DeliveryMethod } from '@/lib/report-service';

const reportTypeLabels: Record<ReportType, string> = {
  campaign_performance: 'Campaign Performance',
  influencer_analytics: 'Influencer Analytics',
  audience_insights: 'Audience Insights',
  roi_analysis: 'ROI Analysis',
  competitive_analysis: 'Competitive Analysis',
  trend_analysis: 'Trend Analysis',
  agency_dashboard: 'Agency Dashboard',
  custom: 'Custom Report',
};

const reportTypeIcons: Record<ReportType, string> = {
  campaign_performance: '📊',
  influencer_analytics: '👥',
  audience_insights: '🎯',
  roi_analysis: '💰',
  competitive_analysis: '⚔️',
  trend_analysis: '📈',
  agency_dashboard: '🏢',
  custom: '⚙️',
};

const statusColors: Record<ReportStatus, string> = {
  generating: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  scheduled: 'bg-blue-100 text-blue-800',
};

const formatColors: Record<FileFormat, string> = {
  pdf: 'bg-red-50 text-red-700',
  excel: 'bg-green-50 text-green-700',
  csv: 'bg-blue-50 text-blue-700',
  json: 'bg-purple-50 text-purple-700',
  dashboard: 'bg-gray-50 text-gray-700',
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data
  const [reports, setReports] = useState<Report[]>([]);
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [subscriptions, setSubscriptions] = useState<ReportSubscription[]>([]);

  // Filters
  const [typeFilter, setTypeFilter] = useState<ReportType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<ReportStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState<Report | null>(null);

  // Forms
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    reportType: 'campaign_performance' as ReportType,
    fileFormat: 'pdf' as FileFormat,
    dateRange: '30d',
  });
  const [subscriptionForm, setSubscriptionForm] = useState({
    name: '',
    templateId: '',
    frequency: 'weekly' as SubscriptionFrequency,
    deliveryMethod: 'email' as DeliveryMethod,
    emailRecipients: '',
    deliveryTime: '09:00',
  });
  const [shareEmail, setShareEmail] = useState('');
  const [shareMessage, setShareMessage] = useState('');

  // Dashboard stats (mock for now, could be from API)
  const dashboardStats = {
    totalReach: 2850000,
    totalImpressions: 4560000,
    totalEngagement: 156800,
    avgEngagementRate: 4.2,
    totalCampaigns: 12,
    activeCampaigns: 4,
    completedCampaigns: 7,
    totalSpent: 185000,
    totalBudget: 250000,
    totalInfluencers: 34,
    activeCollaborations: 18,
    contentPieces: 89,
    websiteClicks: 12500,
    conversions: 342,
    roiPercentage: 145,
  };

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      setError(null);

      const [reportsData, templatesData, subscriptionsData] = await Promise.all([
        reportService.getReports(),
        reportService.getTemplates(),
        reportService.getSubscriptions(),
      ]);

      setReports(reportsData);
      setTemplates(templatesData);
      setSubscriptions(subscriptionsData);
    } catch (err) {
      console.error('Failed to fetch reports data:', err);
      setError('Failed to load reports');
    } finally {
      setLoading(false);
    }
  }

  const filteredReports = reports.filter((r) => {
    const matchesType = typeFilter === 'all' || r.reportType === typeFilter;
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesStatus && matchesSearch;
  });

  async function handleCreateReport() {
    try {
      const newReport = await reportService.createReport({
        title: createForm.title,
        description: createForm.description,
        reportType: createForm.reportType,
        fileFormat: createForm.fileFormat,
        filters: { dateRange: createForm.dateRange },
      });

      setReports([newReport, ...reports]);
      setShowCreateModal(false);
      setCreateForm({ title: '', description: '', reportType: 'campaign_performance', fileFormat: 'pdf', dateRange: '30d' });

      // Poll for completion
      pollReportStatus(newReport.id);
    } catch (err) {
      console.error('Failed to create report:', err);
      alert('Failed to create report');
    }
  }

  async function pollReportStatus(reportId: number) {
    const maxAttempts = 30;
    let attempts = 0;

    const poll = async () => {
      try {
        const status = await reportService.getReportStatus(reportId);
        setReports((prev) =>
          prev.map((r) =>
            r.id === reportId
              ? { ...r, status: status.status, generationTime: status.generationTime, downloadUrl: status.downloadUrl, canDownload: status.status === 'completed' }
              : r
          )
        );

        if (status.status === 'generating' && attempts < maxAttempts) {
          attempts++;
          setTimeout(poll, 2000);
        }
      } catch (err) {
        console.error('Failed to poll report status:', err);
      }
    };

    poll();
  }

  async function handleCreateSubscription() {
    const template = templates.find((t) => t.id === parseInt(subscriptionForm.templateId));
    if (!template) return;

    try {
      const newSubscription = await reportService.createSubscription({
        name: subscriptionForm.name,
        reportTemplateId: parseInt(subscriptionForm.templateId),
        frequency: subscriptionForm.frequency,
        deliveryMethod: subscriptionForm.deliveryMethod,
        emailRecipients: subscriptionForm.emailRecipients,
        deliveryTime: subscriptionForm.deliveryTime,
      });

      setSubscriptions([...subscriptions, newSubscription]);
      setShowSubscriptionModal(false);
      setSubscriptionForm({ name: '', templateId: '', frequency: 'weekly', deliveryMethod: 'email', emailRecipients: '', deliveryTime: '09:00' });
    } catch (err) {
      console.error('Failed to create subscription:', err);
      alert('Failed to create subscription');
    }
  }

  function handleDownload(report: Report) {
    if (report.downloadUrl) {
      window.open(reportService.getDownloadUrl(report.id), '_blank');
    }
  }

  function handleShare() {
    // TODO: Implement share via API
    alert(`Report shared with ${shareEmail}`);
    setShowShareModal(null);
    setShareEmail('');
    setShareMessage('');
  }

  async function handleRegenerateReport(reportId: number) {
    try {
      await reportService.regenerateReport(reportId);
      setReports((prev) => prev.map((r) => (r.id === reportId ? { ...r, status: 'generating' as ReportStatus, errorMessage: null } : r)));
      pollReportStatus(reportId);
    } catch (err) {
      console.error('Failed to regenerate report:', err);
      alert('Failed to regenerate report');
    }
  }

  async function handleDeleteReport(reportId: number) {
    if (!confirm('Delete this report?')) return;

    try {
      await reportService.deleteReport(reportId);
      setReports((prev) => prev.filter((r) => r.id !== reportId));
    } catch (err) {
      console.error('Failed to delete report:', err);
      alert('Failed to delete report');
    }
  }

  async function toggleSubscription(subscriptionId: number) {
    try {
      const result = await reportService.toggleSubscription(subscriptionId);
      setSubscriptions((prev) => prev.map((s) => (s.id === subscriptionId ? { ...s, isActive: result.isActive } : s)));
    } catch (err) {
      console.error('Failed to toggle subscription:', err);
      alert('Failed to toggle subscription');
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

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
          <button onClick={fetchData} className="ml-4 underline hover:no-underline">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600 mt-1">Track performance, generate reports, and gain insights</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowSubscriptionModal(true)} className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
            Schedule Report
          </button>
          <button onClick={() => setShowCreateModal(true)} className="px-4 py-2.5 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800">
            Generate Report
          </button>
        </div>
      </div>

      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {(['dashboard', 'reports', 'templates', 'subscriptions'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px capitalize ${activeTab === tab ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <>
          <div className="grid grid-cols-5 gap-4 mb-6">
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <div className="text-sm text-gray-500 mb-1">Total Reach</div>
              <div className="text-2xl font-bold text-gray-900">{formatNumber(dashboardStats.totalReach)}</div>
              <div className="text-xs text-green-600 mt-1">+12% vs last month</div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <div className="text-sm text-gray-500 mb-1">Total Engagement</div>
              <div className="text-2xl font-bold text-gray-900">{formatNumber(dashboardStats.totalEngagement)}</div>
              <div className="text-xs text-green-600 mt-1">{dashboardStats.avgEngagementRate}% rate</div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <div className="text-sm text-gray-500 mb-1">Conversions</div>
              <div className="text-2xl font-bold text-gray-900">{dashboardStats.conversions}</div>
              <div className="text-xs text-gray-500 mt-1">{formatNumber(dashboardStats.websiteClicks)} clicks</div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <div className="text-sm text-gray-500 mb-1">Total Spent</div>
              <div className="text-2xl font-bold text-gray-900">{formatCurrency(dashboardStats.totalSpent)}</div>
              <div className="text-xs text-gray-500 mt-1">of {formatCurrency(dashboardStats.totalBudget)}</div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <div className="text-sm text-gray-500 mb-1">ROI</div>
              <div className="text-2xl font-bold text-green-600">+{dashboardStats.roiPercentage}%</div>
              <div className="text-xs text-gray-500 mt-1">return on investment</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Performance Over Time</h3>
                <select className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white">
                  <option>Last 30 days</option>
                  <option>Last 90 days</option>
                </select>
              </div>
              <div className="h-64 flex items-center justify-center text-gray-400 border border-dashed border-gray-200 rounded-lg">
                <div className="text-center">
                  <div className="text-4xl mb-2">📈</div>
                  <div>Performance chart would render here</div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Campaign Summary</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-600">Active Campaigns</span>
                  <span className="font-semibold text-gray-900">{dashboardStats.activeCampaigns}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-600">Total Influencers</span>
                  <span className="font-semibold text-gray-900">{dashboardStats.totalInfluencers}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-600">Content Pieces</span>
                  <span className="font-semibold text-gray-900">{dashboardStats.contentPieces}</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-gray-600">Total Investment</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(dashboardStats.totalSpent)}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <>
          <div className="flex gap-4 mb-6">
            <input
              type="text"
              placeholder="Search reports..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-gray-200"
            />
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as ReportType | 'all')} className="px-3 py-2 border border-gray-200 rounded-lg bg-white">
              <option value="all">All Types</option>
              {Object.entries(reportTypeLabels).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as ReportStatus | 'all')} className="px-3 py-2 border border-gray-200 rounded-lg bg-white">
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="generating">Generating</option>
              <option value="failed">Failed</option>
              <option value="scheduled">Scheduled</option>
            </select>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Report</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Format</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Created</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredReports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{report.title}</div>
                      {report.description && <div className="text-sm text-gray-500 truncate max-w-xs">{report.description}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <span className="flex items-center gap-2 text-sm text-gray-600">
                        <span>{reportTypeIcons[report.reportType]}</span>
                        {reportTypeLabels[report.reportType]}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded text-xs font-medium uppercase ${formatColors[report.fileFormat]}`}>{report.fileFormat}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[report.status]}`}>{report.status}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{formatDateTime(report.createdAt)}</td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {report.canDownload && (
                        <button onClick={() => handleDownload(report)} className="text-sm text-gray-600 hover:text-gray-900">
                          Download
                        </button>
                      )}
                      {report.status === 'completed' && (
                        <button onClick={() => setShowShareModal(report)} className="text-sm text-gray-600 hover:text-gray-900">
                          Share
                        </button>
                      )}
                      {report.canRegenerate && (
                        <button onClick={() => handleRegenerateReport(report.id)} className="text-sm text-blue-600 hover:text-blue-700">
                          Regenerate
                        </button>
                      )}
                      <button onClick={() => handleDeleteReport(report.id)} className="text-sm text-red-600 hover:text-red-700">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredReports.length === 0 && <div className="p-12 text-center text-gray-500">No reports found</div>}
          </div>
        </>
      )}

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-2 gap-4">
          {templates.map((template) => (
            <div key={template.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:border-gray-300 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{reportTypeIcons[template.reportType]}</span>
                  <div>
                    <h3 className="font-semibold text-gray-900">{template.name}</h3>
                    <span className="text-xs text-gray-500">{reportTypeLabels[template.reportType]}</span>
                  </div>
                </div>
                {template.isPublic && <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded">Public</span>}
              </div>
              <p className="text-sm text-gray-600 mb-4">{template.description}</p>
              <button
                onClick={() => {
                  setCreateForm({ ...createForm, title: template.name, reportType: template.reportType });
                  setShowCreateModal(true);
                }}
                className="text-sm font-medium text-gray-900 hover:text-gray-600"
              >
                Use Template →
              </button>
            </div>
          ))}
          {templates.length === 0 && <div className="col-span-2 p-12 text-center text-gray-500 bg-white rounded-lg border border-gray-200">No templates available</div>}
        </div>
      )}

      {/* Subscriptions Tab */}
      {activeTab === 'subscriptions' && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Subscription</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Frequency</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Delivery</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Next Delivery</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {subscriptions.map((sub) => (
                <tr key={sub.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{sub.name}</div>
                    <div className="text-sm text-gray-500">{sub.reportTemplateName}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 capitalize">{sub.frequency}</td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-600 capitalize">{sub.deliveryMethod}</div>
                    <div className="text-xs text-gray-400 truncate max-w-xs">{sub.emailRecipients}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{sub.nextDelivery ? formatDateTime(sub.nextDelivery) : '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${sub.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                      {sub.isActive ? 'Active' : 'Paused'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => toggleSubscription(sub.id)} className={`px-3 py-1 text-sm font-medium ${sub.isActive ? 'text-yellow-600' : 'text-green-600'}`}>
                      {sub.isActive ? 'Pause' : 'Resume'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {subscriptions.length === 0 && <div className="p-12 text-center text-gray-500">No subscriptions found</div>}
        </div>
      )}

      {/* Create Report Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowCreateModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Generate New Report</h2>
              <button onClick={() => setShowCreateModal(false)} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500">
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Report Title</label>
                <input
                  type="text"
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  placeholder="e.g., Q3 Campaign Performance"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
                  <select
                    value={createForm.reportType}
                    onChange={(e) => setCreateForm({ ...createForm, reportType: e.target.value as ReportType })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white"
                  >
                    {Object.entries(reportTypeLabels).map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Format</label>
                  <select
                    value={createForm.fileFormat}
                    onChange={(e) => setCreateForm({ ...createForm, fileFormat: e.target.value as FileFormat })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white"
                  >
                    <option value="pdf">PDF</option>
                    <option value="excel">Excel</option>
                    <option value="csv">CSV</option>
                    <option value="json">JSON</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                <select
                  value={createForm.dateRange}
                  onChange={(e) => setCreateForm({ ...createForm, dateRange: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white"
                >
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                  <option value="all">All time</option>
                </select>
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleCreateReport} disabled={!createForm.title} className="px-4 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 disabled:opacity-50">
                Generate Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subscription Modal */}
      {showSubscriptionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowSubscriptionModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Schedule Automated Report</h2>
              <button onClick={() => setShowSubscriptionModal(false)} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500">
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subscription Name</label>
                <input
                  type="text"
                  value={subscriptionForm.name}
                  onChange={(e) => setSubscriptionForm({ ...subscriptionForm, name: e.target.value })}
                  placeholder="e.g., Weekly Performance Digest"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Report Template</label>
                <select
                  value={subscriptionForm.templateId}
                  onChange={(e) => setSubscriptionForm({ ...subscriptionForm, templateId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white"
                >
                  <option value="">Select template...</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                  <select
                    value={subscriptionForm.frequency}
                    onChange={(e) => setSubscriptionForm({ ...subscriptionForm, frequency: e.target.value as SubscriptionFrequency })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Delivery</label>
                  <select
                    value={subscriptionForm.deliveryMethod}
                    onChange={(e) => setSubscriptionForm({ ...subscriptionForm, deliveryMethod: e.target.value as DeliveryMethod })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white"
                  >
                    <option value="email">Email</option>
                    <option value="slack">Slack</option>
                  </select>
                </div>
              </div>
              {subscriptionForm.deliveryMethod === 'email' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Recipients</label>
                  <input
                    type="text"
                    value={subscriptionForm.emailRecipients}
                    onChange={(e) => setSubscriptionForm({ ...subscriptionForm, emailRecipients: e.target.value })}
                    placeholder="email1@example.com, email2@example.com"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                  />
                </div>
              )}
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowSubscriptionModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
                Cancel
              </button>
              <button
                onClick={handleCreateSubscription}
                disabled={!subscriptionForm.name || !subscriptionForm.templateId}
                className="px-4 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 disabled:opacity-50"
              >
                Create Subscription
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowShareModal(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Share Report</h2>
              <button onClick={() => setShowShareModal(null)} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500">
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="font-medium text-gray-900">{showShareModal.title}</div>
                <div className="text-sm text-gray-500">
                  {reportTypeLabels[showShareModal.reportType]} • {showShareModal.fileFormat.toUpperCase()}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message (optional)</label>
                <textarea value={shareMessage} onChange={(e) => setShareMessage(e.target.value)} rows={3} className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowShareModal(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleShare} disabled={!shareEmail} className="px-4 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 disabled:opacity-50">
                Send Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
