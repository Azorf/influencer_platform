import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
  type UseQueryOptions,
  type UseMutationOptions,
} from '@tanstack/react-query';
import { influencersApi } from '@/lib/api/influencers';
import { influencerKeys } from '@/lib/query-keys';
import type {
  ApiError,
  PaginatedResponse,
  Influencer,
  InfluencerWithSocials,
  InfluencerSearchResult,
  SocialMediaAccount,
  Category,
  CategoryWithChildren,
  Tag,
  InfluencerSearchParams,
  AddSocialAccountRequest,
  InfluencerAnalyticsResponse,
} from '@/types';

// =============================================================================
// Query Hooks
// =============================================================================

/**
 * Hook to list influencers with pagination
 * Maps to GET /influencers/
 */
export const useInfluencers = (
  params?: InfluencerSearchParams,
  options?: Omit<
    UseQueryOptions<PaginatedResponse<Influencer>, ApiError>,
    'queryKey' | 'queryFn'
  >
) => {
  return useQuery<PaginatedResponse<Influencer>, ApiError>({
    queryKey: influencerKeys.list(params as Record<string, unknown>),
    queryFn: () => influencersApi.listInfluencers(params),
    ...options,
  });
};

/**
 * Hook for infinite scrolling influencer list
 * Maps to GET /influencers/
 */
