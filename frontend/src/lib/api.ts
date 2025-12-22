// ===========================================
// API Services - All Backend Endpoints
// ===========================================

import apiClient from './api-client';
import type {
  User,
  Agency,
  TeamMember,
  TeamInvitation,
  Subscription,
  Influencer,
  Campaign,
  Collaboration,
  CampaignContent,
  CampaignAnalytics,
  PaymentRecord,
  Report,
  ReportTemplate,
  ReportSubscription,
  PaginatedResponse,
} from '@/types';

// ===========================================
// AUTH SERVICE
// ===========================================
export const authService = {
  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    const response = await apiClient.post<{ token: string; user: User }>('/accounts/login/', { email, password });
    apiClient.setToken(response.token);
    if (typeof window !== 'undefined') {
      localStorage.setItem('authToken', response.token);
    }
    return response;
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/accounts/logout/');
    } catch {
      // Ignore errors on logout - we want to clear tokens anyway
    }
    this.clearTokens();
  },

  async getCurrentUser(): Promise<User> {
    return apiClient.get<User>('/accounts/me/');
  },

  async updateProfile(data: Partial<User>): Promise<User> {
    return apiClient.put<User>('/accounts/me/', data);
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    return apiClient.post('/accounts/change-password/', {
      current_password: currentPassword,
      new_password: newPassword,
    });
  },

  // Token helpers
  getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('authToken');
  },

  clearTokens(): void {
    apiClient.setToken(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
    }
  },

  // Initialize token from storage on app load
  initializeFromStorage(): void {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('authToken');
      if (token) {
        apiClient.setToken(token);
      }
    }
  },
};

// ===========================================
// AGENCY SERVICE
// ===========================================
export const agencyService = {
  async getAgency(id: number): Promise<Agency> {
    return apiClient.get<Agency>(`/agencies/${id}/`);
  },

  async updateAgency(id: number, data: Partial<Agency>): Promise<Agency> {
    return apiClient.put<Agency>(`/agencies/${id}/edit/`, transformToSnakeCase(data));
  },

  async setupAgency(data: Partial<Agency>): Promise<Agency> {
    return apiClient.post<Agency>('/agencies/setup/', transformToSnakeCase(data));
  },

  // Team Management
  async getTeamMembers(agencyId: number): Promise<TeamMember[]> {
    return apiClient.get<TeamMember[]>(`/agencies/${agencyId}/team/`);
  },

  async inviteTeamMember(agencyId: number, data: { email: string; role: string; permissions: string; message?: string }): Promise<TeamInvitation> {
    return apiClient.post<TeamInvitation>(`/agencies/${agencyId}/team/invite/`, data);
  },

  async removeTeamMember(agencyId: number, memberId: number): Promise<void> {
    return apiClient.delete(`/agencies/${agencyId}/team/remove/${memberId}/`);
  },

  async getInvitations(agencyId: number): Promise<TeamInvitation[]> {
    return apiClient.get<TeamInvitation[]>(`/agencies/api/${agencyId}/invitations/`);
  },

  async cancelInvitation(invitationId: number): Promise<void> {
    return apiClient.post(`/agencies/invitations/cancel/${invitationId}/`);
  },

  async resendInvitation(invitationId: number): Promise<void> {
    return apiClient.post(`/agencies/api/invitations/${invitationId}/resend/`);
  },

  // Subscription
  async getSubscription(agencyId: number): Promise<Subscription> {
    return apiClient.get<Subscription>(`/agencies/${agencyId}/subscription/`);
  },
};

// ===========================================
// INFLUENCER SERVICE
// ===========================================

// Type for raw API response (snake_case)
interface RawInfluencerResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Record<string, unknown>[];
}

