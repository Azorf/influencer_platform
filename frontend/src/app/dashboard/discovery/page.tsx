'use client';

import { useState, useEffect, useMemo } from 'react';
import { influencerService } from '@/lib/api';
import type { Influencer } from '@/types';

type InfluencerTier = 'nano' | 'micro' | 'mid' | 'macro' | 'mega';

interface BrandCollab {
  name: string;
  videos: { views: number; likes: number }[];
}

// Extended type for display purposes
interface DisplayInfluencer extends Influencer {
  handle: string;
  followers: number;
  followersGained14d: number;
  avgViews: number;
  avgLikes: number;
  avgComments: number;
  engagementRate: number;
  tier: InfluencerTier;
  totalPosts: number;
  postsLast14d: number;
  brandCollabs: BrandCollab[];
  languages: string[];
  lastPosts: { views: number; likes: number }[];
  topPosts: { views: number; likes: number }[];
}

const categories = ['All', 'Lifestyle', 'Beauty', 'Fashion', 'Technology', 'Fitness', 'Food', 'Travel', 'Gaming'];
const tiers = ['All', 'Nano (1K-10K)', 'Micro (10K-50K)', 'Mid (50K-500K)', 'Macro (500K-1M)', 'Mega (1M+)'];

const sortFields = [
  { field: 'followers', label: 'Followers' },
  { field: 'engagement', label: 'Engagement' },
  { field: 'avgViews', label: 'Avg Views' },
  { field: 'avgLikes', label: 'Avg Likes' },
  { field: 'avgComments', label: 'Avg Comments' },
  { field: 'postsLast14d', label: 'Posts (14d)' },
  { field: 'followersGained14d', label: 'Gained (14d)' },
  { field: 'totalPosts', label: 'Total Posts' },
];

interface SortCriteria {
  field: string;
  direction: 'asc' | 'desc';
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

function getTierFromFollowers(followers: number): InfluencerTier {
  if (followers >= 1000000) return 'mega';
  if (followers >= 500000) return 'macro';
  if (followers >= 50000) return 'mid';
  if (followers >= 10000) return 'micro';
  return 'nano';
}

function getTierFromString(tierStr: string): InfluencerTier | null {
  if (tierStr.includes('Nano')) return 'nano';
  if (tierStr.includes('Micro')) return 'micro';
  if (tierStr.includes('Mid')) return 'mid';
  if (tierStr.includes('Macro')) return 'macro';
  if (tierStr.includes('Mega')) return 'mega';
  return null;
}

// Transform API influencer to display influencer
function transformToDisplay(influencer: Influencer): DisplayInfluencer {
  const followers = influencer.followerCount || 0;
  const engagement = influencer.engagementRate || 0;
  
  return {
    ...influencer,
    handle: `@${influencer.username}`,
    followers: followers,
    followersGained14d: influencer.analytics?.followersGained14d || Math.floor(followers * 0.02),
    avgViews: influencer.analytics?.avgViews || Math.floor(followers * 0.35),
    avgLikes: influencer.analytics?.avgLikes || Math.floor(followers * 0.03),
    avgComments: influencer.analytics?.avgComments || Math.floor(followers * 0.005),
    engagementRate: engagement,
    tier: getTierFromFollowers(followers),
    totalPosts: influencer.analytics?.totalPosts || influencer.mediaCount || 0,
    postsLast14d: influencer.analytics?.postsLast14d || Math.floor(Math.random() * 10) + 1,
    brandCollabs: influencer.analytics?.brandCollabs || [],
    languages: influencer.languages || ['Arabic'],
    lastPosts: influencer.analytics?.lastPosts || [],
    topPosts: influencer.analytics?.topPosts || [],
  };
}

function ProfileCard({ influencer, onClose, onPrevious, onNext, hasPrevious, hasNext }: { 
  influencer: DisplayInfluencer; onClose: () => void; onPrevious: () => void; onNext: () => void; hasPrevious: boolean; hasNext: boolean;
}) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const totalSlides = 3;

  const goToSlide = (index: number) => {
    if (index >= 0 && index < totalSlides) setCurrentSlide(index);
  };

