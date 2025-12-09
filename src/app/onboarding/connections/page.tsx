'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { CONNECTION_SECTORS, ConnectionSector, RelationshipStrength } from '@/types';
import { collection, addDoc, doc, updateDoc, serverTimestamp, getDocs, query, where, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface ConnectionEntry {
  id?: string;
  sector: ConnectionSector;
  organizationName: string;
  contactName: string;
  relationshipStrength: RelationshipStrength;
}

const RELATIONSHIP_OPTIONS: { value: RelationshipStrength; label: string; description: string }[] = [
  { value: 'decision_maker', label: 'Decision Maker', description: 'Can make things happen directly' },
  { value: 'strong_contact', label: 'Strong Contact', description: 'Solid relationship, good influence' },
  { value: 'acquaintance', label: 'Acquaintance', description: 'Know them, can make an introduction' },
];

export default function ConnectionsOnboardingPage() {
  const { user, refreshUserData } = useAuth();
  const router = useRouter();
  const [connections, setConnections] = useState<ConnectionEntry[]>([
    { sector: 'Corporate', organizationName: '', contactName: '', relationshipStrength: 'strong_contact' }
  ]);
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Fetch existing connections
  useEffect(() => {
    if (user) {
      const fetchConnections = async () => {
        try {
          const q = query(collection(db, 'connections'), where('userId', '==', user.uid));
          const querySnapshot = await getDocs(q);
          const fetchedConnections = querySnapshot.docs.map(doc => ({
            id: doc.id,
            sector: doc.data().sector as ConnectionSector,
            organizationName: doc.data().organizationName,
            contactName: doc.data().contactName || '',
            relationshipStrength: doc.data().relationshipStrength as RelationshipStrength
          }));

          if (fetchedConnections.length > 0) {
            setConnections(fetchedConnections);
          }
        } catch (err) {
          console.error("Error fetching connections:", err);
        } finally {
          setLoading(false);
        }
      };
      fetchConnections();
    }
  }, [user]);

  const addConnectionEntry = () => {
    setConnections([...connections, {
      sector: 'Corporate',
      organizationName: '',
      contactName: '',
      relationshipStrength: 'strong_contact'
    }]);
  };

  const removeConnectionEntry = (index: number) => {
    const connToRemove = connections[index];
    if (connToRemove.id) {
      setDeletedIds([...deletedIds, connToRemove.id]);
    }

    if (connections.length > 1) {
      setConnections(connections.filter((_, i) => i !== index));
    } else if (connections.length === 1 && connToRemove.id) {
      // Clear if last one
      setConnections([{ sector: 'Corporate', organizationName: '', contactName: '', relationshipStrength: 'strong_contact' }]);
    }
  };

  const updateConnectionEntry = (index: number, field: keyof ConnectionEntry, value: string) => {
    const newConnections = [...connections];
    newConnections[index] = { ...newConnections[index], [field]: value };
    setConnections(newConnections);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const validConnections = connections.filter(c => c.organizationName);
    if (validConnections.length === 0) {
      setError('Please add at least one connection');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const connectionsCollection = collection(db, 'connections');

      // 1. Delete removed connections
      for (const id of deletedIds) {
        await deleteDoc(doc(db, 'connections', id));
      }

      // 2. Add or Update connections
      for (const conn of validConnections) {
        if (conn.id) {
          // Update existing
          await updateDoc(doc(db, 'connections', conn.id), {
            sector: conn.sector,
            organizationName: conn.organizationName,
            contactName: conn.contactName,
            relationshipStrength: conn.relationshipStrength,
            updatedAt: serverTimestamp()
          });
        } else {
          // Add new
          await addDoc(connectionsCollection, {
            userId: user.uid,
            sector: conn.sector,
            organizationName: conn.organizationName,
            contactName: conn.contactName,
            relationshipStrength: conn.relationshipStrength,
            createdAt: serverTimestamp()
          });
        }
      }

      // Mark onboarding as complete (idempotent)
      await updateDoc(doc(db, 'users', user.uid), {
        onboardingComplete: true,
        updatedAt: serverTimestamp()
      });

      // Refresh user data so ProtectedRoute knows onboarding is complete
      await refreshUserData();

      router.push('/dashboard');
    } catch (err) {
      console.error('Error saving connections:', err);
      setError('Failed to save connections. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-pattern">
        <div className="absolute top-20 right-10 w-72 h-72 bg-[#99D6EA] rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-[#00245D] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>

        <div className="max-w-3xl mx-auto relative z-10">
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl shadow-[#00245D]/10 p-8 border border-[#D4C4A8] animate-fadeIn">
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#99D6EA] rounded-xl flex items-center justify-center text-[#00245D] text-xl shadow-lg">🤝</div>
                  <h1 className="text-2xl font-bold text-[#00245D]">Who do you know?</h1>
                </div>
                <span className="text-sm text-[#00245D]/60 bg-[#D4C4A8]/50 px-3 py-1 rounded-full">Step 2 of 2</span>
              </div>
              <div className="w-full bg-[#D4C4A8]/50 rounded-full h-2.5 overflow-hidden">
                <div className="bg-[#00245D] h-2.5 rounded-full w-full transition-all"></div>
              </div>
            </div>

            {error && <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm mb-6 flex items-center gap-2"><span>⚠️</span> {error}</div>}

            <form onSubmit={handleSubmit} className="space-y-5">
              {connections.map((conn, index) => (
                <div key={index} className="bg-[#D4C4A8]/20 rounded-2xl p-6 space-y-4 border border-[#D4C4A8] shadow-lg hover:shadow-xl transition-shadow animate-fadeIn" style={{ animationDelay: `${index * 0.1}s` }}>
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-[#00245D] flex items-center gap-2"><span className="w-6 h-6 bg-[#99D6EA]/50 text-[#00245D] rounded-lg flex items-center justify-center text-sm">{index + 1}</span> Connection</h3>
                    {connections.length > 1 && <button type="button" onClick={() => removeConnectionEntry(index)} className="text-red-500 hover:text-red-700 text-sm font-medium hover:bg-red-50 px-3 py-1 rounded-lg transition-colors">Remove</button>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#00245D] mb-1.5">Sector</label>
                      <select value={conn.sector} onChange={(e) => updateConnectionEntry(index, 'sector', e.target.value)} className="w-full px-4 py-3 border-2 border-[#D4C4A8] rounded-xl focus:outline-none focus:border-[#00245D] transition-colors bg-white">
                        {CONNECTION_SECTORS.map((sector) => <option key={sector} value={sector}>{sector}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#00245D] mb-1.5">Organization</label>
                      <input type="text" value={conn.organizationName} onChange={(e) => updateConnectionEntry(index, 'organizationName', e.target.value)} placeholder="Company or organization name" className="w-full px-4 py-3 border-2 border-[#D4C4A8] rounded-xl focus:outline-none focus:border-[#00245D] transition-colors" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#00245D] mb-1.5">Contact Name (Optional)</label>
                    <input type="text" value={conn.contactName} onChange={(e) => updateConnectionEntry(index, 'contactName', e.target.value)} placeholder="Your contact's name" className="w-full px-4 py-3 border-2 border-[#D4C4A8] rounded-xl focus:outline-none focus:border-[#00245D] transition-colors" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#00245D] mb-2">Relationship Strength</label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {RELATIONSHIP_OPTIONS.map((opt) => (
                        <button key={opt.value} type="button" onClick={() => updateConnectionEntry(index, 'relationshipStrength', opt.value)} className={`px-4 py-3 rounded-xl text-sm font-medium transition-all text-left ${conn.relationshipStrength === opt.value ? 'bg-[#00245D] text-white shadow-lg shadow-[#00245D]/25' : 'bg-white border-2 border-[#D4C4A8] text-[#00245D] hover:border-[#00245D]'}`}>
                          <div className="font-semibold">{opt.label}</div>
                          <div className={`text-xs mt-1 ${conn.relationshipStrength === opt.value ? 'text-[#99D6EA]' : 'text-[#00245D]/60'}`}>{opt.description}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}

              <button type="button" onClick={addConnectionEntry} className="w-full py-4 border-2 border-dashed border-[#D4C4A8] rounded-2xl text-[#00245D]/60 hover:border-[#00245D] hover:text-[#00245D] hover:bg-[#99D6EA]/20 transition-all font-medium">+ Add Another Connection</button>

              <div className="flex justify-between pt-4">
                <button type="button" onClick={() => router.push('/onboarding/skills')} className="px-6 py-4 border-2 border-[#D4C4A8] text-[#00245D] rounded-xl font-semibold hover:bg-[#D4C4A8]/30 transition-colors">← Back</button>
                <button type="submit" disabled={submitting} className="px-8 py-4 bg-[#00245D] text-white rounded-xl font-semibold shadow-lg shadow-[#00245D]/25 hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0">
                  {submitting ? <span className="flex items-center gap-2"><span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></span>Saving...</span> : 'Complete Setup ✓'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}


