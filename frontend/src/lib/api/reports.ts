import { get, post, patch, del, download } from './axios';
import type {
  PaginatedResponse,
  Report,
  ReportTemplate,
  Dashboard,
  AnalyticsSnapshot,
  ReportSubscription,
  ReportCreateRequest,
  ReportScheduleRequest,
  DashboardCreateRequest,
  DashboardUpdateRequest,
  CreateSnapshotRequest,
  SubscriptionCreateRequest,
  ReportListParams,
  SnapshotListParams,
} from '@/types';

// =============================================================================
// API Endpoints (maps to reports/urls.py)
// =============================================================================

const ENDPOINTS = {
  // Reports
  reports: '/reports/',
  createReport: '/reports/create/',
  reportDetail: (pk: number) => `/reports/${pk}/`,
  downloadReport: (pk: number) => `/reports/${pk}/download/`,
  shareReport: (pk: number) => `/reports/${pk}/share/`,
  
  // Templates
  templates: '/reports/templates/',
  templateDetail: (pk: number) => `/reports/templates/${pk}/`,
  
  // Dashboards
  dashboards: '/reports/dashboards/',
  createDashboard: '/reports/dashboards/create/',
  dashboardView: (pk: number) => `/reports/dashboards/${pk}/`,
  dashboardEdit: (pk: number) => `/reports/dashboards/${pk}/edit/`,
  
  // Snapshots
  snapshots: '/reports/snapshots/',
  createSnapshot: '/reports/snapshots/create/',
  
  // Subscriptions
  subscriptions: '/reports/subscriptions/',
  createSubscription: '/reports/subscriptions/create/',
} as const;

// =============================================================================
// Report Functions
// =============================================================================

/**
 * List reports with filters
 * GET /reports/
 */
export const listReports = async (
  params?: ReportListParams
): Promise<PaginatedResponse<Report>> => {
  return get<PaginatedResponse<Report>>(ENDPOINTS.reports, params as Record<string, unknown> | undefined);
};

/**
 * Create a new report
 * POST /reports/create/
 */
export const createReport = async (
  data: ReportCreateRequest
): Promise<Report> => {
  return post<Report>(ENDPOINTS.createReport, data);
};

/**
 * Get report details
 * GET /reports/:pk/
 */
export const getReport = async (pk: number): Promise<Report> => {
  return get<Report>(ENDPOINTS.reportDetail(pk));
};

/**
 * Download report file
 * GET /reports/:pk/download/
 */
export const downloadReport = async (
  pk: number,
  filename: string
): Promise<void> => {
  return download(ENDPOINTS.downloadReport(pk), filename);
};

/**
 * Share report with users
 * POST /reports/:pk/share/
 */
export const shareReport = async (
  pk: number,
  userIds: number[]
): Promise<{ success: boolean; shared_with: number[] }> => {
  return post<{ success: boolean; shared_with: number[] }>(
    ENDPOINTS.shareReport(pk),
    { user_ids: userIds }
  );
};

/**
 * Schedule a report
 * PATCH /reports/:pk/
 */
export const scheduleReport = async (
  pk: number,
  data: ReportScheduleRequest
): Promise<Report> => {
  return patch<Report>(ENDPOINTS.reportDetail(pk), data);
};

/**
 * Delete a report
 * DELETE /reports/:pk/
 */
export const deleteReport = async (pk: number): Promise<void> => {
  return del<void>(ENDPOINTS.reportDetail(pk));
};

/**
 * Regenerate a report
 * POST /reports/:pk/regenerate/
 */
export const regenerateReport = async (pk: number): Promise<Report> => {
  return post<Report>(`/reports/${pk}/regenerate/`);
};

// =============================================================================
// Template Functions
// =============================================================================

/**
 * List report templates
 * GET /reports/templates/
 */
export const listTemplates = async (): Promise<ReportTemplate[]> => {
  return get<ReportTemplate[]>(ENDPOINTS.templates);
};

/**
 * Get template details
 * GET /reports/templates/:pk/
 */
export const getTemplate = async (pk: number): Promise<ReportTemplate> => {
  return get<ReportTemplate>(ENDPOINTS.templateDetail(pk));
};

/**
 * Create report from template
 * POST /reports/templates/:pk/create-report/
 */
export const createReportFromTemplate = async (
  templatePk: number,
  overrides?: Partial<ReportCreateRequest>
): Promise<Report> => {
  return post<Report>(`/reports/templates/${templatePk}/create-report/`, overrides);
};

// =============================================================================
// Dashboard Functions
// =============================================================================

/**
 * List dashboards
 * GET /reports/dashboards/
 */
export const listDashboards = async (): Promise<Dashboard[]> => {
  return get<Dashboard[]>(ENDPOINTS.dashboards);
};

/**
 * Create a new dashboard
 * POST /reports/dashboards/create/
 */
export const createDashboard = async (
  data: DashboardCreateRequest
): Promise<Dashboard> => {
  return post<Dashboard>(ENDPOINTS.createDashboard, data);
};

/**
 * Get dashboard details
 * GET /reports/dashboards/:pk/
 */
