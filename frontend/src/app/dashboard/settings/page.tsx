'use client';

import { useState, useEffect } from 'react';
import { agencyService } from '@/lib/api';
import type { Agency, TeamMember, TeamInvitation, Subscription, TeamRole } from '@/types';

const roleLabels: Record<TeamRole, string> = {
  owner: 'Owner',
  admin: 'Admin',
  manager: 'Manager',
  account_manager: 'Account Manager',
  strategist: 'Strategist',
  creative: 'Creative',
  analyst: 'Analyst',
  coordinator: 'Coordinator',
  intern: 'Intern',
};

const roleColors: Record<TeamRole, string> = {
  owner: 'bg-purple-100 text-purple-800',
  admin: 'bg-red-100 text-red-800',
  manager: 'bg-blue-100 text-blue-800',
  account_manager: 'bg-green-100 text-green-800',
  strategist: 'bg-yellow-100 text-yellow-800',
  creative: 'bg-pink-100 text-pink-800',
  analyst: 'bg-indigo-100 text-indigo-800',
  coordinator: 'bg-orange-100 text-orange-800',
  intern: 'bg-gray-100 text-gray-800',
};

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'team' | 'billing'>('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Data
  const [agency, setAgency] = useState<Agency | null>(null);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  
  // Forms
  const [profileForm, setProfileForm] = useState({
    name: '',
    displayName: '',
    email: '',
    phone: '',
    website: '',
    description: '',
  });
  
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'coordinator' as TeamRole, message: '' });
  const [inviteStatus, setInviteStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      setError(null);

      // Fetch agency profile
      const agencyData = await agencyService.getAgency();
      setAgency(agencyData);
      setProfileForm({
        name: agencyData.name || '',
        displayName: agencyData.displayName || '',
        email: agencyData.email || '',
        phone: agencyData.phone || '',
        website: agencyData.website || '',
        description: agencyData.description || '',
      });

      // Fetch team members
      const teamData = await agencyService.getTeamMembers();
      setTeam(teamData);

      // Fetch subscription
      const subscriptionData = await agencyService.getSubscription();
      setSubscription(subscriptionData);

    } catch (err) {
      console.error('Failed to fetch settings data:', err);
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSaving(true);
      await agencyService.updateAgency({
        name: profileForm.name,
        displayName: profileForm.displayName,
        phone: profileForm.phone,
        website: profileForm.website,
        description: profileForm.description,
      });
      // Refresh data
      await fetchData();
    } catch (err) {
      console.error('Failed to save profile:', err);
      alert('Failed to save profile');
    } finally {
      setSaving(false);
    }
  }

  async function handleInviteMember() {
    if (!inviteForm.email) return;
    
    try {
      setInviteStatus('sending');
      await agencyService.inviteTeamMember({
        email: inviteForm.email,
        role: inviteForm.role,
        message: inviteForm.message,
      });
      setInviteStatus('sent');
      
      // Reset after showing success
      setTimeout(() => {
        setShowInviteModal(false);
        setInviteForm({ email: '', role: 'coordinator', message: '' });
        setInviteStatus('idle');
        fetchData();
      }, 1500);
    } catch (err) {
      console.error('Failed to invite member:', err);
      setInviteStatus('error');
    }
  }

  async function handleRemoveMember(memberId: number) {
    if (!confirm('Are you sure you want to remove this team member?')) return;
    
    try {
      await agencyService.removeTeamMember(memberId);
      await fetchData();
    } catch (err) {
      console.error('Failed to remove member:', err);
      alert('Failed to remove team member');
    }
  }

  async function handleUpdateRole(memberId: number, newRole: TeamRole) {
    try {
      await agencyService.updateTeamMember(memberId, { role: newRole });
      await fetchData();
    } catch (err) {
      console.error('Failed to update role:', err);
      alert('Failed to update role');
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
          <button onClick={fetchData} className="ml-4 underline hover:no-underline">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your account and preferences</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-8 border-b border-gray-200">
        {(['profile', 'team', 'billing'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 text-sm font-medium border-b-2 -mb-px transition-colors capitalize ${
              activeTab === tab
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="max-w-2xl">
          <form onSubmit={handleSaveProfile} className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
              <h2 className="font-semibold text-gray-900">Agency Information</h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Agency Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200"
                  />
                </div>
                <div>
                  <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    id="displayName"
                    value={profileForm.displayName}
                    onChange={(e) => setProfileForm({ ...profileForm, displayName: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={profileForm.email}
                  disabled
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
                />
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
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
                    value={profileForm.website}
                    onChange={(e) => setProfileForm({ ...profileForm, website: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  rows={4}
                  value={profileForm.description}
                  onChange={(e) => setProfileForm({ ...profileForm, description: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Team Tab */}
      {activeTab === 'team' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">Team Members</h2>
              <p className="text-sm text-gray-500">{team.length} members</p>
            </div>
            <button
              onClick={() => setShowInviteModal(true)}
              className="px-4 py-2.5 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800"
            >
              Invite Member
            </button>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Member</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Joined</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {team.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-medium">
                          {member.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{member.name}</div>
                          <div className="text-sm text-gray-500">{member.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={member.role}
                        onChange={(e) => handleUpdateRole(member.id, e.target.value as TeamRole)}
                        disabled={member.role === 'owner'}
                        className={`text-xs font-medium px-2.5 py-1 rounded-full border-0 ${roleColors[member.role]} ${member.role === 'owner' ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        {Object.entries(roleLabels).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        member.isActive ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {member.isActive ? 'Active' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(member.joinedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {member.role !== 'owner' && (
                        <button 
                          onClick={() => handleRemoveMember(member.id)}
                          className="text-sm text-red-600 hover:text-red-700"
                        >
                          Remove
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Billing Tab */}
      {activeTab === 'billing' && subscription && (
        <div className="max-w-2xl space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Current Plan</h2>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                subscription.status === 'active' ? 'bg-green-100 text-green-800' :
                subscription.status === 'trialing' ? 'bg-blue-100 text-blue-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {subscription.isTrial ? 'Trial' : subscription.status}
              </span>
            </div>

            <div className="flex items-baseline gap-1 mb-4">
              <span className="text-3xl font-bold text-gray-900">{subscription.monthlyPrice}</span>
              <span className="text-gray-600">MAD/month</span>
            </div>

            <div className="space-y-2 text-sm text-gray-600 mb-6">
              <div className="flex items-center justify-between">
                <span>Plan</span>
                <span className="font-medium text-gray-900 capitalize">{subscription.planType}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Influencer Limit</span>
                <span className="font-medium text-gray-900">{subscription.influencerLimit}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Campaign Limit</span>
                <span className="font-medium text-gray-900">{subscription.campaignLimit}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Team Members</span>
                <span className="font-medium text-gray-900">{subscription.teamMemberLimit}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Current Period</span>
                <span className="font-medium text-gray-900">
                  {new Date(subscription.currentPeriodStart).toLocaleDateString()} - {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </span>
              </div>
              {subscription.isTrial && subscription.daysUntilTrialEnds && (
                <div className="flex items-center justify-between text-blue-600">
                  <span>Trial Ends In</span>
                  <span className="font-medium">{subscription.daysUntilTrialEnds} days</span>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
                Change Plan
              </button>
              {!subscription.cancelAtPeriodEnd && (
                <button className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700">
                  Cancel Subscription
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => inviteStatus === 'idle' && setShowInviteModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Invite Team Member</h2>
              <button 
                onClick={() => inviteStatus === 'idle' && setShowInviteModal(false)}
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                    <select
                      value={inviteForm.role}
                      onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value as TeamRole })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 bg-white"
                      disabled={inviteStatus === 'sending'}
                    >
                      {Object.entries(roleLabels).filter(([k]) => k !== 'owner').map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Message (optional)</label>
                    <textarea
                      value={inviteForm.message}
                      onChange={(e) => setInviteForm({ ...inviteForm, message: e.target.value })}
                      placeholder="Add a personal message..."
                      rows={3}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200"
                      disabled={inviteStatus === 'sending'}
                    />
                  </div>

                  {inviteStatus === 'error' && (
                    <div className="text-sm text-red-600">Failed to send invitation. Please try again.</div>
                  )}
                </div>

                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                  <button 
                    onClick={() => setShowInviteModal(false)}
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
    </div>
  );
}