export const influencerService = {
  async getInfluencers(params?: {
    page?: number;
    search?: string;
    category?: string;
    location?: string;
    minFollowers?: number;
    maxFollowers?: number;
  }): Promise<PaginatedResponse<Influencer>> {
    const response = await apiClient.get<RawInfluencerResponse>('/influencers/', {
      page: params?.page,
      search: params?.search,
      category: params?.category,
      location: params?.location,
      min_followers: params?.minFollowers,
      max_followers: params?.maxFollowers,
    });
    // Transform response to camelCase
    return {
      count: response.count,
      next: response.next,
      previous: response.previous,
      results: response.results.map(transformInfluencer),
    };
  },

  async getInfluencer(id: number): Promise<Influencer> {
    const response = await apiClient.get<Record<string, unknown>>(`/influencers/${id}/`);
    return transformInfluencer(response);
  },

  async searchInfluencers(filters: {
    category?: string;
    minFollowers?: number;
    maxFollowers?: number;
    location?: string;
    platform?: string;
  }): Promise<Influencer[]> {
    const response = await apiClient.post<{ results: Record<string, unknown>[] }>('/influencers/search/', {
      category: filters.category,
      min_followers: filters.minFollowers,
      max_followers: filters.maxFollowers,
      location: filters.location,
      platform: filters.platform,
    });
    return response.results.map(transformInfluencer);
  },

  async getInfluencerAnalytics(id: number): Promise<Influencer['analytics']> {
    return apiClient.get(`/influencers/analytics/${id}/`);
  },

  async getCategories(): Promise<{ value: string; label: string }[]> {
    return apiClient.get('/influencers/categories/');
  },

  async getTags(): Promise<{ id: number; name: string; color: string }[]> {
    return apiClient.get('/influencers/tags/');
  },
};

// ===========================================
// CAMPAIGN SERVICE
// ===========================================

interface RawCampaignResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Record<string, unknown>[];
}

export const campaignService = {
  async getCampaigns(params?: {
    page?: number;
    status?: string;
    search?: string;
  }): Promise<PaginatedResponse<Campaign>> {
    const response = await apiClient.get<RawCampaignResponse>('/campaigns/', {
      page: params?.page,
      status: params?.status,
      search: params?.search,
    });
    return {
      count: response.count,
      next: response.next,
      previous: response.previous,
      results: response.results.map(transformCampaign),
    };
  },

  async getCampaign(id: number): Promise<Campaign> {
    const response = await apiClient.get<Record<string, unknown>>(`/campaigns/${id}/`);
    return transformCampaign(response);
  },

  async createCampaign(data: Partial<Campaign>): Promise<Campaign> {
    const response = await apiClient.post<Record<string, unknown>>('/campaigns/create/', transformCampaignToBackend(data));
    return transformCampaign(response);
  },

  async updateCampaign(id: number, data: Partial<Campaign>): Promise<Campaign> {
    const response = await apiClient.put<Record<string, unknown>>(`/campaigns/${id}/edit/`, transformCampaignToBackend(data));
    return transformCampaign(response);
  },

  async deleteCampaign(id: number): Promise<void> {
    return apiClient.delete(`/campaigns/${id}/delete/`);
  },

  // Collaborations
  async getCollaborations(campaignId: number): Promise<Collaboration[]> {
    const response = await apiClient.get<Record<string, unknown>[]>(`/campaigns/${campaignId}/collaborations/`);
    return response.map(transformCollaboration);
  },

  async inviteInfluencer(campaignId: number, data: {
    influencerId: number;
    contentType: string;
    deliverablesCount: number;
    agreedRate: number;
    deadline: string;
    specificRequirements?: string;
  }): Promise<Collaboration> {
    const response = await apiClient.post<Record<string, unknown>>(`/campaigns/${campaignId}/invite-influencer/`, {
      influencer_id: data.influencerId,
      content_type: data.contentType,
      deliverables_count: data.deliverablesCount,
      agreed_rate: data.agreedRate,
      deadline: data.deadline,
      specific_requirements: data.specificRequirements,
    });
    return transformCollaboration(response);
  },

  async getCollaboration(id: number): Promise<Collaboration> {
    const response = await apiClient.get<Record<string, unknown>>(`/campaigns/collaboration/${id}/`);
    return transformCollaboration(response);
  },

  async updateCollaborationStatus(id: number, status: string): Promise<Collaboration> {
    const response = await apiClient.post<Record<string, unknown>>(`/campaigns/collaboration/${id}/update-status/`, { status });
    return transformCollaboration(response);
  },

  async updateCollaboration(campaignId: number, collaborationId: number, data: Partial<Collaboration>): Promise<Collaboration> {
    const response = await apiClient.put<Record<string, unknown>>(`/campaigns/${campaignId}/collaborations/${collaborationId}/`, {
      status: data.status,
      agreed_rate: data.agreedRate,
      deadline: data.deadline,
      notes: data.notes,
      specific_requirements: data.specificRequirements,
    });
    return transformCollaboration(response);
  },

  // Content
  async getContent(collaborationId: number): Promise<CampaignContent[]> {
    const response = await apiClient.get<Record<string, unknown>[]>(`/campaigns/collaboration/${collaborationId}/content/`);
    return response.map(transformContent);
  },

  async updateContent(campaignId: number, contentId: number, data: Partial<CampaignContent>): Promise<CampaignContent> {
    const response = await apiClient.put<Record<string, unknown>>(`/campaigns/${campaignId}/content/${contentId}/`, {
      status: data.status,
      caption: data.caption,
      feedback: data.feedback,
    });
    return transformContent(response);
  },

  async reviewContent(contentId: number, data: { status: string; feedback?: string }): Promise<CampaignContent> {
    const response = await apiClient.post<Record<string, unknown>>(`/campaigns/content/${contentId}/review/`, data);
    return transformContent(response);
  },

  async updateContentMetrics(contentId: number, metrics: {
    likesCount: number;
    commentsCount: number;
    sharesCount: number;
    viewsCount: number;
  }): Promise<CampaignContent> {
    const response = await apiClient.post<Record<string, unknown>>(`/campaigns/content/${contentId}/update-metrics/`, {
      likes_count: metrics.likesCount,
      comments_count: metrics.commentsCount,
      shares_count: metrics.sharesCount,
      views_count: metrics.viewsCount,
    });
    return transformContent(response);
  },

  // Analytics
  async getCampaignAnalytics(campaignId: number): Promise<CampaignAnalytics> {
    const response = await apiClient.get<Record<string, unknown>>(`/campaigns/${campaignId}/analytics/`);
    return transformCampaignAnalytics(response);
  },

  async refreshCampaignAnalytics(campaignId: number): Promise<CampaignAnalytics> {
    const response = await apiClient.post<Record<string, unknown>>(`/campaigns/api/${campaignId}/analytics/refresh/`);
    return transformCampaignAnalytics(response);
  },
};

