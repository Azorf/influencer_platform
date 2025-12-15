'use client';

import { useState } from 'react';
import Link from 'next/link';

// Types based on Django models - matching backend exactly
type UserType = 'agency' | 'influencer' | 'brand' | 'admin';
type CampaignType = 'awareness' | 'engagement' | 'conversion' | 'product_launch' | 'events' | 'ugc';
type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
type CollaborationStatus = 'invited' | 'accepted' | 'declined' | 'in_progress' | 'content_submitted' | 'approved' | 'published' | 'completed' | 'cancelled';
type ContentStatus = 'draft' | 'submitted' | 'revision_requested' | 'approved' | 'published' | 'rejected';
type ContentType = 'script' | 'post' | 'story' | 'reel' | 'igtv' | 'youtube' | 'tiktok' | 'live';

// Available influencers for adding to campaign
interface BrandCollab {
  name: string;
  videos: { views: number; likes: number }[];
}

interface AvailableInfluencer {
  id: number;
  name: string;
  handle: string;
  email: string;
  followers: number;
  engagementRate: number;
  avgViews: number;
  avgLikes: number;
  avgComments: number;
  category: string;
  isVerified: boolean;
  bio: string;
  location: string;
  languages: string[];
  tier: string;
  totalPosts: number;
  postsLast14d: number;
  followersGained14d: number;
  platforms: { name: string; followers: number; engagementRate: number }[];
  categories: string[];
  lastPosts: { views: number; likes: number }[];
  topPosts: { views: number; likes: number }[];
  brandCollabs: BrandCollab[];
}

const availableInfluencers: AvailableInfluencer[] = [
  { 
    id: 10, name: 'Yasmine Style', handle: '@yasminestyle', email: 'yasmine@style.ma', 
    followers: 89000, engagementRate: 5.4, avgViews: 32000, avgLikes: 4800, avgComments: 234,
    category: 'Fashion', isVerified: true, 
    bio: 'Fashion & lifestyle content creator based in Casablanca 🇲🇦', 
    location: 'Casablanca', languages: ['Arabic', 'French'], tier: 'mid',
    totalPosts: 245, postsLast14d: 6, followersGained14d: 1450,
    platforms: [{ name: 'Instagram', followers: 89000, engagementRate: 5.4 }], 
    categories: ['Fashion', 'Lifestyle'],
    lastPosts: [{ views: 35000, likes: 4200 }, { views: 32000, likes: 3800 }, { views: 29000, likes: 3500 }],
    topPosts: [{ views: 85000, likes: 9500 }, { views: 72000, likes: 8200 }, { views: 65000, likes: 7400 }],
    brandCollabs: [{ name: 'Zara', videos: [{ views: 52000, likes: 4200 }] }, { name: 'H&M', videos: [{ views: 41000, likes: 3500 }] }]
  },
  { 
    id: 11, name: 'Omar Adventures', handle: '@omaradventures', email: 'omar@adventures.ma', 
    followers: 156000, engagementRate: 4.8, avgViews: 58000, avgLikes: 7500, avgComments: 456,
    category: 'Travel', isVerified: true, 
    bio: 'Exploring Morocco one adventure at a time 🏔️', 
    location: 'Marrakech', languages: ['Arabic', 'English', 'French'], tier: 'mid',
    totalPosts: 312, postsLast14d: 4, followersGained14d: 2100,
    platforms: [{ name: 'Instagram', followers: 156000, engagementRate: 4.8 }, { name: 'YouTube', followers: 45000, engagementRate: 3.2 }], 
    categories: ['Travel', 'Adventure'],
    lastPosts: [{ views: 62000, likes: 7800 }, { views: 55000, likes: 7200 }, { views: 51000, likes: 6800 }],
    topPosts: [{ views: 145000, likes: 18500 }, { views: 128000, likes: 16200 }, { views: 112000, likes: 14500 }],
    brandCollabs: [{ name: 'Booking.com', videos: [{ views: 78000, likes: 8200 }, { views: 65000, likes: 6800 }] }, { name: 'Royal Air Maroc', videos: [{ views: 58000, likes: 6100 }] }]
  },
  { 
    id: 12, name: 'Leila Fitness', handle: '@leilafitness', email: 'leila@fitness.ma', 
    followers: 203000, engagementRate: 6.1, avgViews: 89000, avgLikes: 12400, avgComments: 890,
    category: 'Fitness', isVerified: true, 
    bio: 'Certified trainer | Transform your body & mind 💪', 
    location: 'Rabat', languages: ['Arabic', 'French'], tier: 'mid',
    totalPosts: 389, postsLast14d: 12, followersGained14d: 3800,
    platforms: [{ name: 'Instagram', followers: 203000, engagementRate: 6.1 }, { name: 'TikTok', followers: 89000, engagementRate: 8.2 }], 
    categories: ['Fitness', 'Health', 'Wellness'],
    lastPosts: [{ views: 95000, likes: 13200 }, { views: 88000, likes: 12100 }, { views: 82000, likes: 11500 }],
    topPosts: [{ views: 245000, likes: 32000 }, { views: 198000, likes: 26500 }, { views: 175000, likes: 23000 }],
    brandCollabs: [{ name: 'Nike', videos: [{ views: 185000, likes: 24000 }, { views: 162000, likes: 21000 }] }, { name: 'Decathlon', videos: [{ views: 125000, likes: 16500 }] }]
  },
  { 
    id: 13, name: 'Amine Tech', handle: '@aminetech', email: 'amine@tech.ma', 
    followers: 67000, engagementRate: 7.2, avgViews: 28000, avgLikes: 4800, avgComments: 567,
    category: 'Technology', isVerified: false, 
    bio: 'Tech reviews & tutorials in Darija 🎮📱', 
    location: 'Casablanca', languages: ['Arabic', 'French', 'English'], tier: 'mid',
    totalPosts: 156, postsLast14d: 3, followersGained14d: 980,
    platforms: [{ name: 'YouTube', followers: 67000, engagementRate: 7.2 }], 
    categories: ['Technology', 'Gaming'],
    lastPosts: [{ views: 32000, likes: 5200 }, { views: 28000, likes: 4600 }, { views: 25000, likes: 4100 }],
    topPosts: [{ views: 89000, likes: 12500 }, { views: 76000, likes: 10800 }, { views: 65000, likes: 9200 }],
    brandCollabs: [{ name: 'Samsung', videos: [{ views: 65000, likes: 8500 }] }, { name: 'Jumia', videos: [{ views: 52000, likes: 6800 }] }]
  },
  { 
    id: 14, name: 'Salma Kitchen', handle: '@salmakitchen', email: 'salma@kitchen.ma', 
    followers: 312000, engagementRate: 5.9, avgViews: 125000, avgLikes: 18400, avgComments: 1230,
    category: 'Food', isVerified: true, 
    bio: 'Traditional Moroccan recipes with a modern twist 🍽️', 
    location: 'Fes', languages: ['Arabic', 'French'], tier: 'mid',
    totalPosts: 478, postsLast14d: 8, followersGained14d: 4500,
    platforms: [{ name: 'Instagram', followers: 312000, engagementRate: 5.9 }, { name: 'YouTube', followers: 178000, engagementRate: 4.5 }], 
    categories: ['Food', 'Cooking', 'Lifestyle'],
    lastPosts: [{ views: 132000, likes: 19500 }, { views: 118000, likes: 17800 }, { views: 125000, likes: 18200 }],
    topPosts: [{ views: 385000, likes: 52000 }, { views: 312000, likes: 42000 }, { views: 278000, likes: 38000 }],
    brandCollabs: [{ name: 'Knorr', videos: [{ views: 145000, likes: 19000 }, { views: 128000, likes: 16800 }] }, { name: 'Carrefour', videos: [{ views: 112000, likes: 14500 }] }]
  },
  { 
    id: 15, name: 'Khalid Vlogs', handle: '@khalidvlogs', email: 'khalid@vlogs.ma', 
    followers: 445000, engagementRate: 4.2, avgViews: 180000, avgLikes: 18700, avgComments: 2340,
    category: 'Lifestyle', isVerified: true, 
    bio: 'Daily vlogs | Comedy | Lifestyle 🎬', 
    location: 'Tangier', languages: ['Arabic', 'French', 'English'], tier: 'macro',
    totalPosts: 623, postsLast14d: 14, followersGained14d: 8200,
    platforms: [{ name: 'YouTube', followers: 445000, engagementRate: 4.2 }, { name: 'Instagram', followers: 234000, engagementRate: 3.8 }], 
    categories: ['Lifestyle', 'Comedy', 'Vlogs'],
    lastPosts: [{ views: 195000, likes: 20500 }, { views: 178000, likes: 18800 }, { views: 185000, likes: 19200 }],
    topPosts: [{ views: 520000, likes: 58000 }, { views: 445000, likes: 49000 }, { views: 398000, likes: 44000 }],
    brandCollabs: [{ name: 'Samsung', videos: [{ views: 285000, likes: 32000 }, { views: 245000, likes: 27000 }] }, { name: 'Maroc Telecom', videos: [{ views: 312000, likes: 35000 }] }]
  },
];

interface CampaignContent {
  id: number;
  type: ContentType;
  caption: string;
  mediaUrl: string;
  status: ContentStatus;
  submittedAt: string | null;
  publishedAt: string | null;
  likes: number;
  comments: number;
  shares: number;
  views: number;
  reach: number;
}

