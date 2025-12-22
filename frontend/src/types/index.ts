// ===========================================
// Core Types
// ===========================================

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ===========================================
// User & Auth Types
// ===========================================

export type UserType = 'agency' | 'influencer' | 'brand' | 'admin';

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  userType: UserType;
  isActive: boolean;
  dateJoined: string;
  lastLogin?: string;
  avatar?: string;
  phoneNumber?: string;
}

// ===========================================
// Agency Types
// ===========================================

export type TeamRole = 
  | 'owner' 
  | 'admin' 
  | 'manager' 
  | 'account_manager' 
  | 'strategist' 
  | 'creative' 
  | 'analyst' 
  | 'coordinator' 
  | 'intern';

export interface Agency {
  id: number;
  name: string;
  displayName?: string;
  description?: string;
  website?: string;
  email?: string;
  phone?: string;
  organizationType?: string;
  organizationSize?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  country?: string;
  postalCode?: string;
  foundedYear?: number;
  monthlyBudgetRange?: string;
  targetDemographics?: string;
  logo?: string;
  brandColors?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  isVerified: boolean;
  isActive: boolean;
  isPremium: boolean;
  totalCampaignsRun: number;
  totalInfluencersWorkedWith: number;
  averageCampaignRoi?: number;
  createdAt: string;
}

export interface TeamMember {
  id: number;
  userId: number;
  name: string;
  email: string;
  avatar?: string;
  role: TeamRole;
  permissions: string;
  isActive: boolean;
  canInviteMembers: boolean;
  canManageBilling: boolean;
  joinedAt: string;
  lastActive?: string;
}

export interface TeamInvitation {
  id: number;
  email: string;
  role: TeamRole;
  permissions: string;
  message?: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  invitedBy: string;
  expiresAt: string;
  createdAt: string;
}

export interface Subscription {
  id: number;
  planType: 'free' | 'starter' | 'professional' | 'enterprise';
  status: 'active' | 'cancelled' | 'past_due' | 'trialing';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  trialEnd?: string;
  cancelAtPeriodEnd: boolean;
  influencerLimit: number;
  campaignLimit: number;
  teamMemberLimit: number;
  monthlyPrice: number;
  daysUntilTrialEnds?: number;
  isTrial: boolean;
}

// ===========================================
// Influencer Types
// ===========================================

export type Platform = 'instagram' | 'youtube' | 'tiktok' | 'twitter' | 'facebook' | 'linkedin' | 'snapchat' | 'twitch';
export type InfluencerTier = 'nano' | 'micro' | 'mid' | 'macro' | 'mega';
export type InfluencerCategory = 
  | 'lifestyle' | 'beauty' | 'fashion' | 'technology' | 'gaming'
  | 'fitness' | 'food' | 'travel' | 'education' | 'entertainment'
  | 'business' | 'health' | 'parenting' | 'sports' | 'music' | 'other';

export interface SocialMediaAccount {
  id: number;
  platform: Platform;
  username: string;
  url: string;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  engagementRate: number;
  avgLikes: number;
  avgComments: number;
  avgShares: number;
  avgViews: number;
  avgSaves: number;
  followers14dAgo: number;
  followersGrowth14d: number;
  followersGrowthRate14d: number;
  postsCount14d: number;
  isVerified: boolean;
  isActive: boolean;
  lastUpdated: string;
}

export interface Influencer {
  id: number;
  fullName: string;
  username: string;
  email?: string;
  bio?: string;
  avatar?: string;
  age?: number;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  location?: string;
  language: string;
  primaryCategory: InfluencerCategory;
  secondaryCategories: string[];
  phoneNumber?: string;
  website?: string;
  country: string;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  socialAccounts: SocialMediaAccount[];
  analytics?: InfluencerAnalytics;
  sponsoredPosts?: SponsoredPost[];
  tier: InfluencerTier;
  totalFollowers: number;
}

export interface InfluencerAnalytics {
  id: number;
  avgEngagementRate: number;
  estimatedRatePerPost?: number;
  collaborationCount: number;
  authenticityScore: number;
  influenceScore: number;
  topAudienceCountries: Record<string, number>;
  topAudienceCities: Record<string, number>;
  audienceGenderMale: number;
  audienceGenderFemale: number;
}

export interface SponsoredPost {
  id: number;
  postUrl: string;
  postType: string;
  brandName: string;
  brandHandle?: string;
  viewsCount: number;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  engagementRate: number;
  postedAt: string;
}

// ===========================================
// Campaign Types
// ===========================================

export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
export type CampaignType = 
  | 'brand_awareness' 
  | 'product_launch' 
  | 'engagement' 
  | 'conversions' 
  | 'event_promotion' 
  | 'user_generated_content';

export interface Campaign {
  id: number;
  agencyId: number;
  name: string;
  description?: string;
  campaignType: CampaignType;
  brandName: string;
  productName?: string;
  objective?: string;
  targetAudience?: {
    ageRange?: string;
    gender?: string;
    interests?: string[];
    locations?: string[];
    description?: string;
  };
  campaignObjectives?: string;
  totalBudget: number;
  budgetCurrency: string;
  startDate: string;
  endDate: string;
  contentGuidelines?: string;
  hashtags?: string[];
  mentions?: string[];
  briefDocument?: string;
  brandAssets?: string;
  status: CampaignStatus;
  createdById: number;
  createdAt: string;
  updatedAt: string;
  collaborations?: Collaboration[];
  analytics?: CampaignAnalytics;
}

