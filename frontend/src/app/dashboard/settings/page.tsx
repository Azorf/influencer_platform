'use client';

import { useState } from 'react';

// Types based on Django models - matching backend exactly
type UserType = 'agency' | 'influencer' | 'brand' | 'admin';

const userTypeLabels: Record<UserType, string> = {
  agency: 'Agency',
  influencer: 'Influencer',
  brand: 'Brand',
  admin: 'Admin',
};

const userTypeColors: Record<UserType, string> = {
  agency: 'bg-blue-100 text-blue-800',
  influencer: 'bg-purple-100 text-purple-800',
  brand: 'bg-green-100 text-green-800',
  admin: 'bg-red-100 text-red-800',
};

interface TeamMember {
  id: number;
  name: string;
  email: string;
  userType: UserType;
  isVerified: boolean;
  joinedAt: string;
}

// Mock data matching Django model structure
const mockUser = {
  email: 'user@example.com',
  name: 'Agency Name',
  phone: '+212 600 000 000',
  website: 'www.agency.ma',
  bio: 'Leading digital marketing agency in Morocco specializing in influencer marketing.',
  userType: 'agency' as UserType,
};

const mockTeam: TeamMember[] = [
  { id: 1, name: 'Ahmed Manager', email: 'ahmed@agency.ma', userType: 'admin', isVerified: true, joinedAt: '2024-01-15' },
  { id: 2, name: 'Sarah Member', email: 'sarah@agency.ma', userType: 'agency', isVerified: true, joinedAt: '2024-03-20' },
  { id: 3, name: 'Karim Brand', email: 'karim@brand.ma', userType: 'brand', isVerified: false, joinedAt: '2024-05-10' },
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
  const [team, setTeam] = useState<TeamMember[]>(mockTeam);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: '', userType: 'agency' as UserType });
  const [inviteStatus, setInviteStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Saving profile:', profile);
  };

  const handleInviteMember = async () => {
    if (!inviteForm.email) return;
    
    setInviteStatus('sending');
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Add to team (pending state)
    const newMember: TeamMember = {
      id: Date.now(),
      name: inviteForm.email.split('@')[0],
      email: inviteForm.email,
      userType: inviteForm.userType,
      isVerified: false,
      joinedAt: 'Pending',
    };
    setTeam([...team, newMember]);
    
    setInviteStatus('sent');
    
    // Reset after showing success
    setTimeout(() => {
      setShowInviteModal(false);
      setInviteForm({ email: '', userType: 'agency' });
      setInviteStatus('idle');
    }, 1500);
  };

  const handleRemoveMember = (memberId: number) => {
    if (confirm('Are you sure you want to remove this member?')) {
      setTeam(team.filter(m => m.id !== memberId));
    }
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
            <button 
              onClick={() => setShowInviteModal(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800"
            >
              Invite Member
            </button>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Member</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {team.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center text-gray-600 font-medium">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{member.name}</span>
                            {member.isVerified && (
                              <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">{member.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${userTypeColors[member.userType]}`}>
                        {userTypeLabels[member.userType]}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {member.isVerified ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {member.joinedAt === 'Pending' ? (
                        <span className="text-sm text-gray-400">—</span>
                      ) : (
                        member.joinedAt
                      )}
                    </td>
                    <td className="px-6 py-4 text-right space-x-3">
                      <button className="text-sm text-gray-500 hover:text-gray-900">Edit</button>
                      <button 
                        onClick={() => handleRemoveMember(member.id)}
                        className="text-sm text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => { if (inviteStatus === 'idle') { setShowInviteModal(false); setInviteForm({ email: '', userType: 'agency' }); } }}>
          <div className="bg-white rounded-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Invite Team Member</h2>
              <button 
                onClick={() => { if (inviteStatus === 'idle') { setShowInviteModal(false); setInviteForm({ email: '', userType: 'agency' }); } }}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500"
              >
                ✕
              </button>
            </div>

            {inviteStatus === 'sent' ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Invitation Sent!</h3>
                <p className="text-gray-600">An invitation email has been sent to {inviteForm.email}</p>
              </div>
            ) : (
              <>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      value={inviteForm.email}
                      onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                      placeholder="colleague@company.com"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200"
                      disabled={inviteStatus === 'sending'}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">User Type</label>
                    <select
                      value={inviteForm.userType}
                      onChange={(e) => setInviteForm({ ...inviteForm, userType: e.target.value as UserType })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 bg-white"
                      disabled={inviteStatus === 'sending'}
                    >
                      <option value="agency">Agency</option>
                      <option value="brand">Brand</option>
                      <option value="influencer">Influencer</option>
                      <option value="admin">Admin</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      {inviteForm.userType === 'admin' && 'Full access to manage team, campaigns, and billing'}
                      {inviteForm.userType === 'agency' && 'Can create and manage campaigns for the agency'}
                      {inviteForm.userType === 'brand' && 'Can view and approve campaigns for their brand'}
                      {inviteForm.userType === 'influencer' && 'Can view assigned campaigns (limited access)'}
                    </p>
                  </div>
                </div>

                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                  <button 
                    onClick={() => { setShowInviteModal(false); setInviteForm({ email: '', userType: 'agency' }); }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
                    disabled={inviteStatus === 'sending'}
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleInviteMember}
                    disabled={!inviteForm.email || inviteStatus === 'sending'}
                    className="px-4 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2"
                  >
                    {inviteStatus === 'sending' ? (
                      <>
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Sending...
                      </>
                    ) : (
                      'Send Invitation'
                    )}
                  </button>
                </div>
              </>
            )}
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