export const useInfiniteInfluencers = (
  params?: Omit<InfluencerSearchParams, 'page'>
) => {
  return useInfiniteQuery({
    queryKey: influencerKeys.list(params as Record<string, unknown>),
    queryFn: ({ pageParam }) =>
      influencersApi.listInfluencers({ ...params, page: pageParam as number }),
    getNextPageParam: (lastPage: PaginatedResponse<Influencer>, allPages: PaginatedResponse<Influencer>[]) => {
      if (lastPage.next) {
        return allPages.length + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
  });
};

/**
 * Hook to get influencer details
 * Maps to GET /influencers/:pk/
 */
export const useInfluencer = (
  id: number,
  options?: Omit<
    UseQueryOptions<InfluencerWithSocials, ApiError>,
    'queryKey' | 'queryFn'
  >
) => {
  return useQuery<InfluencerWithSocials, ApiError>({
    queryKey: influencerKeys.detail(id),
    queryFn: () => influencersApi.getInfluencer(id),
    enabled: id > 0,
    ...options,
  });
};

/**
 * Hook to search influencers
 * Maps to GET /influencers/search/
 */
export const useSearchInfluencers = (
  params: InfluencerSearchParams,
  options?: Omit<
    UseQueryOptions<PaginatedResponse<InfluencerSearchResult>, ApiError>,
    'queryKey' | 'queryFn'
  >
) => {
  return useQuery<PaginatedResponse<InfluencerSearchResult>, ApiError>({
    queryKey: influencerKeys.search(params as Record<string, unknown>),
    queryFn: () => influencersApi.searchInfluencers(params),
    enabled: Object.keys(params).length > 0,
    ...options,
  });
};

/**
 * Hook to get influencer analytics
 * Maps to GET /influencers/analytics/:pk/
 */
export const useInfluencerAnalytics = (
  id: number,
  options?: Omit<
    UseQueryOptions<InfluencerAnalyticsResponse, ApiError>,
    'queryKey' | 'queryFn'
  >
) => {
  return useQuery<InfluencerAnalyticsResponse, ApiError>({
    queryKey: influencerKeys.analytics(id),
    queryFn: () => influencersApi.getInfluencerAnalytics(id),
    enabled: id > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

/**
 * Hook to get social accounts for an influencer
 * Maps to GET /influencers/:pk/social-accounts/
 */
export const useSocialAccounts = (
  influencerId: number,
  options?: Omit<
    UseQueryOptions<SocialMediaAccount[], ApiError>,
    'queryKey' | 'queryFn'
  >
) => {
  return useQuery<SocialMediaAccount[], ApiError>({
    queryKey: influencerKeys.socialAccounts(influencerId),
    queryFn: () => influencersApi.getSocialAccounts(influencerId),
    enabled: influencerId > 0,
    ...options,
  });
};

/**
 * Hook to get all tags
 * Maps to GET /influencers/tags/
 */
export const useTags = (
  options?: Omit<UseQueryOptions<Tag[], ApiError>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<Tag[], ApiError>({
    queryKey: influencerKeys.tags(),
    queryFn: influencersApi.listTags,
    staleTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });
};

/**
 * Hook to get all categories
 * Maps to GET /influencers/categories/
 */
export const useCategories = (
  options?: Omit<
    UseQueryOptions<CategoryWithChildren[], ApiError>,
    'queryKey' | 'queryFn'
  >
) => {
  return useQuery<CategoryWithChildren[], ApiError>({
    queryKey: influencerKeys.categories(),
    queryFn: influencersApi.listCategories,
    staleTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });
};

// =============================================================================
// Mutation Hooks
// =============================================================================

/**
 * Hook for adding a social account
 * Maps to POST /influencers/social-accounts/add/
 */
export const useAddSocialAccount = (
  options?: UseMutationOptions<SocialMediaAccount, ApiError, AddSocialAccountRequest>
) => {
  const queryClient = useQueryClient();

  return useMutation<SocialMediaAccount, ApiError, AddSocialAccountRequest>({
    mutationFn: influencersApi.addSocialAccount,
    onSuccess: (_data: SocialMediaAccount, variables: AddSocialAccountRequest) => {
      queryClient.invalidateQueries({
        queryKey: influencerKeys.socialAccounts(variables.influencer_id),
      });
      queryClient.invalidateQueries({
        queryKey: influencerKeys.detail(variables.influencer_id),
      });
    },
    ...options,
  });
};

/**
 * Hook for updating a social account
 */
export const useUpdateSocialAccount = (
  options?: UseMutationOptions<
    SocialMediaAccount,
    ApiError,
    { influencerId: number; accountId: number; data: Partial<SocialMediaAccount> }
  >
) => {
  const queryClient = useQueryClient();

  return useMutation<
    SocialMediaAccount,
    ApiError,
    { influencerId: number; accountId: number; data: Partial<SocialMediaAccount> }
  >({
    mutationFn: ({ influencerId, accountId, data }: { influencerId: number; accountId: number; data: Partial<SocialMediaAccount> }) =>
      influencersApi.updateSocialAccount(influencerId, accountId, data),
    onSuccess: (_data: SocialMediaAccount, variables: { influencerId: number; accountId: number; data: Partial<SocialMediaAccount> }) => {
      queryClient.invalidateQueries({
        queryKey: influencerKeys.socialAccounts(variables.influencerId),
      });
    },
    ...options,
  });
};

/**
 * Hook for deleting a social account
 */
export const useDeleteSocialAccount = (
  options?: UseMutationOptions<
    void,
    ApiError,
    { influencerId: number; accountId: number }
  >
) => {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, { influencerId: number; accountId: number }>({
    mutationFn: ({ influencerId, accountId }: { influencerId: number; accountId: number }) =>
      influencersApi.deleteSocialAccount(influencerId, accountId),
    onSuccess: (_data: void, variables: { influencerId: number; accountId: number }) => {
      queryClient.invalidateQueries({
        queryKey: influencerKeys.socialAccounts(variables.influencerId),
      });
      queryClient.invalidateQueries({
        queryKey: influencerKeys.detail(variables.influencerId),
      });
    },
    ...options,
  });
};

/**
 * Hook for syncing a social account
 */
export const useSyncSocialAccount = (
  options?: UseMutationOptions<
    SocialMediaAccount,
    ApiError,
    { influencerId: number; accountId: number }
  >
) => {
  const queryClient = useQueryClient();

  return useMutation<SocialMediaAccount, ApiError, { influencerId: number; accountId: number }>({
    mutationFn: ({ influencerId, accountId }: { influencerId: number; accountId: number }) =>
      influencersApi.syncSocialAccount(influencerId, accountId),
    onSuccess: (_data: SocialMediaAccount, variables: { influencerId: number; accountId: number }) => {
      queryClient.invalidateQueries({
        queryKey: influencerKeys.socialAccounts(variables.influencerId),
      });
      queryClient.invalidateQueries({
        queryKey: influencerKeys.analytics(variables.influencerId),
      });
    },
    ...options,
  });
};

/**
 * Hook for creating a tag
 * Maps to POST /influencers/tags/
 */
export const useCreateTag = (
  options?: UseMutationOptions<Tag, ApiError, { name: string; color?: string }>
) => {
  const queryClient = useQueryClient();

  return useMutation<Tag, ApiError, { name: string; color?: string }>({
    mutationFn: influencersApi.createTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: influencerKeys.tags() });
    },
    ...options,
  });
};

/**
 * Hook for creating a category
 * Maps to POST /influencers/categories/
 */
export const useCreateCategory = (
  options?: UseMutationOptions<
    Category,
    ApiError,
    { name: string; description?: string; parent?: number }
  >
) => {
  const queryClient = useQueryClient();

  return useMutation<Category, ApiError, { name: string; description?: string; parent?: number }>({
    mutationFn: influencersApi.createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: influencerKeys.categories() });
    },
    ...options,
  });
};

/**
 * Hook for bulk updating tags
 */
export const useBulkUpdateTags = (
  options?: UseMutationOptions<
    { updated: number },
    ApiError,
    { influencerIds: number[]; tagIds: number[] }
  >
) => {
  const queryClient = useQueryClient();

  return useMutation<{ updated: number }, ApiError, { influencerIds: number[]; tagIds: number[] }>({
    mutationFn: ({ influencerIds, tagIds }: { influencerIds: number[]; tagIds: number[] }) =>
      influencersApi.bulkUpdateTags(influencerIds, tagIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: influencerKeys.lists() });
    },
    ...options,
  });
};

// =============================================================================
// Export All Hooks
// =============================================================================

export const influencerHooks = {
  useInfluencers,
  useInfiniteInfluencers,
  useInfluencer,
  useSearchInfluencers,
  useInfluencerAnalytics,
  useSocialAccounts,
  useTags,
  useCategories,
  useAddSocialAccount,
  useUpdateSocialAccount,
  useDeleteSocialAccount,
  useSyncSocialAccount,
  useCreateTag,
  useCreateCategory,
  useBulkUpdateTags,
};

export default influencerHooks;
