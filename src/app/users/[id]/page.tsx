'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skill, Connection } from '@/types';

interface UserProfile {
  displayName: string;
  email: string;
  profilePhoto?: string;
  skills: Skill[];
  connections: Connection[];
}

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const userId = params.id as string;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!userId) return;

      try {
        // Fetch user data
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (!userDoc.exists()) {
          setError('User not found');
          setLoading(false);
          return;
        }

        const userData = userDoc.data();

        // Fetch skills
        const skillsQuery = query(collection(db, 'skills'), where('userId', '==', userId));
        const skillsSnapshot = await getDocs(skillsQuery);
        const skills = skillsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Skill));

        // Fetch connections
        const connectionsQuery = query(collection(db, 'connections'), where('userId', '==', userId));
        const connectionsSnapshot = await getDocs(connectionsQuery);
        const connections = connectionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Connection));

        setProfile({
          displayName: userData.displayName || 'Community Member',
          email: userData.email || '',
          profilePhoto: userData.profilePhoto || '',
          skills,
          connections
        });
      } catch (err) {
        console.error('Error fetching user profile:', err);
        setError('Failed to load user profile');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [userId]);

  if (loading) {
    return (
      <ProtectedRoute requireOnboarding>
        <div className="min-h-screen bg-pattern flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#99D6EA] border-t-[#00245D]"></div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !profile) {
    return (
      <ProtectedRoute requireOnboarding>
        <div className="min-h-screen bg-pattern">
          <Navbar />
          <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-12 text-center border border-[#D4C4A8] shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-5xl mb-4">❌</div>
              <p className="text-[#00245D] text-lg font-bold">{error || 'User not found'}</p>
              <button
                onClick={() => router.back()}
                className="mt-6 px-6 py-3 bg-[#00245D] text-white rounded-xl hover:bg-[#00245D]/90 transition-colors"
              >
                Go Back
              </button>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requireOnboarding>
      <div className="min-h-screen bg-pattern">
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="mb-6 flex items-center gap-2 text-[#00245D] hover:text-[#00245D]/80 transition-colors font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>

          {/* Profile Header */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 border border-[#D4C4A8] shadow-lg hover:shadow-xl transition-shadow mb-6 animate-fadeIn">
            <div className="flex items-start gap-6">
              <div className="w-20 h-20 bg-[#00245D] rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-lg overflow-hidden">
                {profile.profilePhoto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.profilePhoto} alt={profile.displayName} className="w-full h-full object-cover" />
                ) : (
                  profile.displayName[0]
                )}
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-[#00245D] mb-2">{profile.displayName}</h1>
                <p className="text-[#00245D]/60 mb-4">{profile.email}</p>
                <div className="flex gap-4 text-sm">
                  <span className="bg-[#99D6EA]/30 text-[#00245D] px-4 py-2 rounded-lg font-medium">
                    {profile.skills.length} Skills
                  </span>
                  <span className="bg-[#00245D]/10 text-[#00245D] px-4 py-2 rounded-lg font-medium">
                    {profile.connections.length} Connections
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Skills Section */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 border border-[#D4C4A8] shadow-lg hover:shadow-xl transition-shadow mb-6 animate-fadeIn" style={{ animationDelay: '0.1s' }}>
            <h2 className="text-2xl font-bold text-[#00245D] mb-6 flex items-center gap-3">
              <span className="w-10 h-10 bg-[#00245D] rounded-xl flex items-center justify-center text-white text-lg shadow-lg">⚽</span>
              Skills
              <span className="text-sm font-normal text-[#00245D]/60 bg-[#D4C4A8]/50 px-3 py-1 rounded-full">{profile.skills.length}</span>
            </h2>
            {profile.skills.length === 0 ? (
              <p className="text-[#00245D]/60 text-center py-8">No skills added yet</p>
            ) : (
              <div className="grid gap-4">
                {profile.skills.map((skill, i) => (
                  <div
                    key={skill.id}
                    className="bg-[#D4C4A8]/20 rounded-xl p-4 border border-[#D4C4A8] animate-fadeIn"
                    style={{ animationDelay: `${i * 0.05}s` }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-[#00245D] text-lg">{skill.skillName}</h3>
                        <p className="text-[#00245D]/60 text-sm mt-1">{skill.category}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="bg-[#99D6EA] text-[#00245D] px-4 py-1 rounded-lg text-sm font-medium">
                          {skill.willingnessLevel.replace('_', ' ')}
                        </span>
                        {skill.isHobby && (
                          <span className="bg-[#00245D]/10 text-[#00245D] px-3 py-1 rounded-lg text-xs">
                            Hobby
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Connections Section */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 border border-[#D4C4A8] shadow-lg hover:shadow-xl transition-shadow animate-fadeIn" style={{ animationDelay: '0.2s' }}>
            <h2 className="text-2xl font-bold text-[#00245D] mb-6 flex items-center gap-3">
              <span className="w-10 h-10 bg-[#00245D] rounded-xl flex items-center justify-center text-white text-lg shadow-lg">🤝</span>
              Connections
              <span className="text-sm font-normal text-[#00245D]/60 bg-[#D4C4A8]/50 px-3 py-1 rounded-full">{profile.connections.length}</span>
            </h2>
            {profile.connections.length === 0 ? (
              <p className="text-[#00245D]/60 text-center py-8">No connections added yet</p>
            ) : (
              <div className="grid gap-4">
                {profile.connections.map((connection, i) => (
                  <div
                    key={connection.id}
                    className="bg-[#D4C4A8]/20 rounded-xl p-4 border border-[#D4C4A8] animate-fadeIn"
                    style={{ animationDelay: `${i * 0.05}s` }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-[#00245D] text-lg">{connection.organizationName}</h3>
                        <p className="text-[#00245D]/60 text-sm mt-1">{connection.sector}</p>
                        {connection.contactName && (
                          <p className="text-[#00245D]/50 text-sm mt-1">Contact: {connection.contactName}</p>
                        )}
                      </div>
                      <span className="bg-[#00245D] text-white px-4 py-1 rounded-lg text-sm font-medium">
                        {connection.relationshipStrength.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}


