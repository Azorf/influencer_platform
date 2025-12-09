import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from '@tanstack/react-query';
import { campaignsApi } from '@/lib/api/campaigns';
import { campaignKeys } from '@/lib/query-keys';
import type {
  ApiError,
  PaginatedResponse,
  Campaign,
  CampaignWithStats,
  CampaignWithCollaborations,
  InfluencerCollaboration,
  CampaignContent,
  CampaignAnalytics,
  CampaignCreateRequest,
  CampaignUpdateRequest,
  InviteInfluencerRequest,
  UpdateCollaborationStatusRequest,
  ContentReviewRequest,
  UpdateContentMetricsRequest,
  BulkUpdateMetricsRequest,
  CampaignPerformanceResponse,
  CampaignListParams,
} from '@/types';

// =============================================================================
// Query Hooks
// =============================================================================

/**
 * Hook to list campaigns with pagination
 * Maps to GET /campaigns/
 */
export const useCampaigns = (
  params?: CampaignListParams,
  options?: Omit<
    UseQueryOptions<PaginatedResponse<CampaignWithStats>, ApiError>,
    'queryKey' | 'queryFn'
  >
) => {
  return useQuery<PaginatedResponse<CampaignWithStats>, ApiError>({
    queryKey: campaignKeys.list(params as Record<string, unknown>),
    queryFn: () => campaignsApi.listCampaigns(params),
    ...options,
  });
};

/**
 * Hook to get campaign details
 * Maps to GET /campaigns/:pk/
 */
export const useCampaign = (
  id: number,
  options?: Omit<
    UseQueryOptions<CampaignWithCollaborations, ApiError>,
    'queryKey' | 'queryFn'
  >
) => {
  return useQuery<CampaignWithCollaborations, ApiError>({
    queryKey: campaignKeys.detail(id),
    queryFn: () => campaignsApi.getCampaign(id),
    enabled: id > 0,
    ...options,
  });
};

/**
 * Hook to get collaborations for a campaign
 * Maps to GET /campaigns/:pk/collaborations/
 */
export const useCollaborations = (
  campaignId: number,
  options?: Omit<
    UseQueryOptions<InfluencerCollaboration[], ApiError>,
    'queryKey' | 'queryFn'
  >
) => {
  return useQuery<InfluencerCollaboration[], ApiError>({
    queryKey: campaignKeys.collaborations(campaignId),
    queryFn: () => campaignsApi.listCollaborations(campaignId),
    enabled: campaignId > 0,
    ...options,
  });
};

/**
 * Hook to get single collaboration details
 * Maps to GET /campaigns/collaboration/:pk/
 */
export const useCollaboration = (
  id: number,
  options?: Omit<
    UseQueryOptions<InfluencerCollaboration, ApiError>,
    'queryKey' | 'queryFn'
  >
) => {
  return useQuery<InfluencerCollaboration, ApiError>({
    queryKey: campaignKeys.collaboration(id),
    queryFn: () => campaignsApi.getCollaboration(id),
    enabled: id > 0,
    ...options,
  });
};

/**
 * Hook to get content for a collaboration
 * Maps to GET /campaigns/collaboration/:pk/content/
 */
export const useContent = (
  collaborationId: number,
  options?: Omit<
    UseQueryOptions<CampaignContent[], ApiError>,
    'queryKey' | 'queryFn'
  >
) => {
  return useQuery<CampaignContent[], ApiError>({
    queryKey: campaignKeys.content(collaborationId),
    queryFn: () => campaignsApi.listContent(collaborationId),
    enabled: collaborationId > 0,
    ...options,
  });
};

/**
 * Hook to get campaign analytics
 * Maps to GET /campaigns/:pk/analytics/
 */
