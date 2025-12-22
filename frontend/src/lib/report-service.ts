// Report service for communicating with Django reports API
import { apiClient } from './api-client';

// Types for reports
export type ReportType = 
  | 'campaign_performance' 
  | 'influencer_analytics' 
  | 'audience_insights' 
  | 'roi_analysis' 
  | 'competitive_analysis' 
  | 'trend_analysis' 
  | 'agency_dashboard' 
  | 'custom';

export type ReportStatus = 'generating' | 'completed' | 'failed' | 'scheduled';
export type FileFormat = 'pdf' | 'excel' | 'csv' | 'json' | 'dashboard';
export type SubscriptionFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly';
export type DeliveryMethod = 'email' | 'slack' | 'webhook';
export type DashboardType = 'executive' | 'campaign_manager' | 'influencer_manager' | 'financial' | 'custom';

export interface Report {
  id: number;
  title: string;
  description: string | null;
  reportType: ReportType;
  reportTypeDisplay: string;
  parameters: Record<string, unknown>;
  filters: Record<string, unknown>;
  fileFormat: FileFormat;
  fileFormatDisplay: string;
  reportData: Record<string, unknown>;
  status: ReportStatus;
  statusDisplay: string;
  createdById: number;
  agencyId: number;
  generationStartedAt: string | null;
  generationCompletedAt: string | null;
  errorMessage: string | null;
  isScheduled: boolean;
  scheduleFrequency: SubscriptionFrequency | null;
  nextGenerationDate: string | null;
  createdAt: string;
  updatedAt: string;
  canDownload: boolean;
  canRegenerate: boolean;
  downloadUrl: string | null;
  generationTime: number | null;
}

export interface ReportTemplate {
  id: number;
  name: string;
  description: string;
  reportType: ReportType;
  reportTypeDisplay: string;
  defaultParameters: Record<string, unknown>;
  defaultFilters: Record<string, unknown>;
  chartConfigurations: unknown[];
  sections: unknown[];
  isPublic: boolean;
  createdById: number;
  createdAt: string;
}

export interface Dashboard {
  id: number;
  name: string;
  description: string | null;
  dashboardType: DashboardType;
  dashboardTypeDisplay: string;
  layout: Record<string, unknown>;
  widgets: unknown[];
  agencyId: number;
  createdById: number;
  isDefault: boolean;
  autoRefreshInterval: number;
  createdAt: string;
  updatedAt: string;
}

export interface AnalyticsSnapshot {
  id: number;
  snapshotType: 'campaign' | 'influencer' | 'agency' | 'platform';
  snapshotTypeDisplay: string;
  campaignId: number | null;
  influencerId: number | null;
  agencyId: number | null;
  metrics: Record<string, unknown>;
  snapshotDate: string;
  createdAt: string;
}

export interface ReportSubscription {
  id: number;
  name: string;
  reportTemplateId: number;
  reportTemplateName: string | null;
  agencyId: number;
  frequency: SubscriptionFrequency;
  frequencyDisplay: string;
  deliveryMethod: DeliveryMethod;
  deliveryMethodDisplay: string;
  emailRecipients: string;
  slackWebhookUrl: string | null;
  customWebhookUrl: string | null;
  deliveryTime: string;
  deliveryDayOfWeek: number | null;
  deliveryDayOfMonth: number | null;
  isActive: boolean;
  lastDelivered: string | null;
  nextDelivery: string | null;
  reportParameters: Record<string, unknown>;
  createdById: number;
  createdAt: string;
}

export interface ReportOptions {
  reportTypes: { value: string; label: string }[];
  formats: { value: string; label: string }[];
  frequencies: { value: string; label: string }[];
  dashboardTypes: { value: string; label: string }[];
}

export interface ReportStatusResponse {
  id: number;
  status: ReportStatus;
  statusDisplay: string;
  progress: number;
  errorMessage: string | null;
  downloadUrl: string | null;
  fileFormat: FileFormat;
  generationTime: number | null;
}

export interface CreateReportInput {
  title: string;
  description?: string;
  reportType: ReportType;
  parameters?: Record<string, unknown>;
  filters?: Record<string, unknown>;
  fileFormat?: FileFormat;
  isScheduled?: boolean;
  scheduleFrequency?: SubscriptionFrequency;
}

export interface CreateDashboardInput {
  name: string;
  description?: string;
  dashboardType: DashboardType;
  layout?: Record<string, unknown>;
  widgets?: unknown[];
  isDefault?: boolean;
  autoRefreshInterval?: number;
}

