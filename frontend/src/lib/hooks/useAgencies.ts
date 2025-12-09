import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from '@tanstack/react-query';
import { agenciesApi } from '@/lib/api/agencies';
import { agencyKeys } from '@/lib/query-keys';
import type {
  ApiError,
  PaginatedResponse,
  Agency,
  AgencyWithOwner,
  AgencyWithTeam,
  TeamMember,
  TeamInvitation,
  AgencySubscription,
  AgencySetupRequest,
  AgencyUpdateRequest,
  TeamAddRequest,
  TeamInviteRequest,
  SubscriptionUpdateRequest,
} from '@/types';

// =============================================================================
// Query Hooks
// =============================================================================

/**
 * Hook to list all agencies (admin)
 * Maps to GET /agencies/list/
 */
export const useAgencies = (
  params?: {
    search?: string;
    status?: string;
    page?: number;
    page_size?: number;
  },
  options?: Omit<
    UseQueryOptions<PaginatedResponse<Agency>, ApiError>,
    'queryKey' | 'queryFn'
  >
) => {
  return useQuery<PaginatedResponse<Agency>, ApiError>({
    queryKey: agencyKeys.list(params as Record<string, unknown>),
    queryFn: () => agenciesApi.listAgencies(params),
    ...options,
  });
};

/**
 * Hook to get agency details
 * Maps to GET /agencies/:pk/
 */
export const useAgency = (
  id: number,
  options?: Omit<
    UseQueryOptions<AgencyWithOwner, ApiError>,
    'queryKey' | 'queryFn'
  >
) => {
  return useQuery<AgencyWithOwner, ApiError>({
    queryKey: agencyKeys.detail(id),
    queryFn: () => agenciesApi.getAgency(id),
    enabled: id > 0,
    ...options,
  });
};

/**
 * Hook to get team members
 * Maps to GET /agencies/:pk/team/
 */
export const useTeamMembers = (
  agencyId: number,
  options?: Omit<
    UseQueryOptions<AgencyWithTeam, ApiError>,
    'queryKey' | 'queryFn'
  >
) => {
  return useQuery<AgencyWithTeam, ApiError>({
    queryKey: agencyKeys.team(agencyId),
    queryFn: () => agenciesApi.getTeamMembers(agencyId),
    enabled: agencyId > 0,
    ...options,
  });
};

/**
 * Hook to get pending invitations
 * Maps to GET /agencies/api/:pk/invitations/
 */
export const useInvitations = (
  agencyId: number,
  options?: Omit<
    UseQueryOptions<TeamInvitation[], ApiError>,
    'queryKey' | 'queryFn'
  >
) => {
  return useQuery<TeamInvitation[], ApiError>({
    queryKey: agencyKeys.invitations(agencyId),
    queryFn: () => agenciesApi.listInvitations(agencyId),
    enabled: agencyId > 0,
    ...options,
  });
};

/**
 * Hook to get subscription details
 * Maps to GET /agencies/:pk/subscription/
 */
export const useSubscription = (
  agencyId: number,
  options?: Omit<
    UseQueryOptions<AgencySubscription, ApiError>,
    'queryKey' | 'queryFn'
  >
) => {
  return useQuery<AgencySubscription, ApiError>({
    queryKey: agencyKeys.subscription(agencyId),
    queryFn: () => agenciesApi.getSubscription(agencyId),
    enabled: agencyId > 0,
    ...options,
  });
};

// =============================================================================
// Mutation Hooks
// =============================================================================

/**
 * Hook for agency setup
 * Maps to POST /agencies/setup/
 */
export const useSetupAgency = (
  options?: UseMutationOptions<Agency, ApiError, AgencySetupRequest>
) => {
  const queryClient = useQueryClient();

  return useMutation<Agency, ApiError, AgencySetupRequest>({
    mutationFn: agenciesApi.setupAgency,
    onSuccess: (data: Agency) => {
      queryClient.invalidateQueries({ queryKey: agencyKeys.lists() });
      queryClient.setQueryData(agencyKeys.detail(data.id), data);
    },
    ...options,
  });
};

/**
 * Hook for agency update
 * Maps to PATCH /agencies/:pk/edit/
 */
export const useUpdateAgency = (
  options?: UseMutationOptions<
    Agency,
    ApiError,
    { id: number; data: AgencyUpdateRequest }
  >
) => {
  const queryClient = useQueryClient();

  return useMutation<Agency, ApiError, { id: number; data: AgencyUpdateRequest }>({
    mutationFn: ({ id, data }: { id: number; data: AgencyUpdateRequest }) => 
      agenciesApi.updateAgency(id, data),
    onSuccess: (_data: Agency, variables: { id: number; data: AgencyUpdateRequest }) => {
      queryClient.invalidateQueries({
        queryKey: agencyKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: agencyKeys.lists() });
    },
    ...options,
  });
};

/**
 * Hook for adding team member (existing user)
 * Maps to POST /agencies/:pk/team/add/
 */