export const useCampaignAnalytics = (
  id: number,
  options?: Omit<
    UseQueryOptions<CampaignAnalytics, ApiError>,
    'queryKey' | 'queryFn'
  >
) => {
  return useQuery<CampaignAnalytics, ApiError>({
    queryKey: campaignKeys.analytics(id),
    queryFn: () => campaignsApi.getCampaignAnalytics(id),
    enabled: id > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

/**
 * Hook to get campaign performance (detailed)
 * Maps to GET /campaigns/api/:pk/performance/
 */
export const useCampaignPerformance = (
  id: number,
  options?: Omit<
    UseQueryOptions<CampaignPerformanceResponse, ApiError>,
    'queryKey' | 'queryFn'
  >
) => {
  return useQuery<CampaignPerformanceResponse, ApiError>({
    queryKey: campaignKeys.performance(id),
    queryFn: () => campaignsApi.getCampaignPerformance(id),
    enabled: id > 0,
    ...options,
  });
};

// =============================================================================
// Mutation Hooks
// =============================================================================

/**
 * Hook for creating a campaign
 * Maps to POST /campaigns/create/
 */
export const useCreateCampaign = (
  options?: UseMutationOptions<Campaign, ApiError, CampaignCreateRequest>
) => {
  const queryClient = useQueryClient();

  return useMutation<Campaign, ApiError, CampaignCreateRequest>({
    mutationFn: campaignsApi.createCampaign,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.lists() });
    },
    ...options,
  });
};

/**
 * Hook for updating a campaign
 * Maps to PATCH /campaigns/:pk/edit/
 */
export const useUpdateCampaign = (
  options?: UseMutationOptions<
    Campaign,
    ApiError,
    { id: number; data: CampaignUpdateRequest }
  >
) => {
  const queryClient = useQueryClient();

  return useMutation<Campaign, ApiError, { id: number; data: CampaignUpdateRequest }>({
    mutationFn: ({ id, data }: { id: number; data: CampaignUpdateRequest }) => 
      campaignsApi.updateCampaign(id, data),
    onSuccess: (_data: Campaign, variables: { id: number; data: CampaignUpdateRequest }) => {
      queryClient.invalidateQueries({
        queryKey: campaignKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: campaignKeys.lists() });
    },
    ...options,
  });
};

/**
 * Hook for deleting a campaign
 * Maps to DELETE /campaigns/:pk/delete/
 */
export const useDeleteCampaign = (
  options?: UseMutationOptions<void, ApiError, number>
) => {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, number>({
    mutationFn: campaignsApi.deleteCampaign,
    onSuccess: (_data: void, id: number) => {
      queryClient.removeQueries({ queryKey: campaignKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: campaignKeys.lists() });
    },
    ...options,
  });
};

/**
 * Hook for inviting an influencer to a campaign
 * Maps to POST /campaigns/:pk/invite-influencer/
 */
export const useInviteInfluencer = (
  options?: UseMutationOptions<
    InfluencerCollaboration,
    ApiError,
    { campaignId: number; data: InviteInfluencerRequest }
  >
) => {
  const queryClient = useQueryClient();

  return useMutation<InfluencerCollaboration, ApiError, { campaignId: number; data: InviteInfluencerRequest }>({
    mutationFn: ({ campaignId, data }: { campaignId: number; data: InviteInfluencerRequest }) =>
      campaignsApi.inviteInfluencer(campaignId, data),
    onSuccess: (_data: InfluencerCollaboration, variables: { campaignId: number; data: InviteInfluencerRequest }) => {
      queryClient.invalidateQueries({
        queryKey: campaignKeys.collaborations(variables.campaignId),
      });
      queryClient.invalidateQueries({
        queryKey: campaignKeys.detail(variables.campaignId),
      });
    },
    ...options,
  });
};

/**
 * Hook for updating collaboration status
 * Maps to PATCH /campaigns/collaboration/:pk/update-status/
 */
export const useUpdateCollaborationStatus = (
  options?: UseMutationOptions<
    InfluencerCollaboration,
    ApiError,
    { id: number; data: UpdateCollaborationStatusRequest }
  >
) => {
  const queryClient = useQueryClient();

  return useMutation<InfluencerCollaboration, ApiError, { id: number; data: UpdateCollaborationStatusRequest }>({
    mutationFn: ({ id, data }: { id: number; data: UpdateCollaborationStatusRequest }) =>
      campaignsApi.updateCollaborationStatus(id, data),
    onSuccess: (data: InfluencerCollaboration, variables: { id: number; data: UpdateCollaborationStatusRequest }) => {
      queryClient.invalidateQueries({
        queryKey: campaignKeys.collaboration(variables.id),
      });
      // Also invalidate the parent campaign's collaborations
      queryClient.invalidateQueries({
        queryKey: campaignKeys.collaborations(data.campaign),
      });
    },
    ...options,
  });
};

/**
 * Hook for submitting content
 * Maps to POST /campaigns/collaboration/:pk/content/
 */
