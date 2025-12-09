import { get, post, patch, del } from './axios';
import type {
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
// API Endpoints (maps to campaigns/urls.py)
// =============================================================================

const ENDPOINTS = {
  // Campaign management
  list: '/campaigns/',
  create: '/campaigns/create/',
  detail: (pk: number) => `/campaigns/${pk}/`,
  edit: (pk: number) => `/campaigns/${pk}/edit/`,
  delete: (pk: number) => `/campaigns/${pk}/delete/`,
  
  // Collaborations
  collaborations: (pk: number) => `/campaigns/${pk}/collaborations/`,
  inviteInfluencer: (pk: number) => `/campaigns/${pk}/invite-influencer/`,
  collaborationDetail: (pk: number) => `/campaigns/collaboration/${pk}/`,
  updateCollaborationStatus: (pk: number) => `/campaigns/collaboration/${pk}/update-status/`,
  
  // Content management
  contentList: (collaborationPk: number) => `/campaigns/collaboration/${collaborationPk}/content/`,
  contentReview: (contentPk: number) => `/campaigns/content/${contentPk}/review/`,
  updateContentMetrics: (contentPk: number) => `/campaigns/content/${contentPk}/update-metrics/`,
  
  // Analytics
  analytics: (pk: number) => `/campaigns/${pk}/analytics/`,
  
  // API endpoints
  apiPerformance: (pk: number) => `/campaigns/api/${pk}/performance/`,
  apiUpdateMetrics: (contentPk: number) => `/campaigns/api/content/${contentPk}/metrics/`,
  apiAnalytics: (pk: number) => `/campaigns/api/${pk}/analytics/`,
  apiBulkUpdateMetrics: '/campaigns/api/content/bulk-update/',
  apiRefreshAnalytics: (pk: number) => `/campaigns/api/${pk}/analytics/refresh/`,
} as const;

// =============================================================================
// Campaign Management Functions
// =============================================================================

/**
 * List campaigns with pagination and filters
 * GET /campaigns/
 */
export const listCampaigns = async (
  params?: CampaignListParams
): Promise<PaginatedResponse<CampaignWithStats>> => {
  return get<PaginatedResponse<CampaignWithStats>>(ENDPOINTS.list, params as Record<string, unknown> | undefined);
};

/**
 * Create a new campaign
 * POST /campaigns/create/
 */
export const createCampaign = async (
  data: CampaignCreateRequest
): Promise<Campaign> => {
  return post<Campaign>(ENDPOINTS.create, data);
};

/**
 * Get campaign details
 * GET /campaigns/:pk/
 */
export const getCampaign = async (pk: number): Promise<CampaignWithCollaborations> => {
  return get<CampaignWithCollaborations>(ENDPOINTS.detail(pk));
};

/**
 * Update campaign
 * PATCH /campaigns/:pk/edit/
 */
export const updateCampaign = async (
  pk: number,
  data: CampaignUpdateRequest
): Promise<Campaign> => {
  return patch<Campaign>(ENDPOINTS.edit(pk), data);
};

/**
 * Delete campaign
 * DELETE /campaigns/:pk/delete/
 */
export const deleteCampaign = async (pk: number): Promise<void> => {
  return del<void>(ENDPOINTS.delete(pk));
};

// =============================================================================
// Collaboration Functions
// =============================================================================

/**
 * List collaborations for a campaign
 * GET /campaigns/:pk/collaborations/
 */
export const listCollaborations = async (
  campaignPk: number
): Promise<InfluencerCollaboration[]> => {
  return get<InfluencerCollaboration[]>(ENDPOINTS.collaborations(campaignPk));
};

/**
 * Invite an influencer to a campaign
 * POST /campaigns/:pk/invite-influencer/
 */
export const inviteInfluencer = async (
  campaignPk: number,
  data: InviteInfluencerRequest
): Promise<InfluencerCollaboration> => {
  return post<InfluencerCollaboration>(ENDPOINTS.inviteInfluencer(campaignPk), data);
};

/**
 * Get collaboration details
 * GET /campaigns/collaboration/:pk/
 */
export const getCollaboration = async (
  pk: number
): Promise<InfluencerCollaboration> => {
  return get<InfluencerCollaboration>(ENDPOINTS.collaborationDetail(pk));
};

/**
 * Update collaboration status
 * PATCH /campaigns/collaboration/:pk/update-status/
 */
export const updateCollaborationStatus = async (
  pk: number,
  data: UpdateCollaborationStatusRequest
): Promise<InfluencerCollaboration> => {
  return patch<InfluencerCollaboration>(ENDPOINTS.updateCollaborationStatus(pk), data);
};

// =============================================================================
// Content Management Functions
// =============================================================================

/**
 * List content for a collaboration
 * GET /campaigns/collaboration/:pk/content/
 */
export const listContent = async (
  collaborationPk: number
): Promise<CampaignContent[]> => {
  return get<CampaignContent[]>(ENDPOINTS.contentList(collaborationPk));
};

/**
 * Submit content for review
 * POST /campaigns/collaboration/:pk/content/
 */
export const submitContent = async (
  collaborationPk: number,
  data: FormData
): Promise<CampaignContent> => {
  return post<CampaignContent>(ENDPOINTS.contentList(collaborationPk), data);
};

/**
 * Review content (approve/reject)
 * PATCH /campaigns/content/:pk/review/
 */
export const reviewContent = async (
  contentPk: number,
  data: ContentReviewRequest
): Promise<CampaignContent> => {
  return patch<CampaignContent>(ENDPOINTS.contentReview(contentPk), data);
};

/**
 * Update content metrics
 * PATCH /campaigns/content/:pk/update-metrics/
 */
export const updateContentMetrics = async (
  contentPk: number,
  data: UpdateContentMetricsRequest
): Promise<CampaignContent> => {
  return patch<CampaignContent>(ENDPOINTS.updateContentMetrics(contentPk), data);
};

// =============================================================================
// Analytics Functions
// =============================================================================

/**
 * Get campaign analytics
 * GET /campaigns/:pk/analytics/
 */
export const getCampaignAnalytics = async (
  pk: number
): Promise<CampaignAnalytics> => {
  return get<CampaignAnalytics>(ENDPOINTS.analytics(pk));
};

/**
 * Get campaign performance (API endpoint)
 * GET /campaigns/api/:pk/performance/
 */
export const getCampaignPerformance = async (
  pk: number
): Promise<CampaignPerformanceResponse> => {
  return get<CampaignPerformanceResponse>(ENDPOINTS.apiPerformance(pk));
};

/**
 * Update content metrics (API endpoint)
 * POST /campaigns/api/content/:pk/metrics/
 */
export const apiUpdateContentMetrics = async (
  contentPk: number,
  data: UpdateContentMetricsRequest
): Promise<CampaignContent> => {
  return post<CampaignContent>(ENDPOINTS.apiUpdateMetrics(contentPk), data);
};

/**
 * Get campaign analytics (API endpoint)
 * GET /campaigns/api/:pk/analytics/
 */
export const getApiCampaignAnalytics = async (
  pk: number
): Promise<CampaignAnalytics> => {
  return get<CampaignAnalytics>(ENDPOINTS.apiAnalytics(pk));
};

/**
 * Bulk update content metrics
 * POST /campaigns/api/content/bulk-update/
 */
export const bulkUpdateMetrics = async (
  data: BulkUpdateMetricsRequest
): Promise<{ updated: number }> => {
  return post<{ updated: number }>(ENDPOINTS.apiBulkUpdateMetrics, data);
};

/**
 * Refresh campaign analytics
 * POST /campaigns/api/:pk/analytics/refresh/
 */
export const refreshCampaignAnalytics = async (
  pk: number
): Promise<CampaignAnalytics> => {
  return post<CampaignAnalytics>(ENDPOINTS.apiRefreshAnalytics(pk));
};

// =============================================================================
// Export all functions
// =============================================================================

export const campaignsApi = {
  // Campaigns
  listCampaigns,
  createCampaign,
  getCampaign,
  updateCampaign,
  deleteCampaign,
  
  // Collaborations
  listCollaborations,
  inviteInfluencer,
  getCollaboration,
  updateCollaborationStatus,
  
  // Content
  listContent,
  submitContent,
  reviewContent,
  updateContentMetrics,
  
  // Analytics
  getCampaignAnalytics,
  getCampaignPerformance,
  apiUpdateContentMetrics,
  getApiCampaignAnalytics,
  bulkUpdateMetrics,
  refreshCampaignAnalytics,
};

export default campaignsApi;
