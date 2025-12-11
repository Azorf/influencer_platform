'use client';

import { useState } from 'react';

// Mock data
const mockUser = {
  email: 'user@example.com',
  name: 'Agency Name',
  phone: '+212 600 000 000',
  website: 'www.agency.ma',
  bio: 'Leading digital marketing agency in Morocco specializing in influencer marketing.',
};

const mockTeam = [
  { id: 1, name: 'Ahmed Manager', email: 'ahmed@agency.ma', role: 'admin', joinedAt: '2024-01-15' },
  { id: 2, name: 'Sarah Member', email: 'sarah@agency.ma', role: 'member', joinedAt: '2024-03-20' },
];

const mockSubscription = {
  plan: 'Professional',
  price: 199,
  billingCycle: 'monthly',
  nextBillingDate: '2024-08-15',
  status: 'active',
};

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'team' | 'billing'>('profile');
  const [profile, setProfile] = useState(mockUser);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Saving profile:', profile);
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your account and preferences</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-8 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeTab === 'profile'
              ? 'border-gray-900 text-gray-900'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Profile
        </button>
        <button
          onClick={() => setActiveTab('team')}
          className={`pb-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeTab === 'team'
              ? 'border-gray-900 text-gray-900'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Team
        </button>
        <button
          onClick={() => setActiveTab('billing')}
          className={`pb-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeTab === 'billing'
              ? 'border-gray-900 text-gray-900'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Billing
        </button>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="max-w-2xl">
          <form onSubmit={handleSaveProfile} className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
              <h2 className="font-semibold text-gray-900">Agency Information</h2>

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Agency Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={profile.name}
                  onChange={handleProfileChange}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={profile.email}
                  onChange={handleProfileChange}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 bg-gray-50"
                  disabled
                />
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={profile.phone}
                  onChange={handleProfileChange}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200"
                />
              </div>

              <div>
                <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">
                  Website
                </label>
                <input
                  type="url"
                  id="website"
                  name="website"
                  value={profile.website}
                  onChange={handleProfileChange}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200"
                />
              </div>

              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                  Bio
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  value={profile.bio}
                  onChange={handleProfileChange}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-2.5 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Team Tab */}
      {activeTab === 'team' && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-semibold text-gray-900">Team Members</h2>
            <button className="px-4 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800">
              Invite Member
            </button>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Member</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {mockTeam.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{member.name}</div>
                        <div className="text-sm text-gray-500">{member.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                        member.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {member.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {member.joinedAt}
                    </td>
                    <td className="px-6 py-4 text-right space-x-3">
                      <button className="text-sm text-gray-500 hover:text-gray-900">Edit</button>
                      <button className="text-sm text-red-600 hover:text-red-700">Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Billing Tab */}
      {activeTab === 'billing' && (
        <div className="max-w-2xl space-y-6">
          {/* Current Plan */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Current Plan</h2>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 capitalize">
                {mockSubscription.status}
              </span>
            </div>

            <div className="flex items-baseline gap-1 mb-4">
              <span className="text-3xl font-bold text-gray-900">{mockSubscription.price}</span>
              <span className="text-gray-600">MAD/{mockSubscription.billingCycle === 'monthly' ? 'month' : 'year'}</span>
            </div>

            <div className="space-y-2 text-sm text-gray-600 mb-6">
              <div className="flex items-center justify-between">
                <span>Plan</span>
                <span className="font-medium text-gray-900">{mockSubscription.plan}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Billing cycle</span>
                <span className="font-medium text-gray-900 capitalize">{mockSubscription.billingCycle}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Next billing date</span>
                <span className="font-medium text-gray-900">{mockSubscription.nextBillingDate}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
                Change Plan
              </button>
              <button className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700">
                Cancel Subscription
              </button>
            </div>
          </div>

          {/* Billing History */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Billing History</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <div>
                  <div className="text-sm font-medium text-gray-900">July 2024</div>
                  <div className="text-xs text-gray-500">Professional Plan</div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-gray-900">199 MAD</span>
                  <button className="text-sm text-gray-500 hover:text-gray-900">Download</button>
                </div>
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <div className="text-sm font-medium text-gray-900">June 2024</div>
                  <div className="text-xs text-gray-500">Professional Plan</div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-gray-900">199 MAD</span>
                  <button className="text-sm text-gray-500 hover:text-gray-900">Download</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
