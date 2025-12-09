import type { ID, ISODateString } from '../api';

// =============================================================================
// Influencer Types (maps to influencers.Influencer)
// =============================================================================

/**
 * Social media platform choices
 */
export type SocialPlatform = 
  | 'instagram' 
  | 'youtube' 
  | 'tiktok' 
  | 'twitter' 
  | 'facebook' 
  | 'linkedin'
  | 'snapchat'
  | 'pinterest';

/**
 * Influencer tier based on follower count
 */
export type InfluencerTier = 
  | 'nano'       // 1K - 10K
  | 'micro'      // 10K - 50K
  | 'mid'        // 50K - 500K
  | 'macro'      // 500K - 1M
  | 'mega';      // 1M+

/**
 * Influencer verification status
 */
export type VerificationStatus = 'pending' | 'verified' | 'rejected' | 'unverified';

/**
 * Base influencer interface
 */
export interface Influencer {
  id: ID;
  user: ID | null;
  full_name: string;
  email: string | null;
  phone: string | null;
  bio: string | null;
  profile_image: string | null;
  location: string | null;
  city: string | null;
  country: string;
  tier: InfluencerTier;
  verification_status: VerificationStatus;
  is_active: boolean;
  total_followers: number;
  avg_engagement_rate: number;
  primary_platform: SocialPlatform;
  languages: string[];
  categories: ID[];
  tags: ID[];
  created_at: ISODateString;
  updated_at: ISODateString;
}

/**
 * Influencer with social accounts
 */
export interface InfluencerWithSocials extends Influencer {
  social_accounts: SocialMediaAccount[];
  category_details?: Category[];
  tag_details?: Tag[];
}

/**
 * Influencer search result with relevance
 */
export interface InfluencerSearchResult extends Influencer {
  relevance_score: number;
  match_reasons: string[];
}

// =============================================================================
// Social Media Account Types (maps to influencers.SocialMediaAccount)
// =============================================================================

/**
 * Social media account interface
 */
export interface SocialMediaAccount {
  id: ID;
  influencer: ID;
  platform: SocialPlatform;
  username: string;
  profile_url: string;
  followers_count: number;
  following_count: number;
  posts_count: number;
  engagement_rate: number;
  avg_likes: number;
  avg_comments: number;
  avg_views: number | null;
  is_verified: boolean;
  is_primary: boolean;
  last_synced_at: ISODateString | null;
  created_at: ISODateString;
  updated_at: ISODateString;
}

/**
 * Social account with analytics
 */
export interface SocialAccountWithAnalytics extends SocialMediaAccount {
  analytics: SocialAccountAnalytics | null;
  recent_posts: SocialPost[];
}

// =============================================================================
// Social Account Analytics Types
// =============================================================================

/**
 * Social account analytics
 */
export interface SocialAccountAnalytics {
  id: ID;
  social_account: ID;
  followers_growth_30d: number;
  followers_growth_percentage: number;
  engagement_trend: 'up' | 'stable' | 'down';
  best_posting_times: string[];
  top_hashtags: string[];
  audience_demographics: AudienceDemographics;
  content_performance: ContentPerformance;
  calculated_at: ISODateString;
}

/**
 * Audience demographics breakdown
 */
export interface AudienceDemographics {
  age_ranges: Record<string, number>;
  gender: {
    male: number;
    female: number;
    other: number;
  };
  top_countries: Record<string, number>;
  top_cities: Record<string, number>;
}

/**
 * Content performance metrics
 */
export interface ContentPerformance {
  avg_reach: number;
  avg_impressions: number;
  avg_saves: number;
  avg_shares: number;
  content_type_performance: Record<string, number>;
}

// =============================================================================
// Social Post Types
// =============================================================================

/**
 * Social media post
 */
export interface SocialPost {
  id: ID;
  social_account: ID;
  platform: SocialPlatform;
  post_id: string;
  post_url: string;
  caption: string | null;
  media_type: 'image' | 'video' | 'carousel' | 'text';
  media_url: string | null;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  views_count: number | null;
  engagement_rate: number;
  posted_at: ISODateString;
  fetched_at: ISODateString;
}

// =============================================================================
// Category & Tag Types (maps to influencers.Category, influencers.Tag)
// =============================================================================

/**
 * Influencer category
 */
export interface Category {
  id: ID;
  name: string;
  slug: string;
  description: string | null;
  parent: ID | null;
  icon: string | null;
  influencer_count: number;
  is_active: boolean;
  created_at: ISODateString;
}

/**
 * Category with children
 */
export interface CategoryWithChildren extends Category {
  children: Category[];
}

/**
 * Influencer tag
 */
export interface Tag {
  id: ID;
  name: string;
  slug: string;
  color: string | null;
  influencer_count: number;
  created_at: ISODateString;
}

// =============================================================================
// Request/Response Types
// =============================================================================

/**
 * Influencer search parameters
 */
export interface InfluencerSearchParams {
  search?: string;
  platform?: SocialPlatform;
  tier?: InfluencerTier;
  category?: ID;
  tags?: ID[];
  country?: string;
  city?: string;
  min_followers?: number;
  max_followers?: number;
  min_engagement_rate?: number;
  max_engagement_rate?: number;
  languages?: string[];
  is_verified?: boolean;
  ordering?: string;
  page?: number;
  page_size?: number;
}

/**
 * Add social account request
 */
export interface AddSocialAccountRequest {
  influencer_id: ID;
  platform: SocialPlatform;
  username: string;
  profile_url: string;
}

/**
 * Influencer analytics response
 */
export interface InfluencerAnalyticsResponse {
  influencer: Influencer;
  overall_stats: {
    total_followers: number;
    avg_engagement_rate: number;
    total_posts: number;
    estimated_reach: number;
  };
  platform_breakdown: Record<SocialPlatform, {
    followers: number;
    engagement_rate: number;
    posts: number;
  }>;
  growth_trend: Array<{
    date: string;
    followers: number;
    engagement_rate: number;
  }>;
  top_performing_content: SocialPost[];
}
