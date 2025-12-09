'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useReports, useDashboards } from '@/lib/hooks';
import { formatDate, formatRelativeTime, cn } from '@/lib/utils';
import { REPORT_STATUS, REPORT_TYPES } from '@/lib/utils/constants';
import type { ReportType, ReportStatus } from '@/types';

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<'reports' | 'dashboards'>('reports');
  const [typeFilter, setTypeFilter] = useState<ReportType | ''>('');
  const [statusFilter, setStatusFilter] = useState<ReportStatus | ''>('');
  const [page, setPage] = useState(1);

  const {
    data: reportsData,
    isLoading: isLoadingReports,
  } = useReports(
    {
      report_type: typeFilter || undefined,
      status: statusFilter || undefined,
      page,
      page_size: 10,
    },
    { enabled: activeTab === 'reports' }
  );

  const {
    data: dashboards,
    isLoading: isLoadingDashboards,
  } = useDashboards({ enabled: activeTab === 'dashboards' });

  const isLoading = activeTab === 'reports' ? isLoadingReports : isLoadingDashboards;
  const reports = reportsData?.results || [];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
        <div className="flex gap-2">
          {activeTab === 'reports' && (
            <Link
              href="/reports/create"
              className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
            >
              Create Report
            </Link>
          )}
          {activeTab === 'dashboards' && (
            <Link
              href="/reports/dashboards/create"
              className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
            >
              Create Dashboard
            </Link>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex gap-8">
          <button
            onClick={() => {
              setActiveTab('reports');
              setPage(1);
            }}
            className={cn(
              'py-4 px-1 border-b-2 font-medium text-sm',
              activeTab === 'reports'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            )}
          >
            Reports
          </button>
          <button
            onClick={() => {
              setActiveTab('dashboards');
              setPage(1);
            }}
            className={cn(
              'py-4 px-1 border-b-2 font-medium text-sm',
              activeTab === 'dashboards'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            )}
          >
            Dashboards
          </button>
        </nav>
      </div>

      {/* Filters (Reports only) */}
      {activeTab === 'reports' && (
        <div className="flex gap-4 mb-6">
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value as ReportType | '');
              setPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">All Types</option>
            {Object.entries(REPORT_TYPES).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as ReportStatus | '');
              setPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">All Statuses</option>
            {Object.entries(REPORT_STATUS).map(([value, { label }]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center h-64">
          <div className="spinner" />
        </div>
      )}

      {/* Reports Tab */}
      {!isLoading && activeTab === 'reports' && (
        <>
          {reports.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-gray-500 mb-4">No reports found</p>
              <Link
                href="/reports/create"
                className="text-primary-600 hover:underline font-medium"
              >
                Create your first report
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => (
                <Link
                  key={report.id}
                  href={`/reports/${report.id}`}
                  className="card block hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">{report.title}</h3>
                        <span
                          className={cn(
                            'badge',
                            `badge-${REPORT_STATUS[report.status]?.color || 'gray'}`
                          )}
                        >
                          {REPORT_STATUS[report.status]?.label || report.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {REPORT_TYPES[report.report_type]} • {report.file_format.toUpperCase()}
                      </p>
                      {report.description && (
                        <p className="text-sm text-gray-500 mt-1">{report.description}</p>
                      )}
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      <p>Created {formatRelativeTime(report.created_at)}</p>
                      {report.is_scheduled && (
                        <p className="text-primary-600">Scheduled</p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}

      {/* Dashboards Tab */}
      {!isLoading && activeTab === 'dashboards' && (
        <>
          {(!dashboards || dashboards.length === 0) ? (
            <div className="card text-center py-12">
              <p className="text-gray-500 mb-4">No dashboards found</p>
              <Link
                href="/reports/dashboards/create"
                className="text-primary-600 hover:underline font-medium"
              >
                Create your first dashboard
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dashboards.map((dashboard) => (
                <Link
                  key={dashboard.id}
                  href={`/reports/dashboards/${dashboard.id}`}
                  className="card hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-gray-900">{dashboard.name}</h3>
                    {dashboard.is_default && (
                      <span className="badge badge-blue">Default</span>
                    )}
                  </div>
                  {dashboard.description && (
                    <p className="text-sm text-gray-500 mb-3">{dashboard.description}</p>
                  )}
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{dashboard.widgets.length} widgets</span>
                    <span>Updated {formatRelativeTime(dashboard.updated_at)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
