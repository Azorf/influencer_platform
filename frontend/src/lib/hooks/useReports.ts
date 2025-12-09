import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from '@tanstack/react-query';
import { reportsApi } from '@/lib/api/reports';
import { reportKeys } from '@/lib/query-keys';
import type {
  ApiError,
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
// Query Hooks
// =============================================================================

/**
 * Hook to list reports
 * Maps to GET /reports/
 */
export const useReports = (
  params?: ReportListParams,
  options?: Omit<
    UseQueryOptions<PaginatedResponse<Report>, ApiError>,
    'queryKey' | 'queryFn'
  >
) => {
  return useQuery<PaginatedResponse<Report>, ApiError>({
    queryKey: reportKeys.list(params as Record<string, unknown>),
    queryFn: () => reportsApi.listReports(params),
    ...options,
  });
};

/**
 * Hook to get report details
 * Maps to GET /reports/:pk/
 */
export const useReport = (
  id: number,
  options?: Omit<UseQueryOptions<Report, ApiError>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<Report, ApiError>({
    queryKey: reportKeys.detail(id),
    queryFn: () => reportsApi.getReport(id),
    enabled: id > 0,
    // Poll for status if report is generating
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data?.status === 'generating') {
        return 5000; // Poll every 5 seconds
      }
      return false;
    },
    ...options,
  });
};

/**
 * Hook to list report templates
 * Maps to GET /reports/templates/
 */
export const useTemplates = (
  options?: Omit<
    UseQueryOptions<ReportTemplate[], ApiError>,
    'queryKey' | 'queryFn'
  >
) => {
  return useQuery<ReportTemplate[], ApiError>({
    queryKey: reportKeys.templates(),
    queryFn: reportsApi.listTemplates,
    staleTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });
};

/**
 * Hook to get template details
 * Maps to GET /reports/templates/:pk/
 */
export const useTemplate = (
  id: number,
  options?: Omit<
    UseQueryOptions<ReportTemplate, ApiError>,
    'queryKey' | 'queryFn'
  >
) => {
  return useQuery<ReportTemplate, ApiError>({
    queryKey: reportKeys.template(id),
    queryFn: () => reportsApi.getTemplate(id),
    enabled: id > 0,
    ...options,
  });
};

/**
 * Hook to list dashboards
 * Maps to GET /reports/dashboards/
 */
export const useDashboards = (
  options?: Omit<UseQueryOptions<Dashboard[], ApiError>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<Dashboard[], ApiError>({
    queryKey: reportKeys.dashboards(),
    queryFn: reportsApi.listDashboards,
    ...options,
  });
};

/**
 * Hook to get dashboard details
 * Maps to GET /reports/dashboards/:pk/
 */
export const useDashboard = (
  id: number,
  options?: Omit<UseQueryOptions<Dashboard, ApiError>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<Dashboard, ApiError>({
    queryKey: reportKeys.dashboard(id),
    queryFn: () => reportsApi.getDashboard(id),
    enabled: id > 0,
    ...options,
  });
};

/**
 * Hook to list analytics snapshots
 * Maps to GET /reports/snapshots/
 */
export const useSnapshots = (
  params?: SnapshotListParams,
  options?: Omit<
    UseQueryOptions<PaginatedResponse<AnalyticsSnapshot>, ApiError>,
    'queryKey' | 'queryFn'
  >
) => {
  return useQuery<PaginatedResponse<AnalyticsSnapshot>, ApiError>({
    queryKey: reportKeys.snapshots(params as Record<string, unknown>),
    queryFn: () => reportsApi.listSnapshots(params),
    ...options,
  });
};

/**
 * Hook to list report subscriptions
 * Maps to GET /reports/subscriptions/
 */
export const useSubscriptions = (
  options?: Omit<
    UseQueryOptions<ReportSubscription[], ApiError>,
    'queryKey' | 'queryFn'
  >
) => {
  return useQuery<ReportSubscription[], ApiError>({
    queryKey: reportKeys.subscriptions(),
    queryFn: reportsApi.listSubscriptions,
    ...options,
  });
};

// =============================================================================
// Mutation Hooks
// =============================================================================

/**
 * Hook for creating a report
 * Maps to POST /reports/create/
 */
export const useCreateReport = (
  options?: UseMutationOptions<Report, ApiError, ReportCreateRequest>
) => {
  const queryClient = useQueryClient();

  return useMutation<Report, ApiError, ReportCreateRequest>({
    mutationFn: reportsApi.createReport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reportKeys.lists() });
    },
    ...options,
  });
};

/**
 * Hook for scheduling a report
 * Maps to PATCH /reports/:pk/
 */