  const handlePrevious = () => {
    setCurrentSlide(0);
    onPrevious();
  };

  const handleNext = () => {
    setCurrentSlide(0);
    onNext();
  };

  const slideLabels = ['Overview', 'Content', 'Brands'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
        
        {currentSlide === 0 && (
          <>
            <div className="relative h-48 bg-gradient-to-br from-gray-700 to-gray-900">
              <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white">✕</button>
              <div className="absolute -bottom-12 left-6">
                {influencer.profilePictureUrl ? (
                  <img src={influencer.profilePictureUrl} alt={influencer.fullName} className="w-24 h-24 rounded-full border-4 border-white object-cover" />
                ) : (
                  <div className="w-24 h-24 bg-gray-300 rounded-full border-4 border-white flex items-center justify-center text-3xl font-bold text-gray-600">{influencer.fullName.charAt(0)}</div>
                )}
              </div>
            </div>
            <div className="pt-14 px-6 pb-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-gray-900">{influencer.fullName}</h2>
                    {influencer.isVerified && <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>}
                  </div>
                  <p className="text-gray-500">{influencer.handle}</p>
                </div>
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-full">{influencer.category || 'General'}</span>
              </div>
              <p className="mt-3 text-gray-600 text-sm">{influencer.bio || 'No bio available'}</p>
              <div className="grid grid-cols-4 gap-3 mt-6 py-4 border-t border-gray-100">
                <div className="text-center"><div className="text-lg font-bold text-gray-900">{formatNumber(influencer.followers)}</div><div className="text-xs text-gray-500">Followers</div></div>
                <div className="text-center"><div className="text-lg font-bold text-gray-900">{influencer.engagementRate.toFixed(1)}%</div><div className="text-xs text-gray-500">Engagement</div></div>
                <div className="text-center"><div className="text-lg font-bold text-gray-900">{formatNumber(influencer.avgViews)}</div><div className="text-xs text-gray-500">Avg Views</div></div>
                <div className="text-center"><div className="text-lg font-bold text-gray-900">{formatNumber(influencer.avgLikes)}</div><div className="text-xs text-gray-500">Avg Likes</div></div>
              </div>
              <div className="grid grid-cols-4 gap-3 py-4 border-t border-gray-100">
                <div className="text-center"><div className="text-lg font-bold text-gray-900">{formatNumber(influencer.avgComments)}</div><div className="text-xs text-gray-500">Avg Comments</div></div>
                <div className="text-center"><div className="text-lg font-bold text-gray-900">{influencer.totalPosts}</div><div className="text-xs text-gray-500">Total Posts</div></div>
                <div className="text-center"><div className="text-lg font-bold text-gray-900">{influencer.postsLast14d}</div><div className="text-xs text-gray-500">Posts (14d)</div></div>
                <div className="text-center"><div className="text-lg font-bold text-green-600">+{formatNumber(influencer.followersGained14d)}</div><div className="text-xs text-gray-500">Gained (14d)</div></div>
              </div>
              <div className="space-y-3 mt-4 pt-4 border-t border-gray-100">
                <div className="flex justify-between text-sm"><span className="text-gray-500">Email</span><span className="text-gray-900">{influencer.email || '-'}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">Languages</span><span className="text-gray-900">{influencer.languages.join(', ')}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">Tier</span><span className="text-gray-900 capitalize">{influencer.tier}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">Location</span><span className="text-gray-900">{influencer.location || influencer.city || '-'}</span></div>
              </div>
            </div>
          </>
        )}

        {currentSlide === 1 && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Content</h3>
              <button onClick={onClose} className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-gray-500">✕</button>
            </div>
            <div className="space-y-6 max-h-[400px] overflow-y-auto">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Top Performing Posts</h4>
                <div className="grid grid-cols-3 gap-3">
                  {(influencer.topPosts.length > 0 ? influencer.topPosts : [{ views: influencer.avgViews * 2, likes: influencer.avgLikes * 2 }, { views: influencer.avgViews * 1.5, likes: influencer.avgLikes * 1.5 }, { views: influencer.avgViews * 1.3, likes: influencer.avgLikes * 1.3 }]).map((post, idx) => (
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
                  {(influencer.lastPosts.length > 0 ? influencer.lastPosts : [{ views: influencer.avgViews, likes: influencer.avgLikes }, { views: influencer.avgViews * 0.9, likes: influencer.avgLikes * 0.9 }, { views: influencer.avgViews * 0.95, likes: influencer.avgLikes * 0.95 }]).map((post, idx) => (
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

        {currentSlide === 2 && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Brand Collaborations</h3>
              <button onClick={onClose} className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-gray-500">✕</button>
            </div>
            <div className="space-y-4 max-h-[400px] overflow-y-auto">
              {influencer.brandCollabs.map((collab, idx) => (
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
              {influencer.brandCollabs.length === 0 && (
                <div className="text-center text-gray-500 py-8">No brand collaborations data available</div>
              )}
            </div>
          </div>
        )}

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <button onClick={handlePrevious} disabled={!hasPrevious} className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 disabled:opacity-50">←</button>
              <button onClick={handleNext} disabled={!hasNext} className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 disabled:opacity-50">→</button>
            </div>
            <div className="flex items-center gap-3">
              {slideLabels.map((label, idx) => (
                <button key={idx} onClick={() => goToSlide(idx)} className={`text-xs font-medium px-2 py-1 rounded ${currentSlide === idx ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-700'}`}>{label}</button>
              ))}
            </div>
            <div className="flex gap-2">
              <a 
                href={`https://instagram.com/${influencer.username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg hover:from-pink-600 hover:to-purple-700"
              >
                View on Instagram
              </a>
              {currentSlide < totalSlides - 1 ? (
                <button onClick={() => goToSlide(currentSlide + 1)} className="px-4 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800">Next ›</button>
              ) : (
                <button className="px-4 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800">Add to Campaign</button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SortButton({ sortCriteria, onChange }: { sortCriteria: SortCriteria[]; onChange: (criteria: SortCriteria[]) => void }) {
  const [isOpen, setIsOpen] = useState(false);

  const getFieldDirection = (field: string): 'asc' | 'desc' | null => {
    const criteria = sortCriteria.find(c => c.field === field);
    return criteria ? criteria.direction : null;
  };

  const toggleSort = (field: string, direction: 'asc' | 'desc') => {
    const existingIndex = sortCriteria.findIndex(c => c.field === field);
    
    if (existingIndex >= 0) {
      if (sortCriteria[existingIndex].direction === direction) {
        onChange(sortCriteria.filter((_, i) => i !== existingIndex));
      } else {
        const newCriteria = [...sortCriteria];
        newCriteria[existingIndex] = { field, direction };
        onChange(newCriteria);
      }
    } else {
      onChange([...sortCriteria, { field, direction }]);
    }
  };

  const clearAll = () => {
    onChange([]);
    setIsOpen(false);
  };

  const getSortOrder = (field: string): number | null => {
    const index = sortCriteria.findIndex(c => c.field === field);
    return index >= 0 ? index + 1 : null;
  };

  return (
    <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" /></svg>
        Sort
        {sortCriteria.length > 0 && (
          <span className="ml-1 px-1.5 py-0.5 text-xs bg-gray-900 text-white rounded-full">{sortCriteria.length}</span>
        )}
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg border border-gray-200 shadow-lg z-20 py-2">
            <div className="px-3 pb-2 mb-2 border-b border-gray-100 flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500 uppercase">Sort by (multi-select)</span>
              {sortCriteria.length > 0 && (
                <button onClick={clearAll} className="text-xs text-red-600 hover:text-red-700">Clear all</button>
              )}
            </div>
            {sortFields.map((sortField) => {
              const currentDirection = getFieldDirection(sortField.field);
              const order = getSortOrder(sortField.field);
              return (
                <div key={sortField.field} className="px-3 py-1.5 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center gap-2">
                    {order && (
                      <span className="w-5 h-5 flex items-center justify-center text-xs bg-gray-900 text-white rounded-full">{order}</span>
                    )}
                    <span className={`text-sm ${currentDirection ? 'text-gray-900 font-medium' : 'text-gray-700'}`}>{sortField.label}</span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => toggleSort(sortField.field, 'desc')}
                      className={`px-2 py-1 text-xs rounded ${currentDirection === 'desc' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                      ↓ High
                    </button>
                    <button
                      onClick={() => toggleSort(sortField.field, 'asc')}
                      className={`px-2 py-1 text-xs rounded ${currentDirection === 'asc' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                      ↑ Low
                    </button>
                  </div>
                </div>
              );
            })}
            {sortCriteria.length > 0 && (
              <div className="px-3 pt-2 mt-2 border-t border-gray-100">
                <div className="text-xs text-gray-500">
                  Order: {sortCriteria.map((c, i) => {
                    const label = sortFields.find(f => f.field === c.field)?.label;
                    return <span key={c.field}>{i > 0 && ' → '}{label} ({c.direction === 'desc' ? '↓' : '↑'})</span>;
                  })}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function DiscoveryPage() {
  // Data state
  const [influencers, setInfluencers] = useState<DisplayInfluencer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPrevPage, setHasPrevPage] = useState(false);

  // Filter state
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedTier, setSelectedTier] = useState('All');
  const [minFollowers, setMinFollowers] = useState('');
  const [maxFollowers, setMaxFollowers] = useState('');
  const [minEngagement, setMinEngagement] = useState('');
  const [minAvgLikes, setMinAvgLikes] = useState('');
  const [minAvgViews, setMinAvgViews] = useState('');
  const [minAvgComments, setMinAvgComments] = useState('');
  const [minPostsLast14d, setMinPostsLast14d] = useState('');
  const [minFollowersGained14d, setMinFollowersGained14d] = useState('');
  const [minTotalPosts, setMinTotalPosts] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // UI state
  const [selectedInfluencers, setSelectedInfluencers] = useState<number[]>([]);
  const [sortCriteria, setSortCriteria] = useState<SortCriteria[]>([{ field: 'followers', direction: 'desc' }]);
  const [selectedProfileId, setSelectedProfileId] = useState<number | null>(null);

  // Fetch influencers from API
  useEffect(() => {
    fetchInfluencers();
  }, [currentPage, selectedCategory, minFollowers, maxFollowers, searchQuery]);

  async function fetchInfluencers() {
    try {
      setLoading(true);
      setError(null);

      const params: Parameters<typeof influencerService.getInfluencers>[0] = {
        page: currentPage,
        search: searchQuery || undefined,
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
        minFollowers: minFollowers ? parseInt(minFollowers) : undefined,
        maxFollowers: maxFollowers ? parseInt(maxFollowers) : undefined,
      };

      const response = await influencerService.getInfluencers(params);
      
      const displayInfluencers = response.results.map(transformToDisplay);
      setInfluencers(displayInfluencers);
      setTotalCount(response.count);
      setHasNextPage(!!response.next);
      setHasPrevPage(!!response.previous);
    } catch (err) {
      console.error('Failed to fetch influencers:', err);
      setError('Failed to load influencers');
    } finally {
      setLoading(false);
    }
  }

  // Active filters for display
  const activeFilters: { key: string; label: string; onRemove: () => void }[] = [];
  if (selectedCategory !== 'All') activeFilters.push({ key: 'category', label: `Category: ${selectedCategory}`, onRemove: () => setSelectedCategory('All') });
  if (selectedTier !== 'All') activeFilters.push({ key: 'tier', label: selectedTier, onRemove: () => setSelectedTier('All') });
  if (minFollowers) activeFilters.push({ key: 'minFollowers', label: `Followers: ${formatNumber(parseInt(minFollowers))}+`, onRemove: () => setMinFollowers('') });
  if (maxFollowers) activeFilters.push({ key: 'maxFollowers', label: `Followers: <${formatNumber(parseInt(maxFollowers))}`, onRemove: () => setMaxFollowers('') });
  if (minEngagement) activeFilters.push({ key: 'minEngagement', label: `Eng: ${minEngagement}%+`, onRemove: () => setMinEngagement('') });
  if (minAvgLikes) activeFilters.push({ key: 'minAvgLikes', label: `Avg Likes: ${formatNumber(parseInt(minAvgLikes))}+`, onRemove: () => setMinAvgLikes('') });
  if (minAvgViews) activeFilters.push({ key: 'minAvgViews', label: `Avg Views: ${formatNumber(parseInt(minAvgViews))}+`, onRemove: () => setMinAvgViews('') });
  if (minAvgComments) activeFilters.push({ key: 'minAvgComments', label: `Avg Comments: ${formatNumber(parseInt(minAvgComments))}+`, onRemove: () => setMinAvgComments('') });
  if (minPostsLast14d) activeFilters.push({ key: 'minPostsLast14d', label: `Posts (14d): ${minPostsLast14d}+`, onRemove: () => setMinPostsLast14d('') });
  if (minFollowersGained14d) activeFilters.push({ key: 'minFollowersGained14d', label: `Gained (14d): ${formatNumber(parseInt(minFollowersGained14d))}+`, onRemove: () => setMinFollowersGained14d('') });
  if (minTotalPosts) activeFilters.push({ key: 'minTotalPosts', label: `Total Posts: ${minTotalPosts}+`, onRemove: () => setMinTotalPosts('') });
  if (verifiedOnly) activeFilters.push({ key: 'verified', label: 'Verified', onRemove: () => setVerifiedOnly(false) });

  // Client-side filtering for filters not supported by API
  const filteredInfluencers = useMemo(() => {
    let result = influencers.filter((i) => {
      return (selectedTier === 'All' || i.tier === getTierFromString(selectedTier)) &&
        (!minEngagement || i.engagementRate >= parseFloat(minEngagement)) &&
        (!minAvgLikes || i.avgLikes >= parseInt(minAvgLikes)) &&
        (!minAvgViews || i.avgViews >= parseInt(minAvgViews)) &&
        (!minAvgComments || i.avgComments >= parseInt(minAvgComments)) &&
        (!minPostsLast14d || i.postsLast14d >= parseInt(minPostsLast14d)) &&
        (!minFollowersGained14d || i.followersGained14d >= parseInt(minFollowersGained14d)) &&
        (!minTotalPosts || i.totalPosts >= parseInt(minTotalPosts)) &&
        (!verifiedOnly || i.isVerified);
    });

    // Multi-sort logic
    if (sortCriteria.length > 0) {
      result.sort((a, b) => {
        for (const criteria of sortCriteria) {
          let aVal: number, bVal: number;
          switch (criteria.field) {
            case 'followers': aVal = a.followers; bVal = b.followers; break;
            case 'engagement': aVal = a.engagementRate; bVal = b.engagementRate; break;
            case 'avgViews': aVal = a.avgViews; bVal = b.avgViews; break;
            case 'avgLikes': aVal = a.avgLikes; bVal = b.avgLikes; break;
            case 'avgComments': aVal = a.avgComments; bVal = b.avgComments; break;
            case 'postsLast14d': aVal = a.postsLast14d; bVal = b.postsLast14d; break;
            case 'followersGained14d': aVal = a.followersGained14d; bVal = b.followersGained14d; break;
            case 'totalPosts': aVal = a.totalPosts; bVal = b.totalPosts; break;
            default: aVal = a.followers; bVal = b.followers;
          }
          const diff = criteria.direction === 'desc' ? bVal - aVal : aVal - bVal;
          if (diff !== 0) return diff;
        }
        return 0;
      });
    }

    return result;
  }, [influencers, selectedTier, minEngagement, minAvgLikes, minAvgViews, minAvgComments, minPostsLast14d, minFollowersGained14d, minTotalPosts, verifiedOnly, sortCriteria]);

  const toggleInfluencerSelection = (id: number) => setSelectedInfluencers(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  const toggleAllSelection = () => setSelectedInfluencers(selectedInfluencers.length === filteredInfluencers.length ? [] : filteredInfluencers.map(i => i.id));
  const clearAllFilters = () => { 
    setSelectedCategory('All'); 
    setSelectedTier('All'); 
    setMinFollowers(''); 
    setMaxFollowers(''); 
    setMinEngagement(''); 
    setMinAvgLikes('');
    setMinAvgViews('');
    setMinAvgComments('');
    setMinPostsLast14d('');
    setMinFollowersGained14d('');
    setMinTotalPosts('');
    setVerifiedOnly(false);
    setSearchQuery('');
  };

  const selectedProfile = selectedProfileId ? filteredInfluencers.find(i => i.id === selectedProfileId) : null;
  const currentProfileIndex = selectedProfileId ? filteredInfluencers.findIndex(i => i.id === selectedProfileId) : -1;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Discover Influencers</h1>
          <p className="text-gray-600 mt-1">Find Instagram creators that match your brand</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">Export CSV</button>
          <button className="px-4 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800">+ Save View</button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by name or username..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full max-w-md px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200"
        />
      </div>

      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {tiers.map((tier) => (
          <button 
            key={tier} 
            onClick={() => setSelectedTier(tier)} 
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px ${selectedTier === tier ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            {tier === 'All' ? 'All Creators' : tier.split(' ')[0]}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
        <div className="flex flex-wrap gap-3">
          <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white">
            <option value="All">Category</option>
            {categories.filter(c => c !== 'All').map((cat) => (<option key={cat} value={cat}>{cat}</option>))}
          </select>
          <div className="flex items-center gap-2">
            <input type="number" placeholder="Min followers" value={minFollowers} onChange={(e) => setMinFollowers(e.target.value)} className="w-28 px-3 py-2 text-sm border border-gray-200 rounded-lg" />
            <span className="text-gray-400">-</span>
            <input type="number" placeholder="Max followers" value={maxFollowers} onChange={(e) => setMaxFollowers(e.target.value)} className="w-28 px-3 py-2 text-sm border border-gray-200 rounded-lg" />
          </div>
          <input type="number" placeholder="Min eng %" value={minEngagement} onChange={(e) => setMinEngagement(e.target.value)} className="w-24 px-3 py-2 text-sm border border-gray-200 rounded-lg" step="0.1" />
          <input type="number" placeholder="Min avg likes" value={minAvgLikes} onChange={(e) => setMinAvgLikes(e.target.value)} className="w-28 px-3 py-2 text-sm border border-gray-200 rounded-lg" />
          <input type="number" placeholder="Min avg views" value={minAvgViews} onChange={(e) => setMinAvgViews(e.target.value)} className="w-28 px-3 py-2 text-sm border border-gray-200 rounded-lg" />
          <input type="number" placeholder="Min avg comments" value={minAvgComments} onChange={(e) => setMinAvgComments(e.target.value)} className="w-32 px-3 py-2 text-sm border border-gray-200 rounded-lg" />
          <button onClick={() => setVerifiedOnly(!verifiedOnly)} className={`px-3 py-2 text-sm border rounded-lg ${verifiedOnly ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}>✓ Verified</button>
          {activeFilters.length > 0 && <button onClick={clearAllFilters} className="px-3 py-2 text-sm text-red-600 hover:text-red-700">Reset</button>}
        </div>
        <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-gray-100">
          <input type="number" placeholder="Min posts (14d)" value={minPostsLast14d} onChange={(e) => setMinPostsLast14d(e.target.value)} className="w-28 px-3 py-2 text-sm border border-gray-200 rounded-lg" />
          <input type="number" placeholder="Min gained (14d)" value={minFollowersGained14d} onChange={(e) => setMinFollowersGained14d(e.target.value)} className="w-32 px-3 py-2 text-sm border border-gray-200 rounded-lg" />
          <input type="number" placeholder="Min total posts" value={minTotalPosts} onChange={(e) => setMinTotalPosts(e.target.value)} className="w-28 px-3 py-2 text-sm border border-gray-200 rounded-lg" />
        </div>
      </div>

      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {activeFilters.map((filter) => (
            <span key={filter.key} className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full">
              {filter.label}
              <button onClick={filter.onRemove} className="ml-1 hover:text-gray-900">×</button>
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-500">
          {loading ? 'Loading...' : `${filteredInfluencers.length} creators found`}
          {selectedInfluencers.length > 0 && <span className="ml-2 text-gray-900 font-medium">• {selectedInfluencers.length} selected</span>}
        </span>
        <div className="flex items-center gap-3">
          {selectedInfluencers.length > 0 && (
            <>
              <button className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">Add to Campaign</button>
              <button className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">Add to List</button>
              <div className="w-px h-6 bg-gray-200"></div>
            </>
          )}
          <SortButton sortCriteria={sortCriteria} onChange={setSortCriteria} />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 text-red-700">
          {error}
          <button onClick={fetchInfluencers} className="ml-4 underline hover:no-underline">Retry</button>
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 w-10">
                    <input type="checkbox" checked={selectedInfluencers.length === filteredInfluencers.length && filteredInfluencers.length > 0} onChange={toggleAllSelection} className="w-4 h-4 rounded border-gray-300" />
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Creator</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Followers</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Avg Views</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Avg Likes</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Avg Comments</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Engagement</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Posts (14d)</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Gained (14d)</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Total Posts</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Email</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredInfluencers.map((influencer) => (
                  <tr key={influencer.id} className={`hover:bg-gray-50 ${selectedInfluencers.includes(influencer.id) ? 'bg-gray-50' : ''}`}>
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={selectedInfluencers.includes(influencer.id)} onChange={() => toggleInfluencerSelection(influencer.id)} className="w-4 h-4 rounded border-gray-300" />
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => setSelectedProfileId(influencer.id)} className="flex items-center gap-3 text-left hover:opacity-75">
                        {influencer.profilePictureUrl ? (
                          <img src={influencer.profilePictureUrl} alt={influencer.fullName} className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-medium text-sm">{influencer.fullName.charAt(0)}</div>
                        )}
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-gray-900 hover:underline">{influencer.fullName}</span>
                            {influencer.isVerified && <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>}
                          </div>
                          <div className="text-sm text-gray-500">{influencer.handle}</div>
                        </div>
                      </button>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{formatNumber(influencer.followers)}</td>
                    <td className="px-4 py-3 text-gray-600">{formatNumber(influencer.avgViews)}</td>
                    <td className="px-4 py-3 text-gray-600">{formatNumber(influencer.avgLikes)}</td>
                    <td className="px-4 py-3 text-gray-600">{formatNumber(influencer.avgComments)}</td>
                    <td className="px-4 py-3 text-gray-900">{influencer.engagementRate.toFixed(1)}%</td>
                    <td className="px-4 py-3 text-gray-600">{influencer.postsLast14d}</td>
                    <td className="px-4 py-3 text-green-600 font-medium">+{formatNumber(influencer.followersGained14d)}</td>
                    <td className="px-4 py-3 text-gray-600">{influencer.totalPosts}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">{influencer.category || 'General'}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-[180px] truncate">{influencer.email || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredInfluencers.length === 0 && !loading && (
            <div className="p-12 text-center text-gray-500">No creators found matching your filters</div>
          )}
        </div>
      )}

      {filteredInfluencers.length > 0 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-500">
            Showing {filteredInfluencers.length} of {totalCount} results
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={!hasPrevPage}
              className="px-3 py-1.5 text-sm text-gray-500 bg-white border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button 
              onClick={() => setCurrentPage(p => p + 1)}
              disabled={!hasNextPage}
              className="px-3 py-1.5 text-sm text-gray-500 bg-white border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {selectedProfile && (
        <ProfileCard
          influencer={selectedProfile}
          onClose={() => setSelectedProfileId(null)}
          onPrevious={() => currentProfileIndex > 0 && setSelectedProfileId(filteredInfluencers[currentProfileIndex - 1].id)}
          onNext={() => currentProfileIndex < filteredInfluencers.length - 1 && setSelectedProfileId(filteredInfluencers[currentProfileIndex + 1].id)}
          hasPrevious={currentProfileIndex > 0}
          hasNext={currentProfileIndex < filteredInfluencers.length - 1}
        />
      )}
    </div>
  );
}
