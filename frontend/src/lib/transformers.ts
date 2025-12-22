// ===========================================
// Data Transformers - Backend to Frontend UI Format
// ===========================================

import type { Influencer, SocialMediaAccount, SponsoredPost } from '@/types';

// Frontend display format for Discovery page (matching current UI expectations)
export interface InfluencerDisplay {
  id: number;
  name: string;
  handle: string;
  email: string;
  bio: string;
  followers: number;
  followersGained14d: number;
  avgViews: number;
  avgLikes: number;
  avgComments: number;
  engagementRate: number;
  tier: 'nano' | 'micro' | 'mid' | 'macro' | 'mega';
  category: string;
  city: string;
  totalPosts: number;
  postsLast14d: number;
  brandCollabs: { name: string; videos: { views: number; likes: number }[] }[];
  languages: string[];
  isVerified: boolean;
  lastPosts: { views: number; likes: number }[];
  topPosts: { views: number; likes: number }[];
  // Optional fields from backend
  platforms?: { name: string; followers: number; engagementRate: number }[];
  country?: string;
}

/**
 * Transform backend Influencer to frontend display format
 * Maps backend field names to frontend expectations
 */
export function transformInfluencerToDisplay(influencer: Influencer): InfluencerDisplay {
  // Get primary social account (highest followers)
  const primaryAccount = influencer.socialAccounts?.reduce((max, acc) => 
    acc.followersCount > (max?.followersCount || 0) ? acc : max
  , influencer.socialAccounts[0]) || {} as SocialMediaAccount;

  // Extract brand collaborations from sponsored posts
  const brandCollabsMap = new Map<string, { views: number; likes: number }[]>();
  (influencer.sponsoredPosts || []).forEach(post => {
    const existing = brandCollabsMap.get(post.brandName) || [];
    existing.push({ views: post.viewsCount, likes: post.likesCount });
    brandCollabsMap.set(post.brandName, existing);
  });
  const brandCollabs = Array.from(brandCollabsMap.entries()).map(([name, videos]) => ({ name, videos }));

  // Get top posts from sponsored posts (sorted by views)
  const sortedPosts = [...(influencer.sponsoredPosts || [])].sort((a, b) => b.viewsCount - a.viewsCount);
  const topPosts = sortedPosts.slice(0, 3).map(p => ({ views: p.viewsCount, likes: p.likesCount }));
  
  // Get last posts (most recent by date)
  const recentPosts = [...(influencer.sponsoredPosts || [])].sort((a, b) => 
    new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime()
  );
  const lastPosts = recentPosts.slice(0, 3).map(p => ({ views: p.viewsCount, likes: p.likesCount }));

  // Extract languages - default to Arabic if not specified
  const languages = influencer.language ? [influencer.language] : ['Arabic'];
  if (influencer.secondaryCategories.length > 0) {
    // Check if any secondary categories are actually languages (common data entry pattern)
    const possibleLanguages = ['French', 'English', 'Spanish', 'Darija'];
    influencer.secondaryCategories.forEach(cat => {
      if (possibleLanguages.includes(cat) && !languages.includes(cat)) {
        languages.push(cat);
      }
    });
  }

  // Map platforms from social accounts
  const platforms = (influencer.socialAccounts || []).map(acc => ({
    name: acc.platform.charAt(0).toUpperCase() + acc.platform.slice(1),
    followers: acc.followersCount,
    engagementRate: acc.engagementRate,
  }));

  // Map category - capitalize first letter
  const categoryMap: Record<string, string> = {
    'fashion': 'Fashion',
    'beauty': 'Beauty',
    'fitness': 'Fitness',
    'food': 'Food',
    'travel': 'Travel',
    'tech': 'Technology',
    'gaming': 'Gaming',
    'lifestyle': 'Lifestyle',
    'business': 'Business',
    'education': 'Education',
    'entertainment': 'Entertainment',
    'sports': 'Sports',
    'music': 'Music',
    'art': 'Art',
    'parenting': 'Parenting',
    'health': 'Health',
    'finance': 'Finance',
  };

  return {
    id: influencer.id,
    name: influencer.fullName,
    handle: `@${influencer.username}`,
    email: influencer.email || '',
    bio: influencer.bio || '',
    followers: primaryAccount.followersCount || influencer.totalFollowers || 0,
    followersGained14d: primaryAccount.followersGrowth14d || 0,
    avgViews: primaryAccount.avgViews || 0,
    avgLikes: primaryAccount.avgLikes || 0,
    avgComments: primaryAccount.avgComments || 0,
    engagementRate: primaryAccount.engagementRate || influencer.analytics?.avgEngagementRate || 0,
    tier: influencer.tier,
    category: categoryMap[influencer.primaryCategory] || influencer.primaryCategory,
    city: influencer.location || '',
    totalPosts: primaryAccount.postsCount || 0,
    postsLast14d: primaryAccount.postsCount14d || 0,
    brandCollabs: brandCollabs.length > 0 ? brandCollabs : generatePlaceholderBrandCollabs(influencer),
    languages,
    isVerified: influencer.isVerified,
    lastPosts: lastPosts.length > 0 ? lastPosts : generatePlaceholderPosts(primaryAccount, 'last'),
    topPosts: topPosts.length > 0 ? topPosts : generatePlaceholderPosts(primaryAccount, 'top'),
    platforms,
    country: influencer.country,
  };
}

