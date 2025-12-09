import type { ID, ISODateString } from '../api';

// =============================================================================
// Report Types (maps to reports.Report)
// =============================================================================

/**
 * Report type choices
 */
export type ReportType = 
  | 'campaign_performance'
  | 'influencer_analytics'
  | 'audience_insights'
  | 'roi_analysis'
  | 'competitive_analysis'
  | 'trend_analysis'
  | 'agency_dashboard'
  | 'custom';

/**
 * Report status choices
 */
export type ReportStatus = 'generating' | 'completed' | 'failed' | 'scheduled';

/**
 * Report format choices
 */
export type ReportFormat = 'pdf' | 'excel' | 'csv' | 'json' | 'dashboard';

/**
 * Schedule frequency choices
 */
export type ScheduleFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly';

/**
 * Report interface
 */
export interface Report {
  id: ID;
  title: string;
  description: string | null;
  report_type: ReportType;
  parameters: Record<string, unknown>;
  filters: Record<string, unknown>;
  file_format: ReportFormat;
  file_path: string | null;
  report_data: Record<string, unknown>;
  created_by: ID;
  agency: ID;
  status: ReportStatus;
  generation_started_at: ISODateString | null;
  generation_completed_at: ISODateString | null;
  error_message: string | null;
  is_scheduled: boolean;
  schedule_frequency: ScheduleFrequency | null;
  next_generation_date: ISODateString | null;
  created_at: ISODateString;
  updated_at: ISODateString;
}

// =============================================================================
// Report Template Types (maps to reports.ReportTemplate)
// =============================================================================

/**
 * Chart configuration for templates
 */
export interface ChartConfiguration {
  id: string;
  type: 'line' | 'bar' | 'pie' | 'area' | 'scatter' | 'radar';
  title: string;
  dataKey: string;
  xAxisKey?: string;
  yAxisKey?: string;
  colors?: string[];
  options?: Record<string, unknown>;
}

/**
 * Report section configuration
 */
export interface ReportSection {
  id: string;
  title: string;
  type: 'metrics' | 'chart' | 'table' | 'text' | 'comparison';
  content?: string;
  dataSource?: string;
  chartConfig?: ChartConfiguration;
  order: number;
}

/**
 * Report template interface
 */
export interface ReportTemplate {
  id: ID;
  name: string;
  description: string;
  report_type: ReportType;
  default_parameters: Record<string, unknown>;
  default_filters: Record<string, unknown>;
  chart_configurations: ChartConfiguration[];
  sections: ReportSection[];
  is_public: boolean;
  created_by: ID;
  allowed_agencies: ID[];
  created_at: ISODateString;
  updated_at: ISODateString;
}

// =============================================================================
// Dashboard Types (maps to reports.Dashboard)
// =============================================================================

/**
 * Dashboard type choices
 */
export type DashboardType = 
  | 'executive'
  | 'campaign_manager'
  | 'influencer_manager'
  | 'financial'
  | 'custom';

/**
 * Widget type choices
 */
export type WidgetType = 
  | 'metric_card'
  | 'line_chart'
  | 'bar_chart'
  | 'pie_chart'
  | 'table'
  | 'list'
  | 'progress'
  | 'map'
  | 'calendar';

/**
 * Widget configuration
 */
export interface DashboardWidget {
  id: string;
  type: WidgetType;
  title: string;
  dataSource: string;
  refreshInterval?: number;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  config: Record<string, unknown>;
}

/**
 * Dashboard layout configuration
 */
export interface DashboardLayout {
  columns: number;
  rowHeight: number;
  gap: number;
}

/**
 * Dashboard interface
 */
export interface Dashboard {
  id: ID;
  name: string;
  description: string | null;
  dashboard_type: DashboardType;
  layout: DashboardLayout;
  widgets: DashboardWidget[];
  agency: ID;
  created_by: ID;
  shared_with: ID[];
  is_default: boolean;
  auto_refresh_interval: number;
  created_at: ISODateString;
  updated_at: ISODateString;
}

// =============================================================================
// Analytics Snapshot Types (maps to reports.AnalyticsSnapshot)
// =============================================================================

/**
 * Snapshot type choices
 */
export type SnapshotType = 'campaign' | 'influencer' | 'agency' | 'platform';

/**
 * Analytics snapshot interface
 */
export interface AnalyticsSnapshot {
  id: ID;
  snapshot_type: SnapshotType;
  campaign: ID | null;
  influencer: ID | null;
  agency: ID | null;
  metrics: Record<string, unknown>;
  snapshot_date: ISODateString;
  created_at: ISODateString;
}

// =============================================================================
// Report Subscription Types (maps to reports.ReportSubscription)
// =============================================================================

/**
 * Delivery method choices
 */
export type DeliveryMethod = 'email' | 'slack' | 'webhook';

/**
 * Day of week (0 = Monday)
 */
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/**
 * Report subscription interface
 */
export interface ReportSubscription {
  id: ID;
  name: string;
  report_template: ID;
  report_template_details?: ReportTemplate;
  agency: ID;
  frequency: ScheduleFrequency;
  delivery_method: DeliveryMethod;
  email_recipients: string;
  slack_webhook_url: string | null;
  custom_webhook_url: string | null;
  delivery_time: string;
  delivery_day_of_week: DayOfWeek | null;
  delivery_day_of_month: number | null;
  is_active: boolean;
  last_delivered: ISODateString | null;
  next_delivery: ISODateString | null;
  report_parameters: Record<string, unknown>;
  created_by: ID;
  created_at: ISODateString;
  updated_at: ISODateString;
}

// =============================================================================
// Request/Response Types
// =============================================================================

/**
 * Report create request
 */
export interface ReportCreateRequest {
  title: string;
  description?: string;
  report_type: ReportType;
  parameters?: Record<string, unknown>;
  filters?: Record<string, unknown>;
  file_format?: ReportFormat;
  template_id?: ID;
}

/**
 * Report schedule request
 */
export interface ReportScheduleRequest {
  is_scheduled: boolean;
  schedule_frequency?: ScheduleFrequency;
}

/**
 * Dashboard create request
 */
export interface DashboardCreateRequest {
  name: string;
  description?: string;
  dashboard_type: DashboardType;
  layout?: DashboardLayout;
  widgets?: DashboardWidget[];
  is_default?: boolean;
  auto_refresh_interval?: number;
}

/**
 * Dashboard update request
 */
export interface DashboardUpdateRequest extends Partial<DashboardCreateRequest> {
  shared_with?: ID[];
}

/**
 * Create snapshot request
 */
export interface CreateSnapshotRequest {
  snapshot_type: SnapshotType;
  campaign_id?: ID;
  influencer_id?: ID;
}

/**
 * Subscription create request
 */
export interface SubscriptionCreateRequest {
  name: string;
  report_template: ID;
  frequency: ScheduleFrequency;
  delivery_method: DeliveryMethod;
  email_recipients?: string;
  slack_webhook_url?: string;
  custom_webhook_url?: string;
  delivery_time: string;
  delivery_day_of_week?: DayOfWeek;
  delivery_day_of_month?: number;
  report_parameters?: Record<string, unknown>;
}

/**
 * Report list filters
 */
export interface ReportListParams {
  report_type?: ReportType;
  status?: ReportStatus;
  file_format?: ReportFormat;
  start_date?: string;
  end_date?: string;
  page?: number;
  page_size?: number;
}

/**
 * Snapshot list filters
 */
export interface SnapshotListParams {
  snapshot_type?: SnapshotType;
  campaign_id?: ID;
  influencer_id?: ID;
  start_date?: string;
  end_date?: string;
  page?: number;
  page_size?: number;
}