export interface CreateSubscriptionInput {
  name: string;
  reportTemplateId: number;
  frequency: SubscriptionFrequency;
  deliveryMethod: DeliveryMethod;
  emailRecipients: string;
  slackWebhookUrl?: string;
  customWebhookUrl?: string;
  deliveryTime: string;
  deliveryDayOfWeek?: number;
  deliveryDayOfMonth?: number;
  reportParameters?: Record<string, unknown>;
}

// Report Service
export const reportService = {
  // Reports
  async getReports(params?: { type?: ReportType; status?: ReportStatus; search?: string }): Promise<Report[]> {
    const queryParams = new URLSearchParams();
    if (params?.type) queryParams.append('type', params.type);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.search) queryParams.append('search', params.search);
    
    const query = queryParams.toString();
    return apiClient.get<Report[]>(`/reports/${query ? `?${query}` : ''}`);
  },

  async getReport(id: number): Promise<Report> {
    return apiClient.get<Report>(`/reports/${id}/`);
  },

  async createReport(data: CreateReportInput): Promise<Report> {
    return apiClient.post<Report>('/reports/', data);
  },

  async deleteReport(id: number): Promise<void> {
    return apiClient.delete(`/reports/${id}/`);
  },

  async getReportStatus(id: number): Promise<ReportStatusResponse> {
    return apiClient.get<ReportStatusResponse>(`/reports/${id}/status/`);
  },

  async regenerateReport(id: number): Promise<{ status: string; message: string }> {
    return apiClient.post<{ status: string; message: string }>(`/reports/${id}/regenerate/`);
  },

  getDownloadUrl(id: number): string {
    return `${process.env.NEXT_PUBLIC_API_URL || ''}/reports/${id}/download/`;
  },

  // Templates
  async getTemplates(): Promise<ReportTemplate[]> {
    return apiClient.get<ReportTemplate[]>('/reports/templates/');
  },

  async getTemplate(id: number): Promise<ReportTemplate> {
    return apiClient.get<ReportTemplate>(`/reports/templates/${id}/`);
  },

  // Dashboards
  async getDashboards(): Promise<Dashboard[]> {
    return apiClient.get<Dashboard[]>('/reports/dashboards/');
  },

  async getDashboard(id: number): Promise<Dashboard> {
    return apiClient.get<Dashboard>(`/reports/dashboards/${id}/`);
  },

  async createDashboard(data: CreateDashboardInput): Promise<Dashboard> {
    return apiClient.post<Dashboard>('/reports/dashboards/', data);
  },

  async updateDashboard(id: number, data: Partial<CreateDashboardInput>): Promise<Dashboard> {
    return apiClient.put<Dashboard>(`/reports/dashboards/${id}/`, data);
  },

  async deleteDashboard(id: number): Promise<void> {
    return apiClient.delete(`/reports/dashboards/${id}/`);
  },

  // Snapshots
  async getSnapshots(params?: { type?: string }): Promise<AnalyticsSnapshot[]> {
    const query = params?.type ? `?type=${params.type}` : '';
    return apiClient.get<AnalyticsSnapshot[]>(`/reports/snapshots/${query}`);
  },

  async createSnapshot(snapshotType: string): Promise<AnalyticsSnapshot | { status: string; message: string }> {
    return apiClient.post<AnalyticsSnapshot | { status: string; message: string }>('/reports/snapshots/', { snapshotType });
  },

  // Subscriptions
  async getSubscriptions(): Promise<ReportSubscription[]> {
    return apiClient.get<ReportSubscription[]>('/reports/subscriptions/');
  },

  async getSubscription(id: number): Promise<ReportSubscription> {
    return apiClient.get<ReportSubscription>(`/reports/subscriptions/${id}/`);
  },

  async createSubscription(data: CreateSubscriptionInput): Promise<ReportSubscription> {
    return apiClient.post<ReportSubscription>('/reports/subscriptions/', data);
  },

  async updateSubscription(id: number, data: Partial<CreateSubscriptionInput>): Promise<ReportSubscription> {
    return apiClient.put<ReportSubscription>(`/reports/subscriptions/${id}/`, data);
  },

  async deleteSubscription(id: number): Promise<void> {
    return apiClient.delete(`/reports/subscriptions/${id}/`);
  },

  async toggleSubscription(id: number): Promise<{ id: number; isActive: boolean; message: string }> {
    return apiClient.post<{ id: number; isActive: boolean; message: string }>(`/reports/subscriptions/${id}/toggle/`);
  },

  // Options
  async getOptions(): Promise<ReportOptions> {
    return apiClient.get<ReportOptions>('/reports/options/');
  },
};
