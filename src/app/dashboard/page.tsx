'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { collection, getDocs, query, where, documentId } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skill, Connection, Need, NeedResponse } from '@/types';

export default function DashboardPage() {
  const { user, userData } = useAuth();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [recentNeeds, setRecentNeeds] = useState<Need[]>([]);
  const [userResponses, setUserResponses] = useState<NeedResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!user) return;

      try {
        // Fetch user's skills
        const skillsQuery = query(collection(db, 'skills'), where('userId', '==', user.uid));
        const skillsSnapshot = await getDocs(skillsQuery);
        setSkills(skillsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Skill)));

        // Fetch user's connections
        const connectionsQuery = query(collection(db, 'connections'), where('userId', '==', user.uid));
        const connectionsSnapshot = await getDocs(connectionsQuery);
        setConnections(connectionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Connection)));

        // Fetch recent needs
        const needsQuery = query(collection(db, 'needs'), where('isActive', '==', true));
        const needsSnapshot = await getDocs(needsQuery);
        const recentNeedsInitial = needsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Need));

        // Fetch user's responses
        const token = await user.getIdToken();
        const responsesRes = await fetch(`/api/need-responses?userOnly=true`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        const responsesData = await responsesRes.json();
        let responses: NeedResponse[] = [];
        if (responsesData.success) {
          responses = responsesData.data.responses;
          setUserResponses(responses);
        }

        // Fetch needs for user responses if we have them
        let appliedNeeds: Need[] = [];
        if (responses.length > 0) {
          // Get unique need IDs from responses
          const appliedNeedIds = [...new Set(responses.map(r => r.needId))];

          if (appliedNeedIds.length > 0) {
            const chunks = [];
            for (let i = 0; i < appliedNeedIds.length; i += 10) {
              chunks.push(appliedNeedIds.slice(i, i + 10));
            }

            for (const chunk of chunks) {
              const appliedNeedsQuery = query(collection(db, 'needs'), where(documentId(), 'in', chunk));
              const appliedSnapshot = await getDocs(appliedNeedsQuery);
              const chunkNeeds = appliedSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Need));
              appliedNeeds = [...appliedNeeds, ...chunkNeeds];
            }
          }
        }

        // Merge applied needs with recent needs, prioritizing applied ones
        // Remove duplicates
        const allNeedsMap = new Map<string, Need>();
        appliedNeeds.forEach(n => allNeedsMap.set(n.id, n));
        recentNeedsInitial.forEach(n => {
          if (!allNeedsMap.has(n.id)) {
            allNeedsMap.set(n.id, n);
          }
        });

        // Convert map back to array
        const mergedNeeds = Array.from(allNeedsMap.values());

        // Take top 5 for display
        setRecentNeeds(mergedNeeds.slice(0, 5));

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user]);

  return (
    <ProtectedRoute requireOnboarding>
      <div className="min-h-screen bg-pattern">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Header */}
          <div className="mb-8 animate-fadeIn">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-14 h-14 bg-[#00245D] rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-[#00245D]/20 overflow-hidden">
                {userData?.profilePhoto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={userData.profilePhoto} alt={userData?.displayName || "Profile"} className="w-full h-full object-cover" />
                ) : (
                  userData?.displayName?.[0] || 'M'
                )}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-[#00245D]">Welcome back, {userData?.displayName || 'Member'}!</h1>
                <p className="text-[#00245D]/60">Here&apos;s an overview of your community involvement.</p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-4 border-[#99D6EA] border-t-[#00245D]"></div></div>
          ) : (
            <>
              {/* Stats Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                {[
                  { label: 'Skills', value: skills.length, icon: '⚽', color: 'bg-[#00245D]' },
                  { label: 'Connections', value: connections.length, icon: '🤝', color: 'bg-[#99D6EA]' },
                  { label: 'Active Needs', value: recentNeeds.length, icon: '📋', color: 'bg-[#00245D]' },
                ].map((stat, i) => (
                  <div key={i} className="bg-white/95 backdrop-blur-sm rounded-xl p-5 shadow-lg shadow-[#00245D]/10 border border-[#D4C4A8] hover:shadow-xl transition-all animate-fadeIn" style={{ animationDelay: `${i * 0.1}s` }}>
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center text-xl shadow-lg`}>{stat.icon}</div>
                      <div><div className="text-2xl font-bold text-[#00245D]">{stat.value}</div><div className="text-sm text-[#00245D]/60">{stat.label}</div></div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Cards Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Skills Card */}
                <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg shadow-[#00245D]/10 p-6 border border-[#D4C4A8] hover:shadow-xl transition-all group">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#00245D] rounded-xl flex items-center justify-center text-lg shadow-lg">⚽</div>
                      <h2 className="text-lg font-bold text-[#00245D]">Your Skills</h2>
                    </div>
                    <span className="bg-[#99D6EA]/30 text-[#00245D] px-3 py-1 rounded-full text-sm font-semibold">{skills.length}</span>
                  </div>
                  <div className="space-y-3">
                    {skills.slice(0, 4).map(skill => (
                      <div key={skill.id} className="flex justify-between items-center p-3 bg-gray-50 border border-gray-100 rounded-xl hover:bg-blue-50 transition-colors">
                        <span className="font-medium text-[#00245D]">{skill.skillName}</span>
                        <span className="text-xs bg-white px-2 py-1 rounded-lg text-[#00245D]/60 capitalize shadow-sm">{skill.willingnessLevel.replace('_', ' ')}</span>
                      </div>
                    ))}
                    {skills.length > 4 && <p className="text-sm text-[#00245D] font-medium">+{skills.length - 4} more skills</p>}
                  </div>
                  <Link href="/profile" className="mt-5 flex items-center justify-center gap-2 w-full py-3 bg-[#99D6EA]/30 text-[#00245D] rounded-xl font-semibold hover:bg-[#99D6EA]/50 transition-colors group-hover:bg-[#00245D] group-hover:text-white">
                    Manage Skills <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </Link>
                </div>

                {/* Connections Card */}
                <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg shadow-[#00245D]/10 p-6 border border-[#D4C4A8] hover:shadow-xl transition-all group">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#99D6EA] rounded-xl flex items-center justify-center text-lg shadow-lg">🤝</div>
                      <h2 className="text-lg font-bold text-[#00245D]">Connections</h2>
                    </div>
                    <span className="bg-[#99D6EA]/30 text-[#00245D] px-3 py-1 rounded-full text-sm font-semibold">{connections.length}</span>
                  </div>
                  <div className="space-y-3">
                    {connections.slice(0, 4).map(conn => (
                      <div key={conn.id} className="flex justify-between items-center p-3 bg-gray-50 border border-gray-100 rounded-xl hover:bg-blue-50 transition-colors">
                        <span className="font-medium text-[#00245D] truncate">{conn.organizationName}</span>
                        <span className="text-xs bg-white px-2 py-1 rounded-lg text-[#00245D]/60 shadow-sm">{conn.sector}</span>
                      </div>
                    ))}
                    {connections.length > 4 && <p className="text-sm text-[#00245D] font-medium">+{connections.length - 4} more</p>}
                  </div>
                  <Link href="/profile" className="mt-5 flex items-center justify-center gap-2 w-full py-3 bg-[#99D6EA]/30 text-[#00245D] rounded-xl font-semibold hover:bg-[#99D6EA]/50 transition-colors group-hover:bg-[#00245D] group-hover:text-white">
                    Manage Connections <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </Link>
                </div>

                {/* Active Needs Card */}
                <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg shadow-[#00245D]/10 p-6 border border-[#D4C4A8] hover:shadow-xl transition-all group">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#00245D] rounded-xl flex items-center justify-center text-lg shadow-lg">📋</div>
                      <h2 className="text-lg font-bold text-[#00245D]">Active Needs</h2>
                    </div>
                    <span className="bg-[#99D6EA]/30 text-[#00245D] px-3 py-1 rounded-full text-sm font-semibold">{recentNeeds.length}</span>
                  </div>
                  <div className="space-y-3">
                    {recentNeeds.slice(0, 4).map(need => {
                      const userResponse = userResponses.find(r => r.needId === need.id);
                      return (
                        <Link key={need.id} href={`/needs/${need.id}`} className="block p-3 bg-gray-50 border border-gray-100 rounded-xl hover:bg-blue-50 transition-colors relative">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-[#00245D] truncate">{need.title}</p>
                              <p className="text-xs text-[#00245D]/60 mt-1">{need.category}</p>
                            </div>
                            {userResponse && (
                              <span className={`text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap ${userResponse.status === 'accepted' ? 'bg-green-100 text-green-700' :
                                userResponse.status === 'declined' ? 'bg-red-100 text-red-700' :
                                  userResponse.status === 'reviewed' ? 'bg-blue-100 text-blue-700' :
                                    'bg-yellow-100 text-yellow-700'
                                }`}>
                                {userResponse.status === 'accepted' ? '✓ Accepted' :
                                  userResponse.status === 'declined' ? '✗ Declined' :
                                    userResponse.status === 'reviewed' ? '👀 Reviewed' :
                                      '⏳ Pending'}
                              </span>
                            )}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                  <Link href="/needs" className="mt-5 flex items-center justify-center gap-2 w-full py-3 bg-[#99D6EA]/30 text-[#00245D] rounded-xl font-semibold hover:bg-[#99D6EA]/50 transition-colors group-hover:bg-[#00245D] group-hover:text-white">
                    View All Needs <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </Link>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}