// ===========================================
// PAYMENT SERVICE
// ===========================================

interface RawPaymentResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Record<string, unknown>[];
}

export const paymentService = {
  async getPayments(params?: {
    page?: number;
    status?: string;
    search?: string;
  }): Promise<PaginatedResponse<PaymentRecord>> {
    const response = await apiClient.get<RawPaymentResponse>('/payments/', {
      page: params?.page,
      status: params?.status,
      search: params?.search,
    });
    return {
      count: response.count,
      next: response.next,
      previous: response.previous,
      results: response.results.map(transformPayment),
    };
  },

  async createPayment(data: Partial<PaymentRecord>): Promise<PaymentRecord> {
    const response = await apiClient.post<Record<string, unknown>>('/payments/', {
      influencer_id: data.influencerId,
      campaign_id: data.campaignId,
      amount: data.amount,
      currency: data.currency || 'MAD',
      payment_method: data.paymentMethod,
      due_date: data.dueDate,
      notes: data.notes,
    });
    return transformPayment(response);
  },

  async updatePayment(id: number, data: Partial<PaymentRecord>): Promise<PaymentRecord> {
    const response = await apiClient.put<Record<string, unknown>>(`/payments/${id}/`, {
      payment_method: data.paymentMethod,
      due_date: data.dueDate,
      notes: data.notes,
    });
    return transformPayment(response);
  },

  async deletePayment(id: number): Promise<void> {
    return apiClient.delete(`/payments/${id}/`);
  },

  async uploadReceipt(id: number, file: File): Promise<PaymentRecord> {
    const formData = new FormData();
    formData.append('receipt', file);
    const response = await apiClient.uploadFile<Record<string, unknown>>(`/payments/${id}/receipt/`, formData);
    return transformPayment(response);
  },

  async downloadReceipt(id: number): Promise<Blob> {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payments/${id}/receipt/download/`, {
      headers: {
        Authorization: `Token ${apiClient.getToken()}`,
      },
    });
    return response.blob();
  },
};

// ===========================================
// REPORT SERVICE
// ===========================================
export const reportService = {
  async getReports(params?: {
    page?: number;
    type?: string;
    status?: string;
    search?: string;
  }): Promise<PaginatedResponse<Report>> {
    return apiClient.get('/reports/', {
      page: params?.page,
      type: params?.type,
      status: params?.status,
      search: params?.search,
    });
  },

  async createReport(data: Partial<Report>): Promise<Report> {
    return apiClient.post('/reports/create/', {
      title: data.title,
      report_type: data.reportType,
      file_format: data.fileFormat,
      parameters: data.parameters,
    });
  },

  async getReport(id: number): Promise<Report> {
    return apiClient.get(`/reports/${id}/`);
  },

  async getReportStatus(id: number): Promise<{ status: string; progress: number; downloadUrl?: string }> {
    return apiClient.get(`/reports/api/${id}/status/`);
  },

  async regenerateReport(id: number): Promise<Report> {
    return apiClient.post(`/reports/api/${id}/regenerate/`);
  },

  async deleteReport(id: number): Promise<void> {
    return apiClient.delete(`/reports/api/${id}/delete/`);
  },

  async downloadReport(id: number): Promise<Blob> {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports/${id}/download/`, {
      headers: {
        Authorization: `Token ${apiClient.getToken()}`,
      },
    });
    return response.blob();
  },

  async shareReport(id: number, email: string, message?: string): Promise<void> {
    return apiClient.post(`/reports/${id}/share/`, { email, message });
  },

  // Templates
  async getTemplates(): Promise<ReportTemplate[]> {
    return apiClient.get('/reports/templates/');
  },

  async getTemplate(id: number): Promise<ReportTemplate> {
    return apiClient.get(`/reports/templates/${id}/`);
  },

  // Subscriptions
  async getSubscriptions(): Promise<ReportSubscription[]> {
    return apiClient.get('/reports/subscriptions/');
  },

  async createSubscription(data: Partial<ReportSubscription>): Promise<ReportSubscription> {
    return apiClient.post('/reports/subscriptions/create/', {
      name: data.name,
      report_template_id: data.reportTemplateId,
      frequency: data.frequency,
      recipient_emails: data.recipientEmails,
    });
  },
};