export const useSubmitContent = (
  options?: UseMutationOptions<
    CampaignContent,
    ApiError,
    { collaborationId: number; data: FormData }
  >
) => {
  const queryClient = useQueryClient();

  return useMutation<CampaignContent, ApiError, { collaborationId: number; data: FormData }>({
    mutationFn: ({ collaborationId, data }: { collaborationId: number; data: FormData }) =>
      campaignsApi.submitContent(collaborationId, data),
    onSuccess: (_data: CampaignContent, variables: { collaborationId: number; data: FormData }) => {
      queryClient.invalidateQueries({
        queryKey: campaignKeys.content(variables.collaborationId),
      });
    },
    ...options,
  });
};

/**
 * Hook for reviewing content
 * Maps to PATCH /campaigns/content/:pk/review/
 */
export const useReviewContent = (
  options?: UseMutationOptions<
    CampaignContent,
    ApiError,
    { contentId: number; data: ContentReviewRequest }
  >
) => {
  const queryClient = useQueryClient();

  return useMutation<CampaignContent, ApiError, { contentId: number; data: ContentReviewRequest }>({
    mutationFn: ({ contentId, data }: { contentId: number; data: ContentReviewRequest }) =>
      campaignsApi.reviewContent(contentId, data),
    onSuccess: (data: CampaignContent) => {
      queryClient.invalidateQueries({
        queryKey: campaignKeys.content(data.collaboration),
      });
    },
    ...options,
  });
};

/**
 * Hook for updating content metrics
 * Maps to PATCH /campaigns/content/:pk/update-metrics/
 */
export const useUpdateContentMetrics = (
  options?: UseMutationOptions<
    CampaignContent,
    ApiError,
    { contentId: number; data: UpdateContentMetricsRequest }
  >
) => {
  const queryClient = useQueryClient();

  return useMutation<CampaignContent, ApiError, { contentId: number; data: UpdateContentMetricsRequest }>({
    mutationFn: ({ contentId, data }: { contentId: number; data: UpdateContentMetricsRequest }) =>
      campaignsApi.updateContentMetrics(contentId, data),
    onSuccess: (data: CampaignContent) => {
      queryClient.invalidateQueries({
        queryKey: campaignKeys.content(data.collaboration),
      });
    },
    ...options,
  });
};

/**
 * Hook for bulk updating metrics
 * Maps to POST /campaigns/api/content/bulk-update/
 */
export const useBulkUpdateMetrics = (
  options?: UseMutationOptions<{ updated: number }, ApiError, BulkUpdateMetricsRequest>
) => {
  const queryClient = useQueryClient();

  return useMutation<{ updated: number }, ApiError, BulkUpdateMetricsRequest>({
    mutationFn: campaignsApi.bulkUpdateMetrics,
    onSuccess: () => {
      // Invalidate all content queries as we don't know which were affected
      queryClient.invalidateQueries({
        predicate: (query) =>
          Array.isArray(query.queryKey) &&
          query.queryKey[0] === 'campaigns' && 
          query.queryKey[1] === 'content',
      });
    },
    ...options,
  });
};

/**
 * Hook for refreshing campaign analytics
 * Maps to POST /campaigns/api/:pk/analytics/refresh/
 */
export const useRefreshCampaignAnalytics = (
  options?: UseMutationOptions<CampaignAnalytics, ApiError, number>
) => {
  const queryClient = useQueryClient();

  return useMutation<CampaignAnalytics, ApiError, number>({
    mutationFn: campaignsApi.refreshCampaignAnalytics,
    onSuccess: (data: CampaignAnalytics, id: number) => {
      queryClient.setQueryData(campaignKeys.analytics(id), data);
      queryClient.invalidateQueries({ queryKey: campaignKeys.performance(id) });
    },
    ...options,
  });
};

// =============================================================================
// Export All Hooks
// =============================================================================

export const campaignHooks = {
  useCampaigns,
  useCampaign,
  useCollaborations,
  useCollaboration,
  useContent,
  useCampaignAnalytics,
  useCampaignPerformance,
  useCreateCampaign,
  useUpdateCampaign,
  useDeleteCampaign,
  useInviteInfluencer,
  useUpdateCollaborationStatus,
  useSubmitContent,
  useReviewContent,
  useUpdateContentMetrics,
  useBulkUpdateMetrics,
  useRefreshCampaignAnalytics,
};

export default campaignHooks;