/**
 * Generate placeholder brand collaborations based on category
 * Used when no sponsored posts exist in database
 */
function generatePlaceholderBrandCollabs(influencer: Influencer): { name: string; videos: { views: number; likes: number }[] }[] {
  const categoryBrands: Record<string, string[]> = {
    'fashion': ['Zara', 'H&M', 'Mango'],
    'beauty': ['MAC', 'Sephora', 'Maybelline'],
    'fitness': ['Nike', 'Decathlon', 'Adidas'],
    'food': ['Knorr', 'Carrefour', 'Nestle'],
    'travel': ['Booking.com', 'Royal Air Maroc', 'Airbnb'],
    'tech': ['Samsung', 'Jumia', 'Apple'],
    'gaming': ['Razer', 'Logitech', 'PlayStation'],
    'lifestyle': ['IKEA', 'Netflix', 'Spotify'],
  };

  const brands = categoryBrands[influencer.primaryCategory] || categoryBrands['lifestyle'];
  const avgViews = influencer.socialAccounts?.[0]?.avgViews || 10000;
  const avgLikes = influencer.socialAccounts?.[0]?.avgLikes || 1000;

  // Only return brands if we have meaningful data
  if (influencer.analytics?.collaborationCount && influencer.analytics.collaborationCount > 0) {
    return brands.slice(0, Math.min(3, influencer.analytics.collaborationCount)).map(name => ({
      name,
      videos: [
        { views: Math.round(avgViews * 1.2), likes: Math.round(avgLikes * 1.2) },
        { views: Math.round(avgViews * 1.1), likes: Math.round(avgLikes * 1.1) },
      ],
    }));
  }

  return [];
}

/**
 * Generate placeholder posts based on average metrics
 */
function generatePlaceholderPosts(
  account: SocialMediaAccount | Record<string, never>,
  type: 'top' | 'last'
): { views: number; likes: number }[] {
  if (!account || !('avgViews' in account)) return [];
  
  const avgViews = account.avgViews || 0;
  const avgLikes = account.avgLikes || 0;
  
  if (avgViews === 0 && avgLikes === 0) return [];

  if (type === 'top') {
    // Top posts typically perform 2-3x better than average
    return [
      { views: Math.round(avgViews * 2.5), likes: Math.round(avgLikes * 2.5) },
      { views: Math.round(avgViews * 2.0), likes: Math.round(avgLikes * 2.0) },
      { views: Math.round(avgViews * 1.7), likes: Math.round(avgLikes * 1.7) },
    ];
  } else {
    // Last posts are closer to average
    return [
      { views: Math.round(avgViews * 1.1), likes: Math.round(avgLikes * 1.1) },
      { views: Math.round(avgViews * 0.95), likes: Math.round(avgLikes * 0.95) },
      { views: Math.round(avgViews * 1.05), likes: Math.round(avgLikes * 1.05) },
    ];
  }
}