interface Collaboration {
  id: number;
  influencer: {
    id: number;
    name: string;
    handle: string;
    email: string;
    followers: number;
    engagementRate: number;
    avatar: string;
  };
  status: CollaborationStatus;
  agreedRate: number;
  deliverables: { type: ContentType; quantity: number }[];
  deadline: string;
  content: CampaignContent[];
  invitedAt: string;
  acceptedAt: string | null;
  completedAt: string | null;
  notes: string;
}

interface CampaignAnalytics {
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
}

interface Campaign {
  id: string;
  name: string;
  description: string;
  objective: string;
  brandName: string;
  campaignType: CampaignType;
  status: CampaignStatus;
  totalBudget: number;
  currency: string;
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
  collaborations: Collaboration[];
  analytics: CampaignAnalytics;
  createdAt: string;
  updatedAt: string;
}

// Mock data
const mockCampaign: Campaign = {
  id: '1',
  name: 'Summer Collection Launch 2024',
  description: 'Promote our new summer collection through lifestyle and fashion influencers across Morocco. Focus on beach and resort wear, highlighting sustainable materials and local craftsmanship.',
  objective: 'Increase brand awareness by 30% and drive 500+ website visits with a target conversion rate of 3%.',
  brandName: 'Moroccan Threads',
  campaignType: 'product_launch',
  status: 'active',
  totalBudget: 50000,
  currency: 'MAD',
  startDate: '2024-06-01',
  endDate: '2024-07-31',
  contentGuidelines: 'All content should feature our summer collection in natural, outdoor settings. Emphasis on lifestyle shots rather than studio photos. Show the versatility of pieces from beach to cafe settings.',
  hashtags: ['#MoroccanThreads', '#SummerCollection2024', '#SustainableFashion', '#MadeInMorocco'],
  mentions: ['@moroccanthreads', '@moroccanstyle'],
  targetAudience: {
    ageRange: '18-35',
    gender: 'Female',
    interests: ['Fashion', 'Lifestyle', 'Sustainable Living', 'Travel'],
    locations: ['Casablanca', 'Rabat', 'Marrakech', 'Tangier'],
  },
  collaborations: [
    {
      id: 1,
      influencer: { id: 1, name: 'Sarah Lifestyle', handle: '@sarahlifestyle', email: 'sarah@lifestyle.ma', followers: 125000, engagementRate: 4.2, avatar: 'S' },
      status: 'published',
      agreedRate: 8000,
      deliverables: [{ type: 'post', quantity: 2 }, { type: 'story', quantity: 5 }, { type: 'reel', quantity: 1 }],
      deadline: '2024-06-30',
      content: [
        { id: 1, type: 'post', caption: 'Summer vibes with @moroccanthreads ☀️', mediaUrl: '', status: 'published', submittedAt: '2024-06-15', publishedAt: '2024-06-16', likes: 4520, comments: 234, shares: 89, views: 45000, reach: 38000 },
        { id: 2, type: 'post', caption: 'Beach ready 🌊 #SummerCollection2024', mediaUrl: '', status: 'published', submittedAt: '2024-06-20', publishedAt: '2024-06-21', likes: 5100, comments: 312, shares: 124, views: 52000, reach: 44000 },
        { id: 3, type: 'reel', caption: 'Get ready with me - Summer edition', mediaUrl: '', status: 'published', submittedAt: '2024-06-25', publishedAt: '2024-06-26', likes: 12400, comments: 890, shares: 456, views: 180000, reach: 125000 },
      ],
      invitedAt: '2024-05-15',
      acceptedAt: '2024-05-18',
      completedAt: '2024-06-28',
      notes: 'Excellent collaboration. High engagement on all content.',
    },
    {
      id: 2,
      influencer: { id: 3, name: 'Fatima Beauty', handle: '@fatimabeauty', email: 'contact@fatimabeauty.com', followers: 234000, engagementRate: 3.8, avatar: 'F' },
      status: 'in_progress',
      agreedRate: 12000,
      deliverables: [{ type: 'post', quantity: 3 }, { type: 'story', quantity: 8 }, { type: 'reel', quantity: 2 }],
      deadline: '2024-07-15',
      content: [
        { id: 4, type: 'post', caption: 'Summer glow with sustainable fashion', mediaUrl: '', status: 'published', submittedAt: '2024-06-28', publishedAt: '2024-06-29', likes: 8900, comments: 567, shares: 234, views: 95000, reach: 78000 },
        { id: 5, type: 'reel', caption: 'Morning routine ft. summer looks', mediaUrl: '', status: 'approved', submittedAt: '2024-07-05', publishedAt: null, likes: 0, comments: 0, shares: 0, views: 0, reach: 0 },
      ],
      invitedAt: '2024-05-20',
      acceptedAt: '2024-05-25',
      completedAt: null,
      notes: 'Content quality is excellent. On track for deadline.',
    },
    {
      id: 3,
      influencer: { id: 7, name: 'Nadia Fashion', handle: '@nadiafashion', email: 'nadia.style@outlook.com', followers: 45000, engagementRate: 7.2, avatar: 'N' },
      status: 'content_submitted',
      agreedRate: 4000,
      deliverables: [{ type: 'post', quantity: 2 }, { type: 'story', quantity: 4 }],
      deadline: '2024-07-20',
      content: [
        { id: 6, type: 'post', caption: 'Summer essentials 🌺', mediaUrl: '', status: 'submitted', submittedAt: '2024-07-01', publishedAt: null, likes: 0, comments: 0, shares: 0, views: 0, reach: 0 },
        { id: 7, type: 'post', caption: 'Outfit of the day - beach edition', mediaUrl: '', status: 'revision_requested', submittedAt: '2024-07-02', publishedAt: null, likes: 0, comments: 0, shares: 0, views: 0, reach: 0 },
      ],
      invitedAt: '2024-06-01',
      acceptedAt: '2024-06-05',
      completedAt: null,
      notes: 'Requested revision on second post - needs better lighting.',
    },
    {
      id: 4,
      influencer: { id: 5, name: 'Meryem Food', handle: '@meryemfood', email: 'meryem.food@gmail.com', followers: 178000, engagementRate: 4.9, avatar: 'M' },
      status: 'accepted',
      agreedRate: 6000,
      deliverables: [{ type: 'post', quantity: 2 }, { type: 'story', quantity: 6 }, { type: 'reel', quantity: 1 }],
      deadline: '2024-07-25',
      content: [],
      invitedAt: '2024-06-10',
      acceptedAt: '2024-06-15',
      completedAt: null,
      notes: 'Cross-niche collaboration - lifestyle content at restaurants.',
    },
    {
      id: 5,
      influencer: { id: 6, name: 'Karim Travel', handle: '@karimtravel', email: 'karim@wandermorocco.com', followers: 67000, engagementRate: 5.5, avatar: 'K' },
      status: 'invited',
      agreedRate: 5000,
      deliverables: [{ type: 'post', quantity: 2 }, { type: 'reel', quantity: 1 }],
      deadline: '2024-07-30',
      content: [],
      invitedAt: '2024-07-01',
      acceptedAt: null,
      completedAt: null,
      notes: 'Awaiting response. Follow up scheduled for July 5.',
    },
  ],
  analytics: {
    totalReach: 285000,
    totalImpressions: 456000,
    totalLikes: 30920,
    totalComments: 2003,
    totalShares: 903,
    totalSaves: 1245,
    avgEngagementRate: 5.2,
    costPerEngagement: 0.58,
    websiteClicks: 3420,
    conversions: 89,
    conversionRate: 2.6,
    totalSpent: 20000,
    estimatedValue: 45000,
    roiPercentage: 125,
  },
  createdAt: '2024-05-01',
  updatedAt: '2024-07-03',
};

const statusColors: Record<CampaignStatus, string> = {
  draft: 'bg-gray-100 text-gray-800',
  active: 'bg-green-100 text-green-800',
  paused: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-blue-100 text-blue-800',
  cancelled: 'bg-red-100 text-red-800',
};

const collabStatusColors: Record<CollaborationStatus, string> = {
  invited: 'bg-yellow-100 text-yellow-800',
  accepted: 'bg-blue-100 text-blue-800',
  declined: 'bg-red-100 text-red-800',
  in_progress: 'bg-purple-100 text-purple-800',
  content_submitted: 'bg-orange-100 text-orange-800',
  approved: 'bg-teal-100 text-teal-800',
  published: 'bg-green-100 text-green-800',
  completed: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
};