export const useScheduleReport = (
  options?: UseMutationOptions<
    Report,
    ApiError,
    { id: number; data: ReportScheduleRequest }
  >
) => {
  const queryClient = useQueryClient();

  return useMutation<Report, ApiError, { id: number; data: ReportScheduleRequest }>({
    mutationFn: ({ id, data }: { id: number; data: ReportScheduleRequest }) => 
      reportsApi.scheduleReport(id, data),
    onSuccess: (_data: Report, variables: { id: number; data: ReportScheduleRequest }) => {
      queryClient.invalidateQueries({
        queryKey: reportKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: reportKeys.lists() });
    },
    ...options,
  });
};

/**
 * Hook for deleting a report
 * Maps to DELETE /reports/:pk/
 */
export const useDeleteReport = (
  options?: UseMutationOptions<void, ApiError, number>
) => {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, number>({
    mutationFn: reportsApi.deleteReport,
    onSuccess: (_data: void, id: number) => {
      queryClient.removeQueries({ queryKey: reportKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: reportKeys.lists() });
    },
    ...options,
  });
};

/**
 * Hook for regenerating a report
 * Maps to POST /reports/:pk/regenerate/
 */
export const useRegenerateReport = (
  options?: UseMutationOptions<Report, ApiError, number>
) => {
  const queryClient = useQueryClient();

  return useMutation<Report, ApiError, number>({
    mutationFn: reportsApi.regenerateReport,
    onSuccess: (data: Report, id: number) => {
      queryClient.setQueryData(reportKeys.detail(id), data);
      queryClient.invalidateQueries({ queryKey: reportKeys.lists() });
    },
    ...options,
  });
};

/**
 * Hook for sharing a report
 * Maps to POST /reports/:pk/share/
 */
export const useShareReport = (
  options?: UseMutationOptions<
    { success: boolean; shared_with: number[] },
    ApiError,
    { id: number; userIds: number[] }
  >
) => {
  return useMutation<
    { success: boolean; shared_with: number[] },
    ApiError,
    { id: number; userIds: number[] }
  >({
    mutationFn: ({ id, userIds }: { id: number; userIds: number[] }) => 
      reportsApi.shareReport(id, userIds),
    ...options,
  });
};

/**
 * Hook for creating report from template
 * Maps to POST /reports/templates/:pk/create-report/
 */
export const useCreateReportFromTemplate = (
  options?: UseMutationOptions<
    Report,
    ApiError,
    { templateId: number; overrides?: Partial<ReportCreateRequest> }
  >
) => {
  const queryClient = useQueryClient();

  return useMutation<
    Report,
    ApiError,
    { templateId: number; overrides?: Partial<ReportCreateRequest> }
  >({
    mutationFn: ({ templateId, overrides }: { templateId: number; overrides?: Partial<ReportCreateRequest> }) =>
      reportsApi.createReportFromTemplate(templateId, overrides),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reportKeys.lists() });
    },
    ...options,
  });
};

/**
 * Hook for creating a dashboard
 * Maps to POST /reports/dashboards/create/
 */
export const useCreateDashboard = (
  options?: UseMutationOptions<Dashboard, ApiError, DashboardCreateRequest>
) => {
  const queryClient = useQueryClient();

  return useMutation<Dashboard, ApiError, DashboardCreateRequest>({
    mutationFn: reportsApi.createDashboard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reportKeys.dashboards() });
    },
    ...options,
  });
};

/**
 * Hook for updating a dashboard
 * Maps to PATCH /reports/dashboards/:pk/edit/
 */
export const useUpdateDashboard = (
  options?: UseMutationOptions<
    Dashboard,
    ApiError,
    { id: number; data: DashboardUpdateRequest }
  >
) => {
  const queryClient = useQueryClient();

  return useMutation<Dashboard, ApiError, { id: number; data: DashboardUpdateRequest }>({
    mutationFn: ({ id, data }: { id: number; data: DashboardUpdateRequest }) => 
      reportsApi.updateDashboard(id, data),
    onSuccess: (_data: Dashboard, variables: { id: number; data: DashboardUpdateRequest }) => {
      queryClient.invalidateQueries({
        queryKey: reportKeys.dashboard(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: reportKeys.dashboards() });
    },
    ...options,
  });
};

/**
 * Hook for deleting a dashboard
 * Maps to DELETE /reports/dashboards/:pk/
 */
export const useDeleteDashboard = (
  options?: UseMutationOptions<void, ApiError, number>
) => {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, number>({
    mutationFn: reportsApi.deleteDashboard,
    onSuccess: (_data: void, id: number) => {
      queryClient.removeQueries({ queryKey: reportKeys.dashboard(id) });
      queryClient.invalidateQueries({ queryKey: reportKeys.dashboards() });
    },
    ...options,
  });
};

/**
 * Hook for setting default dashboard
 * Maps to POST /reports/dashboards/:pk/set-default/
 */
export const useSetDefaultDashboard = (
  options?: UseMutationOptions<Dashboard, ApiError, number>
) => {
  const queryClient = useQueryClient();

  return useMutation<Dashboard, ApiError, number>({
    mutationFn: reportsApi.setDefaultDashboard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reportKeys.dashboards() });
    },
    ...options,
  });
};

