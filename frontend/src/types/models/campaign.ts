import type { ID, ISODateString, CurrencyCode } from '../api';
import type { Influencer } from './influencer';

// =============================================================================
// Campaign Types (maps to campaigns.Campaign)
// =============================================================================

/**
 * Campaign status choices
 */
export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';

/**
 * Campaign type choices
 */
export type CampaignType = 
  | 'brand_awareness'
  | 'product_launch'
  | 'engagement'
  | 'conversions'
  | 'event_promotion'
  | 'user_generated_content';

/**
 * Campaign interface matching Campaign model
 */
export interface Campaign {
  id: ID;
  agency: ID;
  name: string;
  description: string | null;
  campaign_type: CampaignType;
  brand_name: string;
  product_name: string | null;
  target_audience: string;
  campaign_objectives: string;
  total_budget: string;
  budget_currency: CurrencyCode;
  start_date: string;
  end_date: string;
  content_guidelines: string | null;
  hashtags: string | null;
  mentions: string | null;
  brief_document: string | null;
  brand_assets: string | null;
  status: CampaignStatus;
  created_by: ID;
  created_at: ISODateString;
  updated_at: ISODateString;
}

/**
 * Campaign with computed fields
 */
export interface CampaignWithStats extends Campaign {
  total_spent: string;
  remaining_budget: string;
  collaborations_count: number;
  completed_collaborations: number;
  pending_collaborations: number;
}

/**
 * Campaign with collaborations
 */
export interface CampaignWithCollaborations extends Campaign {
  collaborations: InfluencerCollaboration[];
}

// =============================================================================
// Collaboration Types (maps to campaigns.InfluencerCollaboration)
// =============================================================================

/**
 * Collaboration status choices
 */
export type CollaborationStatus = 
  | 'invited'
  | 'accepted'
  | 'declined'
  | 'in_progress'
  | 'content_submitted'
  | 'approved'
  | 'published'
  | 'completed'
  | 'cancelled';

/**
 * Content type choices
 */
export type ContentType = 
  | 'post'
  | 'story'
  | 'reel'
  | 'igtv'
  | 'youtube_video'
  | 'tiktok_video'
  | 'live_stream'
  | 'multiple';

/**
 * Payment status choices
 */
export type CollaborationPaymentStatus = 'pending' | 'processing' | 'paid' | 'failed';

/**
 * Influencer collaboration interface
 */
export interface InfluencerCollaboration {
  id: ID;
  campaign: ID;
  influencer: ID;
  influencer_details?: Influencer;
  content_type: ContentType;
  deliverables_count: number;
  agreed_rate: string;
  currency: CurrencyCode;
  deadline: string;
  specific_requirements: string | null;
  status: CollaborationStatus;
  notes: string | null;
  invited_at: ISODateString;
  responded_at: ISODateString | null;
  actual_reach: number | null;
  actual_engagement: number | null;
  payment_status: CollaborationPaymentStatus;
}

/**
 * Collaboration with campaign details
 */
export interface CollaborationWithCampaign extends InfluencerCollaboration {
  campaign_details: Campaign;
}

// =============================================================================
// Campaign Content Types (maps to campaigns.CampaignContent)
// =============================================================================

/**
 * Content status choices
 */
export type ContentStatus = 
  | 'draft'
  | 'submitted'
  | 'revision_requested'
  | 'approved'
  | 'published'
  | 'rejected';

/**
 * Campaign content interface
 */
export interface CampaignContent {
  id: ID;
  collaboration: ID;
  title: string | null;
  caption: string | null;
  image: string | null;
  video: string | null;
  post_url: string | null;
  status: ContentStatus;
  feedback: string | null;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  views_count: number;
  created_at: ISODateString;
  submitted_at: ISODateString | null;
  published_at: ISODateString | null;
}

/**
 * Content with collaboration details
 */
export interface ContentWithCollaboration extends CampaignContent {
  collaboration_details: InfluencerCollaboration;
}

// =============================================================================
// Campaign Analytics Types (maps to campaigns.CampaignAnalytics)
// =============================================================================

/**
 * Campaign analytics interface
 */
export interface CampaignAnalytics {
  id: ID;
  campaign: ID;
  total_reach: number;
  total_impressions: number;
  total_likes: number;
  total_comments: number;
  total_shares: number;
  total_saves: number;
  avg_engagement_rate: number;
  cost_per_engagement: string;
  website_clicks: number;
  conversions: number;
  conversion_rate: number;
  total_spent: string;
  estimated_value: string;
  roi_percentage: number;
  last_calculated: ISODateString;
}

// =============================================================================
// Request/Response Types
// =============================================================================

/**
 * Campaign create request
 */
export interface CampaignCreateRequest {
  name: string;
  description?: string;
  campaign_type: CampaignType;
  brand_name: string;
  product_name?: string;
  target_audience: string;
  campaign_objectives: string;
  total_budget: string;
  budget_currency?: CurrencyCode;
  start_date: string;
  end_date: string;
  content_guidelines?: string;
  hashtags?: string;
  mentions?: string;
}

/**
 * Campaign update request
 */
export interface CampaignUpdateRequest extends Partial<CampaignCreateRequest> {
  status?: CampaignStatus;
}

/**
 * Invite influencer request
 */
export interface InviteInfluencerRequest {
  influencer_id: ID;
  content_type: ContentType;
  deliverables_count: number;
  agreed_rate: string;
  currency?: CurrencyCode;
  deadline: string;
  specific_requirements?: string;
}

/**
 * Update collaboration status request
 */
export interface UpdateCollaborationStatusRequest {
  status: CollaborationStatus;
  notes?: string;
}

/**
 * Content review request
 */
export interface ContentReviewRequest {
  status: ContentStatus;
  feedback?: string;
}

/**
 * Update content metrics request
 */
export interface UpdateContentMetricsRequest {
  likes_count?: number;
  comments_count?: number;
  shares_count?: number;
  views_count?: number;
  post_url?: string;
}

/**
 * Bulk update metrics request
 */
export interface BulkUpdateMetricsRequest {
  content_ids: ID[];
  metrics: UpdateContentMetricsRequest;
}

/**
 * Campaign performance response
 */
export interface CampaignPerformanceResponse {
  campaign: Campaign;
  analytics: CampaignAnalytics;
  collaborations_summary: {
    total: number;
    by_status: Record<CollaborationStatus, number>;
  };
  content_summary: {
    total: number;
    by_status: Record<ContentStatus, number>;
  };
  timeline: Array<{
    date: string;
    reach: number;
    engagement: number;
    spent: string;
  }>;
}

/**
 * Campaign list filters
 */
export interface CampaignListParams {
  status?: CampaignStatus;
  campaign_type?: CampaignType;
  start_date_after?: string;
  start_date_before?: string;
  end_date_after?: string;
  end_date_before?: string;
  search?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
}
