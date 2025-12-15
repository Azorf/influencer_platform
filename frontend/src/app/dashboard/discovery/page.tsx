'use client';

import { useState, useMemo } from 'react';

type InfluencerTier = 'nano' | 'micro' | 'mid' | 'macro' | 'mega';

interface BrandCollab {
  name: string;
  videos: { views: number; likes: number }[];
}

interface MockInfluencer {
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
  tier: InfluencerTier;
  category: string;
  city: string;
  totalPosts: number;
  postsLast14d: number;
  brandCollabs: BrandCollab[];
  languages: string[];
  isVerified: boolean;
  lastPosts: { views: number; likes: number }[];
  topPosts: { views: number; likes: number }[];
}

const mockInfluencers: MockInfluencer[] = [
  { id: 1, name: 'Sarah Lifestyle', handle: '@sarahlifestyle', email: 'sarah@lifestyle.ma', bio: 'Lifestyle & fashion content creator based in Casablanca.', followers: 125000, followersGained14d: 2340, avgViews: 45000, avgLikes: 3800, avgComments: 245, engagementRate: 4.2, tier: 'mid', category: 'Lifestyle', city: 'Casablanca', totalPosts: 342, postsLast14d: 8, brandCollabs: [{ name: 'Zara', videos: [{ views: 52000, likes: 4200 }, { views: 48000, likes: 3800 }] }, { name: 'H&M', videos: [{ views: 41000, likes: 3500 }] }, { name: 'Sephora', videos: [{ views: 38000, likes: 3200 }, { views: 35000, likes: 2900 }] }], languages: ['Arabic', 'French'], isVerified: true, lastPosts: [{ views: 52000, likes: 4200 }, { views: 48000, likes: 3800 }, { views: 41000, likes: 3500 }], topPosts: [{ views: 120000, likes: 15000 }, { views: 98000, likes: 12000 }, { views: 85000, likes: 9500 }] },
  { id: 2, name: 'Ahmed Tech', handle: '@ahmedtech', email: 'ahmed@techreviews.ma', bio: 'Tech enthusiast & reviewer covering gadgets and apps.', followers: 89000, followersGained14d: 1560, avgViews: 32000, avgLikes: 2900, avgComments: 312, engagementRate: 5.1, tier: 'mid', category: 'Technology', city: 'Rabat', totalPosts: 189, postsLast14d: 3, brandCollabs: [{ name: 'Samsung', videos: [{ views: 89000, likes: 8500 }, { views: 76000, likes: 7200 }] }, { name: 'Jumia', videos: [{ views: 65000, likes: 6100 }] }], languages: ['Arabic', 'English'], isVerified: true, lastPosts: [{ views: 38000, likes: 3200 }, { views: 29000, likes: 2800 }, { views: 35000, likes: 3100 }], topPosts: [{ views: 89000, likes: 8500 }, { views: 76000, likes: 7200 }, { views: 65000, likes: 6100 }] },
  { id: 3, name: 'Fatima Beauty', handle: '@fatimabeauty', email: 'contact@fatimabeauty.com', bio: 'Beauty & skincare expert. Makeup tutorials and reviews.', followers: 234000, followersGained14d: 4120, avgViews: 78000, avgLikes: 6500, avgComments: 890, engagementRate: 3.8, tier: 'mid', category: 'Beauty', city: 'Marrakech', totalPosts: 567, postsLast14d: 12, brandCollabs: [{ name: 'MAC', videos: [{ views: 250000, likes: 28000 }, { views: 198000, likes: 22000 }] }, { name: 'Maybelline', videos: [{ views: 175000, likes: 19500 }] }, { name: "L'Oreal", videos: [{ views: 156000, likes: 17200 }, { views: 142000, likes: 15800 }] }, { name: 'Sephora', videos: [{ views: 128000, likes: 14200 }] }], languages: ['Arabic', 'French', 'English'], isVerified: true, lastPosts: [{ views: 82000, likes: 7500 }, { views: 71000, likes: 6800 }, { views: 85000, likes: 8100 }], topPosts: [{ views: 250000, likes: 28000 }, { views: 198000, likes: 22000 }, { views: 175000, likes: 19500 }] },
  { id: 4, name: 'Youssef Fitness', handle: '@yousseffitness', email: 'youssef@fitmorocco.ma', bio: 'Certified personal trainer & nutrition coach.', followers: 456000, followersGained14d: 8900, avgViews: 180000, avgLikes: 15200, avgComments: 1450, engagementRate: 6.2, tier: 'macro', category: 'Fitness', city: 'Tangier', totalPosts: 423, postsLast14d: 14, brandCollabs: [{ name: 'Nike', videos: [{ views: 520000, likes: 62000 }, { views: 445000, likes: 53000 }, { views: 398000, likes: 47000 }] }, { name: 'Decathlon', videos: [{ views: 312000, likes: 37000 }] }, { name: 'MyProtein', videos: [{ views: 285000, likes: 34000 }, { views: 267000, likes: 31000 }] }], languages: ['Arabic', 'French'], isVerified: true, lastPosts: [{ views: 195000, likes: 18500 }, { views: 172000, likes: 16200 }, { views: 188000, likes: 17800 }], topPosts: [{ views: 520000, likes: 62000 }, { views: 445000, likes: 53000 }, { views: 398000, likes: 47000 }] },
  { id: 5, name: 'Meryem Food', handle: '@meryemfood', email: 'meryem.food@gmail.com', bio: 'Moroccan food blogger & recipe developer.', followers: 178000, followersGained14d: 2890, avgViews: 62000, avgLikes: 5100, avgComments: 678, engagementRate: 4.9, tier: 'mid', category: 'Food', city: 'Fes', totalPosts: 289, postsLast14d: 5, brandCollabs: [{ name: 'Knorr', videos: [{ views: 145000, likes: 16000 }, { views: 128000, likes: 14200 }] }, { name: 'Carrefour', videos: [{ views: 112000, likes: 12500 }] }], languages: ['Arabic', 'French'], isVerified: false, lastPosts: [{ views: 58000, likes: 5200 }, { views: 65000, likes: 5800 }, { views: 61000, likes: 5500 }], topPosts: [{ views: 145000, likes: 16000 }, { views: 128000, likes: 14200 }, { views: 112000, likes: 12500 }] },
  { id: 6, name: 'Karim Travel', handle: '@karimtravel', email: 'karim@wandermorocco.com', bio: 'Travel photographer & content creator.', followers: 67000, followersGained14d: 890, avgViews: 25000, avgLikes: 2100, avgComments: 234, engagementRate: 5.5, tier: 'mid', category: 'Travel', city: 'Agadir', totalPosts: 156, postsLast14d: 4, brandCollabs: [{ name: 'Booking.com', videos: [{ views: 78000, likes: 8200 }, { views: 65000, likes: 6800 }] }, { name: 'Royal Air Maroc', videos: [{ views: 58000, likes: 6100 }] }], languages: ['Arabic', 'English', 'French'], isVerified: false, lastPosts: [{ views: 28000, likes: 2600 }, { views: 22000, likes: 2100 }, { views: 26000, likes: 2400 }], topPosts: [{ views: 78000, likes: 8200 }, { views: 65000, likes: 6800 }, { views: 58000, likes: 6100 }] },
  { id: 7, name: 'Nadia Fashion', handle: '@nadiafashion', email: 'nadia.style@outlook.com', bio: 'Fashion stylist & outfit inspiration.', followers: 45000, followersGained14d: 1230, avgViews: 15000, avgLikes: 1800, avgComments: 156, engagementRate: 7.2, tier: 'micro', category: 'Fashion', city: 'Casablanca', totalPosts: 234, postsLast14d: 10, brandCollabs: [{ name: 'Mango', videos: [{ views: 42000, likes: 5200 }, { views: 38000, likes: 4700 }] }], languages: ['Arabic', 'French'], isVerified: false, lastPosts: [{ views: 16000, likes: 1800 }, { views: 14500, likes: 1650 }, { views: 15200, likes: 1720 }], topPosts: [{ views: 42000, likes: 5200 }, { views: 38000, likes: 4700 }, { views: 35000, likes: 4300 }] },
  { id: 8, name: 'Omar Gaming', handle: '@omargaming', email: 'omar@gamingarabia.com', bio: 'Pro gamer & streamer. Esports competitor.', followers: 890000, followersGained14d: 15600, avgViews: 320000, avgLikes: 42000, avgComments: 5600, engagementRate: 8.1, tier: 'macro', category: 'Gaming', city: 'Rabat', totalPosts: 678, postsLast14d: 18, brandCollabs: [{ name: 'Razer', videos: [{ views: 1200000, likes: 145000 }, { views: 980000, likes: 118000 }] }, { name: 'Logitech', videos: [{ views: 856000, likes: 102000 }, { views: 745000, likes: 89000 }] }, { name: 'Maroc Telecom', videos: [{ views: 623000, likes: 74000 }] }], languages: ['Arabic', 'French', 'English'], isVerified: true, lastPosts: [{ views: 345000, likes: 42000 }, { views: 298000, likes: 36000 }, { views: 312000, likes: 38000 }], topPosts: [{ views: 1200000, likes: 145000 }, { views: 980000, likes: 118000 }, { views: 856000, likes: 102000 }] },
];

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