/**
 * Transform display format back to API format for creating/updating
 */
export function transformDisplayToInfluencer(display: Partial<InfluencerDisplay>): Partial<Influencer> {
  return {
    fullName: display.name,
    username: display.handle?.replace('@', ''),
    email: display.email,
    bio: display.bio,
    location: display.city,
    primaryCategory: display.category?.toLowerCase() as Influencer['primaryCategory'],
    isVerified: display.isVerified,
    country: display.country || 'Morocco',
    language: display.languages?.[0] || 'Arabic',
  };
}

// Campaign display helpers
export interface CampaignDisplay {
  id: number;
  name: string;
  description: string;
  brandName: string;
  objective: string;
  campaignType: string;
  status: string;
  totalBudget: number;
  startDate: string;
  endDate: string;
  contentGuidelines: string;
  hashtags: string[];
  mentions: string[];
  targetAudience: {
    ageRange: string;
    gender: string;
    interests: string[];
    locations: string[];
  };
}

/**
 * Transform backend Campaign to frontend display format
 */
export function transformCampaignToDisplay(campaign: import('@/types').Campaign): CampaignDisplay {
  // Parse target audience - backend stores as single text field
  // Expected format: "Age: 18-35, Gender: All, Interests: Fashion, Beauty, Locations: Morocco"
  const parseTargetAudience = (text: string) => {
    const result = {
      ageRange: '18-35',
      gender: 'all',
      interests: [] as string[],
      locations: ['Morocco'],
    };
    
    if (!text) return result;
    
    // Try to parse structured format
    const ageMatch = text.match(/Age:\s*([^,]+)/i);
    if (ageMatch) result.ageRange = ageMatch[1].trim();
    
    const genderMatch = text.match(/Gender:\s*([^,]+)/i);
    if (genderMatch) result.gender = genderMatch[1].trim().toLowerCase();
    
    const interestsMatch = text.match(/Interests:\s*([^,]+(?:,\s*[^,]+)*)/i);
    if (interestsMatch) {
      result.interests = interestsMatch[1].split(',').map(s => s.trim()).filter(Boolean);
    }
    
    const locationsMatch = text.match(/Locations?:\s*([^,]+(?:,\s*[^,]+)*)/i);
    if (locationsMatch) {
      result.locations = locationsMatch[1].split(',').map(s => s.trim()).filter(Boolean);
    }
    
    return result;
  };

  return {
    id: campaign.id,
    name: campaign.name,
    description: campaign.description || '',
    brandName: campaign.brandName,
    objective: campaign.campaignObjectives,
    campaignType: campaign.campaignType,
    status: campaign.status,
    totalBudget: campaign.totalBudget,
    startDate: campaign.startDate,
    endDate: campaign.endDate,
    contentGuidelines: campaign.contentGuidelines || '',
    hashtags: campaign.hashtags ? campaign.hashtags.split(',').map(h => h.trim()) : [],
    mentions: campaign.mentions ? campaign.mentions.split(',').map(m => m.trim()) : [],
    targetAudience: parseTargetAudience(campaign.targetAudience),
  };
}

/**
 * Transform display format back to API format
 */
export function transformDisplayToCampaign(display: Partial<CampaignDisplay>): Partial<import('@/types').Campaign> {
  // Convert target audience back to text format
  const targetAudienceText = display.targetAudience 
    ? `Age: ${display.targetAudience.ageRange}, Gender: ${display.targetAudience.gender}, Interests: ${display.targetAudience.interests.join(', ')}, Locations: ${display.targetAudience.locations.join(', ')}`
    : '';

  return {
    name: display.name,
    description: display.description,
    brandName: display.brandName,
    campaignObjectives: display.objective,
    campaignType: display.campaignType as import('@/types').CampaignType,
    status: display.status as import('@/types').CampaignStatus,
    totalBudget: display.totalBudget,
    startDate: display.startDate,
    endDate: display.endDate,
    contentGuidelines: display.contentGuidelines,
    hashtags: display.hashtags?.join(', '),
    mentions: display.mentions?.join(', '),
    targetAudience: targetAudienceText,
  };
}