/**
 * Hook for duplicating a dashboard
 * Maps to POST /reports/dashboards/:pk/duplicate/
 */
export const useDuplicateDashboard = (
  options?: UseMutationOptions<
    Dashboard,
    ApiError,
    { id: number; newName: string }
  >
) => {
  const queryClient = useQueryClient();

  return useMutation<Dashboard, ApiError, { id: number; newName: string }>({
    mutationFn: ({ id, newName }: { id: number; newName: string }) => 
      reportsApi.duplicateDashboard(id, newName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reportKeys.dashboards() });
    },
    ...options,
  });
};

/**
 * Hook for creating a snapshot
 * Maps to POST /reports/snapshots/create/
 */
export const useCreateSnapshot = (
  options?: UseMutationOptions<AnalyticsSnapshot, ApiError, CreateSnapshotRequest>
) => {
  const queryClient = useQueryClient();

  return useMutation<AnalyticsSnapshot, ApiError, CreateSnapshotRequest>({
    mutationFn: reportsApi.createSnapshot,
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (query) =>
          Array.isArray(query.queryKey) &&
          query.queryKey[0] === 'reports' && 
          query.queryKey[1] === 'snapshots',
      });
    },
    ...options,
  });
};

/**
 * Hook for creating a subscription
 * Maps to POST /reports/subscriptions/create/
 */
export const useCreateSubscription = (
  options?: UseMutationOptions<
    ReportSubscription,
    ApiError,
    SubscriptionCreateRequest
  >
) => {
  const queryClient = useQueryClient();

  return useMutation<ReportSubscription, ApiError, SubscriptionCreateRequest>({
    mutationFn: reportsApi.createSubscription,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reportKeys.subscriptions() });
    },
    ...options,
  });
};

/**
 * Hook for updating a subscription
 * Maps to PATCH /reports/subscriptions/:pk/
 */
export const useUpdateSubscription = (
  options?: UseMutationOptions<
    ReportSubscription,
    ApiError,
    { id: number; data: Partial<SubscriptionCreateRequest> }
  >
) => {
  const queryClient = useQueryClient();

  return useMutation<
    ReportSubscription,
    ApiError,
    { id: number; data: Partial<SubscriptionCreateRequest> }
  >({
    mutationFn: ({ id, data }: { id: number; data: Partial<SubscriptionCreateRequest> }) => 
      reportsApi.updateSubscription(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reportKeys.subscriptions() });
    },
    ...options,
  });
};

/**
 * Hook for deleting a subscription
 * Maps to DELETE /reports/subscriptions/:pk/
 */
export const useDeleteSubscription = (
  options?: UseMutationOptions<void, ApiError, number>
) => {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, number>({
    mutationFn: reportsApi.deleteSubscription,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reportKeys.subscriptions() });
    },
    ...options,
  });
};

/**
 * Hook for toggling subscription active status
 * Maps to POST /reports/subscriptions/:pk/toggle/
 */
export const useToggleSubscription = (
  options?: UseMutationOptions<ReportSubscription, ApiError, number>
) => {
  const queryClient = useQueryClient();

  return useMutation<ReportSubscription, ApiError, number>({
    mutationFn: reportsApi.toggleSubscription,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reportKeys.subscriptions() });
    },
    ...options,
  });
};

// =============================================================================
// Export All Hooks
// =============================================================================

export const reportHooks = {
  // Queries
  useReports,
  useReport,
  useTemplates,
  useTemplate,
  useDashboards,
  useDashboard,
  useSnapshots,
  useSubscriptions,
  // Mutations
  useCreateReport,
  useScheduleReport,
  useDeleteReport,
  useRegenerateReport,
  useShareReport,
  useCreateReportFromTemplate,
  useCreateDashboard,
  useUpdateDashboard,
  useDeleteDashboard,
  useSetDefaultDashboard,
  useDuplicateDashboard,
  useCreateSnapshot,
  useCreateSubscription,
  useUpdateSubscription,
  useDeleteSubscription,
  useToggleSubscription,
};

export default reportHooks;