// ===========================================
// TRANSFORMATION HELPERS
// ===========================================

// Generic camelCase to snake_case transformer
function transformToSnakeCase(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key in obj) {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    const value = obj[key];
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      result[snakeKey] = transformToSnakeCase(value as Record<string, unknown>);
    } else if (Array.isArray(value)) {
      result[snakeKey] = value.map(item => 
        typeof item === 'object' ? transformToSnakeCase(item as Record<string, unknown>) : item
      );
    } else {
      result[snakeKey] = value;
    }
  }
  return result;
}

// Influencer transformation (backend → frontend)
function transformInfluencer(data: Record<string, unknown>): Influencer {
  const socialAccounts = (data.social_accounts as Record<string, unknown>[] || []).map(account => ({
    id: account.id as number,
    platform: account.platform as string,
    username: account.username as string,
    url: account.url as string,
    followersCount: account.followers_count as number,
    followingCount: account.following_count as number,
    postsCount: account.posts_count as number,
    engagementRate: account.engagement_rate as number,
    avgLikes: account.avg_likes as number,
    avgComments: account.avg_comments as number,
    avgShares: account.avg_shares as number,
    avgViews: account.avg_views as number,
    avgSaves: account.avg_saves as number,
    followers14dAgo: account.followers_14d_ago as number,
    followersGrowth14d: account.followers_growth_14d as number,
    followersGrowthRate14d: account.followers_growth_rate_14d as number,
    postsCount14d: account.posts_count_14d as number,
    isVerified: account.is_verified as boolean,
    isActive: account.is_active as boolean,
    lastUpdated: account.last_updated as string,
  })) as Influencer['socialAccounts'];

  // Get primary account (highest followers)
  const primaryAccount = socialAccounts.reduce((max, acc) => 
    acc.followersCount > (max?.followersCount || 0) ? acc : max
  , socialAccounts[0]);

  // Calculate tier from primary account
  const followers = primaryAccount?.followersCount || 0;
  let tier: Influencer['tier'] = 'nano';
  if (followers >= 1000000) tier = 'mega';
  else if (followers >= 500000) tier = 'macro';
  else if (followers >= 50000) tier = 'mid';
  else if (followers >= 10000) tier = 'micro';

  return {
    id: data.id as number,
    fullName: data.full_name as string,
    username: data.username as string,
    email: data.email as string | undefined,
    bio: data.bio as string | undefined,
    avatar: data.avatar as string | undefined,
    age: data.age as number | undefined,
    gender: data.gender as Influencer['gender'],
    location: data.location as string | undefined,
    language: (data.language as string) || 'Arabic',
    primaryCategory: data.primary_category as Influencer['primaryCategory'],
    secondaryCategories: data.secondary_categories 
      ? (data.secondary_categories as string).split(',').map(s => s.trim())
      : [],
    phoneNumber: data.phone_number as string | undefined,
    website: data.website as string | undefined,
    country: (data.country as string) || 'Morocco',
    isVerified: data.is_verified as boolean,
    isActive: data.is_active as boolean,
    createdAt: data.created_at as string,
    socialAccounts,
    analytics: data.analytics ? transformAnalytics(data.analytics as Record<string, unknown>) : undefined,
    sponsoredPosts: data.sponsored_posts ? (data.sponsored_posts as Record<string, unknown>[]).map(p => transformSponsoredPost(p)) : undefined,
    tier,
    totalFollowers: socialAccounts.reduce((sum, acc) => sum + acc.followersCount, 0),
  };
}

