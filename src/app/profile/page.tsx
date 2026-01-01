'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { collection, getDocs, query, where, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skill, Connection } from '@/types';
import ProfilePhotoUpload from '@/components/ProfilePhotoUpload';

export default function ProfilePage() {
  const { user, userData } = useAuth();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState(userData?.displayName || '');
  const [phoneNumber, setPhoneNumber] = useState(userData?.phoneNumber || '');
  const [bio, setBio] = useState(userData?.bio || '');
  const [location, setLocation] = useState(userData?.location || '');
  const [linkedinUrl, setLinkedinUrl] = useState(userData?.linkedinUrl || '');
  const [profilePhoto, setProfilePhoto] = useState(userData?.profilePhoto || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function fetchData() {
      if (!user) return;

      try {
        const skillsQuery = query(collection(db, 'skills'), where('userId', '==', user.uid));
        const skillsSnapshot = await getDocs(skillsQuery);
        setSkills(skillsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Skill)));

        const connectionsQuery = query(collection(db, 'connections'), where('userId', '==', user.uid));
        const connectionsSnapshot = await getDocs(connectionsQuery);
        setConnections(connectionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Connection)));
      } catch (error) {
        console.error('Error fetching profile data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
    if (userData) {
      if (userData.displayName) setDisplayName(userData.displayName);
      if (userData.phoneNumber) setPhoneNumber(userData.phoneNumber);
      if (userData.bio) setBio(userData.bio);
      if (userData.location) setLocation(userData.location);
      if (userData.linkedinUrl) setLinkedinUrl(userData.linkedinUrl);
      if (userData.profilePhoto) setProfilePhoto(userData.profilePhoto);
    }
  }, [user, userData]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setMessage('');

    if (!phoneNumber.trim()) {
      setMessage('Phone number is required and cannot be removed');
      setSaving(false);
      return;
    }

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        displayName,
        phoneNumber,
        bio,
        location,
        linkedinUrl,
        profilePhoto,
        updatedAt: serverTimestamp(),
      });
      setMessage('Profile updated successfully!');
    } catch (error) {
      setMessage('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProtectedRoute requireOnboarding>
      <div className="min-h-screen bg-pattern">
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8 animate-fadeIn">
            <h1 className="text-3xl font-bold text-[#00245D] flex items-center gap-3">
              <span className="w-10 h-10 bg-[#00245D] rounded-xl flex items-center justify-center text-white text-lg shadow-lg">👤</span>
              Your Profile
            </h1>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-4 border-[#99D6EA] border-t-[#00245D]"></div></div>
          ) : (
            <div className="space-y-6">
              {/* Profile Header Card */}
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-[#D4C4A8] p-8 animate-fadeIn">
                <div className="flex items-center gap-6 mb-6">
                  <div className="w-20 h-20 bg-[#00245D] rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-xl overflow-hidden">
                    {profilePhoto ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={profilePhoto} alt={displayName || 'Profile'} className="w-full h-full object-cover" />
                    ) : (
                      <span>{(displayName || user?.email || 'U')[0].toUpperCase()}</span>
                    )}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-[#00245D]">{displayName || 'Community Member'}</h2>
                    <p className="text-[#00245D]/60">{user?.email}</p>
                    <div className="flex gap-3 mt-2">
                      <span className="bg-[#99D6EA]/30 text-[#00245D] px-3 py-1 rounded-lg text-sm font-medium">{skills.length} Skills</span>
                      <span className="bg-[#99D6EA]/30 text-[#00245D] px-3 py-1 rounded-lg text-sm font-medium">{connections.length} Connections</span>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleUpdateProfile} className="space-y-4 pt-6 border-t border-[#D4C4A8]">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#00245D] mb-1.5">Email</label>
                      <input type="email" value={user?.email || ''} disabled className="w-full px-4 py-3 border-2 border-[#D4C4A8] rounded-xl bg-[#D4C4A8]/20 text-[#00245D]/60" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#00245D] mb-1.5">Display Name</label>
                      <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full px-4 py-3 border-2 border-[#D4C4A8] rounded-xl focus:outline-none focus:border-[#00245D] transition-colors" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-[#00245D] mb-1.5">Phone Number</label>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-[#D4C4A8] rounded-xl focus:outline-none focus:border-[#00245D] transition-colors"
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#00245D] mb-1.5">Location / City</label>
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-[#D4C4A8] rounded-xl focus:outline-none focus:border-[#00245D] transition-colors"
                        placeholder="e.g. Vancouver, BC"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-[#00245D] mb-1.5">LinkedIn URL</label>
                      <input
                        type="url"
                        value={linkedinUrl}
                        onChange={(e) => setLinkedinUrl(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-[#D4C4A8] rounded-xl focus:outline-none focus:border-[#00245D] transition-colors"
                        placeholder="https://www.linkedin.com/in/username"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <ProfilePhotoUpload
                        currentPhotoUrl={profilePhoto}
                        onPhotoUploaded={setProfilePhoto}
                        userId={user?.uid}
                        disabled={saving}
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-[#00245D] mb-1.5">Brief Bio</label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-[#D4C4A8] rounded-xl placeholder-[#00245D]/40 focus:outline-none focus:border-[#00245D] transition-colors"
                      rows={3}
                      placeholder="Tell the community a bit about yourself, your role, or how you like to help."
                    />
                  </div>
                  {message && <p className={`text-sm px-4 py-2 rounded-lg ${message.includes('success') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>{message.includes('success') ? '✓' : '⚠️'} {message}</p>}
                  <button type="submit" disabled={saving} className="px-6 py-3 bg-[#00245D] text-white rounded-xl font-semibold shadow-lg shadow-[#00245D]/25 hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50">
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </form>
              </div>

              {/* Skills Card */}
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-[#D4C4A8] p-6 animate-fadeIn" style={{ animationDelay: '0.1s' }}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-[#00245D] flex items-center gap-2">⚽ Your Skills <span className="text-sm font-normal text-[#00245D]/60 bg-[#D4C4A8]/50 px-2 py-0.5 rounded-full">{skills.length}</span></h2>
                  <Link href="/profile/skills" className="text-[#00245D] hover:text-[#00245D]/70 text-sm font-semibold flex items-center gap-1">Edit <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></Link>
                </div>
                <div className="flex flex-wrap gap-2">
                  {skills.map(skill => (
                    <span key={skill.id} className="bg-[#99D6EA]/30 text-[#00245D] px-4 py-2 rounded-xl text-sm font-medium">{skill.skillName} <span className="text-[#00245D]/60">• {skill.willingnessLevel.replace('_', ' ')}</span></span>
                  ))}
                  {skills.length === 0 && <p className="text-[#00245D]/40">No skills added yet</p>}
                </div>
              </div>

              {/* Connections Card */}
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-[#D4C4A8] p-6 animate-fadeIn" style={{ animationDelay: '0.2s' }}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-[#00245D] flex items-center gap-2">🤝 Your Connections <span className="text-sm font-normal text-[#00245D]/60 bg-[#D4C4A8]/50 px-2 py-0.5 rounded-full">{connections.length}</span></h2>
                  <Link href="/profile/connections" className="text-[#00245D] hover:text-[#00245D]/70 text-sm font-semibold flex items-center gap-1">Edit <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></Link>
                </div>
                <div className="flex flex-wrap gap-2">
                  {connections.map(conn => (
                    <span key={conn.id} className="bg-[#00245D]/10 text-[#00245D] px-4 py-2 rounded-xl text-sm font-medium">{conn.organizationName} <span className="text-[#00245D]/60">• {conn.sector}</span></span>
                  ))}
                  {connections.length === 0 && <p className="text-[#00245D]/40">No connections added yet</p>}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}