export const getDashboard = async (pk: number): Promise<Dashboard> => {
  return get<Dashboard>(ENDPOINTS.dashboardView(pk));
};

/**
 * Update dashboard
 * PATCH /reports/dashboards/:pk/edit/
 */
export const updateDashboard = async (
  pk: number,
  data: DashboardUpdateRequest
): Promise<Dashboard> => {
  return patch<Dashboard>(ENDPOINTS.dashboardEdit(pk), data);
};

/**
 * Delete dashboard
 * DELETE /reports/dashboards/:pk/
 */
export const deleteDashboard = async (pk: number): Promise<void> => {
  return del<void>(ENDPOINTS.dashboardView(pk));
};

/**
 * Set dashboard as default
 * POST /reports/dashboards/:pk/set-default/
 */
export const setDefaultDashboard = async (pk: number): Promise<Dashboard> => {
  return post<Dashboard>(`/reports/dashboards/${pk}/set-default/`);
};

/**
 * Duplicate dashboard
 * POST /reports/dashboards/:pk/duplicate/
 */
export const duplicateDashboard = async (
  pk: number,
  newName: string
): Promise<Dashboard> => {
  return post<Dashboard>(`/reports/dashboards/${pk}/duplicate/`, {
    name: newName,
  });
};

// =============================================================================
// Snapshot Functions
// =============================================================================

/**
 * List analytics snapshots
 * GET /reports/snapshots/
 */
export const listSnapshots = async (
  params?: SnapshotListParams
): Promise<PaginatedResponse<AnalyticsSnapshot>> => {
  return get<PaginatedResponse<AnalyticsSnapshot>>(ENDPOINTS.snapshots, params as Record<string, unknown> | undefined);
};

/**
 * Create a new snapshot
 * POST /reports/snapshots/create/
 */
export const createSnapshot = async (
  data: CreateSnapshotRequest
): Promise<AnalyticsSnapshot> => {
  return post<AnalyticsSnapshot>(ENDPOINTS.createSnapshot, data);
};

/**
 * Get snapshot comparison
 * GET /reports/snapshots/compare/
 */
export const compareSnapshots = async (
  snapshot1Id: number,
  snapshot2Id: number
): Promise<{
  snapshot1: AnalyticsSnapshot;
  snapshot2: AnalyticsSnapshot;
  differences: Record<string, { before: unknown; after: unknown; change: number }>;
}> => {
  return get('/reports/snapshots/compare/', {
    snapshot1: snapshot1Id,
    snapshot2: snapshot2Id,
  });
};

// =============================================================================
// Subscription Functions
// =============================================================================

/**
 * List report subscriptions
 * GET /reports/subscriptions/
 */
export const listSubscriptions = async (): Promise<ReportSubscription[]> => {
  return get<ReportSubscription[]>(ENDPOINTS.subscriptions);
};

/**
 * Create a new subscription
 * POST /reports/subscriptions/create/
 */
export const createSubscription = async (
  data: SubscriptionCreateRequest
): Promise<ReportSubscription> => {
  return post<ReportSubscription>(ENDPOINTS.createSubscription, data);
};

/**
 * Update subscription
 * PATCH /reports/subscriptions/:pk/
 */
export const updateSubscription = async (
  pk: number,
  data: Partial<SubscriptionCreateRequest>
): Promise<ReportSubscription> => {
  return patch<ReportSubscription>(`/reports/subscriptions/${pk}/`, data);
};

/**
 * Delete subscription
 * DELETE /reports/subscriptions/:pk/
 */
export const deleteSubscription = async (pk: number): Promise<void> => {
  return del<void>(`/reports/subscriptions/${pk}/`);
};

/**
 * Toggle subscription active status
 * POST /reports/subscriptions/:pk/toggle/
 */
export const toggleSubscription = async (
  pk: number
): Promise<ReportSubscription> => {
  return post<ReportSubscription>(`/reports/subscriptions/${pk}/toggle/`);
};

/**
 * Send test report delivery
 * POST /reports/subscriptions/:pk/test/
 */
export const testSubscription = async (
  pk: number
): Promise<{ success: boolean; message: string }> => {
  return post<{ success: boolean; message: string }>(
    `/reports/subscriptions/${pk}/test/`
  );
};

// =============================================================================
// Export all functions
// =============================================================================

export const reportsApi = {
  // Reports
  listReports,
  createReport,
  getReport,
  downloadReport,
  shareReport,
  scheduleReport,
  deleteReport,
  regenerateReport,
  
  // Templates
  listTemplates,
  getTemplate,
  createReportFromTemplate,
  
  // Dashboards
  listDashboards,
  createDashboard,
  getDashboard,
  updateDashboard,
  deleteDashboard,
  setDefaultDashboard,
  duplicateDashboard,
  
  // Snapshots
  listSnapshots,
  createSnapshot,
  compareSnapshots,
  
  // Subscriptions
  listSubscriptions,
  createSubscription,
  updateSubscription,
  deleteSubscription,
  toggleSubscription,
  testSubscription,
};

export default reportsApi;