function transformAnalytics(data: Record<string, unknown>): Influencer['analytics'] {
  return {
    id: data.id as number,
    avgEngagementRate: data.avg_engagement_rate as number,
    estimatedRatePerPost: data.estimated_rate_per_post as number | undefined,
    collaborationCount: data.collaboration_count as number,
    authenticityScore: data.authenticity_score as number,
    influenceScore: data.influence_score as number,
    topAudienceCountries: data.top_audience_countries as Record<string, number>,
    topAudienceCities: data.top_audience_cities as Record<string, number>,
    audienceGenderMale: data.audience_gender_male as number,
    audienceGenderFemale: data.audience_gender_female as number,
  };
}

function transformSponsoredPost(data: Record<string, unknown>): NonNullable<Influencer['sponsoredPosts']>[number] {
  return {
    id: data.id as number,
    postUrl: data.post_url as string,
    postType: data.post_type as string,
    brandName: data.brand_name as string,
    brandHandle: data.brand_handle as string | undefined,
    viewsCount: data.views_count as number,
    likesCount: data.likes_count as number,
    commentsCount: data.comments_count as number,
    sharesCount: data.shares_count as number,
    engagementRate: data.engagement_rate as number,
    postedAt: data.posted_at as string,
  };
}

// Campaign transformation (backend → frontend)
function transformCampaign(data: Record<string, unknown>): Campaign {
  return {
    id: data.id as number,
    agencyId: data.agency as number,
    name: data.name as string,
    description: data.description as string | undefined,
    campaignType: data.campaign_type as Campaign['campaignType'],
    brandName: data.brand_name as string,
    productName: data.product_name as string | undefined,
    targetAudience: data.target_audience as string,
    campaignObjectives: data.campaign_objectives as string,
    totalBudget: parseFloat(data.total_budget as string),
    budgetCurrency: (data.budget_currency as string) || 'MAD',
    startDate: data.start_date as string,
    endDate: data.end_date as string,
    contentGuidelines: data.content_guidelines as string | undefined,
    hashtags: data.hashtags as string | undefined,
    mentions: data.mentions as string | undefined,
    briefDocument: data.brief_document as string | undefined,
    brandAssets: data.brand_assets as string | undefined,
    status: data.status as Campaign['status'],
    createdById: data.created_by as number,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
    collaborations: data.collaborations 
      ? (data.collaborations as Record<string, unknown>[]).map(transformCollaboration)
      : undefined,
    analytics: data.analytics 
      ? transformCampaignAnalytics(data.analytics as Record<string, unknown>)
      : undefined,
  };
}

// Campaign transformation (frontend → backend)
function transformCampaignToBackend(data: Partial<Campaign>): Record<string, unknown> {
  return {
    name: data.name,
    description: data.description,
    campaign_type: data.campaignType,
    brand_name: data.brandName,
    product_name: data.productName,
    target_audience: data.targetAudience,
    campaign_objectives: data.campaignObjectives,
    total_budget: data.totalBudget,
    budget_currency: data.budgetCurrency,
    start_date: data.startDate,
    end_date: data.endDate,
    content_guidelines: data.contentGuidelines,
    hashtags: data.hashtags,
    mentions: data.mentions,
    status: data.status,
  };
}

