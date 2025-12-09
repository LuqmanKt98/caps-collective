'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import PasswordInput from '@/components/PasswordInput';
import {
  SKILL_CATEGORIES,
  SkillCategory,
  Need,
  ScoringConfig,
  InvitationWithDetails,
  UserWithStats,
  AnalyticsSummary
} from '@/types';

type TabType = 'needs' | 'invitations' | 'users' | 'analytics' | 'scoring' | 'settings';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('analytics');

  // Needs state
  const [needs, setNeeds] = useState<Need[]>([]);
  const [newNeed, setNewNeed] = useState({
    title: '',
    description: '',
    category: 'Technology' as SkillCategory,
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  // Invitations state
  const [invitations, setInvitations] = useState<InvitationWithDetails[]>([]);
  const [newInvitationEmail, setNewInvitationEmail] = useState('');
  const [invitationLink, setInvitationLink] = useState('');
  const [invitingUser, setInvitingUser] = useState(false);
  const [invitationEmailStatus, setInvitationEmailStatus] = useState<{ sent: boolean; error?: string } | null>(null);

  // Users state
  const [users, setUsers] = useState<UserWithStats[]>([]);
  const [userFilter, setUserFilter] = useState<'all' | 'onboarded' | 'pending' | 'admins'>('all');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showDeleteNeedConfirm, setShowDeleteNeedConfirm] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Analytics state
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);

  // Scoring state
  const [scoringConfig, setScoringConfig] = useState<ScoringConfig | null>(null);
  const [analyzingAI, setAnalyzingAI] = useState(false);
  const [aiMessage, setAiMessage] = useState('');

  // Settings state - Password
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');

  // Settings state - Email
  const [newEmail, setNewEmail] = useState('');
  const [confirmNewEmail, setConfirmNewEmail] = useState('');
  const [changingEmail, setChangingEmail] = useState(false);
  const [emailMessage, setEmailMessage] = useState('');

  const [loading, setLoading] = useState(true);

  // Edit need state
  const [editingNeed, setEditingNeed] = useState<Need | null>(null);
  const [editNeedData, setEditNeedData] = useState({ title: '', description: '', category: 'Technology' as SkillCategory });

  // Clear invitation state
  const [showClearInvitationsConfirm, setShowClearInvitationsConfirm] = useState(false);
  const [clearingInvitations, setClearingInvitations] = useState(false);

  // Fetch data on mount
  useEffect(() => {
    if (!user) return;
    fetchAllData();
  }, [user]);

  const fetchAllData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const token = await user.getIdToken();
      const headers = {
        'Authorization': `Bearer ${token}`,
      };

      const [needsRes, invitationsRes, usersRes, analyticsRes, configRes] = await Promise.all([
        fetch(`/api/needs?active=all`, { headers }),
        fetch(`/api/invitations?userId=${user.uid}`, { headers }),
        fetch(`/api/users?userId=${user.uid}`, { headers }),
        fetch(`/api/analytics?userId=${user.uid}`, { headers }),
        fetch('/api/scoring-config', { headers }),
      ]);

      const [needsData, invitationsData, usersData, analyticsData, configData] = await Promise.all([
        needsRes.json(),
        invitationsRes.json(),
        usersRes.json(),
        analyticsRes.json(),
        configRes.json(),
      ]);

      if (needsData.success) setNeeds(needsData.data.needs);
      if (invitationsData.success) setInvitations(invitationsData.data.invitations);
      if (usersData.success) setUsers(usersData.data.users);
      if (analyticsData.success) setAnalytics(analyticsData.data);
      if (configData.success) setScoringConfig(configData.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNeed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newNeed.title || !newNeed.description) return;

    setSubmitting(true);
    setSubmitMessage('');

    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/needs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...newNeed,
          userId: user.uid,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSubmitMessage('Need created successfully!');
        setNewNeed({ title: '', description: '', category: 'Technology' });
        await fetchAllData();
      } else {
        setSubmitMessage(`Error: ${data.error}`);
      }
    } catch (error) {
      setSubmitMessage('Failed to create need');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleNeedStatus = async (needId: string, currentStatus: boolean) => {
    if (!user) return;

    try {
      const token = await user.getIdToken();
      await fetch('/api/needs', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          needId,
          userId: user.uid,
          isActive: !currentStatus,
        }),
      });

      setNeeds(needs.map(n =>
        n.id === needId ? { ...n, isActive: !currentStatus } : n
      ));
      await fetchAllData();
    } catch (error) {
      console.error('Error toggling need status:', error);
    }
  };

  const handleDeleteNeed = async (needId: string) => {
    if (!user) return;

    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/needs?needId=${needId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setNeeds(needs.filter(n => n.id !== needId));
        setShowDeleteNeedConfirm(null);
        await fetchAllData();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      alert('Failed to delete need');
    }
  };

  const handleSendInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newInvitationEmail) return;

    setInvitingUser(true);
    setInvitationLink('');
    setInvitationEmailStatus(null);

    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: newInvitationEmail,
          userId: user.uid,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setInvitationLink(data.data.invitationLink);
        setInvitationEmailStatus({
          sent: data.data.emailSent,
          error: data.data.emailError,
        });
        setNewInvitationEmail('');
        await fetchAllData();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      alert('Failed to send invitation');
    } finally {
      setInvitingUser(false);
    }
  };

  const toggleUserAdmin = async (targetUserId: string, currentStatus: boolean) => {
    if (!user) return;

    try {
      const token = await user.getIdToken();
      await fetch('/api/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          targetUserId,
          requestingUserId: user.uid,
          updates: { isAdmin: !currentStatus },
        }),
      });

      setUsers(users.map(u =>
        u.id === targetUserId ? { ...u, isAdmin: !currentStatus } : u
      ));
    } catch (error) {
      console.error('Error toggling admin status:', error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!user) return;

    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/users', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          targetUserId: userId,
          requestingUserId: user.uid,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setUsers(users.filter(u => u.id !== userId));
        setShowDeleteConfirm(null);
        await fetchAllData();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      alert('Failed to delete user');
    }
  };

  const runAIAnalysis = async () => {
    if (!user) return;
    setAnalyzingAI(true);
    setAiMessage('');
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/scoring-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setScoringConfig(data.data);
        setAiMessage('AI analysis complete! New scoring weights applied.');
      } else {
        setAiMessage(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('AI Analysis Error:', error);
      setAiMessage('Failed to run AI analysis');
    } finally {
      setAnalyzingAI(false);
    }
  };

  const getFilteredUsers = () => {
    let filtered = users;

    // Apply status filter
    switch (userFilter) {
      case 'onboarded':
        filtered = filtered.filter(u => u.onboardingComplete);
        break;
      case 'pending':
        filtered = filtered.filter(u => !u.onboardingComplete);
        break;
      case 'admins':
        filtered = filtered.filter(u => u.isAdmin);
        break;
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(u =>
        u.email?.toLowerCase().includes(query) ||
        u.displayName?.toLowerCase().includes(query)
      );
    }

    return filtered;
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (newPassword !== confirmNewPassword) {
      setPasswordMessage('Error: Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMessage('Error: Password must be at least 6 characters');
      return;
    }

    setChangingPassword(true);
    setPasswordMessage('');

    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ newPassword }),
      });

      const data = await response.json();

      if (data.success) {
        setPasswordMessage('Password changed successfully!');
        setNewPassword('');
        setConfirmNewPassword('');
      } else {
        setPasswordMessage(`Error: ${data.error}`);
      }
    } catch (error) {
      setPasswordMessage('Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (newEmail !== confirmNewEmail) {
      setEmailMessage('Error: Emails do not match');
      return;
    }

    if (!newEmail.includes('@')) {
      setEmailMessage('Error: Please enter a valid email address');
      return;
    }

    if (newEmail === user.email) {
      setEmailMessage('Error: New email is the same as current email');
      return;
    }

    setChangingEmail(true);
    setEmailMessage('');

    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/admin/change-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ newEmail }),
      });

      const data = await response.json();

      if (data.success) {
        setEmailMessage('Email changed successfully! Please sign in again with your new email.');
        setNewEmail('');
        setConfirmNewEmail('');
        // Sign out after email change to force re-authentication
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else {
        setEmailMessage(`Error: ${data.error}`);
      }
    } catch (error) {
      setEmailMessage('Failed to change email');
    } finally {
      setChangingEmail(false);
    }
  };

  const handleEditNeed = (need: Need) => {
    setEditingNeed(need);
    setEditNeedData({
      title: need.title,
      description: need.description,
      category: need.category,
    });
  };

  const handleUpdateNeed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !editingNeed) return;

    setSubmitting(true);
    setSubmitMessage('');

    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/needs', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          needId: editingNeed.id,
          userId: user.uid,
          title: editNeedData.title,
          description: editNeedData.description,
          category: editNeedData.category,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSubmitMessage('Need updated successfully!');
        setNeeds(needs.map(n => n.id === editingNeed.id ? { ...n, ...editNeedData } : n));
        setEditingNeed(null);
        await fetchAllData();
      } else {
        setSubmitMessage(`Error: ${data.error}`);
      }
    } catch (error) {
      setSubmitMessage('Failed to update need');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClearInvitations = async () => {
    if (!user) return;
    setClearingInvitations(true);

    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/invitations/clear', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setInvitations([]);
        setShowClearInvitationsConfirm(false);
        await fetchAllData();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      alert('Failed to clear invitations');
    } finally {
      setClearingInvitations(false);
    }
  };

  const handleDeleteInvitation = async (invitationId: string) => {
    if (!user) return;

    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/invitations?invitationId=${invitationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setInvitations(invitations.filter(inv => inv.id !== invitationId));
        await fetchAllData();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      alert('Failed to delete invitation');
    }
  };

  const handleResendInvitation = async (invitationId: string, email: string) => {
    if (!user) return;

    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/invitations', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          invitationId,
          action: 'resend',
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert(`Invitation resent to ${email}`);
        await fetchAllData();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      alert('Failed to resend invitation');
    }
  };

  return (
    <ProtectedRoute requireAdmin>
      <div className="min-h-screen bg-pattern">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#00245D]">Admin Dashboard</h1>
            <p className="mt-1 text-[#00245D]/60">Manage community needs, users, and platform settings</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            <button onClick={() => setActiveTab('analytics')} className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${activeTab === 'analytics' ? 'bg-[#00245D] text-white shadow-xl' : 'bg-white/95 backdrop-blur-sm text-[#00245D] hover:bg-[#99D6EA]/30 shadow-lg hover:shadow-xl'}`}>
              📊 Analytics
            </button>
            <button onClick={() => setActiveTab('invitations')} className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${activeTab === 'invitations' ? 'bg-[#00245D] text-white shadow-xl' : 'bg-white/95 backdrop-blur-sm text-[#00245D] hover:bg-[#99D6EA]/30 shadow-lg hover:shadow-xl'}`}>
              📧 Invitations
            </button>
            <button onClick={() => setActiveTab('users')} className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${activeTab === 'users' ? 'bg-[#00245D] text-white shadow-xl' : 'bg-white/95 backdrop-blur-sm text-[#00245D] hover:bg-[#99D6EA]/30 shadow-lg hover:shadow-xl'}`}>
              👥 Users
            </button>
            <button onClick={() => setActiveTab('needs')} className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${activeTab === 'needs' ? 'bg-[#00245D] text-white shadow-xl' : 'bg-white/95 backdrop-blur-sm text-[#00245D] hover:bg-[#99D6EA]/30 shadow-lg hover:shadow-xl'}`}>
              📋 Needs
            </button>
            <button onClick={() => setActiveTab('scoring')} className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${activeTab === 'scoring' ? 'bg-[#00245D] text-white shadow-xl' : 'bg-white/95 backdrop-blur-sm text-[#00245D] hover:bg-[#99D6EA]/30 shadow-lg hover:shadow-xl'}`}>
              🤖 AI Scoring
            </button>
            <button onClick={() => setActiveTab('settings')} className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${activeTab === 'settings' ? 'bg-[#00245D] text-white shadow-xl' : 'bg-white/95 backdrop-blur-sm text-[#00245D] hover:bg-[#99D6EA]/30 shadow-lg hover:shadow-xl'}`}>
              ⚙️ Settings
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00245D]"></div>
            </div>
          ) : (
            <>
              {/* Analytics Tab */}
              {activeTab === 'analytics' && analytics && (
                <div className="space-y-6">
                  {/* Key Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 border border-[#D4C4A8] shadow-lg hover:shadow-xl transition-shadow">
                      <div className="text-sm text-[#00245D]/60 font-medium">Total Users</div>
                      <div className="text-3xl font-bold text-[#00245D] mt-2">{analytics.totalUsers}</div>
                      <div className="text-xs text-[#00245D]/50 mt-1">{analytics.totalAdmins} admins</div>
                    </div>
                    <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 border border-[#D4C4A8] shadow-lg hover:shadow-xl transition-shadow">
                      <div className="text-sm text-[#00245D]/60 font-medium">Onboarding</div>
                      <div className="text-3xl font-bold text-green-600 mt-2">{analytics.onboardedUsers}</div>
                      <div className="text-xs text-[#00245D]/50 mt-1">{analytics.pendingOnboarding} pending</div>
                    </div>
                    <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 border border-[#D4C4A8] shadow-lg hover:shadow-xl transition-shadow">
                      <div className="text-sm text-[#00245D]/60 font-medium">Community Data</div>
                      <div className="text-3xl font-bold text-[#99D6EA] mt-2">{analytics.totalSkills}</div>
                      <div className="text-xs text-[#00245D]/50 mt-1">{analytics.totalConnections} connections</div>
                    </div>
                    <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 border border-[#D4C4A8] shadow-lg hover:shadow-xl transition-shadow">
                      <div className="text-sm text-[#00245D]/60 font-medium">Active Needs</div>
                      <div className="text-3xl font-bold text-[#00245D] mt-2">{analytics.activeNeeds}</div>
                      <div className="text-xs text-[#00245D]/50 mt-1">of {analytics.totalNeeds} total</div>
                    </div>
                  </div>

                  {/* Charts */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 border border-[#D4C4A8] shadow-lg hover:shadow-xl transition-shadow">
                      <h3 className="text-lg font-semibold text-[#00245D] mb-4">Top Skill Categories</h3>
                      <div className="space-y-3">
                        {analytics.topSkillCategories.map((cat, idx) => (
                          <div key={idx}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-[#00245D]">{cat.category}</span>
                              <span className="font-medium text-[#00245D]">{cat.count}</span>
                            </div>
                            <div className="w-full bg-[#D4C4A8]/30 rounded-full h-2">
                              <div className="bg-[#00245D] h-2 rounded-full" style={{ width: `${(cat.count / analytics.totalSkills) * 100}%` }}></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 border border-[#D4C4A8] shadow-lg hover:shadow-xl transition-shadow">
                      <h3 className="text-lg font-semibold text-[#00245D] mb-4">Top Connection Sectors</h3>
                      <div className="space-y-3">
                        {analytics.topConnectionSectors.map((sector, idx) => (
                          <div key={idx}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-[#00245D]">{sector.sector}</span>
                              <span className="font-medium text-[#00245D]">{sector.count}</span>
                            </div>
                            <div className="w-full bg-[#D4C4A8]/30 rounded-full h-2">
                              <div className="bg-[#99D6EA] h-2 rounded-full" style={{ width: `${(sector.count / analytics.totalConnections) * 100}%` }}></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Recent Users */}
                  <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 border border-[#D4C4A8] shadow-lg hover:shadow-xl transition-shadow">
                    <h3 className="text-lg font-semibold text-[#00245D] mb-4">Recent Users</h3>
                    <div className="space-y-2">
                      {analytics.recentUsers.map((u, idx) => (
                        <div key={idx} className="flex justify-between items-center py-2 border-b border-[#D4C4A8]/30 last:border-b-0">
                          <span className="text-[#00245D]">{u.email}</span>
                          <span className="text-sm text-[#00245D]/60">{new Date(u.createdAt).toLocaleDateString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Invitations Tab */}
              {activeTab === 'invitations' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-xl transition-shadow p-6 border border-[#D4C4A8]">
                    <h2 className="text-lg font-semibold text-[#00245D] mb-4">Send New Invitation</h2>
                    <form onSubmit={handleSendInvitation} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-[#00245D] mb-1">Email Address</label>
                        <input
                          type="email"
                          value={newInvitationEmail}
                          onChange={(e) => setNewInvitationEmail(e.target.value)}
                          className="w-full px-4 py-2 border border-[#D4C4A8] rounded-lg focus:ring-2 focus:ring-[#00245D] focus:border-[#00245D]"
                          placeholder="user@example.com"
                          required
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={invitingUser}
                        className="w-full py-3 bg-[#00245D] text-white rounded-lg font-medium hover:bg-[#00245D]/90 disabled:opacity-50 transition-colors"
                      >
                        {invitingUser ? 'Sending...' : 'Generate Invitation Link'}
                      </button>
                    </form>
                    {invitationLink && (
                      <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm font-medium text-green-800 mb-2">Invitation created successfully!</p>

                        {/* Email Status */}
                        {invitationEmailStatus && (
                          <div className={`text-xs p-2 rounded mb-2 ${invitationEmailStatus.sent
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'}`}>
                            {invitationEmailStatus.sent
                              ? '✅ Email invitation sent successfully!'
                              : `⚠️ Email could not be sent. ${invitationEmailStatus.error || 'Please share the link manually.'}`}
                          </div>
                        )}

                        <p className="text-xs text-green-700 mb-2">Copy this link and send it to the invitee:</p>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={invitationLink}
                            readOnly
                            className="flex-1 px-3 py-2 bg-white border border-green-300 rounded text-sm"
                          />
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(invitationLink);
                              alert('Link copied to clipboard!');
                            }}
                            className="px-4 py-2 bg-green-600 text-white rounded font-medium hover:bg-green-700 transition-colors"
                          >
                            Copy
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-xl transition-shadow p-6 border border-[#D4C4A8]">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-lg font-semibold text-[#00245D]">Invitation History</h2>
                      {invitations.length > 0 && (
                        <button
                          onClick={() => setShowClearInvitationsConfirm(true)}
                          className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                        >
                          Clear All
                        </button>
                      )}
                    </div>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {invitations.length === 0 ? (
                        <p className="text-[#00245D]/60 text-center py-8">No invitations sent yet</p>
                      ) : (
                        invitations.map(inv => (
                          <div key={inv.id} className="p-3 bg-[#D4C4A8]/20 rounded-lg">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className="font-medium text-[#00245D]">{inv.email}</p>
                                <p className="text-xs text-[#00245D]/60 mt-1">
                                  Invited by {inv.inviterName || inv.inviterEmail} on {new Date(inv.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                              <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${inv.status === 'accepted' ? 'bg-green-100 text-green-800' :
                                inv.status === 'expired' ? 'bg-red-100 text-red-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }`}>
                                {inv.status}
                              </span>
                            </div>
                            <div className="flex gap-2 mt-2">
                              {inv.status === 'pending' && (
                                <button
                                  onClick={() => handleResendInvitation(inv.id, inv.email)}
                                  className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                                >
                                  Resend
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteInvitation(inv.id)}
                                className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Users Tab */}
              {activeTab === 'users' && (
                <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-xl transition-shadow p-6 border border-[#D4C4A8]">
                  <div className="mb-4">
                    <h2 className="text-lg font-semibold text-[#00245D]">User Management</h2>
                    <p className="text-sm text-[#00245D]/60 mt-1">Manage users, assign admin roles, and monitor onboarding status. Use the Invitations tab to invite new users.</p>
                  </div>

                  {/* Search Bar */}
                  <div className="mb-4">
                    <input
                      type="text"
                      placeholder="Search by email, name, or skills..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-4 py-2 border border-[#D4C4A8] rounded-lg focus:ring-2 focus:ring-[#00245D] focus:border-[#00245D]"
                    />
                  </div>

                  {/* Filter Buttons */}
                  <div className="flex gap-2 mb-4">
                    <button onClick={() => setUserFilter('all')} className={`px-3 py-1 rounded text-sm ${userFilter === 'all' ? 'bg-[#00245D] text-white' : 'bg-[#D4C4A8]/30 text-[#00245D]'}`}>All ({users.length})</button>
                    <button onClick={() => setUserFilter('onboarded')} className={`px-3 py-1 rounded text-sm ${userFilter === 'onboarded' ? 'bg-[#00245D] text-white' : 'bg-[#D4C4A8]/30 text-[#00245D]'}`}>Onboarded</button>
                    <button onClick={() => setUserFilter('pending')} className={`px-3 py-1 rounded text-sm ${userFilter === 'pending' ? 'bg-[#00245D] text-white' : 'bg-[#D4C4A8]/30 text-[#00245D]'}`}>Pending</button>
                    <button onClick={() => setUserFilter('admins')} className={`px-3 py-1 rounded text-sm ${userFilter === 'admins' ? 'bg-[#00245D] text-white' : 'bg-[#D4C4A8]/30 text-[#00245D]'}`}>Admins</button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-[#D4C4A8]">
                          <th className="text-left py-3 px-4 text-sm font-medium text-[#00245D]">Email</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-[#00245D]">Name</th>
                          <th className="text-center py-3 px-4 text-sm font-medium text-[#00245D]">Skills</th>
                          <th className="text-center py-3 px-4 text-sm font-medium text-[#00245D]">Connections</th>
                          <th className="text-center py-3 px-4 text-sm font-medium text-[#00245D]">Status</th>
                          <th className="text-center py-3 px-4 text-sm font-medium text-[#00245D]">Admin</th>
                          <th className="text-center py-3 px-4 text-sm font-medium text-[#00245D]">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getFilteredUsers().length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-8 text-center text-[#00245D]/60">
                              No users found
                            </td>
                          </tr>
                        ) : (
                          getFilteredUsers().map(u => (
                            <tr key={u.id} className="border-b border-[#D4C4A8]/30 hover:bg-[#D4C4A8]/10">
                              <td className="py-3 px-4 text-sm text-[#00245D]">{u.email}</td>
                              <td className="py-3 px-4 text-sm text-[#00245D]">{u.displayName || '-'}</td>
                              <td className="py-3 px-4 text-sm text-center text-[#00245D]">{u.skillsCount}</td>
                              <td className="py-3 px-4 text-sm text-center text-[#00245D]">{u.connectionsCount}</td>
                              <td className="py-3 px-4 text-center">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${u.onboardingComplete ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                  {u.onboardingComplete ? 'Complete' : 'Pending'}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center">
                                {u.isAdmin ? (
                                  <span className="px-3 py-1 rounded text-xs font-medium bg-[#00245D] text-white">
                                    👑 Admin
                                  </span>
                                ) : (
                                  <span className="px-3 py-1 rounded text-xs font-medium bg-gray-100 text-gray-600">
                                    Member
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-center">
                                <button
                                  onClick={() => setShowDeleteConfirm(u.id)}
                                  disabled={u.id === user?.uid}
                                  className="px-3 py-1 bg-red-500 text-white rounded text-xs font-medium hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Needs Tab */}
              {activeTab === 'needs' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-xl transition-shadow p-6 border border-[#D4C4A8]">
                    <h2 className="text-lg font-semibold text-[#00245D] mb-4">
                      {editingNeed ? 'Edit Need' : 'Create New Need'}
                    </h2>
                    <form onSubmit={editingNeed ? handleUpdateNeed : handleCreateNeed} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-[#00245D] mb-1">Title</label>
                        <input
                          type="text"
                          value={editingNeed ? editNeedData.title : newNeed.title}
                          onChange={(e) => editingNeed
                            ? setEditNeedData({ ...editNeedData, title: e.target.value })
                            : setNewNeed({ ...newNeed, title: e.target.value })
                          }
                          className="w-full px-4 py-2 border border-[#D4C4A8] rounded-lg focus:ring-2 focus:ring-[#00245D] focus:border-[#00245D]"
                          placeholder="What does the community need?"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#00245D] mb-1">Category</label>
                        <select
                          value={editingNeed ? editNeedData.category : newNeed.category}
                          onChange={(e) => editingNeed
                            ? setEditNeedData({ ...editNeedData, category: e.target.value as SkillCategory })
                            : setNewNeed({ ...newNeed, category: e.target.value as SkillCategory })
                          }
                          className="w-full px-4 py-2 border border-[#D4C4A8] rounded-lg focus:ring-2 focus:ring-[#00245D] focus:border-[#00245D]"
                        >
                          {SKILL_CATEGORIES.map(cat => (<option key={cat} value={cat}>{cat}</option>))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#00245D] mb-1">Description</label>
                        <textarea
                          value={editingNeed ? editNeedData.description : newNeed.description}
                          onChange={(e) => editingNeed
                            ? setEditNeedData({ ...editNeedData, description: e.target.value })
                            : setNewNeed({ ...newNeed, description: e.target.value })
                          }
                          className="w-full px-4 py-2 border border-[#D4C4A8] rounded-lg focus:ring-2 focus:ring-[#00245D] focus:border-[#00245D]"
                          rows={4}
                          placeholder="Describe the need in detail..."
                          required
                        />
                      </div>
                      {submitMessage && <div className={`text-sm p-3 rounded-lg ${submitMessage.includes('Error') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>{submitMessage}</div>}
                      <div className="flex gap-2">
                        <button type="submit" disabled={submitting} className="flex-1 py-3 bg-[#00245D] text-white rounded-lg font-medium hover:bg-[#00245D]/90 disabled:opacity-50 transition-colors">
                          {submitting ? 'Saving...' : (editingNeed ? 'Update Need' : 'Create Need')}
                        </button>
                        {editingNeed && (
                          <button
                            type="button"
                            onClick={() => { setEditingNeed(null); setSubmitMessage(''); }}
                            className="px-4 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </form>
                  </div>
                  <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-xl transition-shadow p-6 border border-[#D4C4A8]">
                    <h2 className="text-lg font-semibold text-[#00245D] mb-4">Manage Needs</h2>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {needs.map(need => (
                        <div key={need.id} className="p-3 bg-[#D4C4A8]/30 rounded-lg hover:bg-[#D4C4A8]/40 transition-colors">
                          <div className="flex items-center justify-between">
                            <Link href={`/admin/needs/${need.id}`} className="flex-1 min-w-0 group">
                              <p className="font-medium text-[#00245D] truncate group-hover:text-[#00245D]/70 transition-colors cursor-pointer">
                                {need.title} →
                              </p>
                              <p className="text-sm text-[#00245D]/60">{need.category}</p>
                            </Link>
                            <button
                              onClick={() => toggleNeedStatus(need.id, need.isActive)}
                              className={`px-3 py-1 rounded-full text-sm font-medium ${need.isActive ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                            >
                              {need.isActive ? 'Active' : 'Inactive'}
                            </button>
                          </div>
                          <p className="text-xs text-[#00245D]/50 mt-2 line-clamp-2">{need.description}</p>
                          <div className="flex gap-2 mt-2">
                            <Link
                              href={`/admin/needs/${need.id}`}
                              className="px-3 py-1 bg-purple-100 text-purple-600 rounded text-sm font-medium hover:bg-purple-200 transition-colors"
                            >
                              👥 View Matches
                            </Link>
                            <button
                              onClick={() => handleEditNeed(need)}
                              className="px-3 py-1 bg-blue-100 text-blue-600 rounded text-sm font-medium hover:bg-blue-200 transition-colors"
                            >
                              ✏️ Edit
                            </button>
                            <button
                              onClick={() => setShowDeleteNeedConfirm(need.id)}
                              className="px-3 py-1 bg-red-100 text-red-600 rounded text-sm font-medium hover:bg-red-200 transition-colors"
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* AI Scoring Tab */}
              {activeTab === 'scoring' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-xl transition-shadow p-6 border border-[#D4C4A8]">
                    <h2 className="text-lg font-semibold text-[#00245D] mb-4">🤖 AI Scoring Optimization</h2>
                    <p className="text-[#00245D]/60 mb-4">Use AI to analyze community data and optimize the scoring algorithm weights for better matching.</p>
                    <button onClick={runAIAnalysis} disabled={analyzingAI} className="w-full py-3 bg-[#00245D] text-white rounded-lg font-medium hover:bg-[#00245D]/90 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                      {analyzingAI ? (<><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>Analyzing...</>) : '🔄 Run AI Analysis'}
                    </button>
                    {aiMessage && <div className={`mt-4 text-sm p-3 rounded-lg ${aiMessage.includes('Error') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>{aiMessage}</div>}
                    {scoringConfig?.aiAnalysis && (
                      <div className="mt-4 p-4 bg-[#99D6EA]/30 rounded-lg">
                        <h3 className="font-medium text-[#00245D] mb-2">Last AI Analysis</h3>
                        <p className="text-sm text-[#00245D]/80 mb-2">{scoringConfig.aiAnalysis.reasoning}</p>
                        <div className="flex gap-4 text-xs text-[#00245D]/60">
                          <span>Confidence: {Math.round((scoringConfig.aiAnalysis.confidence || 0) * 100)}%</span>
                          <span>Data Points: {scoringConfig.aiAnalysis.dataPointsAnalyzed}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-xl transition-shadow p-6 border border-[#D4C4A8]">
                    <h2 className="text-lg font-semibold text-[#00245D] mb-4">Current Scoring Weights</h2>
                    {scoringConfig ? (
                      <div className="space-y-4">
                        <div><h3 className="text-sm font-medium text-[#00245D] mb-2">Base Weights</h3><div className="grid grid-cols-3 gap-2">{Object.entries(scoringConfig.weights).map(([k, v]) => (<div key={k} className="bg-[#D4C4A8]/30 p-2 rounded text-center"><div className="text-xs text-[#00245D]/60">{k}</div><div className="font-semibold text-[#00245D]">{v}</div></div>))}</div></div>
                        <div><h3 className="text-sm font-medium text-[#00245D] mb-2">Willingness Multipliers</h3><div className="grid grid-cols-5 gap-2">{Object.entries(scoringConfig.willingnessMultipliers).map(([k, v]) => (<div key={k} className="bg-[#99D6EA]/30 p-2 rounded text-center"><div className="text-xs text-[#00245D]/60">{k.replace('_', ' ')}</div><div className="font-semibold text-[#00245D]">{v}x</div></div>))}</div></div>
                        <div><h3 className="text-sm font-medium text-[#00245D] mb-2">Relationship Multipliers</h3><div className="grid grid-cols-3 gap-2">{Object.entries(scoringConfig.relationshipMultipliers).map(([k, v]) => (<div key={k} className="bg-[#00245D]/10 p-2 rounded text-center"><div className="text-xs text-[#00245D]/60">{k.replace('_', ' ')}</div><div className="font-semibold text-[#00245D]">{v}x</div></div>))}</div></div>
                      </div>
                    ) : <p className="text-[#00245D]/60">Loading configuration...</p>}
                  </div>
                </div>
              )}

              {/* Settings Tab */}
              {activeTab === 'settings' && (
                <div className="space-y-8">
                  {/* Account Settings Row */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Email Change Card */}
                    <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-xl transition-shadow p-6 border border-[#D4C4A8]">
                      <h2 className="text-lg font-semibold text-[#00245D] mb-4">📧 Change Email</h2>
                      <p className="text-[#00245D]/60 mb-4">Update your admin account email address.</p>
                      <form onSubmit={handleChangeEmail} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-[#00245D] mb-1">Current Email</label>
                          <input
                            type="email"
                            value={user?.email || ''}
                            readOnly
                            className="w-full px-4 py-2 border border-[#D4C4A8] rounded-lg bg-gray-50 text-[#00245D]/60 cursor-not-allowed"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#00245D] mb-1">New Email</label>
                          <input
                            type="email"
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            className="w-full px-4 py-2 border border-[#D4C4A8] rounded-lg focus:ring-2 focus:ring-[#00245D] focus:border-[#00245D]"
                            placeholder="Enter new email"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#00245D] mb-1">Confirm New Email</label>
                          <input
                            type="email"
                            value={confirmNewEmail}
                            onChange={(e) => setConfirmNewEmail(e.target.value)}
                            className="w-full px-4 py-2 border border-[#D4C4A8] rounded-lg focus:ring-2 focus:ring-[#00245D] focus:border-[#00245D]"
                            placeholder="Confirm new email"
                            required
                          />
                        </div>
                        {emailMessage && (
                          <div className={`text-sm p-3 rounded-lg ${emailMessage.includes('Error') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                            {emailMessage}
                          </div>
                        )}
                        <button
                          type="submit"
                          disabled={changingEmail}
                          className="w-full py-3 bg-[#00245D] text-white rounded-lg font-medium hover:bg-[#00245D]/90 disabled:opacity-50 transition-colors"
                        >
                          {changingEmail ? 'Updating...' : 'Update Email'}
                        </button>
                      </form>
                    </div>

                    {/* Password Change Card */}
                    <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-xl transition-shadow p-6 border border-[#D4C4A8]">
                      <h2 className="text-lg font-semibold text-[#00245D] mb-4">🔐 Change Password</h2>
                      <p className="text-[#00245D]/60 mb-4">Update your admin account password.</p>
                      <form onSubmit={handleChangePassword} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-[#00245D] mb-1">New Password</label>
                          <PasswordInput
                            id="newPassword"
                            name="newPassword"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Enter new password"
                            required
                            minLength={6}
                            autoComplete="new-password"
                            className="w-full px-4 py-2 border border-[#D4C4A8] rounded-lg focus:ring-2 focus:ring-[#00245D] focus:border-[#00245D]"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#00245D] mb-1">Confirm New Password</label>
                          <PasswordInput
                            id="confirmNewPassword"
                            name="confirmNewPassword"
                            value={confirmNewPassword}
                            onChange={(e) => setConfirmNewPassword(e.target.value)}
                            placeholder="Confirm new password"
                            required
                            minLength={6}
                            autoComplete="new-password"
                            className="w-full px-4 py-2 border border-[#D4C4A8] rounded-lg focus:ring-2 focus:ring-[#00245D] focus:border-[#00245D]"
                          />
                        </div>
                        {passwordMessage && (
                          <div className={`text-sm p-3 rounded-lg ${passwordMessage.includes('Error') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                            {passwordMessage}
                          </div>
                        )}
                        <button
                          type="submit"
                          disabled={changingPassword}
                          className="w-full py-3 bg-[#00245D] text-white rounded-lg font-medium hover:bg-[#00245D]/90 disabled:opacity-50 transition-colors"
                        >
                          {changingPassword ? 'Updating...' : 'Update Password'}
                        </button>
                      </form>
                    </div>
                  </div>

                  {/* Admin Profile Card */}
                  <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-xl transition-shadow p-6 border border-[#D4C4A8]">
                    <h2 className="text-lg font-semibold text-[#00245D] mb-4">👤 Admin Profile</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="flex items-center gap-4 p-4 bg-[#D4C4A8]/20 rounded-lg">
                        <div className="w-16 h-16 bg-[#00245D] rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                          {user?.email?.[0].toUpperCase() || 'A'}
                        </div>
                        <div>
                          <p className="font-semibold text-[#00245D]">{user?.email}</p>
                          <span className="inline-flex items-center gap-1 bg-[#00245D] text-white px-2 py-0.5 rounded-full text-xs mt-1">
                            👑 Administrator
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-[#99D6EA]/30 rounded-lg text-center">
                          <div className="text-2xl font-bold text-[#00245D]">{users.length}</div>
                          <div className="text-xs text-[#00245D]/60">Total Users</div>
                        </div>
                        <div className="p-3 bg-[#99D6EA]/30 rounded-lg text-center">
                          <div className="text-2xl font-bold text-[#00245D]">{needs.length}</div>
                          <div className="text-xs text-[#00245D]/60">Total Needs</div>
                        </div>
                      </div>
                      <div className="p-3 bg-[#D4C4A8]/30 rounded-lg flex items-center">
                        <p className="text-sm text-[#00245D]/80">
                          <span className="font-medium">Platform:</span> Caps Collective - Family Soccer Community
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </main>

        {/* Delete Confirmation Modal */}
        {
          showDeleteConfirm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                <h3 className="text-xl font-bold text-[#00245D] mb-4">Confirm Delete User</h3>
                <p className="text-[#00245D]/80 mb-6">
                  Are you sure you want to delete this user? This action cannot be undone and will remove all their data, including skills, connections, and activity.
                </p>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setShowDeleteConfirm(null)}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDeleteUser(showDeleteConfirm)}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
                  >
                    Delete User
                  </button>
                </div>
              </div>
            </div>
          )
        }

        {/* Delete Need Confirmation Modal */}
        {
          showDeleteNeedConfirm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                <h3 className="text-xl font-bold text-[#00245D] mb-4">Confirm Delete Need</h3>
                <p className="text-[#00245D]/80 mb-6">
                  Are you sure you want to delete this need? This action cannot be undone.
                </p>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setShowDeleteNeedConfirm(null)}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDeleteNeed(showDeleteNeedConfirm)}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
                  >
                    Delete Need
                  </button>
                </div>
              </div>
            </div>
          )
        }

        {/* Clear Invitations Confirmation Modal */}
        {
          showClearInvitationsConfirm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                <h3 className="text-xl font-bold text-[#00245D] mb-4">Clear All Invitations</h3>
                <p className="text-[#00245D]/80 mb-6">
                  Are you sure you want to clear all invitation history? This action cannot be undone.
                </p>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setShowClearInvitationsConfirm(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleClearInvitations}
                    disabled={clearingInvitations}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium disabled:opacity-50"
                  >
                    {clearingInvitations ? 'Clearing...' : 'Clear All'}
                  </button>
                </div>
              </div>
            </div>
          )
        }
      </div >
    </ProtectedRoute >
  );
}