export interface CampaignContent {
  id: number;
  collaborationId: number;
  type: 'post' | 'story' | 'reel' | 'video' | 'carousel';
  title?: string;
  caption?: string;
  image?: string;
  video?: string;
  postUrl?: string;
  status: ContentStatus;
  feedback?: string;
  likes?: number;
  likesCount: number;
  comments?: number;
  commentsCount: number;
  shares?: number;
  sharesCount: number;
  views?: number;
  viewsCount: number;
  createdAt: string;
  submittedAt?: string;
  publishedAt?: string;
}

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

export type ContentType = 'post' | 'story' | 'reel' | 'video' | 'live' | 'multiple';
export type ContentStatus = 'draft' | 'submitted' | 'revision_requested' | 'approved' | 'published' | 'rejected';
export type PaymentStatus = 'pending' | 'processing' | 'paid' | 'failed';

export interface Collaboration {
  id: number;
  campaignId: number;
  influencerId: number;
  influencer?: Influencer;
  contentType: ContentType;
  deliverablesCount: number;
  deliverables?: Array<{ type: string; quantity: number }>;
  agreedRate: number;
  currency: string;
  deadline: string;
  specificRequirements?: string;
  status: CollaborationStatus;
  notes?: string;
  invitedAt: string;
  respondedAt?: string;
  actualReach?: number;
  actualEngagement?: number;
  paymentStatus: PaymentStatus;
  content?: CampaignContent[];
}

export interface CampaignAnalytics {
  id: number;
  campaignId: number;
  totalReach: number;
  totalImpressions: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  totalSaves: number;
  avgEngagementRate: number;
  costPerEngagement: number;
  websiteClicks: number;
  conversions: number;
  conversionRate: number;
  totalSpent: number;
  estimatedValue: number;
  roiPercentage: number;
  lastCalculated: string;
}

// ===========================================
// Payment Types (matching your Django models)
// ===========================================

export type InvoiceStatus = 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled' | 'refunded';
export type InvoiceType = 'subscription' | 'campaign_payment' | 'one_time';
export type PaymentMethodType = 'credit_card' | 'bank_transfer' | 'paypal' | 'stripe' | 'cash';
export type PaymentTransactionStatus = 'pending' | 'processing' | 'succeeded' | 'failed' | 'cancelled' | 'refunded';
export type PayoutStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type PayoutMethod = 'bank_transfer' | 'paypal' | 'check';

export interface PaymentMethod {
  id: number;
  methodType: PaymentMethodType;
  lastFourDigits?: string;
  cardBrand?: string;
  bankName?: string;
  accountHolderName?: string;
  iban?: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface InvoiceLineItem {
  id: number;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  collaborationId?: number;
}

export interface Invoice {
  id: number;
  invoiceNumber: string;
  invoiceType: InvoiceType;
  status: InvoiceStatus;
  agencyId?: number;
  subscriptionId?: number;
  campaignId?: number;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  issueDate: string;
  dueDate: string;
  paidDate?: string;
  stripeInvoiceId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  lineItems?: InvoiceLineItem[];
  payments?: PaymentTransaction[];
  isOverdue?: boolean;
}

export interface PaymentTransaction {
  id: number;
  invoiceId: number;
  invoiceNumber?: string;
  paymentMethod: PaymentMethodType;
  amount: number;
  currency: string;
  status: PaymentTransactionStatus;
  referenceNumber: string;
  stripePaymentIntentId?: string;
  stripeChargeId?: string;
  createdAt: string;
  processedAt?: string;
  failureReason?: string;
  notes?: string;
}

export interface InfluencerPayout {
  id: number;
  collaborationId: number;
  influencerId: number;
  influencerName?: string;
  campaignName?: string;
  amount: number;
  currency: string;
  platformFeePercentage: number;
  platformFeeAmount: number;
  netAmount: number;
  status: PayoutStatus;
  payoutMethod: PayoutMethod;
  bankName?: string;
  accountHolderName?: string;
  iban?: string;
  processedAt?: string;
  createdAt: string;
}

// ===========================================
// Report Types
// ===========================================

export type ReportType = 
  | 'campaign_performance' 
  | 'influencer_analysis' 
  | 'roi_report' 
  | 'audience_insights' 
  | 'content_performance' 
  | 'custom';

export type ReportStatus = 'pending' | 'generating' | 'completed' | 'failed';
export type ReportFormat = 'pdf' | 'xlsx' | 'csv' | 'pptx';

export interface Report {
  id: number;
  title: string;
  reportType: ReportType;
  fileFormat: ReportFormat;
  status: ReportStatus;
  parameters?: Record<string, unknown>;
  fileUrl?: string;
  fileSize?: number;
  generatedAt?: string;
  expiresAt?: string;
  createdAt: string;
}

export interface ReportTemplate {
  id: number;
  name: string;
  description: string;
  reportType: ReportType;
  defaultParameters: Record<string, unknown>;
  isPublic: boolean;
}

export interface ReportSubscription {
  id: number;
  name: string;
  reportTemplateId: number;
  frequency: 'daily' | 'weekly' | 'monthly';
  recipientEmails: string[];
  isActive: boolean;
  lastSentAt?: string;
  nextSendAt: string;
}
