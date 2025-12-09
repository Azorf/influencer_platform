import type {
  CampaignStatus,
  CampaignType,
  CollaborationStatus,
  ContentStatus,
  InvoiceStatus,
  PaymentStatus,
  ReportType,
  ReportStatus,
  SocialPlatform,
  InfluencerTier,
  UserType,
  TeamRole,
} from '@/types';

// =============================================================================
// Status Labels & Colors
// =============================================================================

export const CAMPAIGN_STATUS: Record<
  CampaignStatus,
  { label: string; color: string }
> = {
  draft: { label: 'Draft', color: 'gray' },
  active: { label: 'Active', color: 'green' },
  paused: { label: 'Paused', color: 'yellow' },
  completed: { label: 'Completed', color: 'blue' },
  cancelled: { label: 'Cancelled', color: 'red' },
};

export const CAMPAIGN_TYPES: Record<CampaignType, string> = {
  brand_awareness: 'Brand Awareness',
  product_launch: 'Product Launch',
  engagement: 'Engagement',
  conversions: 'Conversions',
  event_promotion: 'Event Promotion',
  user_generated_content: 'User Generated Content',
};

export const COLLABORATION_STATUS: Record<
  CollaborationStatus,
  { label: string; color: string }
> = {
  invited: { label: 'Invited', color: 'gray' },
  accepted: { label: 'Accepted', color: 'blue' },
  declined: { label: 'Declined', color: 'red' },
  in_progress: { label: 'In Progress', color: 'yellow' },
  content_submitted: { label: 'Content Submitted', color: 'purple' },
  approved: { label: 'Approved', color: 'cyan' },
  published: { label: 'Published', color: 'green' },
  completed: { label: 'Completed', color: 'green' },
  cancelled: { label: 'Cancelled', color: 'red' },
};

export const CONTENT_STATUS: Record<
  ContentStatus,
  { label: string; color: string }
> = {
  draft: { label: 'Draft', color: 'gray' },
  submitted: { label: 'Submitted', color: 'blue' },
  revision_requested: { label: 'Revision Requested', color: 'yellow' },
  approved: { label: 'Approved', color: 'green' },
  published: { label: 'Published', color: 'green' },
  rejected: { label: 'Rejected', color: 'red' },
};

export const INVOICE_STATUS: Record<
  InvoiceStatus,
  { label: string; color: string }
> = {
  draft: { label: 'Draft', color: 'gray' },
  pending: { label: 'Pending', color: 'yellow' },
  paid: { label: 'Paid', color: 'green' },
  overdue: { label: 'Overdue', color: 'red' },
  cancelled: { label: 'Cancelled', color: 'gray' },
  refunded: { label: 'Refunded', color: 'purple' },
};

export const PAYMENT_STATUS: Record<
  PaymentStatus,
  { label: string; color: string }
> = {
  pending: { label: 'Pending', color: 'yellow' },
  processing: { label: 'Processing', color: 'blue' },
  succeeded: { label: 'Succeeded', color: 'green' },
  failed: { label: 'Failed', color: 'red' },
  cancelled: { label: 'Cancelled', color: 'gray' },
  refunded: { label: 'Refunded', color: 'purple' },
};

export const REPORT_STATUS: Record<
  ReportStatus,
  { label: string; color: string }
> = {
  generating: { label: 'Generating', color: 'blue' },
  completed: { label: 'Completed', color: 'green' },
  failed: { label: 'Failed', color: 'red' },
  scheduled: { label: 'Scheduled', color: 'purple' },
};

export const REPORT_TYPES: Record<ReportType, string> = {
  campaign_performance: 'Campaign Performance',
  influencer_analytics: 'Influencer Analytics',
  audience_insights: 'Audience Insights',
  roi_analysis: 'ROI Analysis',
  competitive_analysis: 'Competitive Analysis',
  trend_analysis: 'Trend Analysis',
  agency_dashboard: 'Agency Dashboard',
  custom: 'Custom Report',
};

// =============================================================================
// Social Media
// =============================================================================

export const SOCIAL_PLATFORMS: Record<
  SocialPlatform,
  { label: string; icon: string; color: string }
> = {
  instagram: { label: 'Instagram', icon: 'instagram', color: '#E4405F' },
  youtube: { label: 'YouTube', icon: 'youtube', color: '#FF0000' },
  tiktok: { label: 'TikTok', icon: 'music', color: '#000000' },
  twitter: { label: 'Twitter/X', icon: 'twitter', color: '#1DA1F2' },
  facebook: { label: 'Facebook', icon: 'facebook', color: '#1877F2' },
  linkedin: { label: 'LinkedIn', icon: 'linkedin', color: '#0A66C2' },
  snapchat: { label: 'Snapchat', icon: 'ghost', color: '#FFFC00' },
  pinterest: { label: 'Pinterest', icon: 'pin', color: '#E60023' },
};

export const INFLUENCER_TIERS: Record<
  InfluencerTier,
  { label: string; range: string; color: string }
> = {
  nano: { label: 'Nano', range: '1K - 10K', color: 'gray' },
  micro: { label: 'Micro', range: '10K - 50K', color: 'blue' },
  mid: { label: 'Mid-tier', range: '50K - 500K', color: 'purple' },
  macro: { label: 'Macro', range: '500K - 1M', color: 'orange' },
  mega: { label: 'Mega', range: '1M+', color: 'red' },
};

// =============================================================================
// User & Team
// =============================================================================

export const USER_TYPES: Record<UserType, string> = {
  agency: 'Agency',
  influencer: 'Influencer',
  brand: 'Brand',
  admin: 'Administrator',
};

export const TEAM_ROLES: Record<TeamRole, { label: string; description: string }> = {
  admin: {
    label: 'Admin',
    description: 'Full access to all agency features and settings',
  },
  manager: {
    label: 'Manager',
    description: 'Can manage campaigns, influencers, and team members',
  },
  member: {
    label: 'Member',
    description: 'Can view and edit campaigns and influencers',
  },
  viewer: {
    label: 'Viewer',
    description: 'Read-only access to campaigns and reports',
  },
};

// =============================================================================
// Pagination
// =============================================================================

export const DEFAULT_PAGE_SIZE = 20;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

// =============================================================================
// Content Types
// =============================================================================

export const CONTENT_TYPES = {
  post: 'Social Media Post',
  story: 'Story',
  reel: 'Reel/Video',
  igtv: 'IGTV',
  youtube_video: 'YouTube Video',
  tiktok_video: 'TikTok Video',
  live_stream: 'Live Stream',
  multiple: 'Multiple Content Types',
} as const;

// =============================================================================
// Countries (for Moroccan market)
// =============================================================================

export const COUNTRIES = [
  { code: 'MA', name: 'Morocco' },
  { code: 'FR', name: 'France' },
  { code: 'BE', name: 'Belgium' },
  { code: 'CA', name: 'Canada' },
  { code: 'US', name: 'United States' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'ES', name: 'Spain' },
  { code: 'IT', name: 'Italy' },
  { code: 'DE', name: 'Germany' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'NL', name: 'Netherlands' },
] as const;

// =============================================================================
// Languages
// =============================================================================

export const LANGUAGES = [
  { code: 'ar', name: 'Arabic' },
  { code: 'fr', name: 'French' },
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'ber', name: 'Berber' },
] as const;

// =============================================================================
// Currencies
// =============================================================================

export const CURRENCIES = [
  { code: 'MAD', name: 'Moroccan Dirham', symbol: 'DH' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
] as const;