const contentStatusColors: Record<ContentStatus, string> = {
  draft: 'bg-gray-100 text-gray-700',
  submitted: 'bg-yellow-100 text-yellow-700',
  revision_requested: 'bg-orange-100 text-orange-700',
  approved: 'bg-blue-100 text-blue-700',
  published: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

const campaignTypeLabels: Record<CampaignType, string> = {
  awareness: 'Brand Awareness',
  engagement: 'Engagement',
  conversion: 'Conversion',
  product_launch: 'Product Launch',
  events: 'Events',
  ugc: 'User Generated Content',
};

function formatCurrency(amount: number, currency: string = 'MAD'): string {
  return new Intl.NumberFormat('fr-MA', { style: 'currency', currency }).format(amount);
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getDaysRemaining(endDate: string): number {
  const end = new Date(endDate);
  const today = new Date();
  const diff = end.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

interface PageProps {
  params: { id: string };
}

export default function CampaignDetailPage({ params }: PageProps) {
  const { id } = params;
  const [campaign, setCampaign] = useState<Campaign>(mockCampaign);
  const [activeTab, setActiveTab] = useState<'overview' | 'collaborations' | 'content' | 'analytics'>('overview');
  const [selectedCollaboration, setSelectedCollaboration] = useState<Collaboration | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddInfluencerModal, setShowAddInfluencerModal] = useState(false);
  
  // Edit form state
  const [editForm, setEditForm] = useState({
    name: campaign.name,
    description: campaign.description,
    objective: campaign.objective,
    brandName: campaign.brandName,
    campaignType: campaign.campaignType,
    status: campaign.status,
    totalBudget: campaign.totalBudget,
    startDate: campaign.startDate,
    endDate: campaign.endDate,
    contentGuidelines: campaign.contentGuidelines,
    hashtags: campaign.hashtags.join(', '),
    mentions: campaign.mentions.join(', '),
    ageRange: campaign.targetAudience.ageRange,
    gender: campaign.targetAudience.gender,
    interests: campaign.targetAudience.interests.join(', '),
    locations: campaign.targetAudience.locations.join(', '),
  });

  // Add influencer form state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInfluencer, setSelectedInfluencer] = useState<AvailableInfluencer | null>(null);
  const [inviteForm, setInviteForm] = useState({
    agreedRate: '',
    deadline: '',
    posts: 1,
    stories: 0,
    reels: 0,
    notes: '',
  });

  // Content management state
  const [showAddContentModal, setShowAddContentModal] = useState(false);
  const [showContentDetailModal, setShowContentDetailModal] = useState<(CampaignContent & { influencer: { id: number; name: string; handle: string } }) | null>(null);
  const [selectedCollabForContent, setSelectedCollabForContent] = useState<Collaboration | null>(null);
  const [contentForm, setContentForm] = useState({
    type: 'script' as ContentType,
    caption: '',
    mediaUrl: '',
    status: 'draft' as ContentStatus,
  });

  // Content metrics form (for when updating to published)
  const [metricsForm, setMetricsForm] = useState({
    likes: 0,
    comments: 0,
    shares: 0,
    views: 0,
    reach: 0,
  });

  // Influencer profile modal state
  const [showInfluencerProfileModal, setShowInfluencerProfileModal] = useState<AvailableInfluencer | null>(null);
  const [profileSlide, setProfileSlide] = useState(0);
  
  // Track if collaboration has unsaved changes
  const [collabEditForm, setCollabEditForm] = useState<{
    agreedRate: number;
    deadline: string;
    notes: string;
  } | null>(null);
  const [hasCollabChanges, setHasCollabChanges] = useState(false);

  const filteredInfluencers = availableInfluencers.filter(inf => 
    !campaign.collaborations.some(c => c.influencer.id === inf.id) &&
    (inf.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
     inf.handle.toLowerCase().includes(searchQuery.toLowerCase()) ||
     inf.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleSaveEdit = () => {
    setCampaign({
      ...campaign,
      name: editForm.name,
      description: editForm.description,
      objective: editForm.objective,
      brandName: editForm.brandName,
      campaignType: editForm.campaignType,
      status: editForm.status,
      totalBudget: editForm.totalBudget,
      startDate: editForm.startDate,
      endDate: editForm.endDate,
      contentGuidelines: editForm.contentGuidelines,
      hashtags: editForm.hashtags.split(',').map(h => h.trim()).filter(h => h),
      mentions: editForm.mentions.split(',').map(m => m.trim()).filter(m => m),
      targetAudience: {
        ageRange: editForm.ageRange,
        gender: editForm.gender,
        interests: editForm.interests.split(',').map(i => i.trim()).filter(i => i),
        locations: editForm.locations.split(',').map(l => l.trim()).filter(l => l),
      },
    });
    setShowEditModal(false);
  };

  const handleAddInfluencer = () => {
    if (!selectedInfluencer) return;
    
    const deliverables: { type: ContentType; quantity: number }[] = [];
    if (inviteForm.posts > 0) deliverables.push({ type: 'post', quantity: inviteForm.posts });
    if (inviteForm.stories > 0) deliverables.push({ type: 'story', quantity: inviteForm.stories });
    if (inviteForm.reels > 0) deliverables.push({ type: 'reel', quantity: inviteForm.reels });

    const newCollaboration: Collaboration = {
      id: Date.now(),
      influencer: {
        id: selectedInfluencer.id,
        name: selectedInfluencer.name,
        handle: selectedInfluencer.handle,
        email: selectedInfluencer.email,
        followers: selectedInfluencer.followers,
        engagementRate: selectedInfluencer.engagementRate,
        avatar: selectedInfluencer.name.charAt(0),
      },
      status: 'invited',
      agreedRate: parseFloat(inviteForm.agreedRate) || 0,
      deliverables,
      deadline: inviteForm.deadline,
      content: [],
      invitedAt: new Date().toISOString().split('T')[0],
      acceptedAt: null,
      completedAt: null,
      notes: inviteForm.notes,
    };

    setCampaign({
      ...campaign,
      collaborations: [...campaign.collaborations, newCollaboration],
    });

    // Reset form
    setSelectedInfluencer(null);
    setInviteForm({ agreedRate: '', deadline: '', posts: 1, stories: 0, reels: 0, notes: '' });
    setSearchQuery('');
    setShowAddInfluencerModal(false);
  };

  // Content management handlers
  const handleAddContent = () => {
    if (!selectedCollabForContent) return;

    const newContent: CampaignContent = {
      id: Date.now(),
      type: contentForm.type,
      caption: contentForm.caption,
      mediaUrl: contentForm.mediaUrl,
      status: contentForm.status,
      submittedAt: contentForm.status !== 'draft' ? new Date().toISOString().split('T')[0] : null,
      publishedAt: contentForm.status === 'published' ? new Date().toISOString().split('T')[0] : null,
      likes: contentForm.status === 'published' ? metricsForm.likes : 0,
      comments: contentForm.status === 'published' ? metricsForm.comments : 0,
      shares: contentForm.status === 'published' ? metricsForm.shares : 0,
      views: contentForm.status === 'published' ? metricsForm.views : 0,
      reach: contentForm.status === 'published' ? metricsForm.reach : 0,
    };

    // Update collaboration status based on content
    let newCollabStatus: CollaborationStatus = selectedCollabForContent.status;
    if (contentForm.status === 'submitted') {
      newCollabStatus = 'content_submitted';
    } else if (contentForm.status === 'published') {
      newCollabStatus = 'published';
    } else if (['accepted', 'in_progress'].includes(selectedCollabForContent.status)) {
      newCollabStatus = 'in_progress';
    }

    setCampaign({
      ...campaign,
      collaborations: campaign.collaborations.map(c => 
        c.id === selectedCollabForContent.id
          ? { ...c, content: [...c.content, newContent], status: newCollabStatus }
          : c
      ),
    });

    // Reset form
    setContentForm({ type: 'post', caption: '', mediaUrl: '', status: 'draft' });
    setMetricsForm({ likes: 0, comments: 0, shares: 0, views: 0, reach: 0 });
    setSelectedCollabForContent(null);
    setShowAddContentModal(false);
  };

  const handleUpdateContentStatus = (collaborationId: number, contentId: number, newStatus: ContentStatus) => {
    setCampaign({
      ...campaign,
      collaborations: campaign.collaborations.map(c => {
        if (c.id !== collaborationId) return c;

        const updatedContent = c.content.map(ct => {
          if (ct.id !== contentId) return ct;
          return {
            ...ct,
            status: newStatus,
            submittedAt: newStatus !== 'draft' && !ct.submittedAt ? new Date().toISOString().split('T')[0] : ct.submittedAt,
            publishedAt: newStatus === 'published' && !ct.publishedAt ? new Date().toISOString().split('T')[0] : ct.publishedAt,
          };
        });

        // Update collaboration status based on content states
        const hasPublished = updatedContent.some(ct => ct.status === 'published');
        const allPublished = updatedContent.length > 0 && updatedContent.every(ct => ct.status === 'published');
        const hasSubmitted = updatedContent.some(ct => ct.status === 'submitted');
        const totalDeliverables = c.deliverables.reduce((s, d) => s + d.quantity, 0);
        
        let newCollabStatus: CollaborationStatus = c.status;
        if (allPublished && updatedContent.length >= totalDeliverables) {
          newCollabStatus = 'completed';
        } else if (hasPublished) {
          newCollabStatus = 'published';
        } else if (hasSubmitted || updatedContent.some(ct => ct.status === 'approved' || ct.status === 'revision_requested')) {
          newCollabStatus = 'content_submitted';
        } else if (c.status === 'accepted') {
          newCollabStatus = 'in_progress';
        }

        return { ...c, content: updatedContent, status: newCollabStatus };
      }),
    });
  };

  const handleUpdateContentMetrics = (collaborationId: number, contentId: number, metrics: typeof metricsForm) => {
    setCampaign({
      ...campaign,
      collaborations: campaign.collaborations.map(c => {
        if (c.id !== collaborationId) return c;
        return {
          ...c,
          content: c.content.map(ct => 
            ct.id === contentId
              ? { ...ct, ...metrics }
              : ct
          ),
        };
      }),
    });
  };

  const handleUpdateCollaborationStatus = (collaborationId: number, newStatus: CollaborationStatus) => {
    setCampaign({
      ...campaign,
      collaborations: campaign.collaborations.map(c => 
        c.id === collaborationId
          ? { 
              ...c, 
              status: newStatus,
              acceptedAt: newStatus === 'accepted' && !c.acceptedAt ? new Date().toISOString().split('T')[0] : c.acceptedAt,
              completedAt: newStatus === 'completed' && !c.completedAt ? new Date().toISOString().split('T')[0] : c.completedAt,
            }
          : c
      ),
    });
  };

  const openAddContentModal = (collaboration: Collaboration) => {
    setSelectedCollabForContent(collaboration);
    setShowAddContentModal(true);
  };

  const handleSaveCollaborationChanges = () => {
    if (!selectedCollaboration || !collabEditForm) return;
    
    setCampaign({
      ...campaign,
      collaborations: campaign.collaborations.map(c => 
        c.id === selectedCollaboration.id
          ? { 
              ...c, 
              agreedRate: collabEditForm.agreedRate,
              deadline: collabEditForm.deadline,
              notes: collabEditForm.notes,
            }
          : c
      ),
    });
    
    // Update selected collaboration to reflect changes
    setSelectedCollaboration({
      ...selectedCollaboration,
      agreedRate: collabEditForm.agreedRate,
      deadline: collabEditForm.deadline,
      notes: collabEditForm.notes,
    });
    
    setHasCollabChanges(false);
  };

  const initCollabEditForm = (collab: Collaboration) => {
    setCollabEditForm({
      agreedRate: collab.agreedRate,
      deadline: collab.deadline,
      notes: collab.notes,
    });
    setHasCollabChanges(false);
  };

  // Get full influencer profile from collaboration
  const getInfluencerProfile = (collab: Collaboration): AvailableInfluencer | null => {
    // Try to find in available influencers first
    const available = availableInfluencers.find(inf => inf.id === collab.influencer.id);
    if (available) return available;
    
    // Otherwise construct from collaboration data with default values
    const avgLikes = Math.round(collab.influencer.followers * collab.influencer.engagementRate / 100);
    return {
      id: collab.influencer.id,
      name: collab.influencer.name,
      handle: collab.influencer.handle,
      email: collab.influencer.email,
      followers: collab.influencer.followers,
      engagementRate: collab.influencer.engagementRate,
      avgViews: Math.round(collab.influencer.followers * 0.3),
      avgLikes: avgLikes,
      avgComments: Math.round(avgLikes * 0.05),
      category: 'Lifestyle',
      isVerified: true,
      bio: `Content creator based in Morocco`,
      location: 'Morocco',
      languages: ['Arabic', 'French'],
      tier: collab.influencer.followers > 500000 ? 'macro' : collab.influencer.followers > 50000 ? 'mid' : 'micro',
      totalPosts: Math.round(collab.influencer.followers / 500),
      postsLast14d: Math.floor(Math.random() * 10) + 2,
      followersGained14d: Math.round(collab.influencer.followers * 0.02),
      platforms: [{ name: 'Instagram', followers: collab.influencer.followers, engagementRate: collab.influencer.engagementRate }],
      categories: ['Lifestyle'],
      lastPosts: [
        { views: Math.round(collab.influencer.followers * 0.35), likes: avgLikes },
        { views: Math.round(collab.influencer.followers * 0.32), likes: Math.round(avgLikes * 0.9) },
        { views: Math.round(collab.influencer.followers * 0.28), likes: Math.round(avgLikes * 0.85) },
      ],
      topPosts: [
        { views: Math.round(collab.influencer.followers * 0.8), likes: Math.round(avgLikes * 2.5) },
        { views: Math.round(collab.influencer.followers * 0.65), likes: Math.round(avgLikes * 2.1) },
        { views: Math.round(collab.influencer.followers * 0.55), likes: Math.round(avgLikes * 1.8) },
      ],
      brandCollabs: [],
    };
  };

  const totalDeliverables = campaign.collaborations.reduce((sum, c) => sum + c.deliverables.reduce((s, d) => s + d.quantity, 0), 0);
  const completedContent = campaign.collaborations.reduce((sum, c) => sum + c.content.filter(ct => ct.status === 'published').length, 0);
  const pendingContent = campaign.collaborations.reduce((sum, c) => sum + c.content.filter(ct => ct.status === 'submitted' || ct.status === 'revision_requested').length, 0);
  const daysRemaining = getDaysRemaining(campaign.endDate);
  const budgetProgress = (campaign.analytics.totalSpent / campaign.totalBudget) * 100;

  return (
    <div className="p-8">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link href="/dashboard/campaigns" className="text-sm text-gray-500 hover:text-gray-900">
          ← Back to Campaigns
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-gray-900">{campaign.name}</h1>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${statusColors[campaign.status]}`}>
              {campaign.status}
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
              {campaignTypeLabels[campaign.campaignType]}
            </span>
          </div>
          <p className="text-gray-600">{campaign.brandName} • {formatDate(campaign.startDate)} - {formatDate(campaign.endDate)}</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowEditModal(true)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            Edit Campaign
          </button>
          <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
            Export Report
          </button>
          <button 
            onClick={() => setShowAddInfluencerModal(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800"
          >
            + Add Influencer
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-6 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-500">Budget</div>
          <div className="text-xl font-bold text-gray-900 mt-1">{formatCurrency(campaign.totalBudget)}</div>
          <div className="w-full h-1.5 bg-gray-200 rounded-full mt-2">
            <div className="h-full bg-gray-900 rounded-full" style={{ width: `${Math.min(budgetProgress, 100)}%` }}></div>
          </div>
          <div className="text-xs text-gray-500 mt-1">{formatCurrency(campaign.analytics.totalSpent)} spent</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-500">Influencers</div>
          <div className="text-xl font-bold text-gray-900 mt-1">{campaign.collaborations.length}</div>
          <div className="text-xs text-gray-500 mt-1">{campaign.collaborations.filter(c => c.status === 'published' || c.status === 'completed').length} completed</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-500">Content</div>
          <div className="text-xl font-bold text-gray-900 mt-1">{completedContent}/{totalDeliverables}</div>
          <div className="text-xs text-gray-500 mt-1">{pendingContent} pending review</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-500">Total Reach</div>
          <div className="text-xl font-bold text-gray-900 mt-1">{formatNumber(campaign.analytics.totalReach)}</div>
          <div className="text-xs text-green-600 mt-1">+{campaign.analytics.avgEngagementRate}% eng.</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-500">Conversions</div>
          <div className="text-xl font-bold text-gray-900 mt-1">{campaign.analytics.conversions}</div>
          <div className="text-xs text-gray-500 mt-1">{campaign.analytics.conversionRate}% rate</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-500">Time Left</div>
          <div className={`text-xl font-bold mt-1 ${daysRemaining < 7 ? 'text-red-600' : daysRemaining < 14 ? 'text-yellow-600' : 'text-gray-900'}`}>
            {daysRemaining > 0 ? `${daysRemaining} days` : 'Ended'}
          </div>
          <div className="text-xs text-gray-500 mt-1">ends {formatDate(campaign.endDate)}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {(['overview', 'collaborations', 'content', 'analytics'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px capitalize ${activeTab === tab ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">
            {/* Campaign Brief */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Campaign Brief</h3>
              <div className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-gray-700">Description</div>
                  <p className="text-sm text-gray-600 mt-1">{campaign.description}</p>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700">Objective</div>
                  <p className="text-sm text-gray-600 mt-1">{campaign.objective}</p>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700">Content Guidelines</div>
                  <p className="text-sm text-gray-600 mt-1">{campaign.contentGuidelines}</p>
                </div>
              </div>
            </div>

            {/* Collaboration Progress */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Collaboration Progress</h3>
                <button onClick={() => setActiveTab('collaborations')} className="text-sm text-gray-500 hover:text-gray-900">View all →</button>
              </div>
              <div className="divide-y divide-gray-200">
                {campaign.collaborations.slice(0, 4).map((collab) => (
                  <div key={collab.id} className="px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-medium">
                        {collab.influencer.avatar}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{collab.influencer.name}</div>
                        <div className="text-sm text-gray-500">{collab.influencer.handle} • {formatNumber(collab.influencer.followers)} followers</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm text-gray-500">{collab.content.filter(c => c.status === 'published').length}/{collab.deliverables.reduce((s, d) => s + d.quantity, 0)} delivered</div>
                        <div className="text-xs text-gray-400">Due {formatDate(collab.deadline)}</div>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${collabStatusColors[collab.status]}`}>
                        {collab.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Target Audience */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Target Audience</h3>
              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Age Range</dt>
                  <dd className="text-sm text-gray-900">{campaign.targetAudience.ageRange}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Gender</dt>
                  <dd className="text-sm text-gray-900">{campaign.targetAudience.gender}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500 mb-2">Interests</dt>
                  <dd className="flex flex-wrap gap-1">
                    {campaign.targetAudience.interests.map((interest) => (
                      <span key={interest} className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded">{interest}</span>
                    ))}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500 mb-2">Locations</dt>
                  <dd className="flex flex-wrap gap-1">
                    {campaign.targetAudience.locations.map((loc) => (
                      <span key={loc} className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded">{loc}</span>
                    ))}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Hashtags & Mentions */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Required Tags</h3>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-500 mb-2">Hashtags</div>
                  <div className="flex flex-wrap gap-1">
                    {campaign.hashtags.map((tag) => (
                      <span key={tag} className="px-2 py-0.5 text-xs bg-blue-50 text-blue-700 rounded">{tag}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-2">Mentions</div>
                  <div className="flex flex-wrap gap-1">
                    {campaign.mentions.map((mention) => (
                      <span key={mention} className="px-2 py-0.5 text-xs bg-purple-50 text-purple-700 rounded">{mention}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ROI Summary */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">ROI Summary</h3>
              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Total Spent</dt>
                  <dd className="text-sm font-medium text-gray-900">{formatCurrency(campaign.analytics.totalSpent)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Est. Value</dt>
                  <dd className="text-sm font-medium text-gray-900">{formatCurrency(campaign.analytics.estimatedValue)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">ROI</dt>
                  <dd className="text-sm font-medium text-green-600">+{campaign.analytics.roiPercentage}%</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Cost/Engagement</dt>
                  <dd className="text-sm font-medium text-gray-900">{formatCurrency(campaign.analytics.costPerEngagement)}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      )}

      {/* Collaborations Tab */}
      {activeTab === 'collaborations' && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Influencer</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Deliverables</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Progress</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Rate</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Deadline</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {campaign.collaborations.map((collab) => {
                  const totalDel = collab.deliverables.reduce((s, d) => s + d.quantity, 0);
                  const completed = collab.content.filter(c => c.status === 'published').length;
                  return (
                    <tr key={collab.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-medium">
                            {collab.influencer.avatar}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{collab.influencer.name}</div>
                            <div className="text-sm text-gray-500">{collab.influencer.handle}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${collabStatusColors[collab.status]}`}>
                          {collab.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">
                          {collab.deliverables.map(d => `${d.quantity} ${d.type}${d.quantity > 1 ? 's' : ''}`).join(', ')}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-1.5 bg-gray-200 rounded-full">
                            <div className="h-full bg-green-500 rounded-full" style={{ width: `${(completed / totalDel) * 100}%` }}></div>
                          </div>
                          <span className="text-sm text-gray-600">{completed}/{totalDel}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{formatCurrency(collab.agreedRate)}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{formatDate(collab.deadline)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {collab.status !== 'invited' && collab.status !== 'declined' && collab.status !== 'cancelled' && (
                            <button 
                              onClick={() => openAddContentModal(collab)}
                              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                            >
                              + Add Content
                            </button>
                          )}
                          <button 
                            onClick={() => setSelectedCollaboration(collab)}
                            className="text-sm text-gray-500 hover:text-gray-900"
                          >
                            View Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Content Tab */}
      {activeTab === 'content' && (
        <div className="space-y-6">
          {/* Content Stats */}
          <div className="grid grid-cols-5 gap-4">
            {(['draft', 'submitted', 'revision_requested', 'approved', 'published'] as ContentStatus[]).map((status) => {
              const count = campaign.collaborations.reduce((sum, c) => sum + c.content.filter(ct => ct.status === status).length, 0);
              return (
                <div key={status} className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="text-sm text-gray-500 capitalize">{status.replace(/_/g, ' ')}</div>
                  <div className="text-2xl font-bold text-gray-900 mt-1">{count}</div>
                </div>
              );
            })}
          </div>

          {/* Content List */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">All Content</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {campaign.collaborations.flatMap(collab => 
                collab.content.map(content => ({ ...content, influencer: collab.influencer, collaborationId: collab.id }))
              ).length === 0 ? (
                <div className="px-6 py-12 text-center text-gray-500">
                  <div className="text-4xl mb-3">📭</div>
                  <div className="font-medium">No content yet</div>
                  <div className="text-sm">Add content from the Collaborations tab</div>
                </div>
              ) : (
                campaign.collaborations.flatMap(collab => 
                  collab.content.map(content => ({ ...content, influencer: collab.influencer, collaborationId: collab.id }))
                ).map((content) => (
                  <div key={content.id} className="px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center text-2xl">
                        {content.type === 'reel' ? '🎬' : content.type === 'story' ? '📱' : '📷'}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{content.caption.slice(0, 50)}{content.caption.length > 50 ? '...' : ''}</div>
                        <div className="text-sm text-gray-500">by {content.influencer.name} • {content.type}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {content.status === 'published' && (
                        <div className="flex gap-4 text-sm text-gray-500">
                          <span>❤️ {formatNumber(content.likes)}</span>
                          <span>💬 {formatNumber(content.comments)}</span>
                          <span>👁️ {formatNumber(content.views)}</span>
                        </div>
                      )}
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${contentStatusColors[content.status]}`}>
                        {content.status.replace(/_/g, ' ')}
                      </span>
                      <button 
                        onClick={() => setShowContentDetailModal(content)}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Manage
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Performance Metrics */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="text-sm text-gray-500">Total Reach</div>
              <div className="text-3xl font-bold text-gray-900 mt-2">{formatNumber(campaign.analytics.totalReach)}</div>
              <div className="text-sm text-gray-500 mt-1">{formatNumber(campaign.analytics.totalImpressions)} impressions</div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="text-sm text-gray-500">Total Engagement</div>
              <div className="text-3xl font-bold text-gray-900 mt-2">{formatNumber(campaign.analytics.totalLikes + campaign.analytics.totalComments + campaign.analytics.totalShares)}</div>
              <div className="text-sm text-gray-500 mt-1">{campaign.analytics.avgEngagementRate}% avg rate</div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="text-sm text-gray-500">Website Clicks</div>
              <div className="text-3xl font-bold text-gray-900 mt-2">{formatNumber(campaign.analytics.websiteClicks)}</div>
              <div className="text-sm text-gray-500 mt-1">{campaign.analytics.conversions} conversions</div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="text-sm text-gray-500">ROI</div>
              <div className="text-3xl font-bold text-green-600 mt-2">+{campaign.analytics.roiPercentage}%</div>
              <div className="text-sm text-gray-500 mt-1">{formatCurrency(campaign.analytics.costPerEngagement)}/eng</div>
            </div>
          </div>

          {/* Engagement Breakdown */}
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Engagement Breakdown</h3>
              <div className="space-y-4">
                {[
                  { label: 'Likes', value: campaign.analytics.totalLikes, color: 'bg-red-500' },
                  { label: 'Comments', value: campaign.analytics.totalComments, color: 'bg-blue-500' },
                  { label: 'Shares', value: campaign.analytics.totalShares, color: 'bg-green-500' },
                  { label: 'Saves', value: campaign.analytics.totalSaves, color: 'bg-purple-500' },
                ].map((metric) => {
                  const total = campaign.analytics.totalLikes + campaign.analytics.totalComments + campaign.analytics.totalShares + campaign.analytics.totalSaves;
                  const percentage = (metric.value / total) * 100;
                  return (
                    <div key={metric.label}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">{metric.label}</span>
                        <span className="font-medium text-gray-900">{formatNumber(metric.value)}</span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 rounded-full">
                        <div className={`h-full ${metric.color} rounded-full`} style={{ width: `${percentage}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Top Performers</h3>
              <div className="space-y-4">
                {campaign.collaborations
                  .filter(c => c.content.length > 0)
                  .sort((a, b) => {
                    const aEng = a.content.reduce((s, c) => s + c.likes + c.comments, 0);
                    const bEng = b.content.reduce((s, c) => s + c.likes + c.comments, 0);
                    return bEng - aEng;
                  })
                  .slice(0, 3)
                  .map((collab, idx) => {
                    const totalEng = collab.content.reduce((s, c) => s + c.likes + c.comments + c.shares, 0);
                    const totalReach = collab.content.reduce((s, c) => s + c.reach, 0);
                    return (
                      <div key={collab.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${idx === 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>
                            {idx + 1}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{collab.influencer.name}</div>
                            <div className="text-xs text-gray-500">{formatNumber(totalReach)} reach</div>
                          </div>
                        </div>
                        <div className="text-sm font-medium text-gray-900">{formatNumber(totalEng)} eng.</div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>

          {/* Budget Analysis */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Budget Analysis</h3>
            <div className="grid grid-cols-4 gap-6">
              <div>
                <div className="text-sm text-gray-500">Total Budget</div>
                <div className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(campaign.totalBudget)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Spent</div>
                <div className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(campaign.analytics.totalSpent)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Remaining</div>
                <div className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(campaign.totalBudget - campaign.analytics.totalSpent)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Est. Media Value</div>
                <div className="text-2xl font-bold text-green-600 mt-1">{formatCurrency(campaign.analytics.estimatedValue)}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Collaboration Detail Modal */}
      {selectedCollaboration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => { setSelectedCollaboration(null); setCollabEditForm(null); setHasCollabChanges(false); }}>
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-white font-medium text-lg">
                  {selectedCollaboration.influencer.avatar}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-gray-900">{selectedCollaboration.influencer.name}</h2>
                    <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-500">{selectedCollaboration.influencer.handle} • {formatNumber(selectedCollaboration.influencer.followers)} followers</p>
                </div>
              </div>
              <button onClick={() => { setSelectedCollaboration(null); setCollabEditForm(null); setHasCollabChanges(false); }} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500">✕</button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status & Rate */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium capitalize ${collabStatusColors[selectedCollaboration.status]}`}>
                    {selectedCollaboration.status.replace(/_/g, ' ')}
                  </span>
                  <select
                    value={selectedCollaboration.status}
                    onChange={(e) => {
                      const newStatus = e.target.value as CollaborationStatus;
                      handleUpdateCollaborationStatus(selectedCollaboration.id, newStatus);
                      setSelectedCollaboration({ ...selectedCollaboration, status: newStatus });
                    }}
                    className="text-xs px-2 py-1 border border-gray-200 rounded bg-white"
                  >
                    <option value="invited">Invited</option>
                    <option value="accepted">Accepted</option>
                    <option value="declined">Declined</option>
                    <option value="in_progress">In Progress</option>
                    <option value="content_submitted">Content Submitted</option>
                    <option value="approved">Approved</option>
                    <option value="published">Published</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">Agreed Rate</div>
                  <input
                    type="number"
                    value={collabEditForm?.agreedRate ?? selectedCollaboration.agreedRate}
                    onChange={(e) => {
                      if (!collabEditForm) initCollabEditForm(selectedCollaboration);
                      setCollabEditForm(prev => prev ? { ...prev, agreedRate: parseFloat(e.target.value) || 0 } : { agreedRate: parseFloat(e.target.value) || 0, deadline: selectedCollaboration.deadline, notes: selectedCollaboration.notes });
                      setHasCollabChanges(true);
                    }}
                    className="text-lg font-bold text-gray-900 w-32 text-right border-b border-transparent hover:border-gray-300 focus:border-gray-900 focus:outline-none"
                  />
                  <span className="text-sm text-gray-500 ml-1">MAD</span>
                </div>
              </div>

              {/* Timeline */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-500">Invited</div>
                  <div className="text-sm font-medium text-gray-900">{formatDate(selectedCollaboration.invitedAt)}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-500">Accepted</div>
                  <div className="text-sm font-medium text-gray-900">{selectedCollaboration.acceptedAt ? formatDate(selectedCollaboration.acceptedAt) : '-'}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-500">Deadline</div>
                  <input
                    type="date"
                    value={collabEditForm?.deadline ?? selectedCollaboration.deadline}
                    onChange={(e) => {
                      if (!collabEditForm) initCollabEditForm(selectedCollaboration);
                      setCollabEditForm(prev => prev ? { ...prev, deadline: e.target.value } : { agreedRate: selectedCollaboration.agreedRate, deadline: e.target.value, notes: selectedCollaboration.notes });
                      setHasCollabChanges(true);
                    }}
                    className="text-sm font-medium text-gray-900 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-gray-900 focus:outline-none"
                  />
                </div>
              </div>

              {/* Deliverables */}
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">Deliverables</div>
                <div className="flex flex-wrap gap-2">
                  {selectedCollaboration.deliverables.map((d, idx) => (
                    <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                      {d.quantity} {d.type}{d.quantity > 1 ? 's' : ''}
                    </span>
                  ))}
                </div>
              </div>

              {/* Content */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-gray-700">Content ({selectedCollaboration.content.length})</div>
                  {selectedCollaboration.status !== 'invited' && selectedCollaboration.status !== 'declined' && selectedCollaboration.status !== 'cancelled' && (
                    <button 
                      onClick={() => {
                        setSelectedCollabForContent(selectedCollaboration);
                        setShowAddContentModal(true);
                      }}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      + Add Content
                    </button>
                  )}
                </div>
                {selectedCollaboration.content.length > 0 ? (
                  <div className="space-y-2">
                    {selectedCollaboration.content.map((content) => (
                      <div key={content.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                            {content.type === 'script' ? '📝' : content.type === 'reel' ? '🎬' : content.type === 'story' ? '📱' : content.type === 'youtube' ? '▶️' : content.type === 'tiktok' ? '🎵' : '📷'}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900 capitalize">{content.type}</div>
                            <div className="text-xs text-gray-500">{content.caption.slice(0, 30)}{content.caption.length > 30 ? '...' : ''}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {content.status === 'published' && (
                            <div className="text-xs text-gray-500">
                              {formatNumber(content.likes)} likes • {formatNumber(content.views)} views
                            </div>
                          )}
                          <select
                            value={content.status}
                            onChange={(e) => {
                              const newStatus = e.target.value as ContentStatus;
                              handleUpdateContentStatus(selectedCollaboration.id, content.id, newStatus);
                              const updatedContent = selectedCollaboration.content.map(c => 
                                c.id === content.id ? { ...c, status: newStatus } : c
                              );
                              setSelectedCollaboration({ ...selectedCollaboration, content: updatedContent });
                            }}
                            className={`text-xs px-2 py-1 rounded font-medium border-0 ${contentStatusColors[content.status]}`}
                          >
                            <option value="draft">Draft</option>
                            <option value="submitted">Submitted</option>
                            <option value="revision_requested">Revision</option>
                            <option value="approved">Approved</option>
                            <option value="published">Published</option>
                            <option value="rejected">Rejected</option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-400 bg-gray-50 rounded-lg">
                    No content added yet
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">Notes</div>
                <textarea
                  value={collabEditForm?.notes ?? selectedCollaboration.notes}
                  onChange={(e) => {
                    if (!collabEditForm) initCollabEditForm(selectedCollaboration);
                    setCollabEditForm(prev => prev ? { ...prev, notes: e.target.value } : { agreedRate: selectedCollaboration.agreedRate, deadline: selectedCollaboration.deadline, notes: e.target.value });
                    setHasCollabChanges(true);
                  }}
                  placeholder="Add notes about this collaboration..."
                  rows={3}
                  className="w-full text-sm text-gray-600 bg-gray-50 rounded-lg p-3 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-between">
              <button 
                onClick={() => {
                  const profile = getInfluencerProfile(selectedCollaboration);
                  if (profile) setShowInfluencerProfileModal(profile);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                View Full Profile
              </button>
              <div className="flex gap-3">
                {hasCollabChanges && (
                  <button 
                    onClick={() => { setCollabEditForm(null); setHasCollabChanges(false); }}
                    className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700"
                  >
                    Discard Changes
                  </button>
                )}
                <button 
                  onClick={handleSaveCollaborationChanges}
                  disabled={!hasCollabChanges}
                  className={`px-4 py-2 text-sm font-medium rounded-lg ${hasCollabChanges ? 'text-white bg-black hover:bg-gray-800' : 'text-gray-400 bg-gray-200 cursor-not-allowed'}`}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Campaign Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowEditModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Edit Campaign</h2>
              <button onClick={() => setShowEditModal(false)} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500">✕</button>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Name</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Brand Name</label>
                  <input
                    type="text"
                    value={editForm.brandName}
                    onChange={(e) => setEditForm({ ...editForm, brandName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Type</label>
                  <select
                    value={editForm.campaignType}
                    onChange={(e) => setEditForm({ ...editForm, campaignType: e.target.value as CampaignType })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
                  >
                    <option value="awareness">Brand Awareness</option>
                    <option value="engagement">Engagement</option>
                    <option value="conversion">Conversion</option>
                    <option value="product_launch">Product Launch</option>
                    <option value="events">Events</option>
                    <option value="ugc">User Generated Content</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value as CampaignStatus })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Budget (MAD)</label>
                  <input
                    type="number"
                    value={editForm.totalBudget}
                    onChange={(e) => setEditForm({ ...editForm, totalBudget: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={editForm.startDate}
                    onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={editForm.endDate}
                    onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
              </div>

              {/* Description & Objective */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Objective</label>
                <textarea
                  value={editForm.objective}
                  onChange={(e) => setEditForm({ ...editForm, objective: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content Guidelines</label>
                <textarea
                  value={editForm.contentGuidelines}
                  onChange={(e) => setEditForm({ ...editForm, contentGuidelines: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>

              {/* Tags */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hashtags (comma separated)</label>
                  <input
                    type="text"
                    value={editForm.hashtags}
                    onChange={(e) => setEditForm({ ...editForm, hashtags: e.target.value })}
                    placeholder="#hashtag1, #hashtag2"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mentions (comma separated)</label>
                  <input
                    type="text"
                    value={editForm.mentions}
                    onChange={(e) => setEditForm({ ...editForm, mentions: e.target.value })}
                    placeholder="@mention1, @mention2"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
              </div>

              {/* Target Audience */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Target Audience</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Age Range</label>
                    <input
                      type="text"
                      value={editForm.ageRange}
                      onChange={(e) => setEditForm({ ...editForm, ageRange: e.target.value })}
                      placeholder="18-35"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Gender</label>
                    <select
                      value={editForm.gender}
                      onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
                    >
                      <option value="All">All</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Interests (comma separated)</label>
                    <input
                      type="text"
                      value={editForm.interests}
                      onChange={(e) => setEditForm({ ...editForm, interests: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Locations (comma separated)</label>
                    <input
                      type="text"
                      value={editForm.locations}
                      onChange={(e) => setEditForm({ ...editForm, locations: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button 
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveEdit}
                className="px-4 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Influencer Modal */}
      {showAddInfluencerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowAddInfluencerModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Add Influencer to Campaign</h2>
              <button onClick={() => setShowAddInfluencerModal(false)} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500">✕</button>
            </div>

            <div className="p-6">
              {!selectedInfluencer ? (
                <>
                  {/* Search */}
                  <div className="mb-4">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search influencers by name, handle, or category..."
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                    />
                  </div>

                  {/* Influencer List */}
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {filteredInfluencers.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">No influencers found</div>
                    ) : (
                      filteredInfluencers.map((inf) => (
                        <div
                          key={inf.id}
                          onClick={() => setSelectedInfluencer(inf)}
                          className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-400 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-medium">
                              {inf.name.charAt(0)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900">{inf.name}</span>
                                {inf.isVerified && (
                                  <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </div>
                              <div className="text-sm text-gray-500">{inf.handle}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-900">{formatNumber(inf.followers)} followers</div>
                            <div className="text-xs text-gray-500">{inf.engagementRate}% eng. • {inf.category}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </>
              ) : (
                <>
                  {/* Selected Influencer */}
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg mb-6">
                    <div className="w-14 h-14 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-medium text-lg">
                      {selectedInfluencer.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">{selectedInfluencer.name}</span>
                        {selectedInfluencer.isVerified && (
                          <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">{selectedInfluencer.handle} • {formatNumber(selectedInfluencer.followers)} followers • {selectedInfluencer.engagementRate}% eng.</div>
                    </div>
                    <button
                      onClick={() => setSelectedInfluencer(null)}
                      className="text-sm text-gray-500 hover:text-gray-700"
                    >
                      Change
                    </button>
                  </div>

                  {/* Collaboration Details Form */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Agreed Rate (MAD)</label>
                        <input
                          type="number"
                          value={inviteForm.agreedRate}
                          onChange={(e) => setInviteForm({ ...inviteForm, agreedRate: e.target.value })}
                          placeholder="5000"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
                        <input
                          type="date"
                          value={inviteForm.deadline}
                          onChange={(e) => setInviteForm({ ...inviteForm, deadline: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Deliverables</label>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Posts</label>
                          <input
                            type="number"
                            min="0"
                            value={inviteForm.posts}
                            onChange={(e) => setInviteForm({ ...inviteForm, posts: parseInt(e.target.value) || 0 })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Stories</label>
                          <input
                            type="number"
                            min="0"
                            value={inviteForm.stories}
                            onChange={(e) => setInviteForm({ ...inviteForm, stories: parseInt(e.target.value) || 0 })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Reels</label>
                          <input
                            type="number"
                            min="0"
                            value={inviteForm.reels}
                            onChange={(e) => setInviteForm({ ...inviteForm, reels: parseInt(e.target.value) || 0 })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                      <textarea
                        value={inviteForm.notes}
                        onChange={(e) => setInviteForm({ ...inviteForm, notes: e.target.value })}
                        rows={2}
                        placeholder="Any special instructions or notes..."
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button 
                onClick={() => {
                  setShowAddInfluencerModal(false);
                  setSelectedInfluencer(null);
                  setSearchQuery('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              {selectedInfluencer && (
                <button 
                  onClick={handleAddInfluencer}
                  disabled={!inviteForm.agreedRate || !inviteForm.deadline || (inviteForm.posts + inviteForm.stories + inviteForm.reels === 0)}
                  className="px-4 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send Invitation
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Content Modal */}
      {showAddContentModal && selectedCollabForContent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => { setShowAddContentModal(false); setSelectedCollabForContent(null); }}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Add Content</h2>
                <p className="text-sm text-gray-500">for {selectedCollabForContent.influencer.name}</p>
              </div>
              <button onClick={() => { setShowAddContentModal(false); setSelectedCollabForContent(null); }} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500">✕</button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Content Type</label>
                  <select
                    value={contentForm.type}
                    onChange={(e) => setContentForm({ ...contentForm, type: e.target.value as ContentType })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
                  >
                    <option value="script">📝 Script</option>
                    <option value="post">📷 Post</option>
                    <option value="story">📱 Story</option>
                    <option value="reel">🎬 Reel</option>
                    <option value="igtv">📺 IGTV</option>
                    <option value="youtube">▶️ YouTube</option>
                    <option value="tiktok">🎵 TikTok</option>
                    <option value="live">🔴 Live</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={contentForm.status}
                    onChange={(e) => setContentForm({ ...contentForm, status: e.target.value as ContentStatus })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
                  >
                    <option value="draft">Draft</option>
                    <option value="submitted">Submitted</option>
                    <option value="revision_requested">Revision Requested</option>
                    <option value="approved">Approved</option>
                    <option value="published">Published</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {contentForm.type === 'script' ? 'Script Content' : 'Caption / Description'}
                </label>
                <textarea
                  value={contentForm.caption}
                  onChange={(e) => setContentForm({ ...contentForm, caption: e.target.value })}
                  rows={contentForm.type === 'script' ? 6 : 3}
                  placeholder={contentForm.type === 'script' ? 'Paste the script content here...' : 'Content caption or description...'}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {contentForm.type === 'script' ? 'Reference Document URL (optional)' : 'Media URL (optional)'}
                </label>
                <input
                  type="url"
                  value={contentForm.mediaUrl}
                  onChange={(e) => setContentForm({ ...contentForm, mediaUrl: e.target.value })}
                  placeholder="https://instagram.com/p/..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>

              {contentForm.status === 'published' && (
                <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                  <h4 className="text-sm font-medium text-gray-700">Performance Metrics</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Likes</label>
                      <input type="number" value={metricsForm.likes} onChange={(e) => setMetricsForm({ ...metricsForm, likes: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Comments</label>
                      <input type="number" value={metricsForm.comments} onChange={(e) => setMetricsForm({ ...metricsForm, comments: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Shares</label>
                      <input type="number" value={metricsForm.shares} onChange={(e) => setMetricsForm({ ...metricsForm, shares: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Views</label>
                      <input type="number" value={metricsForm.views} onChange={(e) => setMetricsForm({ ...metricsForm, views: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Reach</label>
                      <input type="number" value={metricsForm.reach} onChange={(e) => setMetricsForm({ ...metricsForm, reach: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => { setShowAddContentModal(false); setSelectedCollabForContent(null); setContentForm({ type: 'post', caption: '', mediaUrl: '', status: 'draft' }); }} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleAddContent} disabled={!contentForm.caption} className="px-4 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 disabled:opacity-50">Add Content</button>
            </div>
          </div>
        </div>
      )}

      {/* Content Detail / Status Management Modal */}
      {showContentDetailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowContentDetailModal(null)}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Content Details</h2>
                <p className="text-sm text-gray-500">by {showContentDetailModal.influencer.name}</p>
              </div>
              <button onClick={() => setShowContentDetailModal(null)} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500">✕</button>
            </div>

            <div className="p-6 space-y-4">
              {/* Content Preview */}
              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center text-2xl flex-shrink-0">
                  {showContentDetailModal.type === 'reel' ? '🎬' : showContentDetailModal.type === 'story' ? '📱' : '📷'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 mb-1 capitalize">{showContentDetailModal.type}</div>
                  <p className="text-sm text-gray-600">{showContentDetailModal.caption}</p>
                </div>
              </div>

              {/* Current Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Current Status</label>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium capitalize ${contentStatusColors[showContentDetailModal.status]}`}>
                  {showContentDetailModal.status.replace(/_/g, ' ')}
                </span>
              </div>

              {/* Status Actions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Change Status</label>
                <div className="grid grid-cols-2 gap-2">
                  {showContentDetailModal.status === 'draft' && (
                    <button 
                      onClick={() => {
                        const collab = campaign.collaborations.find(c => c.content.some(ct => ct.id === showContentDetailModal.id));
                        if (collab) handleUpdateContentStatus(collab.id, showContentDetailModal.id, 'submitted');
                        setShowContentDetailModal({ ...showContentDetailModal, status: 'submitted' });
                      }}
                      className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100"
                    >
                      Mark as Submitted
                    </button>
                  )}
                  {showContentDetailModal.status === 'submitted' && (
                    <>
                      <button 
                        onClick={() => {
                          const collab = campaign.collaborations.find(c => c.content.some(ct => ct.id === showContentDetailModal.id));
                          if (collab) handleUpdateContentStatus(collab.id, showContentDetailModal.id, 'approved');
                          setShowContentDetailModal({ ...showContentDetailModal, status: 'approved' });
                        }}
                        className="px-4 py-2 text-sm font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100"
                      >
                        ✓ Approve
                      </button>
                      <button 
                        onClick={() => {
                          const collab = campaign.collaborations.find(c => c.content.some(ct => ct.id === showContentDetailModal.id));
                          if (collab) handleUpdateContentStatus(collab.id, showContentDetailModal.id, 'revision_requested');
                          setShowContentDetailModal({ ...showContentDetailModal, status: 'revision_requested' });
                        }}
                        className="px-4 py-2 text-sm font-medium text-yellow-700 bg-yellow-50 rounded-lg hover:bg-yellow-100"
                      >
                        Request Revision
                      </button>
                      <button 
                        onClick={() => {
                          const collab = campaign.collaborations.find(c => c.content.some(ct => ct.id === showContentDetailModal.id));
                          if (collab) handleUpdateContentStatus(collab.id, showContentDetailModal.id, 'rejected');
                          setShowContentDetailModal({ ...showContentDetailModal, status: 'rejected' });
                        }}
                        className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100"
                      >
                        ✗ Reject
                      </button>
                    </>
                  )}
                  {showContentDetailModal.status === 'revision_requested' && (
                    <button 
                      onClick={() => {
                        const collab = campaign.collaborations.find(c => c.content.some(ct => ct.id === showContentDetailModal.id));
                        if (collab) handleUpdateContentStatus(collab.id, showContentDetailModal.id, 'submitted');
                        setShowContentDetailModal({ ...showContentDetailModal, status: 'submitted' });
                      }}
                      className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100"
                    >
                      Mark as Re-submitted
                    </button>
                  )}
                  {showContentDetailModal.status === 'approved' && (
                    <button 
                      onClick={() => {
                        const collab = campaign.collaborations.find(c => c.content.some(ct => ct.id === showContentDetailModal.id));
                        if (collab) handleUpdateContentStatus(collab.id, showContentDetailModal.id, 'published');
                        setShowContentDetailModal({ ...showContentDetailModal, status: 'published', publishedAt: new Date().toISOString().split('T')[0] });
                      }}
                      className="px-4 py-2 text-sm font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100"
                    >
                      🚀 Mark as Published
                    </button>
                  )}
                </div>
              </div>

              {/* Metrics (for published content) */}
              {showContentDetailModal.status === 'published' && (
                <div className="p-4 bg-green-50 rounded-lg space-y-3">
                  <h4 className="text-sm font-medium text-green-800">Performance Metrics</h4>
                  <div className="grid grid-cols-5 gap-3 text-center">
                    <div>
                      <div className="text-lg font-bold text-gray-900">{formatNumber(showContentDetailModal.likes)}</div>
                      <div className="text-xs text-gray-500">Likes</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-gray-900">{formatNumber(showContentDetailModal.comments)}</div>
                      <div className="text-xs text-gray-500">Comments</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-gray-900">{formatNumber(showContentDetailModal.shares)}</div>
                      <div className="text-xs text-gray-500">Shares</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-gray-900">{formatNumber(showContentDetailModal.views)}</div>
                      <div className="text-xs text-gray-500">Views</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-gray-900">{formatNumber(showContentDetailModal.reach)}</div>
                      <div className="text-xs text-gray-500">Reach</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Timeline */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Timeline</label>
                <div className="space-y-2 text-sm">
                  {showContentDetailModal.submittedAt && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      Submitted: {formatDate(showContentDetailModal.submittedAt)}
                    </div>
                  )}
                  {showContentDetailModal.publishedAt && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      Published: {formatDate(showContentDetailModal.publishedAt)}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button onClick={() => setShowContentDetailModal(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Influencer Profile Modal (3-Tab Card like Discovery) */}
      {showInfluencerProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => { setShowInfluencerProfileModal(null); setProfileSlide(0); }}>
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            
            {/* Overview Slide */}
            {profileSlide === 0 && (
              <>
                <div className="relative h-48 bg-gradient-to-br from-gray-700 to-gray-900">
                  <button onClick={() => { setShowInfluencerProfileModal(null); setProfileSlide(0); }} className="absolute top-4 right-4 w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white">✕</button>
                  <div className="absolute -bottom-12 left-6">
                    <div className="w-24 h-24 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full border-4 border-white flex items-center justify-center text-3xl font-bold text-white">{showInfluencerProfileModal.name.charAt(0)}</div>
                  </div>
                </div>
                <div className="pt-14 px-6 pb-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-gray-900">{showInfluencerProfileModal.name}</h2>
                        {showInfluencerProfileModal.isVerified && <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>}
                      </div>
                      <p className="text-gray-500">{showInfluencerProfileModal.handle}</p>
                    </div>
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-full">{showInfluencerProfileModal.category}</span>
                  </div>
                  <p className="mt-3 text-gray-600 text-sm">{showInfluencerProfileModal.bio}</p>
                  <div className="grid grid-cols-4 gap-3 mt-6 py-4 border-t border-gray-100">
                    <div className="text-center"><div className="text-lg font-bold text-gray-900">{formatNumber(showInfluencerProfileModal.followers)}</div><div className="text-xs text-gray-500">Followers</div></div>
                    <div className="text-center"><div className="text-lg font-bold text-gray-900">{showInfluencerProfileModal.engagementRate}%</div><div className="text-xs text-gray-500">Engagement</div></div>
                    <div className="text-center"><div className="text-lg font-bold text-gray-900">{formatNumber(showInfluencerProfileModal.avgViews)}</div><div className="text-xs text-gray-500">Avg Views</div></div>
                    <div className="text-center"><div className="text-lg font-bold text-gray-900">{formatNumber(showInfluencerProfileModal.avgLikes)}</div><div className="text-xs text-gray-500">Avg Likes</div></div>
                  </div>
                  <div className="grid grid-cols-4 gap-3 py-4 border-t border-gray-100">
                    <div className="text-center"><div className="text-lg font-bold text-gray-900">{formatNumber(showInfluencerProfileModal.avgComments)}</div><div className="text-xs text-gray-500">Avg Comments</div></div>
                    <div className="text-center"><div className="text-lg font-bold text-gray-900">{showInfluencerProfileModal.totalPosts}</div><div className="text-xs text-gray-500">Total Posts</div></div>
                    <div className="text-center"><div className="text-lg font-bold text-gray-900">{showInfluencerProfileModal.postsLast14d}</div><div className="text-xs text-gray-500">Posts (14d)</div></div>
                    <div className="text-center"><div className="text-lg font-bold text-green-600">+{formatNumber(showInfluencerProfileModal.followersGained14d)}</div><div className="text-xs text-gray-500">Gained (14d)</div></div>
                  </div>
                  <div className="space-y-3 mt-4 pt-4 border-t border-gray-100">
                    <div className="flex justify-between text-sm"><span className="text-gray-500">Email</span><span className="text-gray-900">{showInfluencerProfileModal.email}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-gray-500">Languages</span><span className="text-gray-900">{showInfluencerProfileModal.languages.join(', ')}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-gray-500">Tier</span><span className="text-gray-900 capitalize">{showInfluencerProfileModal.tier}</span></div>
                  </div>
                </div>
              </>
            )}

            {/* Content Slide */}
            {profileSlide === 1 && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Content</h3>
                  <button onClick={() => { setShowInfluencerProfileModal(null); setProfileSlide(0); }} className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-gray-500">✕</button>
                </div>
                <div className="space-y-6 max-h-[400px] overflow-y-auto">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Top Performing Posts</h4>
                    <div className="grid grid-cols-3 gap-3">
                      {showInfluencerProfileModal.topPosts.map((post, idx) => (
                        <div key={idx} className="group cursor-pointer">
                          <div className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center text-3xl relative overflow-hidden">
                            📷
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <div className="text-white text-center">
                                <div className="text-sm font-bold">{formatNumber(post.views)}</div>
                                <div className="text-xs">views</div>
                              </div>
                            </div>
                          </div>
                          <div className="mt-1 text-xs text-gray-500 text-center">{formatNumber(post.views)} views</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Latest Posts</h4>
                    <div className="grid grid-cols-3 gap-3">
                      {showInfluencerProfileModal.lastPosts.map((post, idx) => (
                        <div key={idx} className="group cursor-pointer">
                          <div className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center text-3xl relative overflow-hidden">
                            📷
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <div className="text-white text-center">
                                <div className="text-sm font-bold">{formatNumber(post.views)}</div>
                                <div className="text-xs">views</div>
                              </div>
                            </div>
                          </div>
                          <div className="mt-1 text-xs text-gray-500 text-center">{formatNumber(post.views)} views</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Brands Slide */}
            {profileSlide === 2 && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Brand Collaborations</h3>
                  <button onClick={() => { setShowInfluencerProfileModal(null); setProfileSlide(0); }} className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-gray-500">✕</button>
                </div>
                <div className="space-y-4 max-h-[400px] overflow-y-auto">
                  {showInfluencerProfileModal.brandCollabs.map((collab, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-sm font-bold text-gray-600">{collab.name.charAt(0)}</div>
                        <div>
                          <div className="font-medium text-gray-900">{collab.name}</div>
                          <div className="text-xs text-gray-500">{collab.videos.length} video{collab.videos.length > 1 ? 's' : ''}</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {collab.videos.map((video, vIdx) => (
                          <div key={vIdx} className="group cursor-pointer">
                            <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center text-xl relative overflow-hidden">
                              🎬
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <div className="text-white text-center text-xs">
                                  <div className="font-bold">{formatNumber(video.views)}</div>
                                </div>
                              </div>
                            </div>
                            <div className="mt-1 text-xs text-gray-500 text-center">{formatNumber(video.views)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  {showInfluencerProfileModal.brandCollabs.length === 0 && (
                    <div className="text-center text-gray-500 py-8">No brand collaborations yet</div>
                  )}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <a 
                    href={`https://instagram.com/${showInfluencerProfileModal.handle.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg hover:from-pink-600 hover:to-purple-700"
                  >
                    View on Instagram
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  {['Overview', 'Content', 'Brands'].map((label, idx) => (
                    <button key={idx} onClick={() => setProfileSlide(idx)} className={`text-xs font-medium px-2 py-1 rounded ${profileSlide === idx ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-700'}`}>{label}</button>
                  ))}
                </div>
                <div className="flex gap-2">
                  {profileSlide < 2 ? (
                    <button onClick={() => setProfileSlide(profileSlide + 1)} className="px-4 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800">Next ›</button>
                  ) : (
                    <button onClick={() => { setShowInfluencerProfileModal(null); setProfileSlide(0); }} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">Close</button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}