export const useAddTeamMember = (
  options?: UseMutationOptions<
    TeamMember,
    ApiError,
    { agencyId: number; data: TeamAddRequest }
  >
) => {
  const queryClient = useQueryClient();

  return useMutation<TeamMember, ApiError, { agencyId: number; data: TeamAddRequest }>({
    mutationFn: ({ agencyId, data }: { agencyId: number; data: TeamAddRequest }) =>
      agenciesApi.addTeamMember(agencyId, data),
    onSuccess: (_data: TeamMember, variables: { agencyId: number; data: TeamAddRequest }) => {
      queryClient.invalidateQueries({
        queryKey: agencyKeys.team(variables.agencyId),
      });
    },
    ...options,
  });
};

/**
 * Hook for inviting new team member
 * Maps to POST /agencies/:pk/team/invite/
 */
export const useInviteTeamMember = (
  options?: UseMutationOptions<
    TeamInvitation,
    ApiError,
    { agencyId: number; data: TeamInviteRequest }
  >
) => {
  const queryClient = useQueryClient();

  return useMutation<TeamInvitation, ApiError, { agencyId: number; data: TeamInviteRequest }>({
    mutationFn: ({ agencyId, data }: { agencyId: number; data: TeamInviteRequest }) =>
      agenciesApi.inviteTeamMember(agencyId, data),
    onSuccess: (_data: TeamInvitation, variables: { agencyId: number; data: TeamInviteRequest }) => {
      queryClient.invalidateQueries({
        queryKey: agencyKeys.invitations(variables.agencyId),
      });
    },
    ...options,
  });
};

/**
 * Hook for removing team member
 * Maps to DELETE /agencies/:pk/team/remove/:memberPk/
 */
export const useRemoveTeamMember = (
  options?: UseMutationOptions<
    void,
    ApiError,
    { agencyId: number; memberId: number }
  >
) => {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, { agencyId: number; memberId: number }>({
    mutationFn: ({ agencyId, memberId }: { agencyId: number; memberId: number }) =>
      agenciesApi.removeTeamMember(agencyId, memberId),
    onSuccess: (_data: void, variables: { agencyId: number; memberId: number }) => {
      queryClient.invalidateQueries({
        queryKey: agencyKeys.team(variables.agencyId),
      });
    },
    ...options,
  });
};

/**
 * Hook for accepting invitation
 * Maps to POST /agencies/invitations/accept/:token/
 */
export const useAcceptInvitation = (
  options?: UseMutationOptions<
    { agency: Agency; message: string },
    ApiError,
    string
  >
) => {
  const queryClient = useQueryClient();

  return useMutation<{ agency: Agency; message: string }, ApiError, string>({
    mutationFn: agenciesApi.acceptInvitation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agencyKeys.all });
    },
    ...options,
  });
};

/**
 * Hook for canceling invitation
 * Maps to POST /agencies/invitations/cancel/:invitationPk/
 */
export const useCancelInvitation = (
  agencyId: number,
  options?: UseMutationOptions<void, ApiError, number>
) => {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, number>({
    mutationFn: agenciesApi.cancelInvitation,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: agencyKeys.invitations(agencyId),
      });
    },
    ...options,
  });
};

/**
 * Hook for resending invitation
 * Maps to POST /agencies/api/invitations/:invitationPk/resend/
 */
export const useResendInvitation = (
  options?: UseMutationOptions<
    { success: boolean; message: string },
    ApiError,
    number
  >
) => {
  return useMutation<{ success: boolean; message: string }, ApiError, number>({
    mutationFn: agenciesApi.resendInvitation,
    ...options,
  });
};

/**
 * Hook for updating subscription
 * Maps to POST /agencies/:pk/subscription/
 */
export const useUpdateSubscription = (
  options?: UseMutationOptions<
    AgencySubscription,
    ApiError,
    { agencyId: number; data: SubscriptionUpdateRequest }
  >
) => {
  const queryClient = useQueryClient();

  return useMutation<AgencySubscription, ApiError, { agencyId: number; data: SubscriptionUpdateRequest }>({
    mutationFn: ({ agencyId, data }: { agencyId: number; data: SubscriptionUpdateRequest }) =>
      agenciesApi.updateSubscription(agencyId, data),
    onSuccess: (_data: AgencySubscription, variables: { agencyId: number; data: SubscriptionUpdateRequest }) => {
      queryClient.invalidateQueries({
        queryKey: agencyKeys.subscription(variables.agencyId),
      });
      queryClient.invalidateQueries({
        queryKey: agencyKeys.detail(variables.agencyId),
      });
    },
    ...options,
  });
};

// =============================================================================
// Export All Hooks
// =============================================================================

export const agencyHooks = {
  useAgencies,
  useAgency,
  useTeamMembers,
  useInvitations,
  useSubscription,
  useSetupAgency,
  useUpdateAgency,
  useAddTeamMember,
  useInviteTeamMember,
  useRemoveTeamMember,
  useAcceptInvitation,
  useCancelInvitation,
  useResendInvitation,
  useUpdateSubscription,
};

export default agencyHooks;
