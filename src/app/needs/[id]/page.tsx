'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import StrengthMeter from '@/components/StrengthMeter';
import FormattedDescription from '@/components/FormattedDescription';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Need, CapsScoreResult, NeedResponse } from '@/types';

export default function NeedDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAdmin } = useAuth();
  const [need, setNeed] = useState<Need | null>(null);
  const [matches, setMatches] = useState<CapsScoreResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Response form state
  const [showResponseForm, setShowResponseForm] = useState(false);
  const [responseMessage, setResponseMessage] = useState('');
  const [submittingResponse, setSubmittingResponse] = useState(false);
  const [existingResponse, setExistingResponse] = useState<NeedResponse | null>(null);
  const [responseSuccess, setResponseSuccess] = useState(false);

  useEffect(() => {
    async function fetchNeedAndData() {
      if (!params.id || !user) return;

      try {
        // Fetch the need
        const needDoc = await getDoc(doc(db, 'needs', params.id as string));
        if (!needDoc.exists()) {
          router.push('/needs');
          return;
        }

        const needData = { id: needDoc.id, ...needDoc.data() } as Need;
        setNeed(needData);

        const token = await user.getIdToken();

        // Fetch matches with authentication token (admin only)
        if (isAdmin) {
          const matchResponse = await fetch(`/api/caps-score?category=${needData.category}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          const matchData = await matchResponse.json();

          if (matchData.success) {
            setMatches(matchData.data);
          }
        }

        // Check if user already responded to this need
        const responseCheck = await fetch(`/api/need-responses?needId=${params.id}&userOnly=true`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        const responseData = await responseCheck.json();

        if (responseData.success && responseData.data.responses.length > 0) {
          const newResponse = responseData.data.responses[0];

          // Check if status changed and show notification
          if (existingResponse && existingResponse.status !== newResponse.status) {
            // Status changed! Could show a toast here
            console.log('Response status updated:', newResponse.status);
          }

          setExistingResponse(newResponse);
        }
      } catch (error) {
        console.error('Error fetching need:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchNeedAndData();

    // Poll for updates every 30 seconds if user has submitted a response
    const pollInterval = setInterval(() => {
      if (existingResponse && !isAdmin) {
        fetchNeedAndData();
      }
    }, 30000); // 30 seconds

    return () => clearInterval(pollInterval);
  }, [params.id, router, user, isAdmin, existingResponse]);

  const handleToggleStatus = async () => {
    if (!need || !isAdmin) return;
    setActionLoading(true);
    try {
      await updateDoc(doc(db, 'needs', need.id), {
        isActive: !need.isActive,
        updatedAt: new Date(),
      });
      setNeed({ ...need, isActive: !need.isActive });
    } catch (error) {
      console.error('Error toggling status:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!need || !isAdmin) return;
    if (!confirm('Are you sure you want to delete this need? This action cannot be undone.')) return;

    setActionLoading(true);
    try {
      await deleteDoc(doc(db, 'needs', need.id));
      router.push('/needs');
    } catch (error) {
      console.error('Error deleting need:', error);
      setActionLoading(false);
    }
  };

  const handleSubmitResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !need || !responseMessage.trim()) return;

    setSubmittingResponse(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/need-responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          needId: need.id,
          message: responseMessage,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setExistingResponse(data.data);
        setResponseSuccess(true);
        setShowResponseForm(false);
        setResponseMessage('');
      } else {
        alert(data.error || 'Failed to submit response');
      }
    } catch (error) {
      console.error('Error submitting response:', error);
      alert('Failed to submit response');
    } finally {
      setSubmittingResponse(false);
    }
  };

  // Check if description is long enough to need collapsing
  const isLongDescription = need?.description && need.description.length > 500;

  if (loading) {
    return (
      <ProtectedRoute requireOnboarding>
        <div className="min-h-screen bg-pattern">
          <Navbar />
          <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-4 border-[#99D6EA] border-t-[#00245D]"></div></div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!need) return null;

  return (
    <ProtectedRoute requireOnboarding>
      <div className="min-h-screen bg-pattern">
        <Navbar />
        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back Button */}
          <button onClick={() => router.back()} className="mb-6 text-[#00245D] hover:text-[#00245D]/70 font-semibold flex items-center gap-2 hover:-translate-x-1 transition-transform">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg> Back to Needs Board
          </button>

          {/* Main Card */}
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl hover:shadow-2xl transition-shadow shadow-[#00245D]/10 border border-[#D4C4A8] animate-fadeIn overflow-hidden">
            {/* Header Section */}
            <div className="p-8 border-b border-[#D4C4A8]/50">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-sm text-[#00245D] font-semibold bg-[#99D6EA]/30 px-4 py-1.5 rounded-full">
                      {need.category}
                    </span>
                    {need.isActive ? (
                      <span className="bg-green-50 text-green-700 px-4 py-1.5 rounded-full text-sm font-semibold flex items-center gap-1.5">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        Active
                      </span>
                    ) : (
                      <span className="bg-gray-100 text-gray-600 px-4 py-1.5 rounded-full text-sm font-semibold">
                        Closed
                      </span>
                    )}
                  </div>
                  <h1 className="text-3xl font-bold text-[#00245D] leading-tight">{need.title}</h1>
                </div>
              </div>
            </div>

            {/* Description Section */}
            <div className="p-8">
              <h3 className="text-lg font-bold text-[#00245D] mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-[#00245D]/10 rounded-lg flex items-center justify-center text-sm">📄</span>
                Project Details
              </h3>

              <div className={`relative ${isLongDescription && !isExpanded ? 'max-h-80 overflow-hidden' : ''}`}>
                <FormattedDescription
                  text={need.description}
                  className="text-[#00245D]/80"
                />

                {/* Gradient overlay for collapsed state */}
                {isLongDescription && !isExpanded && (
                  <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent"></div>
                )}
              </div>

              {/* Expand/Collapse Button */}
              {isLongDescription && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="mt-4 text-[#00245D] font-semibold flex items-center gap-2 hover:text-[#99D6EA] transition-colors"
                >
                  {isExpanded ? (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                      Show Less
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                      Read Full Description
                    </>
                  )}
                </button>
              )}
            </div>

            {/* User Response Section - Only for non-admins and active needs */}
            {!isAdmin && need.isActive && (
              <div className="px-8 pb-8 pt-4 border-t border-[#D4C4A8]/50 bg-gradient-to-r from-[#99D6EA]/10 to-transparent">
                {existingResponse || responseSuccess ? (
                  <div className={`border rounded-xl p-5 ${existingResponse?.status === 'accepted' ? 'bg-green-50 border-green-200' :
                    existingResponse?.status === 'declined' ? 'bg-red-50 border-red-200' :
                      existingResponse?.status === 'reviewed' ? 'bg-blue-50 border-blue-200' :
                        'bg-green-50 border-green-200'
                    }`}>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3 flex-1">
                        <span className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${existingResponse?.status === 'accepted' ? 'bg-green-100' :
                          existingResponse?.status === 'declined' ? 'bg-red-100' :
                            existingResponse?.status === 'reviewed' ? 'bg-blue-100' :
                              'bg-green-100'
                          }`}>
                          {existingResponse?.status === 'accepted' ? '🎉' :
                            existingResponse?.status === 'declined' ? '📋' :
                              existingResponse?.status === 'reviewed' ? '👀' :
                                '✅'}
                        </span>
                        <div className="flex-1">
                          <h4 className={`font-semibold ${existingResponse?.status === 'accepted' ? 'text-green-800' :
                            existingResponse?.status === 'declined' ? 'text-red-800' :
                              existingResponse?.status === 'reviewed' ? 'text-blue-800' :
                                'text-green-800'
                            }`}>
                            {existingResponse?.status === 'accepted' ? 'Response Accepted!' :
                              existingResponse?.status === 'declined' ? 'Response Reviewed' :
                                existingResponse?.status === 'reviewed' ? 'Response Under Review' :
                                  'Response Submitted!'}
                          </h4>
                          <p className={`text-sm ${existingResponse?.status === 'accepted' ? 'text-green-600' :
                            existingResponse?.status === 'declined' ? 'text-red-600' :
                              existingResponse?.status === 'reviewed' ? 'text-blue-600' :
                                'text-green-600'
                            }`}>
                            {existingResponse?.status === 'accepted'
                              ? 'Great news! An admin will contact you soon about this opportunity.'
                              : existingResponse?.status === 'declined'
                                ? 'Thank you for your interest. The admin has reviewed your response.'
                                : existingResponse?.status === 'reviewed'
                                  ? 'Your response is being reviewed by the admin team.'
                                  : 'Your interest has been sent to the admin. They will review and contact you if there\'s a match.'}
                          </p>
                        </div>
                      </div>
                      {existingResponse && (
                        <span className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap ${existingResponse.status === 'accepted' ? 'bg-green-100 text-green-700' :
                          existingResponse.status === 'declined' ? 'bg-red-100 text-red-700' :
                            existingResponse.status === 'reviewed' ? 'bg-blue-100 text-blue-700' :
                              'bg-yellow-100 text-yellow-700'
                          }`}>
                          {existingResponse.status === 'accepted' ? 'Accepted' :
                            existingResponse.status === 'declined' ? 'Declined' :
                              existingResponse.status === 'reviewed' ? 'Reviewed' :
                                'Pending'}
                        </span>
                      )}
                    </div>
                    {existingResponse && (
                      <div className="mt-3 pl-13">
                        <p className={`text-sm rounded-lg p-3 italic ${existingResponse.status === 'accepted' ? 'text-green-700 bg-green-100' :
                          existingResponse.status === 'declined' ? 'text-red-700 bg-red-100' :
                            existingResponse.status === 'reviewed' ? 'text-blue-700 bg-blue-100' :
                              'text-green-700 bg-green-100'
                          }`}>
                          &quot;{existingResponse.message}&quot;
                        </p>
                        <div className="flex items-center justify-between mt-3">
                          <p className={`text-xs ${existingResponse.status === 'accepted' ? 'text-green-600' :
                            existingResponse.status === 'declined' ? 'text-red-600' :
                              existingResponse.status === 'reviewed' ? 'text-blue-600' :
                                'text-green-600'
                            }`}>
                            Submitted: {new Date(existingResponse.createdAt).toLocaleDateString('en-US', {
                              month: 'short', day: 'numeric', year: 'numeric'
                            })}
                          </p>
                          <button
                            onClick={() => window.location.reload()}
                            className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${existingResponse.status === 'accepted' ? 'bg-green-100 text-green-700 hover:bg-green-200' :
                              existingResponse.status === 'declined' ? 'bg-red-100 text-red-700 hover:bg-red-200' :
                                existingResponse.status === 'reviewed' ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' :
                                  'bg-green-100 text-green-700 hover:bg-green-200'
                              }`}
                          >
                            🔄 Refresh Status
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : showResponseForm ? (
                  <form onSubmit={handleSubmitResponse} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[#00245D] mb-2">
                        Your Message to Admin
                      </label>
                      <textarea
                        value={responseMessage}
                        onChange={(e) => setResponseMessage(e.target.value)}
                        className="w-full px-4 py-3 border border-[#D4C4A8] rounded-xl focus:ring-2 focus:ring-[#00245D] focus:border-[#00245D] resize-none"
                        rows={4}
                        placeholder="Explain why you're interested and how your skills can help with this need..."
                        required
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        type="submit"
                        disabled={submittingResponse || !responseMessage.trim()}
                        className="flex-1 py-3 bg-[#00245D] text-white rounded-xl font-semibold hover:bg-[#00245D]/90 disabled:opacity-50 transition-colors"
                      >
                        {submittingResponse ? 'Submitting...' : '📨 Send Response'}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowResponseForm(false); setResponseMessage(''); }}
                        className="px-5 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    onClick={() => setShowResponseForm(true)}
                    className="w-full py-4 bg-[#00245D] text-white rounded-xl font-semibold hover:bg-[#00245D]/90 transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                  >
                    <span className="text-xl">🙋</span>
                    Express Interest in This Need
                  </button>
                )}
              </div>
            )}

            {/* Closed Need Message */}
            {!isAdmin && !need.isActive && (
              <div className="px-8 pb-8 pt-4 border-t border-[#D4C4A8]/50 bg-gray-50">
                <div className="flex items-center gap-3 text-gray-600">
                  <span className="text-2xl">🔒</span>
                  <p>This need is no longer accepting responses.</p>
                </div>
              </div>
            )}

            {/* Admin Actions */}
            {isAdmin && (
              <div className="px-8 pb-8 pt-4 border-t border-[#D4C4A8]/50 bg-[#D4C4A8]/10">
                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    onClick={handleToggleStatus}
                    disabled={actionLoading}
                    className={`px-5 py-2.5 rounded-xl font-semibold transition-all flex items-center gap-2 disabled:opacity-50 ${need.isActive
                      ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                  >
                    {need.isActive ? (
                      <>📁 Close Need</>
                    ) : (
                      <>✅ Reopen Need</>
                    )}
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={actionLoading}
                    className="px-5 py-2.5 bg-red-100 text-red-700 rounded-xl font-semibold hover:bg-red-200 transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    🗑️ Delete Need
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Top Matches - Only visible to admins */}
          {isAdmin && (
            <div className="mt-8">
              <h2 className="text-xl font-bold text-[#00245D] mb-4 flex items-center gap-2">
                🏆 Top Matches
                <span className="text-sm font-normal text-[#00245D]/60 bg-[#D4C4A8]/50 px-3 py-1 rounded-full">
                  {matches.length} found
                </span>
              </h2>

              {matches.length === 0 ? (
                <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-12 text-center border border-[#D4C4A8] shadow-lg hover:shadow-xl transition-shadow">
                  <div className="text-5xl mb-4">🔍</div>
                  <p className="text-[#00245D]/60 text-lg">No matches found for this need yet. Users need to add skills in this category to appear as matches.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {matches.map((match, index) => (
                    <div
                      key={match.userId}
                      className="bg-white/95 backdrop-blur-sm rounded-2xl p-5 border border-[#D4C4A8] shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 flex items-center justify-between animate-fadeIn"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg ${index === 0 ? 'bg-yellow-500' :
                          index === 1 ? 'bg-gray-400' :
                            index === 2 ? 'bg-amber-600' : 'bg-[#00245D]'
                          }`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-bold text-[#00245D] text-lg">{match.userName || 'Community Member'}</p>
                          <div className="flex items-center gap-3 mt-1 text-sm text-[#00245D]/60">
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 bg-[#00245D] rounded-full"></span>
                              {match.matchDetails.directSkillMatches} skills
                            </span>
                            {match.matchDetails.hobbySkillMatches > 0 && (
                              <span className="flex items-center gap-1">
                                <span className="w-2 h-2 bg-[#99D6EA] rounded-full"></span>
                                {match.matchDetails.hobbySkillMatches} hobbies
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <StrengthMeter strength={match.strengthMeter} size="lg" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