function getTierFromString(tierStr: string): InfluencerTier | null {
  if (tierStr.includes('Nano')) return 'nano';
  if (tierStr.includes('Micro')) return 'micro';
  if (tierStr.includes('Mid')) return 'mid';
  if (tierStr.includes('Macro')) return 'macro';
  if (tierStr.includes('Mega')) return 'mega';
  return null;
}

function ProfileCard({ influencer, onClose, onPrevious, onNext, hasPrevious, hasNext }: { 
  influencer: MockInfluencer; onClose: () => void; onPrevious: () => void; onNext: () => void; hasPrevious: boolean; hasNext: boolean;
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
                <div className="w-24 h-24 bg-gray-300 rounded-full border-4 border-white flex items-center justify-center text-3xl font-bold text-gray-600">{influencer.name.charAt(0)}</div>
              </div>
            </div>
            <div className="pt-14 px-6 pb-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-gray-900">{influencer.name}</h2>
                    {influencer.isVerified && <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>}
                  </div>
                  <p className="text-gray-500">{influencer.handle}</p>
                </div>
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-full">{influencer.category}</span>
              </div>
              <p className="mt-3 text-gray-600 text-sm">{influencer.bio}</p>
              <div className="grid grid-cols-4 gap-3 mt-6 py-4 border-t border-gray-100">
                <div className="text-center"><div className="text-lg font-bold text-gray-900">{formatNumber(influencer.followers)}</div><div className="text-xs text-gray-500">Followers</div></div>
                <div className="text-center"><div className="text-lg font-bold text-gray-900">{influencer.engagementRate}%</div><div className="text-xs text-gray-500">Engagement</div></div>
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
                <div className="flex justify-between text-sm"><span className="text-gray-500">Email</span><span className="text-gray-900">{influencer.email}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">Languages</span><span className="text-gray-900">{influencer.languages.join(', ')}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">Tier</span><span className="text-gray-900 capitalize">{influencer.tier}</span></div>
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
                  {influencer.topPosts.map((post, idx) => (
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
                  {influencer.lastPosts.map((post, idx) => (
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
                <div className="text-center text-gray-500 py-8">No brand collaborations yet</div>
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
                href={`https://instagram.com/${influencer.handle.replace('@', '')}`}
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
      // Field already exists
      if (sortCriteria[existingIndex].direction === direction) {
        // Same direction - remove it
        onChange(sortCriteria.filter((_, i) => i !== existingIndex));
      } else {
        // Different direction - update it
        const newCriteria = [...sortCriteria];
        newCriteria[existingIndex] = { field, direction };
        onChange(newCriteria);
      }
    } else {
      // Add new sort criteria
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
  const [selectedInfluencers, setSelectedInfluencers] = useState<number[]>([]);
  const [sortCriteria, setSortCriteria] = useState<SortCriteria[]>([{ field: 'followers', direction: 'desc' }]);
  const [selectedProfileId, setSelectedProfileId] = useState<number | null>(null);

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

  const filteredInfluencers = useMemo(() => {
    let result = mockInfluencers.filter((i) => {
      return (selectedCategory === 'All' || i.category === selectedCategory) &&
        (selectedTier === 'All' || i.tier === getTierFromString(selectedTier)) &&
        (!minFollowers || i.followers >= parseInt(minFollowers)) &&
        (!maxFollowers || i.followers <= parseInt(maxFollowers)) &&
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
  }, [selectedCategory, selectedTier, minFollowers, maxFollowers, minEngagement, minAvgLikes, minAvgViews, minAvgComments, minPostsLast14d, minFollowersGained14d, minTotalPosts, verifiedOnly, sortCriteria]);

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
  };

  const selectedProfile = selectedProfileId ? filteredInfluencers.find(i => i.id === selectedProfileId) : null;
  const currentProfileIndex = selectedProfileId ? filteredInfluencers.findIndex(i => i.id === selectedProfileId) : -1;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-gray-900">Discover Influencers</h1><p className="text-gray-600 mt-1">Find Instagram creators that match your brand</p></div>
        <div className="flex gap-3">
          <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">Export CSV</button>
          <button className="px-4 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800">+ Save View</button>
        </div>
      </div>

      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {tiers.map((tier) => (<button key={tier} onClick={() => setSelectedTier(tier)} className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px ${selectedTier === tier ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>{tier === 'All' ? 'All Creators' : tier.split(' ')[0]}</button>))}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
        <div className="flex flex-wrap gap-3">
          <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white"><option value="All">Category</option>{categories.filter(c => c !== 'All').map((cat) => (<option key={cat} value={cat}>{cat}</option>))}</select>
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

      {activeFilters.length > 0 && (<div className="flex flex-wrap gap-2 mb-4">{activeFilters.map((filter) => (<span key={filter.key} className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full">{filter.label}<button onClick={filter.onRemove} className="ml-1 hover:text-gray-900">×</button></span>))}</div>)}

      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-500">{filteredInfluencers.length} creators found{selectedInfluencers.length > 0 && <span className="ml-2 text-gray-900 font-medium">• {selectedInfluencers.length} selected</span>}</span>
        <div className="flex items-center gap-3">
          {selectedInfluencers.length > 0 && (<><button className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">Add to Campaign</button><button className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">Add to List</button><div className="w-px h-6 bg-gray-200"></div></>)}
          <SortButton sortCriteria={sortCriteria} onChange={setSortCriteria} />
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 w-10"><input type="checkbox" checked={selectedInfluencers.length === filteredInfluencers.length && filteredInfluencers.length > 0} onChange={toggleAllSelection} className="w-4 h-4 rounded border-gray-300" /></th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Creator</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Followers</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Avg Views</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Avg Likes</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Avg Comments</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Engagement</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Posts (14d)</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Gained (14d)</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Total Posts</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Brands</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Category</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Email</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-200">
              {filteredInfluencers.map((influencer) => (
                <tr key={influencer.id} className={`hover:bg-gray-50 ${selectedInfluencers.includes(influencer.id) ? 'bg-gray-50' : ''}`}>
                  <td className="px-4 py-3"><input type="checkbox" checked={selectedInfluencers.includes(influencer.id)} onChange={() => toggleInfluencerSelection(influencer.id)} className="w-4 h-4 rounded border-gray-300" /></td>
                  <td className="px-4 py-3"><button onClick={() => setSelectedProfileId(influencer.id)} className="flex items-center gap-3 text-left hover:opacity-75"><div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-medium text-sm">{influencer.name.charAt(0)}</div><div><div className="flex items-center gap-1.5"><span className="font-medium text-gray-900 hover:underline">{influencer.name}</span>{influencer.isVerified && <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>}</div><div className="text-sm text-gray-500">{influencer.handle}</div></div></button></td>
                  <td className="px-4 py-3 font-medium text-gray-900">{formatNumber(influencer.followers)}</td>
                  <td className="px-4 py-3 text-gray-600">{formatNumber(influencer.avgViews)}</td>
                  <td className="px-4 py-3 text-gray-600">{formatNumber(influencer.avgLikes)}</td>
                  <td className="px-4 py-3 text-gray-600">{formatNumber(influencer.avgComments)}</td>
                  <td className="px-4 py-3 text-gray-900">{influencer.engagementRate}%</td>
                  <td className="px-4 py-3 text-gray-600">{influencer.postsLast14d}</td>
                  <td className="px-4 py-3 text-green-600 font-medium">+{formatNumber(influencer.followersGained14d)}</td>
                  <td className="px-4 py-3 text-gray-600">{influencer.totalPosts}</td>
                  <td className="px-4 py-3"><div className="flex -space-x-1">{influencer.brandCollabs.slice(0, 3).map((collab, idx) => (<div key={idx} className="w-7 h-7 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs font-medium text-gray-600" title={collab.name}>{collab.name.charAt(0)}</div>))}{influencer.brandCollabs.length > 3 && <div className="w-7 h-7 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs font-medium text-gray-500">+{influencer.brandCollabs.length - 3}</div>}</div></td>
                  <td className="px-4 py-3"><span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">{influencer.category}</span></td>
                  <td className="px-4 py-3 text-sm text-gray-600 max-w-[180px] truncate">{influencer.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredInfluencers.length === 0 && <div className="p-12 text-center text-gray-500">No creators found matching your filters</div>}
      </div>

      {filteredInfluencers.length > 0 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-500">Showing 1-{filteredInfluencers.length} of {filteredInfluencers.length} results</div>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 text-sm text-gray-500 bg-white border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50" disabled>Previous</button>
            <button className="px-3 py-1.5 text-sm text-gray-500 bg-white border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50" disabled>Next</button>
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