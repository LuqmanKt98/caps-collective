'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import Pagination from '@/components/Pagination';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import PasswordInput from '@/components/PasswordInput';
import {
  SKILL_CATEGORIES,
  SkillCategory,
  Need,
  ScoringConfig,
  InvitationWithDetails,
  InvitationType,
  UserWithStats,
  AnalyticsSummary,
  Skill,
  Connection
} from '@/types';

type TabType = 'needs' | 'invitations' | 'users' | 'analytics' | 'scoring' | 'settings';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>('analytics');

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['needs', 'invitations', 'users', 'analytics', 'scoring', 'settings'].includes(tab)) {
      setActiveTab(tab as TabType);
    }
  }, [searchParams]);

  // Needs state
  const [needs, setNeeds] = useState<Need[]>([]);
  const [newNeed, setNewNeed] = useState({
    title: '',
    category: 'Sports & Coaching' as SkillCategory,
    // Structured fields for formatted description
    location: '',
    timeline: '',
    overview: '',
    scopeItems: [''],
    requirements: [''],
    additionalInfo: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  // Invitations state
  const [invitations, setInvitations] = useState<InvitationWithDetails[]>([]);
  const [newInvitationEmail, setNewInvitationEmail] = useState('');
  const [publicLinkName, setPublicLinkName] = useState('');
  const [invitationType, setInvitationType] = useState<InvitationType>('public');
  const [invitationLink, setInvitationLink] = useState('');
  const [invitingUser, setInvitingUser] = useState(false);
  const [invitationEmailStatus, setInvitationEmailStatus] = useState<{ sent: boolean; error?: string } | null>(null);
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);

  // Users state
  const [users, setUsers] = useState<UserWithStats[]>([]);
  const [userFilter, setUserFilter] = useState<'all' | 'onboarded' | 'pending' | 'admins' | 'public-link' | 'direct-signup'>('all');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showDeleteNeedConfirm, setShowDeleteNeedConfirm] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Tooltip state for skills
  const [skillTooltip, setSkillTooltip] = useState<{
    x: number;
    y: number;
    skills: string[];
    visible: boolean;
  }>({ x: 0, y: 0, skills: [], visible: false });

  const handleTooltipEnter = (e: React.MouseEvent, skills: string[]) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setSkillTooltip({
      x: rect.left + window.scrollX,
      y: rect.bottom + window.scrollY,
      skills,
      visible: true
    });
  };

  const handleTooltipLeave = () => {
    setSkillTooltip(prev => ({ ...prev, visible: false }));
  };

  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Modal pagination state
  const [modalSkillsPage, setModalSkillsPage] = useState(1);
  const [modalConnectionsPage, setModalConnectionsPage] = useState(1);

  // Get all unique skills from users for autocomplete
  const uniqueSkills = Array.from(new Set(users.flatMap(u => u.skills || []))).sort();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim().length > 0) {
      const matches = uniqueSkills
        .filter(skill => skill.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 5);
      setSuggestions(matches);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (skill: string) => {
    setSearchQuery(skill);
    setShowSuggestions(false);
  };

  // Helper to parse Firestore timestamps
  const parseFirestoreDate = (date: any): Date | null => {
    if (!date) return null;
    // Handle Firestore Timestamp with _seconds
    if (date._seconds) {
      return new Date(date._seconds * 1000);
    }
    // Handle toDate method (Firestore Timestamp)
    if (typeof date.toDate === 'function') {
      return date.toDate();
    }
    // Handle regular Date or ISO string
    const parsed = new Date(date);
    return isNaN(parsed.getTime()) ? null : parsed;
  };

  const formatDate = (date: any, options?: Intl.DateTimeFormatOptions): string => {
    const parsed = parseFirestoreDate(date);
    if (!parsed) return '-';
    return parsed.toLocaleDateString('en-US', options || { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatDateTime = (date: any): string => {
    const parsed = parseFirestoreDate(date);
    if (!parsed) return '-';
    return parsed.toLocaleString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const [togglingAdmin, setTogglingAdmin] = useState<string | null>(null);

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
  const [editNeedData, setEditNeedData] = useState({ title: '', description: '', category: 'Sports & Coaching' as SkillCategory });

  // Clear invitation state
  const [showClearInvitationsConfirm, setShowClearInvitationsConfirm] = useState(false);
  const [clearingInvitations, setClearingInvitations] = useState(false);

  // Needs search state
  const [needsSearchQuery, setNeedsSearchQuery] = useState('');

  // Pending responses count for notification badge
  const [pendingResponsesCount, setPendingResponsesCount] = useState(0);
  const [needResponseCounts, setNeedResponseCounts] = useState<Record<string, { total: number; pending: number }>>({});

  // Pagination state
  const [needsPage, setNeedsPage] = useState(1);
  const [usersPage, setUsersPage] = useState(1);
  const [invitationsPage, setInvitationsPage] = useState(1);
  const itemsPerPage = 10;


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

      const [needsRes, invitationsRes, usersRes, analyticsRes, configRes, responsesRes] = await Promise.all([
        fetch(`/api/needs?active=all`, { headers }),
        fetch(`/api/invitations?userId=${user.uid}`, { headers }),
        fetch(`/api/users?userId=${user.uid}`, { headers }),
        fetch(`/api/analytics?userId=${user.uid}`, { headers }),
        fetch('/api/scoring-config', { headers }),
        fetch('/api/need-responses', { headers }), // Fetch all responses for admin
      ]);

      const [needsData, invitationsData, usersData, analyticsData, configData, responsesData] = await Promise.all([
        needsRes.json(),
        invitationsRes.json(),
        usersRes.json(),
        analyticsRes.json(),
        configRes.json(),
        responsesRes.json(),
      ]);

      if (needsData.success) setNeeds(needsData.data.needs);
      if (invitationsData.success) setInvitations(invitationsData.data.invitations);
      if (usersData.success) setUsers(usersData.data.users);
      if (analyticsData.success) setAnalytics(analyticsData.data);
      if (configData.success) setScoringConfig(configData.data);

      // Count pending responses
      if (responsesData.success) {
        const pendingCount = responsesData.data.responses.filter(
          (r: { status: string }) => r.status === 'pending'
        ).length;
        setPendingResponsesCount(pendingCount);

        // Group responses by needId
        const responsesByNeed: Record<string, { total: number; pending: number }> = {};
        responsesData.data.responses.forEach((response: { needId: string; status: string }) => {
          if (!responsesByNeed[response.needId]) {
            responsesByNeed[response.needId] = { total: 0, pending: 0 };
          }
          responsesByNeed[response.needId].total++;
          if (response.status === 'pending') {
            responsesByNeed[response.needId].pending++;
          }
        });
        setNeedResponseCounts(responsesByNeed);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // User details modal state
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userDetails, setUserDetails] = useState<{
    user: UserWithStats;
    skills: Skill[];
    connections: Connection[];
  } | null>(null);
  const [loadingUserDetails, setLoadingUserDetails] = useState(false);

  // Reset modal pagination when modal opens and lock/unlock body scroll
  useEffect(() => {
    if (selectedUserId) {
      setModalSkillsPage(1);
      setModalConnectionsPage(1);
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [selectedUserId]);

  const fetchUserDetails = async (userId: string) => {
    if (!user) return;
    setLoadingUserDetails(true);
    setSelectedUserId(userId);
    setUserDetails(null);

    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/admin/user-details?userId=${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setUserDetails(data.data);
      } else {
        alert('Failed to load user details');
      }
    } catch (error) {
      console.error('Error loading user details:', error);
      alert('Error loading user details');
    } finally {
      setLoadingUserDetails(false);
    }
  };

  // Helper to format structured data into description
  const formatNeedDescription = () => {
    const parts: string[] = [];

    // Key details
    if (newNeed.location) parts.push(`Project Location: ${newNeed.location}`);
    if (newNeed.timeline) parts.push(`Timeline: ${newNeed.timeline}`);

    // Overview section
    if (newNeed.overview) {
      parts.push(`—— Project Overview ${newNeed.overview}`);
    }

    // Scope section with items
    const validScopes = newNeed.scopeItems.filter(s => s.trim());
    if (validScopes.length > 0) {
      parts.push(`—— Scope of Work ${validScopes.map((item, i) => `${i + 1}. ${item}`).join(' · ')}`);
    }

    // Requirements section
    const validReqs = newNeed.requirements.filter(r => r.trim());
    if (validReqs.length > 0) {
      parts.push(`—— Requirements ${validReqs.join(' · ')}`);
    }

    // Additional info
    if (newNeed.additionalInfo) {
      parts.push(`—— Additional Information ${newNeed.additionalInfo}`);
    }

    return parts.join(' ');
  };

  const handleCreateNeed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newNeed.title || !newNeed.overview) return;

    setSubmitting(true);
    setSubmitMessage('');

    const formattedDescription = formatNeedDescription();

    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/needs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: newNeed.title,
          description: formattedDescription,
          category: newNeed.category,
          userId: user.uid,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSubmitMessage('Need created successfully!');
        setNewNeed({
          title: '',
          category: 'Sports & Coaching',
          location: '',
          timeline: '',
          overview: '',
          scopeItems: [''],
          requirements: [''],
          additionalInfo: '',
        });
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

  const handleCreateInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // For personal invitations, require email
    if (invitationType === 'personal' && !newInvitationEmail) {
      alert('Please enter an email address for personal invitations');
      return;
    }

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
          type: invitationType,
          ...(invitationType === 'personal' ? { email: newInvitationEmail } : { name: publicLinkName || 'Public Invitation Link' }),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setInvitationLink(data.data.invitationLink);
        if (invitationType === 'personal') {
          setInvitationEmailStatus({
            sent: data.data.emailSent,
            error: data.data.emailError,
          });
        }
        setNewInvitationEmail('');
        setPublicLinkName('');
        await fetchAllData();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      alert('Failed to create invitation');
    } finally {
      setInvitingUser(false);
    }
  };

  const copyToClipboard = async (text: string, id?: string) => {
    try {
      await navigator.clipboard.writeText(text);
      if (id) {
        setCopiedLinkId(id);
        setTimeout(() => setCopiedLinkId(null), 2000);
      }
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const toggleUserAdmin = async (targetUserId: string, currentStatus: boolean) => {
    if (!user) return;
    setTogglingAdmin(targetUserId);

    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          targetUserId,
          updates: { isAdmin: !currentStatus },
        }),
      });

      const data = await response.json();

      if (data.success) {
        setUsers(users.map(u =>
          u.id === targetUserId ? { ...u, isAdmin: !currentStatus } : u
        ));
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error toggling admin status:', error);
      alert('Failed to update admin status');
    } finally {
      setTogglingAdmin(null);
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
      case 'public-link':
        // Users who joined via public invitation link
        filtered = filtered.filter(u => u.invitationId && u.invitationType === 'public');
        break;
      case 'direct-signup':
        // Users who signed up directly (no invitation)
        filtered = filtered.filter(u => !u.invitationId);
        break;
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(u =>
        u.email?.toLowerCase().includes(query) ||
        u.displayName?.toLowerCase().includes(query) ||
        u.skills?.some(skill => skill.toLowerCase().includes(query))
      );
    }

    return filtered;
  };

  const getPaginatedUsers = () => {
    const filtered = getFilteredUsers();
    const startIndex = (usersPage - 1) * itemsPerPage;
    return filtered.slice(startIndex, startIndex + itemsPerPage);
  };

  const getFilteredNeeds = () => {
    if (!needsSearchQuery.trim()) return needs;

    const query = needsSearchQuery.toLowerCase().trim();
    return needs.filter(need =>
      need.title.toLowerCase().includes(query) ||
      need.description.toLowerCase().includes(query) ||
      need.category.toLowerCase().includes(query)
    );
  };

  const getPaginatedNeeds = () => {
    const filtered = getFilteredNeeds();
    const startIndex = (needsPage - 1) * itemsPerPage;
    return filtered.slice(startIndex, startIndex + itemsPerPage);
  };

  const getPaginatedInvitations = () => {
    const startIndex = (invitationsPage - 1) * itemsPerPage;
    return invitations.slice(startIndex, startIndex + itemsPerPage);
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
      <div className="min-h-screen bg-pattern overflow-x-hidden">
        <Navbar />
        <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
          <div className="mb-6 md:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#00245D]">Admin Dashboard</h1>
            <p className="mt-1 text-sm sm:text-base text-[#00245D]/60">Manage community needs, users, and platform settings</p>
          </div>

          {/* Tabs - wraps into multiple rows on mobile */}
          <div className="flex flex-wrap gap-2 mb-4 md:mb-6">
            <button onClick={() => setActiveTab('analytics')} className={`px-3 py-1.5 sm:py-2 rounded-lg font-medium transition-all whitespace-nowrap text-xs sm:text-sm flex-shrink-0 ${activeTab === 'analytics' ? 'bg-[#00245D] text-white shadow-lg' : 'bg-white/95 backdrop-blur-sm text-[#00245D] hover:bg-[#99D6EA]/30 shadow-md'}`}>
              📊 Stats
            </button>
            <button onClick={() => setActiveTab('invitations')} className={`px-3 py-1.5 sm:py-2 rounded-lg font-medium transition-all whitespace-nowrap text-xs sm:text-sm flex-shrink-0 ${activeTab === 'invitations' ? 'bg-[#00245D] text-white shadow-lg' : 'bg-white/95 backdrop-blur-sm text-[#00245D] hover:bg-[#99D6EA]/30 shadow-md'}`}>
              📧 Invite
            </button>
            <button onClick={() => setActiveTab('users')} className={`px-3 py-1.5 sm:py-2 rounded-lg font-medium transition-all whitespace-nowrap text-xs sm:text-sm flex-shrink-0 relative ${activeTab === 'users' ? 'bg-[#00245D] text-white shadow-lg' : 'bg-white/95 backdrop-blur-sm text-[#00245D] hover:bg-[#99D6EA]/30 shadow-md'}`}>
              👥 Users
            </button>
            <button onClick={() => setActiveTab('needs')} className={`px-3 py-1.5 sm:py-2 rounded-lg font-medium transition-all whitespace-nowrap text-xs sm:text-sm flex-shrink-0 relative ${activeTab === 'needs' ? 'bg-[#00245D] text-white shadow-lg' : 'bg-white/95 backdrop-blur-sm text-[#00245D] hover:bg-[#99D6EA]/30 shadow-md'}`}>
              📋 Needs
              {pendingResponsesCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center animate-pulse shadow border border-white">
                  {pendingResponsesCount}
                </span>
              )}
            </button>
            <button onClick={() => setActiveTab('scoring')} className={`px-3 py-1.5 sm:py-2 rounded-lg font-medium transition-all whitespace-nowrap text-xs sm:text-sm flex-shrink-0 ${activeTab === 'scoring' ? 'bg-[#00245D] text-white shadow-lg' : 'bg-white/95 backdrop-blur-sm text-[#00245D] hover:bg-[#99D6EA]/30 shadow-md'}`}>
              🤖 AI
            </button>
            <button onClick={() => setActiveTab('settings')} className={`px-3 py-1.5 sm:py-2 rounded-lg font-medium transition-all whitespace-nowrap text-xs sm:text-sm flex-shrink-0 ${activeTab === 'settings' ? 'bg-[#00245D] text-white shadow-lg' : 'bg-white/95 backdrop-blur-sm text-[#00245D] hover:bg-[#99D6EA]/30 shadow-md'}`}>
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
                  <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <div className="bg-white/95 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-[#D4C4A8] shadow-lg hover:shadow-xl transition-shadow">
                      <div className="text-sm text-[#00245D]/60 font-medium">Total Users</div>
                      <div className="text-2xl sm:text-3xl font-bold text-[#00245D] mt-1 sm:mt-2">{analytics.totalUsers}</div>
                      <div className="text-xs text-[#00245D]/50 mt-1">{analytics.totalAdmins} admins</div>
                    </div>
                    <div className="bg-white/95 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-[#D4C4A8] shadow-lg hover:shadow-xl transition-shadow">
                      <div className="text-sm text-[#00245D]/60 font-medium">Onboarding</div>
                      <div className="text-2xl sm:text-3xl font-bold text-green-600 mt-1 sm:mt-2">{analytics.onboardedUsers}</div>
                      <div className="text-xs text-[#00245D]/50 mt-1">{analytics.pendingOnboarding} pending</div>
                    </div>
                    <div className="bg-white/95 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-[#D4C4A8] shadow-lg hover:shadow-xl transition-shadow">
                      <div className="text-sm text-[#00245D]/60 font-medium">Community Data</div>
                      <div className="text-2xl sm:text-3xl font-bold text-[#99D6EA] mt-1 sm:mt-2">{analytics.totalSkills}</div>
                      <div className="text-xs text-[#00245D]/50 mt-1">{analytics.totalConnections} connections</div>
                    </div>
                    <div className="bg-white/95 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-[#D4C4A8] shadow-lg hover:shadow-xl transition-shadow">
                      <div className="text-sm text-[#00245D]/60 font-medium">Active Needs</div>
                      <div className="text-2xl sm:text-3xl font-bold text-[#00245D] mt-1 sm:mt-2">{analytics.activeNeeds}</div>
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
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Create Invitation Card */}
                  <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-xl transition-shadow p-6 border border-[#D4C4A8]">
                    <h3 className="text-lg font-semibold text-[#00245D] mb-4 flex items-center gap-2">
                      <span className="w-8 h-8 bg-[#00245D]/10 rounded-lg flex items-center justify-center text-sm">✨</span>
                      Create New Invitation
                    </h3>

                    {/* Type Selector */}
                    <div className="flex gap-2 mb-6">
                      <button
                        onClick={() => setInvitationType('public')}
                        className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${invitationType === 'public'
                          ? 'bg-[#00245D] text-white shadow-lg'
                          : 'bg-[#D4C4A8]/20 text-[#00245D] hover:bg-[#D4C4A8]/30'
                          }`}
                      >
                        <div className="text-lg mb-1">🌐</div>
                        <div className="text-sm font-semibold">Public Link</div>
                        <div className="text-xs opacity-70 mt-1">Share with many</div>
                      </button>
                      <button
                        onClick={() => setInvitationType('personal')}
                        className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${invitationType === 'personal'
                          ? 'bg-[#00245D] text-white shadow-lg'
                          : 'bg-[#D4C4A8]/20 text-[#00245D] hover:bg-[#D4C4A8]/30'
                          }`}
                      >
                        <div className="text-lg mb-1">📧</div>
                        <div className="text-sm font-semibold">Personal</div>
                        <div className="text-xs opacity-70 mt-1">Email invite</div>
                      </button>
                    </div>

                    <form onSubmit={handleCreateInvitation} className="space-y-4">
                      {invitationType === 'public' ? (
                        <div>
                          <label className="block text-sm font-medium text-[#00245D] mb-2">Link Name (Optional)</label>
                          <input
                            type="text"
                            value={publicLinkName}
                            onChange={(e) => setPublicLinkName(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-[#D4C4A8] rounded-xl focus:ring-2 focus:ring-[#00245D] focus:border-[#00245D] transition-all"
                            placeholder="e.g., Community Open Day, Social Media Campaign"
                          />
                          <p className="text-xs text-[#00245D]/60 mt-2 flex items-center gap-1">
                            <span>✓</span> Never expires • Unlimited uses
                          </p>
                        </div>
                      ) : (
                        <div>
                          <label className="block text-sm font-medium text-[#00245D] mb-2">Email Address</label>
                          <input
                            type="email"
                            value={newInvitationEmail}
                            onChange={(e) => setNewInvitationEmail(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-[#D4C4A8] rounded-xl focus:ring-2 focus:ring-[#00245D] focus:border-[#00245D] transition-all"
                            placeholder="user@example.com"
                            required
                          />
                          <p className="text-xs text-[#00245D]/60 mt-2 flex items-center gap-1">
                            <span>📧</span> Email sent automatically • Never expires
                          </p>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={invitingUser}
                        className="w-full py-4 bg-gradient-to-r from-[#00245D] to-[#00245D]/90 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0 flex items-center justify-center gap-2"
                      >
                        {invitingUser ? (
                          <>
                            <span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                            Creating...
                          </>
                        ) : (
                          <>
                            <span>{invitationType === 'public' ? '🔗' : '📧'}</span>
                            {invitationType === 'public' ? 'Generate Public Link' : 'Send Invitation Email'}
                          </>
                        )}
                      </button>
                    </form>

                    {/* Success Message */}
                    {invitationLink && (
                      <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl animate-fadeIn">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm">✓</span>
                          </div>
                          <div>
                            <p className="font-semibold text-green-800">Link Created Successfully!</p>
                            {invitationType === 'public' && (
                              <p className="text-xs text-green-600">This link never expires and can be used unlimited times.</p>
                            )}
                          </div>
                        </div>

                        {invitationEmailStatus && invitationType === 'personal' && (
                          <div className={`text-sm p-3 rounded-lg mb-3 ${invitationEmailStatus.sent
                            ? 'bg-green-100 text-green-700'
                            : 'bg-amber-100 text-amber-700'
                            }`}>
                            {invitationEmailStatus.sent
                              ? '✅ Email invitation sent successfully!'
                              : `⚠️ Email failed: ${invitationEmailStatus.error || 'Share the link manually below.'}`}
                          </div>
                        )}

                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={invitationLink}
                            readOnly
                            className="flex-1 px-4 py-3 bg-white border border-green-300 rounded-xl text-sm font-mono"
                          />
                          <button
                            onClick={() => {
                              copyToClipboard(invitationLink);
                              alert('Link copied to clipboard!');
                            }}
                            className="px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors flex items-center gap-2"
                          >
                            📋 Copy
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Active Links Card */}
                  <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-xl transition-shadow p-6 border border-[#D4C4A8]">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-[#00245D] flex items-center gap-2">
                        <span className="w-8 h-8 bg-[#00245D]/10 rounded-lg flex items-center justify-center text-sm">📋</span>
                        Active Invitation Links
                      </h3>
                      {invitations.length > 0 && (
                        <button
                          onClick={() => setShowClearInvitationsConfirm(true)}
                          className="px-3 py-1.5 text-xs bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium"
                        >
                          Clear All
                        </button>
                      )}
                    </div>

                    <div className="space-y-3">
                      {/* Permanent Public Invitation Link - Always Displayed */}
                      {(() => {
                        const publicLink = invitations.find(inv => inv.type === 'public');
                        if (publicLink) {
                          return (
                            <div className="p-5 rounded-xl border bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-300 shadow-sm">
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs">🌐</span>
                                    <h4 className="font-semibold text-blue-900">{publicLink.name || 'Public Invitation Link'}</h4>
                                    <span className="px-2.5 py-0.5 bg-green-500 text-white text-xs font-bold rounded-full">● Active</span>
                                  </div>
                                  <p className="text-xs text-blue-700 mt-1.5">
                                    Created {new Date(publicLink.createdAt).toLocaleDateString()} • {users.filter(u => u.invitationId === publicLink.id).length} sign-ups
                                  </p>
                                </div>
                              </div>

                              <div className="flex gap-2 items-center bg-white rounded-lg p-2 border border-blue-200">
                                <input
                                  type="text"
                                  value={publicLink.invitationLink || ''}
                                  readOnly
                                  className="flex-1 px-3 py-2 bg-transparent text-sm font-mono text-blue-900 outline-none select-all"
                                />
                                <button
                                  onClick={() => {
                                    copyToClipboard(publicLink.invitationLink || '', publicLink.id);
                                  }}
                                  className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${copiedLinkId === publicLink.id
                                    ? 'bg-green-600 text-white'
                                    : 'bg-blue-600 text-white hover:bg-blue-700'
                                    }`}
                                >
                                  {copiedLinkId === publicLink.id ? (
                                    <>
                                      ✓ Copied
                                    </>
                                  ) : (
                                    <>
                                      📋 Copy Link
                                    </>
                                  )}
                                </button>
                                <button
                                  onClick={() => handleDeleteInvitation(publicLink.id)}
                                  className="px-3 py-2 bg-red-100 text-red-600 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
                                >
                                  🗑️
                                </button>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })()}

                      {/* Other invitations */}
                      {invitations.length === 0 ? (
                        <div className="text-center py-12">
                          <div className="w-16 h-16 bg-[#D4C4A8]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-3xl opacity-50">🔗</span>
                          </div>
                          <p className="text-[#00245D]/60 font-medium">No invitation links yet</p>
                          <p className="text-[#00245D]/40 text-sm mt-1">Create your first link to start inviting members</p>
                        </div>
                      ) : (
                        <>
                          {getPaginatedInvitations().filter(inv => inv.type !== 'public').map(inv => (
                            <div
                              key={inv.id}
                              className={`p-4 rounded-xl border transition-all hover:shadow-md ${inv.type === 'public'
                                ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200'
                                : 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200'
                                }`}
                            >
                              <div className="flex justify-between items-start gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-lg">{inv.type === 'public' ? '🌐' : '📧'}</span>
                                    <span className="font-semibold text-[#00245D] truncate">
                                      {inv.type === 'public' ? (inv.name || 'Public Link') : inv.email}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-3 text-xs text-[#00245D]/60">
                                    <span>Created {new Date(inv.createdAt).toLocaleDateString()}</span>
                                    {inv.type === 'public' && (
                                      <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                                        {users.filter(u => u.invitationId === inv.id).length} sign-ups
                                      </span>
                                    )}
                                    {inv.type === 'personal' && inv.status === 'accepted' && (
                                      <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                                        ✓ Joined {inv.acceptedAt ? `on ${new Date(inv.acceptedAt).toLocaleDateString()}` : ''}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${inv.status === 'accepted'
                                    ? 'bg-green-100 text-green-700'
                                    : inv.status === 'expired'
                                      ? 'bg-red-100 text-red-700'
                                      : inv.type === 'public'
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'bg-amber-100 text-amber-700'
                                    }`}>
                                    {inv.type === 'public' ? '∞ Active' : inv.status}
                                  </span>
                                </div>
                              </div>



                              <div className="flex gap-2 mt-3 pt-3 border-t border-[#00245D]/10">
                                {inv.invitationLink && (
                                  <button
                                    onClick={() => copyToClipboard(inv.invitationLink!, inv.id)}
                                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${copiedLinkId === inv.id
                                      ? 'bg-green-500 text-white'
                                      : 'bg-[#00245D]/10 text-[#00245D] hover:bg-[#00245D]/20'
                                      }`}
                                  >
                                    {copiedLinkId === inv.id ? (
                                      <>✓ Copied!</>
                                    ) : (
                                      <>📋 Copy Link</>
                                    )}
                                  </button>
                                )}
                                {inv.type === 'personal' && inv.status === 'pending' && (
                                  <button
                                    onClick={() => handleResendInvitation(inv.id, inv.email || '')}
                                    className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors"
                                  >
                                    Resend Email
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteInvitation(inv.id)}
                                  className="px-3 py-2 bg-red-100 text-red-600 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
                                >
                                  🗑️
                                </button>
                              </div>
                            </div>
                          ))}
                          <Pagination
                            currentPage={invitationsPage}
                            totalItems={invitations.length}
                            itemsPerPage={itemsPerPage}
                            onPageChange={setInvitationsPage}
                            className="mt-4"
                          />
                        </>
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

                  {/* Search Bar with Autocomplete */}
                  <div className="mb-6 relative z-20">
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <span className="text-xl text-[#00245D]/40 group-focus-within:text-[#00245D] transition-colors">🔍</span>
                      </div>
                      <input
                        type="text"
                        placeholder="Search by email, name, or skills..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                        onFocus={() => searchQuery && setShowSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                        className="w-full pl-12 pr-4 py-4 bg-white border-2 border-[#D4C4A8]/50 rounded-xl focus:ring-4 focus:ring-[#00245D]/10 focus:border-[#00245D] transition-all shadow-sm hover:shadow-md text-lg"
                      />
                      {/* Keyboard shortcut hint */}
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-1 pointer-events-none opacity-40">
                        <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono">Type to search</kbd>
                      </div>
                    </div>

                    {/* Autocomplete Dropdown */}
                    {showSuggestions && suggestions.length > 0 && (
                      <div className="mt-2 bg-white rounded-xl border border-[#D4C4A8] overflow-hidden animate-fadeIn shadow-inner">
                        <div className="px-4 py-2 bg-gray-50 border-b border-[#D4C4A8]/30 text-xs font-semibold text-[#00245D]/60 uppercase tracking-wider">
                          Suggested Skills
                        </div>
                        {suggestions.map((skill, idx) => (
                          <button
                            key={idx}
                            onClick={() => selectSuggestion(skill)}
                            className="w-full text-left px-4 py-3 hover:bg-[#00245D]/5 transition-colors flex items-center gap-3 group"
                          >
                            <span className="w-8 h-8 rounded-lg bg-[#99D6EA]/20 flex items-center justify-center text-sm group-hover:bg-[#00245D] group-hover:text-white transition-colors">
                              💡
                            </span>
                            <div>
                              <div className="font-medium text-[#00245D] group-hover:translate-x-1 transition-transform">
                                {skill}
                              </div>
                              <div className="text-xs text-[#00245D]/50">
                                Found in {users.filter(u => u.skills?.includes(skill)).length} users
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Filter Buttons */}
                  <div className="flex gap-2 mb-4 flex-wrap">
                    <button onClick={() => setUserFilter('all')} className={`px-3 py-1 rounded text-sm ${userFilter === 'all' ? 'bg-[#00245D] text-white' : 'bg-[#D4C4A8]/30 text-[#00245D]'}`}>All ({users.length})</button>
                    <button onClick={() => setUserFilter('admins')} className={`px-3 py-1 rounded text-sm ${userFilter === 'admins' ? 'bg-[#00245D] text-white' : 'bg-[#D4C4A8]/30 text-[#00245D]'}`}>Admins</button>
                    <button onClick={() => setUserFilter('public-link')} className={`px-3 py-1 rounded text-sm ${userFilter === 'public-link' ? 'bg-[#00245D] text-white' : 'bg-[#D4C4A8]/30 text-[#00245D]'}`}>🌐 Public Invitation Link</button>
                    <button onClick={() => setUserFilter('direct-signup')} className={`px-3 py-1 rounded text-sm ${userFilter === 'direct-signup' ? 'bg-[#00245D] text-white' : 'bg-[#D4C4A8]/30 text-[#00245D]'}`}>👤 Direct Sign-up</button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-[#D4C4A8]">
                          <th className="text-left py-3 px-4 text-sm font-medium text-[#00245D]">Email</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-[#00245D]">Name</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-[#00245D]">Join Method</th>
                          <th className="text-center py-3 px-4 text-sm font-medium text-[#00245D]">Skills</th>
                          <th className="text-center py-3 px-4 text-sm font-medium text-[#00245D]">Connections</th>

                          <th className="text-center py-3 px-4 text-sm font-medium text-[#00245D]">Admin</th>
                          <th className="text-center py-3 px-4 text-sm font-medium text-[#00245D]">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getPaginatedUsers().length === 0 ? (
                          <tr>
                            <td colSpan={8} className="py-8 text-center text-[#00245D]/60">
                              No users found
                            </td>
                          </tr>
                        ) : (
                          getPaginatedUsers().map(u => (
                            <tr
                              key={u.id}
                              onClick={() => fetchUserDetails(u.id)}
                              className="border-b border-[#D4C4A8]/30 hover:bg-gradient-to-r hover:from-[#00245D]/5 hover:to-transparent hover:shadow-md hover:-translate-y-0.5 cursor-pointer transition-all duration-200 group relative"
                            >
                              <td className="py-3 px-4 text-sm text-[#00245D] font-medium group-hover:text-[#00245D]">{u.email}</td>
                              <td className="py-3 px-4 text-sm text-[#00245D]">{u.displayName || '-'}</td>
                              <td className="py-3 px-4">
                                {u.invitationId ? (
                                  (() => {
                                    const invite = invitations.find(i => i.id === u.invitationId);
                                    const displayText = invite
                                      ? (invite.type === 'public' ? `🌐 ${invite.name || 'Public Link'}` : '📧 Personal Invite')
                                      : (u.invitationType === 'public' ? '🌐 Public Link' : '📧 Personal Invite');

                                    return (
                                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#00245D]/5 text-[#00245D] border border-[#00245D]/10">
                                        {displayText}
                                      </span>
                                    );
                                  })()
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                    👤 Direct Sign-up
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-sm text-center">
                                <div className="flex flex-wrap gap-1 justify-center min-w-[120px]">
                                  {(() => {
                                    // Logic to determine which skills to show
                                    const allSkills = u.skills || [];
                                    // If searching, prioritize matching skills
                                    const matchingSkills = searchQuery
                                      ? allSkills.filter(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
                                      : [];

                                    // Decide what to display: matches first, then others if space
                                    // On mobile we might show fewer or rely on horizontal scroll if container allows, but here wrapping is used.
                                    const displaySkills = matchingSkills.length > 0
                                      ? matchingSkills
                                      : allSkills.slice(0, 2);

                                    const remainingCount = allSkills.length - displaySkills.length;
                                    const hiddenSkills = matchingSkills.length > 0
                                      ? allSkills.filter(s => !matchingSkills.includes(s))
                                      : allSkills.slice(2);

                                    if (allSkills.length === 0) {
                                      return <span className="opacity-30 text-[#00245D]">-</span>;
                                    }

                                    return (
                                      <>
                                        {displaySkills.slice(0, 2).map((skill, idx) => {
                                          const isMatch = searchQuery && skill.toLowerCase().includes(searchQuery.toLowerCase());
                                          return (
                                            <span
                                              key={idx}
                                              className={`inline-flex px-2 py-1 rounded text-xs font-medium border ${isMatch
                                                ? 'bg-yellow-100 text-yellow-800 border-yellow-200 shadow-sm animate-pulse-slow'
                                                : 'bg-[#99D6EA]/10 text-[#00245D] border-[#99D6EA]/30'
                                                }`}
                                            >
                                              {skill}
                                            </span>
                                          );
                                        })}
                                        {remainingCount > 0 && (
                                          <span
                                            className="inline-flex px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-500 border border-gray-200 cursor-help transition-colors hover:bg-gray-200"
                                            onMouseEnter={(e) => handleTooltipEnter(e, hiddenSkills)}
                                            onMouseLeave={handleTooltipLeave}
                                          >
                                            +{remainingCount}
                                          </span>
                                        )}
                                      </>
                                    );
                                  })()}
                                </div>
                              </td>
                              <td className="py-3 px-4 text-sm text-center text-[#00245D]">
                                <span className={`inline-block px-2 py-0.5 rounded ${u.connectionsCount > 0 ? 'bg-[#D4C4A8]/20 border border-[#D4C4A8]/50' : 'opacity-50'}`}>
                                  {u.connectionsCount}
                                </span>
                              </td>

                              <td className="py-3 px-4 text-center">
                                {u.isPrimaryAdmin ? (
                                  <span className="px-3 py-1 rounded text-xs font-medium bg-[#00245D] text-white cursor-not-allowed" title="Primary admin cannot be changed">
                                    👑 Primary
                                  </span>
                                ) : u.isAdmin ? (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); toggleUserAdmin(u.id, u.isAdmin); }}
                                    disabled={togglingAdmin === u.id || u.id === user?.uid}
                                    className="px-3 py-1 rounded text-xs font-medium bg-[#00245D] text-white hover:bg-[#00245D]/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed z-10 relative"
                                    title={u.id === user?.uid ? "Cannot change your own admin status" : "Click to remove admin"}
                                  >
                                    {togglingAdmin === u.id ? '...' : '👑 Admin'}
                                  </button>
                                ) : (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); toggleUserAdmin(u.id, u.isAdmin); }}
                                    disabled={togglingAdmin === u.id}
                                    className="px-3 py-1 rounded text-xs font-medium bg-gray-100 text-gray-600 hover:bg-[#99D6EA] hover:text-[#00245D] transition-colors disabled:opacity-50 z-10 relative"
                                    title="Click to make admin"
                                  >
                                    {togglingAdmin === u.id ? '...' : 'Make Admin'}
                                  </button>
                                )}
                              </td>
                              <td className="py-3 px-4 text-center">
                                <button
                                  onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(u.id); }}
                                  disabled={u.id === user?.uid}
                                  className="px-3 py-1 bg-red-500 text-white rounded text-xs font-medium hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed z-10 relative"
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
                  <Pagination
                    currentPage={usersPage}
                    totalItems={getFilteredUsers().length}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setUsersPage}
                    className="mt-4"
                  />
                </div>
              )}

              {/* Needs Tab */}
              {activeTab === 'needs' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-xl transition-shadow p-6 border border-[#D4C4A8]">
                    <h2 className="text-lg font-semibold text-[#00245D] mb-4">
                      {editingNeed ? 'Edit Need' : '✨ Create New Need'}
                    </h2>

                    {editingNeed ? (
                      /* Simple form for editing existing needs */
                      <form onSubmit={handleUpdateNeed} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-[#00245D] mb-1">Title</label>
                          <input
                            type="text"
                            value={editNeedData.title}
                            onChange={(e) => setEditNeedData({ ...editNeedData, title: e.target.value })}
                            className="w-full px-4 py-2 border border-[#D4C4A8] rounded-lg focus:ring-2 focus:ring-[#00245D] focus:border-[#00245D]"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#00245D] mb-1">Category</label>
                          <select
                            value={editNeedData.category}
                            onChange={(e) => setEditNeedData({ ...editNeedData, category: e.target.value as SkillCategory })}
                            className="w-full px-4 py-2 border border-[#D4C4A8] rounded-lg focus:ring-2 focus:ring-[#00245D] focus:border-[#00245D]"
                          >
                            {SKILL_CATEGORIES.map(cat => (<option key={cat} value={cat}>{cat}</option>))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#00245D] mb-1">Description</label>
                          <textarea
                            value={editNeedData.description}
                            onChange={(e) => setEditNeedData({ ...editNeedData, description: e.target.value })}
                            className="w-full px-4 py-2 border border-[#D4C4A8] rounded-lg focus:ring-2 focus:ring-[#00245D] focus:border-[#00245D]"
                            rows={6}
                            required
                          />
                        </div>
                        {submitMessage && <div className={`text-sm p-3 rounded-lg ${submitMessage.includes('Error') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>{submitMessage}</div>}
                        <div className="flex gap-2">
                          <button type="submit" disabled={submitting} className="flex-1 py-3 bg-[#00245D] text-white rounded-lg font-medium hover:bg-[#00245D]/90 disabled:opacity-50 transition-colors">
                            {submitting ? 'Saving...' : 'Update Need'}
                          </button>
                          <button type="button" onClick={() => { setEditingNeed(null); setSubmitMessage(''); }} className="px-4 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors">
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      /* Structured form for creating new needs */
                      <form onSubmit={handleCreateNeed} className="space-y-5">
                        {/* Title & Category */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-[#00245D] mb-1">Need Title *</label>
                            <input
                              type="text"
                              value={newNeed.title}
                              onChange={(e) => setNewNeed({ ...newNeed, title: e.target.value })}
                              className="w-full px-4 py-2 border border-[#D4C4A8] rounded-lg focus:ring-2 focus:ring-[#00245D] focus:border-[#00245D]"
                              placeholder="e.g., Website Development Support"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[#00245D] mb-1">Category *</label>
                            <select
                              value={newNeed.category}
                              onChange={(e) => setNewNeed({ ...newNeed, category: e.target.value as SkillCategory })}
                              className="w-full px-4 py-2 border border-[#D4C4A8] rounded-lg focus:ring-2 focus:ring-[#00245D] focus:border-[#00245D]"
                            >
                              {SKILL_CATEGORIES.map(cat => (<option key={cat} value={cat}>{cat}</option>))}
                            </select>
                          </div>
                        </div>

                        {/* Key Details Section */}
                        <div className="bg-[#D4C4A8]/20 rounded-lg p-4">
                          <h3 className="text-sm font-semibold text-[#00245D] mb-3 flex items-center gap-2">
                            <span className="w-5 h-5 bg-[#00245D] rounded text-white flex items-center justify-center text-xs">📋</span>
                            Key Details
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-[#00245D]/70 mb-1">Location</label>
                              <input
                                type="text"
                                value={newNeed.location}
                                onChange={(e) => setNewNeed({ ...newNeed, location: e.target.value })}
                                className="w-full px-3 py-2 text-sm border border-[#D4C4A8] rounded-lg focus:ring-2 focus:ring-[#00245D] focus:border-[#00245D]"
                                placeholder="e.g., Vancouver, BC or Remote"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-[#00245D]/70 mb-1">Timeline</label>
                              <input
                                type="text"
                                value={newNeed.timeline}
                                onChange={(e) => setNewNeed({ ...newNeed, timeline: e.target.value })}
                                className="w-full px-3 py-2 text-sm border border-[#D4C4A8] rounded-lg focus:ring-2 focus:ring-[#00245D] focus:border-[#00245D]"
                                placeholder="e.g., ASAP, March 2025, Flexible"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Overview */}
                        <div>
                          <label className="block text-sm font-medium text-[#00245D] mb-1">Project Overview *</label>
                          <textarea
                            value={newNeed.overview}
                            onChange={(e) => setNewNeed({ ...newNeed, overview: e.target.value })}
                            className="w-full px-4 py-2 border border-[#D4C4A8] rounded-lg focus:ring-2 focus:ring-[#00245D] focus:border-[#00245D]"
                            rows={3}
                            placeholder="Describe what the project is about and why it's needed..."
                            required
                          />
                        </div>

                        {/* Scope of Work - Dynamic List */}
                        <div className="bg-[#99D6EA]/10 rounded-lg p-4">
                          <h3 className="text-sm font-semibold text-[#00245D] mb-3 flex items-center justify-between">
                            <span className="flex items-center gap-2">
                              <span className="w-5 h-5 bg-[#00245D] rounded text-white flex items-center justify-center text-xs">🔧</span>
                              Scope of Work
                            </span>
                            <button
                              type="button"
                              onClick={() => setNewNeed({ ...newNeed, scopeItems: [...newNeed.scopeItems, ''] })}
                              className="text-xs px-2 py-1 bg-[#00245D] text-white rounded hover:bg-[#00245D]/80"
                            >
                              + Add Item
                            </button>
                          </h3>
                          <div className="space-y-2">
                            {newNeed.scopeItems.map((item, index) => (
                              <div key={index} className="flex gap-2">
                                <span className="w-6 h-8 flex items-center justify-center text-[#00245D]/60 text-sm font-medium">{index + 1}.</span>
                                <input
                                  type="text"
                                  value={item}
                                  onChange={(e) => {
                                    const updated = [...newNeed.scopeItems];
                                    updated[index] = e.target.value;
                                    setNewNeed({ ...newNeed, scopeItems: updated });
                                  }}
                                  className="flex-1 px-3 py-2 text-sm border border-[#D4C4A8] rounded-lg focus:ring-2 focus:ring-[#00245D] focus:border-[#00245D]"
                                  placeholder="What needs to be done..."
                                />
                                {newNeed.scopeItems.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = newNeed.scopeItems.filter((_, i) => i !== index);
                                      setNewNeed({ ...newNeed, scopeItems: updated });
                                    }}
                                    className="px-2 text-red-500 hover:text-red-700"
                                  >
                                    ✕
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Requirements - Dynamic List */}
                        <div className="bg-[#D4C4A8]/20 rounded-lg p-4">
                          <h3 className="text-sm font-semibold text-[#00245D] mb-3 flex items-center justify-between">
                            <span className="flex items-center gap-2">
                              <span className="w-5 h-5 bg-[#00245D] rounded text-white flex items-center justify-center text-xs">📝</span>
                              Requirements
                            </span>
                            <button
                              type="button"
                              onClick={() => setNewNeed({ ...newNeed, requirements: [...newNeed.requirements, ''] })}
                              className="text-xs px-2 py-1 bg-[#00245D] text-white rounded hover:bg-[#00245D]/80"
                            >
                              + Add Requirement
                            </button>
                          </h3>
                          <div className="space-y-2">
                            {newNeed.requirements.map((item, index) => (
                              <div key={index} className="flex gap-2">
                                <span className="w-6 h-8 flex items-center justify-center text-[#99D6EA]">•</span>
                                <input
                                  type="text"
                                  value={item}
                                  onChange={(e) => {
                                    const updated = [...newNeed.requirements];
                                    updated[index] = e.target.value;
                                    setNewNeed({ ...newNeed, requirements: updated });
                                  }}
                                  className="flex-1 px-3 py-2 text-sm border border-[#D4C4A8] rounded-lg focus:ring-2 focus:ring-[#00245D] focus:border-[#00245D]"
                                  placeholder="Skills, experience, or qualifications needed..."
                                />
                                {newNeed.requirements.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = newNeed.requirements.filter((_, i) => i !== index);
                                      setNewNeed({ ...newNeed, requirements: updated });
                                    }}
                                    className="px-2 text-red-500 hover:text-red-700"
                                  >
                                    ✕
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Additional Info */}
                        <div>
                          <label className="block text-sm font-medium text-[#00245D] mb-1">Additional Information</label>
                          <textarea
                            value={newNeed.additionalInfo}
                            onChange={(e) => setNewNeed({ ...newNeed, additionalInfo: e.target.value })}
                            className="w-full px-4 py-2 border border-[#D4C4A8] rounded-lg focus:ring-2 focus:ring-[#00245D] focus:border-[#00245D]"
                            rows={2}
                            placeholder="Any other details, notes, or context..."
                          />
                        </div>

                        {submitMessage && <div className={`text-sm p-3 rounded-lg ${submitMessage.includes('Error') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>{submitMessage}</div>}

                        <button type="submit" disabled={submitting} className="w-full py-3 bg-[#00245D] text-white rounded-lg font-medium hover:bg-[#00245D]/90 disabled:opacity-50 transition-colors">
                          {submitting ? 'Creating Need...' : '✨ Create Need'}
                        </button>
                      </form>
                    )}
                  </div>
                  <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-xl transition-shadow p-6 border border-[#D4C4A8]">
                    <h2 className="text-lg font-semibold text-[#00245D] mb-4">Manage Needs</h2>

                    {/* Needs Search Bar */}
                    <div className="mb-4">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#00245D]/40">🔍</span>
                        <input
                          type="text"
                          placeholder="Search needs by title, description, or category..."
                          value={needsSearchQuery}
                          onChange={(e) => setNeedsSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-[#D4C4A8] rounded-lg focus:ring-2 focus:ring-[#00245D] focus:border-[#00245D]"
                        />
                        {needsSearchQuery && (
                          <button
                            onClick={() => setNeedsSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#00245D]/40 hover:text-[#00245D]"
                            title="Clear search"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                      {needsSearchQuery && (
                        <p className="mt-2 text-xs text-[#00245D]/60">
                          {getFilteredNeeds().length} of {needs.length} needs match &quot;{needsSearchQuery}&quot;
                        </p>
                      )}
                    </div>

                    <div className="space-y-3">
                      {getFilteredNeeds().length === 0 ? (
                        <div className="py-8 text-center text-[#00245D]/60">
                          {needsSearchQuery ? `No needs found matching "${needsSearchQuery}"` : 'No needs created yet'}
                        </div>
                      ) : (
                        <>
                          {getPaginatedNeeds().map(need => {
                            const responseCounts = needResponseCounts[need.id];
                            const hasPendingResponses = responseCounts && responseCounts.pending > 0;

                            return (
                              <div key={need.id} className="p-3 bg-[#D4C4A8]/30 rounded-lg hover:bg-[#D4C4A8]/40 transition-colors">
                                <div className="flex items-center justify-between">
                                  <Link href={`/admin/needs/${need.id}`} className="flex-1 min-w-0 group">
                                    <div className="flex items-center gap-2">
                                      <p className="font-medium text-[#00245D] truncate group-hover:text-[#00245D]/70 transition-colors cursor-pointer">
                                        {need.title} →
                                      </p>
                                      {hasPendingResponses && (
                                        <span className="bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center animate-pulse shadow-md">
                                          {responseCounts.pending}
                                        </span>
                                      )}
                                      {responseCounts && !hasPendingResponses && responseCounts.total > 0 && (
                                        <span className="bg-blue-100 text-blue-700 text-xs font-medium rounded-full px-2 py-0.5">
                                          {responseCounts.total} response{responseCounts.total !== 1 ? 's' : ''}
                                        </span>
                                      )}
                                    </div>
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
                                    className={`px-3 py-1 rounded text-sm font-medium transition-colors relative ${hasPendingResponses
                                      ? 'bg-red-100 text-red-700 hover:bg-red-200 font-semibold'
                                      : 'bg-purple-100 text-purple-600 hover:bg-purple-200'
                                      }`}
                                  >
                                    {hasPendingResponses ? '🔔 View Responses' : '👥 View Matches'}
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
                            );
                          })}
                          <Pagination
                            currentPage={needsPage}
                            totalItems={getFilteredNeeds().length}
                            itemsPerPage={itemsPerPage}
                            onPageChange={(page) => { setNeedsPage(page); }}
                            className="mt-4"
                          />
                        </>
                      )}
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
          )
          }
        </main >

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

        {/* User Details Modal - Premium Redesign */}
        {selectedUserId && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start sm:items-center justify-center z-[60] p-2 sm:p-4 overflow-y-auto">
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl w-full max-w-5xl my-auto overflow-hidden flex flex-col border border-[#D4C4A8]/50" style={{ maxHeight: 'min(95vh, 900px)' }}>
              {loadingUserDetails ? (
                <div className="p-16 flex flex-col justify-center items-center gap-4">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#00245D]/20 border-t-[#00245D]"></div>
                  <p className="text-[#00245D]/60 animate-pulse">Loading user profile...</p>
                </div>
              ) : userDetails ? (
                <>
                  {/* Hero Header - Compact and Responsive */}
                  <div className="relative shrink-0 bg-gradient-to-r from-[#00245D] via-[#003380] to-[#00245D] px-4 py-4 sm:px-6 sm:py-5 text-white overflow-hidden">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-10">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
                      <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#99D6EA] rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>
                    </div>

                    {/* Close Button */}
                    <button
                      onClick={() => setSelectedUserId(null)}
                      className="absolute top-3 right-3 sm:top-4 sm:right-4 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all hover:scale-110 z-10"
                    >
                      <span className="text-lg sm:text-xl">✕</span>
                    </button>

                    <div className="relative flex items-center gap-3 sm:gap-5">
                      {/* Avatar - Fixed size, never shrinks */}
                      <div className="relative shrink-0">
                        {(userDetails.user as any).profilePhoto ? (
                          <img
                            src={(userDetails.user as any).profilePhoto}
                            alt="Profile"
                            className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl object-cover border-2 sm:border-4 border-white/20 shadow-xl"
                          />
                        ) : (
                          <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl bg-gradient-to-br from-[#99D6EA] to-[#D4C4A8] flex items-center justify-center text-3xl sm:text-5xl font-bold text-[#00245D] border-2 sm:border-4 border-white/20 shadow-xl">
                            {userDetails.user.displayName
                              ? userDetails.user.displayName[0].toUpperCase()
                              : userDetails.user.email[0].toUpperCase()}
                          </div>
                        )}
                        {userDetails.user.isAdmin && (
                          <div className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 w-8 h-8 sm:w-10 sm:h-10 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                            <span className="text-sm sm:text-base">👑</span>
                          </div>
                        )}
                      </div>

                      {/* User Info */}
                      <div className="flex-1 min-w-0 pr-8 sm:pr-12">
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
                          <h2 className="text-xl sm:text-3xl font-bold break-words">
                            {userDetails.user.displayName || `${(userDetails.user as any).firstName || ''} ${(userDetails.user as any).lastName || ''}`.trim() || 'No Name'}
                          </h2>
                          {userDetails.user.isPrimaryAdmin && (
                            <span className="px-1.5 sm:px-2 py-0.5 bg-yellow-400 text-yellow-900 text-[10px] sm:text-xs font-bold rounded-full">PRIMARY</span>
                          )}
                        </div>
                        <p className="text-white/70 text-xs sm:text-sm truncate mb-2 sm:mb-3">{userDetails.user.email}</p>

                        {/* Quick Stats - Compact on mobile */}
                        <div className="flex flex-wrap gap-1.5 sm:gap-2">
                          <div className="flex items-center gap-1 sm:gap-1.5 bg-white/10 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm">
                            <span>💡</span>
                            <span className="font-semibold">{userDetails.skills.length}</span>
                            <span className="text-white/60 hidden sm:inline">Skills</span>
                          </div>
                          <div className="flex items-center gap-1 sm:gap-1.5 bg-white/10 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm">
                            <span>🤝</span>
                            <span className="font-semibold">{userDetails.connections.length}</span>
                            <span className="text-white/60 hidden sm:inline">Connections</span>
                          </div>
                          <div className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm ${userDetails.user.onboardingComplete ? 'bg-green-500/20' : 'bg-amber-500/20'}`}>
                            <span>{userDetails.user.onboardingComplete ? '✓' : '⏳'}</span>
                            <span className="hidden sm:inline">{userDetails.user.onboardingComplete ? 'Onboarded' : 'Pending'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Content Body - Scrollable */}
                  <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">

                    {/* Personal Information Card */}
                    <div className="bg-white rounded-lg sm:rounded-xl border border-[#D4C4A8]/50 shadow-sm overflow-hidden">
                      <div className="px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 border-b border-[#D4C4A8]/30 bg-gradient-to-r from-[#00245D]/5 to-transparent">
                        <h3 className="text-sm sm:text-base md:text-lg font-bold text-[#00245D] flex items-center gap-2">
                          <span className="w-6 h-6 sm:w-7 sm:h-7 bg-[#00245D]/10 rounded-lg flex items-center justify-center text-sm">👤</span>
                          Personal Information
                        </h3>
                      </div>
                      <div className="p-3 sm:p-4 md:p-6 grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3 md:gap-4">
                        {/* First Name */}
                        <div className="space-y-0.5">
                          <label className="text-[10px] sm:text-xs font-semibold text-[#00245D]/50 uppercase tracking-wider">First Name</label>
                          <p className="text-sm sm:text-base font-medium text-[#00245D] truncate">{(userDetails.user as any).firstName || '-'}</p>
                        </div>
                        {/* Last Name */}
                        <div className="space-y-0.5">
                          <label className="text-[10px] sm:text-xs font-semibold text-[#00245D]/50 uppercase tracking-wider">Last Name</label>
                          <p className="text-sm sm:text-base font-medium text-[#00245D] truncate">{(userDetails.user as any).lastName || '-'}</p>
                        </div>
                        {/* Display Name */}
                        <div className="space-y-0.5">
                          <label className="text-[10px] sm:text-xs font-semibold text-[#00245D]/50 uppercase tracking-wider">Display Name</label>
                          <p className="text-sm sm:text-base font-medium text-[#00245D] truncate">{userDetails.user.displayName || '-'}</p>
                        </div>
                        {/* Email */}
                        <div className="space-y-0.5 col-span-2 lg:col-span-1">
                          <label className="text-[10px] sm:text-xs font-semibold text-[#00245D]/50 uppercase tracking-wider">Email</label>
                          <p className="text-sm sm:text-base font-medium text-[#00245D] truncate">{userDetails.user.email}</p>
                        </div>
                        {/* Phone */}
                        <div className="space-y-0.5">
                          <label className="text-[10px] sm:text-xs font-semibold text-[#00245D]/50 uppercase tracking-wider">Phone</label>
                          <p className="text-sm sm:text-base font-medium text-[#00245D] truncate">{(userDetails.user as any).phoneNumber || '-'}</p>
                        </div>
                        {/* Location */}
                        <div className="space-y-0.5">
                          <label className="text-[10px] sm:text-xs font-semibold text-[#00245D]/50 uppercase tracking-wider">Location</label>
                          <p className="text-sm sm:text-base font-medium text-[#00245D] truncate">{(userDetails.user as any).location || '-'}</p>
                        </div>
                        {/* LinkedIn */}
                        <div className="space-y-0.5">
                          <label className="text-[10px] sm:text-xs font-semibold text-[#00245D]/50 uppercase tracking-wider">LinkedIn</label>
                          {(userDetails.user as any).linkedinUrl ? (
                            <a
                              href={(userDetails.user as any).linkedinUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm sm:text-base font-medium text-blue-600 hover:underline truncate block"
                            >
                              View ↗
                            </a>
                          ) : (
                            <p className="text-sm sm:text-base font-medium text-[#00245D]">-</p>
                          )}
                        </div>
                        {/* Bio - Full Width */}
                        {(userDetails.user as any).bio && (
                          <div className="space-y-0.5 col-span-2 lg:col-span-3">
                            <label className="text-[10px] sm:text-xs font-semibold text-[#00245D]/50 uppercase tracking-wider">Bio</label>
                            <p className="text-xs sm:text-sm font-medium text-[#00245D] bg-[#00245D]/5 p-2 sm:p-3 rounded-lg leading-relaxed">
                              {(userDetails.user as any).bio}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Account Information Card */}
                    <div className="bg-white rounded-lg sm:rounded-xl border border-[#D4C4A8]/50 shadow-sm overflow-hidden">
                      <div className="px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 border-b border-[#D4C4A8]/30 bg-gradient-to-r from-[#99D6EA]/10 to-transparent">
                        <h3 className="text-sm sm:text-base md:text-lg font-bold text-[#00245D] flex items-center gap-2">
                          <span className="w-6 h-6 sm:w-7 sm:h-7 bg-[#99D6EA]/20 rounded-lg flex items-center justify-center text-sm">⚙️</span>
                          Account Information
                        </h3>
                      </div>
                      <div className="p-3 sm:p-4 md:p-6 grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 md:gap-4">
                        {/* User ID */}

                        {/* Joined Date */}
                        <div className="space-y-0.5">
                          <label className="text-[10px] sm:text-xs font-semibold text-[#00245D]/50 uppercase tracking-wider">Joined Date</label>
                          <p className="text-sm sm:text-base font-medium text-[#00245D]">
                            {formatDate(userDetails.user.createdAt)}
                          </p>
                        </div>
                        {/* Join Method */}
                        <div className="space-y-0.5">
                          <label className="text-[10px] sm:text-xs font-semibold text-[#00245D]/50 uppercase tracking-wider">Join Method</label>
                          <p className="text-xs sm:text-sm font-medium text-[#00245D]">
                            {userDetails.user.invitationId
                              ? (userDetails.user.invitationType === 'public' ? '🌐 Public Link' : '📧 Personal Invite')
                              : '👤 Direct Sign-up'}
                          </p>
                        </div>
                        {/* Admin Status */}
                        <div className="space-y-0.5">
                          <label className="text-[10px] sm:text-xs font-semibold text-[#00245D]/50 uppercase tracking-wider">Admin Status</label>
                          <div className="flex items-center gap-1.5">
                            {userDetails.user.isPrimaryAdmin ? (
                              <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-yellow-100 text-yellow-800 rounded-full text-[10px] sm:text-xs font-bold">👑 Primary</span>
                            ) : userDetails.user.isAdmin ? (
                              <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-[#00245D] text-white rounded-full text-[10px] sm:text-xs font-bold">Admin</span>
                            ) : (
                              <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-gray-100 text-gray-600 rounded-full text-[10px] sm:text-xs font-medium">Member</span>
                            )}
                          </div>
                        </div>
                        {/* Onboarding Status */}
                        <div className="space-y-0.5">
                          <label className="text-[10px] sm:text-xs font-semibold text-[#00245D]/50 uppercase tracking-wider">Onboarding</label>
                          <div className={`flex w-fit items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium ${userDetails.user.onboardingComplete
                            ? 'bg-green-100 text-green-700'
                            : 'bg-amber-100 text-amber-700'
                            }`}>
                            <span>{userDetails.user.onboardingComplete ? '✓' : '⏳'}</span>
                            {userDetails.user.onboardingComplete ? 'Completed' : 'Pending'}
                          </div>
                        </div>
                        {/* Invited By */}
                        {(userDetails.user as any).invitedBy && (
                          <div className="space-y-0.5 col-span-2 lg:col-span-1">
                            <label className="text-[10px] sm:text-xs font-semibold text-[#00245D]/50 uppercase tracking-wider">Invited By</label>
                            <p className="font-mono text-[10px] sm:text-xs text-[#00245D] bg-gray-100 p-1.5 sm:p-2 rounded truncate">{(userDetails.user as any).invitedBy}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Skills Section with Pagination */}
                    <div className="bg-white rounded-lg sm:rounded-xl border border-[#D4C4A8]/50 shadow-sm overflow-hidden">
                      <div className="px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 border-b border-[#D4C4A8]/30 bg-gradient-to-r from-yellow-50 to-transparent flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-2">
                        <h3 className="text-sm sm:text-base md:text-lg font-bold text-[#00245D] flex items-center gap-1.5 sm:gap-2">
                          <span className="w-6 h-6 sm:w-7 sm:h-7 bg-yellow-100 rounded-lg flex items-center justify-center text-sm">💡</span>
                          Skills & Expertise
                          <span className="text-[10px] sm:text-xs font-normal text-[#00245D]/50">({userDetails.skills.length})</span>
                        </h3>
                        {/* Skills Pagination */}
                        {userDetails.skills.length > 6 && (
                          <div className="flex items-center gap-1.5 text-xs sm:text-sm">
                            <span className="text-[#00245D]/50 hidden sm:inline">Page:</span>
                            {Array.from({ length: Math.ceil(userDetails.skills.length / 6) }, (_, i) => (
                              <button
                                key={i}
                                onClick={() => setModalSkillsPage(i + 1)}
                                className={`w-6 h-6 sm:w-7 sm:h-7 rounded-md sm:rounded-lg font-medium transition-colors text-xs ${modalSkillsPage === i + 1
                                  ? 'bg-[#00245D] text-white'
                                  : 'bg-gray-100 text-[#00245D] hover:bg-gray-200'
                                  }`}
                              >
                                {i + 1}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="p-3 sm:p-4 md:p-6">
                        {userDetails.skills.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                            {userDetails.skills
                              .slice((modalSkillsPage - 1) * 6, modalSkillsPage * 6)
                              .map((skill, idx) => (
                                <div
                                  key={idx}
                                  className="group p-2.5 sm:p-3 md:p-4 bg-gradient-to-br from-white to-gray-50 border border-[#D4C4A8]/50 rounded-lg sm:rounded-xl hover:border-[#00245D] hover:shadow-md transition-all"
                                >
                                  <div className="flex items-start justify-between gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                                    <h4 className="text-sm sm:text-base font-semibold text-[#00245D] group-hover:text-[#003380] transition-colors break-words">{skill.skillName}</h4>
                                    <span className={`shrink-0 px-1.5 sm:px-2 py-0.5 rounded-full text-[8px] sm:text-[10px] font-bold uppercase tracking-wider ${skill.willingnessLevel === 'pro_bono' ? 'bg-green-100 text-green-700' :
                                      skill.willingnessLevel === 'discount' ? 'bg-blue-100 text-blue-700' :
                                        skill.willingnessLevel === 'sponsor' ? 'bg-purple-100 text-purple-700' :
                                          skill.willingnessLevel === 'advice' ? 'bg-amber-100 text-amber-700' :
                                            'bg-gray-100 text-gray-700'
                                      }`}>
                                      {skill.willingnessLevel.replace('_', ' ')}
                                    </span>
                                  </div>
                                  <p className="text-[10px] sm:text-xs text-[#00245D]/50">{skill.category}</p>
                                  {skill.isHobby && (
                                    <span className="mt-1 sm:mt-2 inline-block text-[10px] sm:text-xs text-purple-600 bg-purple-50 px-1.5 sm:px-2 py-0.5 rounded">🎨 Hobby</span>
                                  )}
                                </div>
                              ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 sm:py-12 bg-gray-50 rounded-lg sm:rounded-xl">
                            <div className="text-3xl sm:text-4xl mb-2">💡</div>
                            <p className="text-sm sm:text-base text-[#00245D]/50 font-medium">No skills listed yet</p>
                            <p className="text-xs sm:text-sm text-[#00245D]/30">User hasn&apos;t added any skills to their profile</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Connections Section with Pagination */}
                    <div className="bg-white rounded-lg sm:rounded-xl border border-[#D4C4A8]/50 shadow-sm overflow-hidden">
                      <div className="px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 border-b border-[#D4C4A8]/30 bg-gradient-to-r from-[#99D6EA]/10 to-transparent flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-2">
                        <h3 className="text-sm sm:text-base md:text-lg font-bold text-[#00245D] flex items-center gap-1.5 sm:gap-2">
                          <span className="w-6 h-6 sm:w-7 sm:h-7 bg-[#99D6EA]/30 rounded-lg flex items-center justify-center text-sm">🤝</span>
                          Connections & Network
                          <span className="text-[10px] sm:text-xs font-normal text-[#00245D]/50">({userDetails.connections.length})</span>
                        </h3>
                        {/* Connections Pagination */}
                        {userDetails.connections.length > 6 && (
                          <div className="flex items-center gap-1.5 text-xs sm:text-sm">
                            <span className="text-[#00245D]/50 hidden sm:inline">Page:</span>
                            {Array.from({ length: Math.ceil(userDetails.connections.length / 6) }, (_, i) => (
                              <button
                                key={i}
                                onClick={() => setModalConnectionsPage(i + 1)}
                                className={`w-6 h-6 sm:w-7 sm:h-7 rounded-md sm:rounded-lg font-medium transition-colors text-xs ${modalConnectionsPage === i + 1
                                  ? 'bg-[#00245D] text-white'
                                  : 'bg-gray-100 text-[#00245D] hover:bg-gray-200'
                                  }`}
                              >
                                {i + 1}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="p-3 sm:p-4 md:p-6">
                        {userDetails.connections.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                            {userDetails.connections
                              .slice((modalConnectionsPage - 1) * 6, modalConnectionsPage * 6)
                              .map((conn, idx) => (
                                <div
                                  key={idx}
                                  className="group p-2.5 sm:p-3 md:p-4 bg-gradient-to-br from-white to-gray-50 border border-[#D4C4A8]/50 rounded-lg sm:rounded-xl hover:border-[#00245D] hover:shadow-md transition-all"
                                >
                                  <div className="flex items-start justify-between gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                                    <h4 className="text-sm sm:text-base font-semibold text-[#00245D] group-hover:text-[#003380] transition-colors break-words">{conn.organizationName}</h4>
                                    <span className={`shrink-0 px-1.5 sm:px-2 py-0.5 rounded-full text-[8px] sm:text-[10px] font-bold uppercase tracking-wider ${conn.relationshipStrength === 'decision_maker' ? 'bg-green-100 text-green-700' :
                                      conn.relationshipStrength === 'strong_contact' ? 'bg-blue-100 text-blue-700' :
                                        'bg-gray-100 text-gray-700'
                                      }`}>
                                      {conn.relationshipStrength.replace('_', ' ')}
                                    </span>
                                  </div>
                                  <p className="text-[10px] sm:text-xs text-[#00245D]/50 mb-1 sm:mb-2">{conn.sector}</p>
                                  {conn.contactName && (
                                    <p className="text-[10px] sm:text-xs text-[#00245D]/70 flex items-center gap-1">
                                      <span>👤</span> {conn.contactName}
                                    </p>
                                  )}
                                </div>
                              ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 sm:py-12 bg-gray-50 rounded-lg sm:rounded-xl">
                            <div className="text-3xl sm:text-4xl mb-2">🤝</div>
                            <p className="text-sm sm:text-base text-[#00245D]/50 font-medium">No connections listed yet</p>
                            <p className="text-xs sm:text-sm text-[#00245D]/30">User hasn&apos;t added any connections to their profile</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="shrink-0 px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 border-t border-[#D4C4A8]/30 bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-3">
                    <p className="text-[10px] sm:text-xs text-[#00245D]/40">
                      Last updated: {formatDateTime(userDetails.user.updatedAt)}
                    </p>
                    <button
                      onClick={() => setSelectedUserId(null)}
                      className="w-full sm:w-auto px-6 sm:px-8 py-2 sm:py-2.5 bg-[#00245D] text-white rounded-lg sm:rounded-xl text-sm sm:text-base font-semibold hover:bg-[#003380] transition-colors shadow-lg shadow-[#00245D]/20"
                    >
                      Close
                    </button>
                  </div>
                </>
              ) : (
                <div className="p-8 sm:p-16 text-center">
                  <div className="text-4xl sm:text-6xl mb-4">😞</div>
                  <p className="text-sm sm:text-lg text-[#00245D]/60 font-medium">User not found or failed to load.</p>
                  <button
                    onClick={() => setSelectedUserId(null)}
                    className="mt-4 sm:mt-6 px-4 sm:px-6 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm sm:text-base font-medium hover:bg-gray-200 transition-colors"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

      </div >

      {/* Floating Skill Tooltip */}
      {skillTooltip.visible && (
        <div
          className="fixed z-[100] bg-white border border-[#D4C4A8] rounded-xl shadow-2xl p-4 animate-fadeIn max-w-xs pointer-events-none ring-1 ring-[#00245D]/5"
          style={{
            left: `${skillTooltip.x}px`,
            top: `${skillTooltip.y + 10}px`,
            transform: 'translateX(-50%)'
          }}
        >
          <div className="text-[10px] font-bold text-[#00245D]/40 mb-2 uppercase tracking-widest border-b border-[#D4C4A8]/20 pb-1">
            More Skills
          </div>
          <div className="flex flex-wrap gap-1.5">
            {skillTooltip.skills.map((skill, idx) => (
              <span key={idx} className="px-2 py-1 bg-[#F0F7FA] text-[#00245D] rounded-md text-xs font-medium border border-[#99D6EA]/20 shadow-sm">
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}
    </ProtectedRoute >
  );
}
