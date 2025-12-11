'use client';

import { useState } from 'react';

// Mock data for now - will connect to API later
const mockInfluencers = [
  { id: 1, name: 'Sarah Lifestyle', handle: '@sarahlifestyle', platform: 'instagram', followers: 125000, engagement: 4.2, category: 'Lifestyle', location: 'Casablanca' },
  { id: 2, name: 'Ahmed Tech', handle: '@ahmedtech', platform: 'youtube', followers: 89000, engagement: 5.1, category: 'Technology', location: 'Rabat' },
  { id: 3, name: 'Fatima Beauty', handle: '@fatimabeauty', platform: 'instagram', followers: 234000, engagement: 3.8, category: 'Beauty', location: 'Marrakech' },
  { id: 4, name: 'Youssef Fitness', handle: '@yousseffitness', platform: 'tiktok', followers: 456000, engagement: 6.2, category: 'Fitness', location: 'Tangier' },
  { id: 5, name: 'Meryem Food', handle: '@meryemfood', platform: 'instagram', followers: 178000, engagement: 4.9, category: 'Food', location: 'Fes' },
  { id: 6, name: 'Karim Travel', handle: '@karimtravel', platform: 'youtube', followers: 67000, engagement: 5.5, category: 'Travel', location: 'Agadir' },
];

const categories = ['All', 'Lifestyle', 'Beauty', 'Fashion', 'Technology', 'Fitness', 'Food', 'Travel'];
const platforms = ['All', 'Instagram', 'YouTube', 'TikTok'];

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

export default function DiscoveryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedPlatform, setSelectedPlatform] = useState('All');

  const filteredInfluencers = mockInfluencers.filter((influencer) => {
    const matchesSearch = influencer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         influencer.handle.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || influencer.category === selectedCategory;
    const matchesPlatform = selectedPlatform === 'All' || influencer.platform.toLowerCase() === selectedPlatform.toLowerCase();
    return matchesSearch && matchesCategory && matchesPlatform;
  });

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Discover Influencers</h1>
        <p className="text-gray-600 mt-1">Find and connect with creators that match your brand</p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search influencers by name or handle..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 bg-white"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat === 'All' ? 'All Categories' : cat}</option>
              ))}
            </select>

            {/* Platform Filter */}
            <select
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 bg-white"
            >
              {platforms.map((plat) => (
                <option key={plat} value={plat}>{plat === 'All' ? 'All Platforms' : plat}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-4 text-sm text-gray-500">
        {filteredInfluencers.length} influencers found
      </div>

      {/* Influencers Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Influencer</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Platform</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Followers</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Engagement</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
              <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredInfluencers.map((influencer) => (
              <tr key={influencer.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-medium">
                      {influencer.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{influencer.name}</div>
                      <div className="text-sm text-gray-500">{influencer.handle}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                    {influencer.platform}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-900 font-medium">
                  {formatNumber(influencer.followers)}
                </td>
                <td className="px-6 py-4 text-gray-900">
                  {influencer.engagement}%
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {influencer.category}
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {influencer.location}
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-sm font-medium text-gray-900 hover:text-gray-600">
                    View Profile
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredInfluencers.length === 0 && (
          <div className="p-12 text-center text-gray-500">
            No influencers found matching your criteria
          </div>
        )}
      </div>
    </div>
  );
}
