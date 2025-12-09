import { get, post, patch, del } from './axios';
import type {
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
// API Endpoints (maps to agencies/urls.py)
// =============================================================================

const ENDPOINTS = {
  // Agency management
  setup: '/agencies/setup/',
  detail: (pk: number) => `/agencies/${pk}/`,
  edit: (pk: number) => `/agencies/${pk}/edit/`,
  list: '/agencies/list/',
  
  // Team management
  team: (pk: number) => `/agencies/${pk}/team/`,
  teamAdd: (pk: number) => `/agencies/${pk}/team/add/`,
  teamInvite: (pk: number) => `/agencies/${pk}/team/invite/`,
  teamRemove: (pk: number, memberPk: number) => `/agencies/${pk}/team/remove/${memberPk}/`,
  
  // Invitations
  acceptInvitation: (token: string) => `/agencies/invitations/accept/${token}/`,
  cancelInvitation: (invitationPk: number) => `/agencies/invitations/cancel/${invitationPk}/`,
  
  // Subscription
  subscription: (pk: number) => `/agencies/${pk}/subscription/`,
  
  // API endpoints for AJAX
  apiRemoveTeamMember: (pk: number) => `/agencies/api/${pk}/team/remove/`,
  apiListInvitations: (pk: number) => `/agencies/api/${pk}/invitations/`,
  apiResendInvitation: (invitationPk: number) => `/agencies/api/invitations/${invitationPk}/resend/`,
} as const;

// =============================================================================
// Agency Management Functions
// =============================================================================

/**
 * Set up a new agency
 * POST /agencies/setup/
 */
export const setupAgency = async (data: AgencySetupRequest): Promise<Agency> => {
  return post<Agency>(ENDPOINTS.setup, data);
};

/**
 * Get agency details
 * GET /agencies/:pk/
 */
export const getAgency = async (pk: number): Promise<AgencyWithOwner> => {
  return get<AgencyWithOwner>(ENDPOINTS.detail(pk));
};

/**
 * Update agency details
 * PATCH /agencies/:pk/edit/
 */
export const updateAgency = async (
  pk: number,
  data: AgencyUpdateRequest
): Promise<Agency> => {
  // Handle file upload if logo is included
  if (data.logo instanceof File) {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (value instanceof File) {
          formData.append(key, value);
        } else {
          formData.append(key, String(value));
        }
      }
    });
    return patch<Agency>(ENDPOINTS.edit(pk), formData);
  }
  return patch<Agency>(ENDPOINTS.edit(pk), data);
};

/**
 * List all agencies (admin view)
 * GET /agencies/list/
 */
export const listAgencies = async (params?: {
  search?: string;
  status?: string;
  page?: number;
  page_size?: number;
}): Promise<PaginatedResponse<Agency>> => {
  return get<PaginatedResponse<Agency>>(ENDPOINTS.list, params);
};

// =============================================================================
// Team Management Functions
// =============================================================================

/**
 * Get team members for an agency
 * GET /agencies/:pk/team/
 */
export const getTeamMembers = async (pk: number): Promise<AgencyWithTeam> => {
  return get<AgencyWithTeam>(ENDPOINTS.team(pk));
};

/**
 * Add existing user to team
 * POST /agencies/:pk/team/add/
 */
export const addTeamMember = async (
  pk: number,
  data: TeamAddRequest
): Promise<TeamMember> => {
  return post<TeamMember>(ENDPOINTS.teamAdd(pk), data);
};

/**
 * Invite new user to team
 * POST /agencies/:pk/team/invite/
 */
export const inviteTeamMember = async (
  pk: number,
  data: TeamInviteRequest
): Promise<TeamInvitation> => {
  return post<TeamInvitation>(ENDPOINTS.teamInvite(pk), data);
};

/**
 * Remove team member
 * DELETE /agencies/:pk/team/remove/:memberPk/
 */
export const removeTeamMember = async (
  pk: number,
  memberPk: number
): Promise<void> => {
  return del<void>(ENDPOINTS.teamRemove(pk, memberPk));
};

/**
 * Remove team member (API endpoint)
 * POST /agencies/api/:pk/team/remove/
 */
export const apiRemoveTeamMember = async (
  pk: number,
  memberId: number
): Promise<{ success: boolean }> => {
  return post<{ success: boolean }>(ENDPOINTS.apiRemoveTeamMember(pk), {
    member_id: memberId,
  });
};

// =============================================================================
// Invitation Functions
// =============================================================================

/**
 * Accept team invitation
 * POST /agencies/invitations/accept/:token/
 */
export const acceptInvitation = async (
  token: string
): Promise<{ agency: Agency; message: string }> => {
  return post<{ agency: Agency; message: string }>(ENDPOINTS.acceptInvitation(token));
};

/**
 * Cancel team invitation
 * POST /agencies/invitations/cancel/:invitationPk/
 */
export const cancelInvitation = async (
  invitationPk: number
): Promise<void> => {
  return post<void>(ENDPOINTS.cancelInvitation(invitationPk));
};

/**
 * List pending invitations for agency
 * GET /agencies/api/:pk/invitations/
 */
export const listInvitations = async (
  pk: number
): Promise<TeamInvitation[]> => {
  return get<TeamInvitation[]>(ENDPOINTS.apiListInvitations(pk));
};

/**
 * Resend invitation email
 * POST /agencies/api/invitations/:invitationPk/resend/
 */
export const resendInvitation = async (
  invitationPk: number
): Promise<{ success: boolean; message: string }> => {
  return post<{ success: boolean; message: string }>(
    ENDPOINTS.apiResendInvitation(invitationPk)
  );
};

// =============================================================================
// Subscription Functions
// =============================================================================

/**
 * Get agency subscription details
 * GET /agencies/:pk/subscription/
 */
export const getSubscription = async (
  pk: number
): Promise<AgencySubscription> => {
  return get<AgencySubscription>(ENDPOINTS.subscription(pk));
};

/**
 * Update agency subscription
 * POST /agencies/:pk/subscription/
 */
export const updateSubscription = async (
  pk: number,
  data: SubscriptionUpdateRequest
): Promise<AgencySubscription> => {
  return post<AgencySubscription>(ENDPOINTS.subscription(pk), data);
};

// =============================================================================
// Export all functions
// =============================================================================

export const agenciesApi = {
  // Agency
  setupAgency,
  getAgency,
  updateAgency,
  listAgencies,
  
  // Team
  getTeamMembers,
  addTeamMember,
  inviteTeamMember,
  removeTeamMember,
  apiRemoveTeamMember,
  
  // Invitations
  acceptInvitation,
  cancelInvitation,
  listInvitations,
  resendInvitation,
  
  // Subscription
  getSubscription,
  updateSubscription,
};

export default agenciesApi;
