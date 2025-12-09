import { get, post, patch, del } from './axios';
import type {
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
// API Endpoints (maps to influencers/urls.py)
// =============================================================================

const ENDPOINTS = {
  // Influencer management
  list: '/influencers/',
  detail: (pk: number) => `/influencers/${pk}/`,
  search: '/influencers/search/',
  analytics: (pk: number) => `/influencers/analytics/${pk}/`,
  
  // Social media accounts
  socialAccounts: (pk: number) => `/influencers/${pk}/social-accounts/`,
  addSocialAccount: '/influencers/social-accounts/add/',
  
  // Tags and categories
  tags: '/influencers/tags/',
  categories: '/influencers/categories/',
} as const;

// =============================================================================
// Influencer Management Functions
// =============================================================================

/**
 * List influencers with pagination
 * GET /influencers/
 */
export const listInfluencers = async (
  params?: InfluencerSearchParams
): Promise<PaginatedResponse<Influencer>> => {
  return get<PaginatedResponse<Influencer>>(ENDPOINTS.list, params as Record<string, unknown>);
};

/**
 * Get influencer details
 * GET /influencers/:pk/
 */
export const getInfluencer = async (pk: number): Promise<InfluencerWithSocials> => {
  return get<InfluencerWithSocials>(ENDPOINTS.detail(pk));
};

/**
 * Search influencers with advanced filters
 * GET /influencers/search/
 */
export const searchInfluencers = async (
  params: InfluencerSearchParams
): Promise<PaginatedResponse<InfluencerSearchResult>> => {
  return get<PaginatedResponse<InfluencerSearchResult>>(ENDPOINTS.search, params as Record<string, unknown>);
};

/**
 * Get influencer analytics
 * GET /influencers/analytics/:pk/
 */
export const getInfluencerAnalytics = async (
  pk: number
): Promise<InfluencerAnalyticsResponse> => {
  return get<InfluencerAnalyticsResponse>(ENDPOINTS.analytics(pk));
};

// =============================================================================
// Social Media Account Functions
// =============================================================================

/**
 * Get social accounts for an influencer
 * GET /influencers/:pk/social-accounts/
 */
export const getSocialAccounts = async (
  pk: number
): Promise<SocialMediaAccount[]> => {
  return get<SocialMediaAccount[]>(ENDPOINTS.socialAccounts(pk));
};

/**
 * Add a social media account
 * POST /influencers/social-accounts/add/
 */
export const addSocialAccount = async (
  data: AddSocialAccountRequest
): Promise<SocialMediaAccount> => {
  return post<SocialMediaAccount>(ENDPOINTS.addSocialAccount, data);
};

/**
 * Update a social media account
 * PATCH /influencers/:pk/social-accounts/:accountId/
 */
export const updateSocialAccount = async (
  influencerPk: number,
  accountId: number,
  data: Partial<SocialMediaAccount>
): Promise<SocialMediaAccount> => {
  return patch<SocialMediaAccount>(
    `${ENDPOINTS.socialAccounts(influencerPk)}${accountId}/`,
    data
  );
};

/**
 * Delete a social media account
 * DELETE /influencers/:pk/social-accounts/:accountId/
 */
export const deleteSocialAccount = async (
  influencerPk: number,
  accountId: number
): Promise<void> => {
  return del<void>(`${ENDPOINTS.socialAccounts(influencerPk)}${accountId}/`);
};

/**
 * Sync social media account data
 * POST /influencers/:pk/social-accounts/:accountId/sync/
 */
export const syncSocialAccount = async (
  influencerPk: number,
  accountId: number
): Promise<SocialMediaAccount> => {
  return post<SocialMediaAccount>(
    `${ENDPOINTS.socialAccounts(influencerPk)}${accountId}/sync/`
  );
};

// =============================================================================
// Tags and Categories Functions
// =============================================================================

/**
 * List all tags
 * GET /influencers/tags/
 */
export const listTags = async (): Promise<Tag[]> => {
  return get<Tag[]>(ENDPOINTS.tags);
};

/**
 * Create a new tag
 * POST /influencers/tags/
 */
export const createTag = async (data: {
  name: string;
  color?: string;
}): Promise<Tag> => {
  return post<Tag>(ENDPOINTS.tags, data);
};

/**
 * List all categories
 * GET /influencers/categories/
 */
export const listCategories = async (): Promise<CategoryWithChildren[]> => {
  return get<CategoryWithChildren[]>(ENDPOINTS.categories);
};

/**
 * Create a new category
 * POST /influencers/categories/
 */
export const createCategory = async (data: {
  name: string;
  description?: string;
  parent?: number;
}): Promise<Category> => {
  return post<Category>(ENDPOINTS.categories, data);
};

// =============================================================================
// Bulk Operations
// =============================================================================

/**
 * Bulk update influencer tags
 */
export const bulkUpdateTags = async (
  influencerIds: number[],
  tagIds: number[]
): Promise<{ updated: number }> => {
  return post<{ updated: number }>('/influencers/bulk/tags/', {
    influencer_ids: influencerIds,
    tag_ids: tagIds,
  });
};

/**
 * Export influencers to CSV
 */
export const exportInfluencers = async (
  params?: InfluencerSearchParams
): Promise<Blob> => {
  const response = await get<Blob>('/influencers/export/', {
    ...params,
    format: 'csv',
  } as Record<string, unknown>);
  return response;
};

// =============================================================================
// Export all functions
// =============================================================================

export const influencersApi = {
  // Influencers
  listInfluencers,
  getInfluencer,
  searchInfluencers,
  getInfluencerAnalytics,
  
  // Social Accounts
  getSocialAccounts,
  addSocialAccount,
  updateSocialAccount,
  deleteSocialAccount,
  syncSocialAccount,
  
  // Tags & Categories
  listTags,
  createTag,
  listCategories,
  createCategory,
  
  // Bulk
  bulkUpdateTags,
  exportInfluencers,
};

export default influencersApi;