// Collaboration transformation
function transformCollaboration(data: Record<string, unknown>): Collaboration {
  return {
    id: data.id as number,
    campaignId: data.campaign as number,
    influencerId: (data.influencer_id as number) || (data.influencer as Record<string, unknown>)?.id as number,
    influencer: data.influencer ? transformInfluencer(data.influencer as Record<string, unknown>) : {} as Influencer,
    contentType: data.content_type as Collaboration['contentType'],
    deliverablesCount: data.deliverables_count as number,
    agreedRate: parseFloat(data.agreed_rate as string),
    currency: (data.currency as string) || 'MAD',
    deadline: data.deadline as string,
    specificRequirements: data.specific_requirements as string | undefined,
    status: data.status as Collaboration['status'],
    notes: data.notes as string | undefined,
    invitedAt: data.invited_at as string,
    respondedAt: data.responded_at as string | undefined,
    actualReach: data.actual_reach as number | undefined,
    actualEngagement: data.actual_engagement as number | undefined,
    paymentStatus: data.payment_status as Collaboration['paymentStatus'],
    content: data.content 
      ? (data.content as Record<string, unknown>[]).map(transformContent)
      : undefined,
  };
}

// Content transformation
function transformContent(data: Record<string, unknown>): CampaignContent {
  return {
    id: data.id as number,
    collaborationId: data.collaboration as number,
    title: data.title as string | undefined,
    caption: data.caption as string | undefined,
    image: data.image as string | undefined,
    video: data.video as string | undefined,
    postUrl: data.post_url as string | undefined,
    status: data.status as CampaignContent['status'],
    feedback: data.feedback as string | undefined,
    likesCount: data.likes_count as number,
    commentsCount: data.comments_count as number,
    sharesCount: data.shares_count as number,
    viewsCount: data.views_count as number,
    createdAt: data.created_at as string,
    submittedAt: data.submitted_at as string | undefined,
    publishedAt: data.published_at as string | undefined,
  };
}

// Campaign Analytics transformation
function transformCampaignAnalytics(data: Record<string, unknown>): CampaignAnalytics {
  return {
    id: data.id as number,
    campaignId: data.campaign as number,
    totalReach: data.total_reach as number,
    totalImpressions: data.total_impressions as number,
    totalLikes: data.total_likes as number,
    totalComments: data.total_comments as number,
    totalShares: data.total_shares as number,
    totalSaves: data.total_saves as number,
    avgEngagementRate: data.avg_engagement_rate as number,
    costPerEngagement: parseFloat(data.cost_per_engagement as string),
    websiteClicks: data.website_clicks as number,
    conversions: data.conversions as number,
    conversionRate: data.conversion_rate as number,
    totalSpent: parseFloat(data.total_spent as string),
    estimatedValue: parseFloat(data.estimated_value as string),
    roiPercentage: data.roi_percentage as number,
    lastCalculated: data.last_calculated as string,
  };
}

// Payment transformation
function transformPayment(data: Record<string, unknown>): PaymentRecord {
  const influencer = data.influencer as Record<string, unknown>;
  const campaign = data.campaign as Record<string, unknown>;
  
  return {
    id: data.id as number,
    influencerId: (data.influencer_id as number) || influencer?.id as number,
    influencer: {
      id: influencer?.id as number,
      fullName: influencer?.full_name as string,
      username: influencer?.username as string,
      avatar: influencer?.avatar as string | undefined,
    },
    campaignId: (data.campaign_id as number) || campaign?.id as number,
    campaign: {
      id: campaign?.id as number,
      name: campaign?.name as string,
    },
    amount: parseFloat(data.amount as string),
    currency: (data.currency as string) || 'MAD',
    status: data.status as PaymentRecord['status'],
    paymentMethod: data.payment_method as PaymentRecord['paymentMethod'],
    paymentDate: data.payment_date as string | undefined,
    dueDate: data.due_date as string,
    reference: data.reference as string,
    notes: data.notes as string | undefined,
    receiptUrl: data.receipt_url as string | undefined,
    receiptFileName: data.receipt_file_name as string | undefined,
    createdAt: data.created_at as string,
  };
}
