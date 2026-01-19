'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { SKILL_CATEGORIES, SKILLS_BY_CATEGORY, SkillCategory, WillingnessLevel } from '@/types';
import { collection, addDoc, serverTimestamp, getDocs, query, where, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface SkillEntry {
    id?: string;
    category: SkillCategory;
    skillName: string;
    willingnessLevel: WillingnessLevel;
    isHobby: boolean;
}

const WILLINGNESS_OPTIONS: { value: WillingnessLevel; label: string; description: string }[] = [
    { value: 'pro_bono', label: 'Pro Bono', description: 'Free service for the community' },
    { value: 'sponsor', label: 'Sponsor', description: 'Financial or in-kind sponsorship' },
    { value: 'discount', label: 'Discount', description: 'Reduced rate for community members' },
    { value: 'advice', label: 'Advice', description: 'Share knowledge and guidance' },
    { value: 'vendor', label: 'Vendor', description: 'Paid professional services' },
];

export default function SkillsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [skills, setSkills] = useState<SkillEntry[]>([
        { category: 'Sports & Coaching', skillName: '', willingnessLevel: 'advice', isHobby: false }
    ]);
    const [deletedIds, setDeletedIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Fetch existing skills
    useEffect(() => {
        if (user) {
            const fetchSkills = async () => {
                try {
                    const q = query(collection(db, 'skills'), where('userId', '==', user.uid));
                    const querySnapshot = await getDocs(q);
                    const fetchedSkills = querySnapshot.docs.map(doc => ({
                        id: doc.id,
                        category: doc.data().category as SkillCategory,
                        skillName: doc.data().skillName,
                        willingnessLevel: doc.data().willingnessLevel as WillingnessLevel,
                        isHobby: doc.data().isHobby || false
                    }));

                    if (fetchedSkills.length > 0) {
                        setSkills(fetchedSkills);
                    }
                } catch (err) {
                    console.error("Error fetching skills:", err);
                } finally {
                    setLoading(false);
                }
            };
            fetchSkills();
        }
    }, [user]);

    const addSkillEntry = () => {
        setSkills([...skills, { category: 'Sports & Coaching', skillName: '', willingnessLevel: 'advice', isHobby: false }]);
    };

    const removeSkillEntry = (index: number) => {
        const skillToRemove = skills[index];
        if (skillToRemove.id) {
            setDeletedIds([...deletedIds, skillToRemove.id]);
        }

        if (skills.length > 1) {
            setSkills(skills.filter((_, i) => i !== index));
        } else if (skills.length === 1 && skillToRemove.id) {
            // If it's the last one and has ID, remove it and replace with empty
            setSkills([{ category: 'Sports & Coaching', skillName: '', willingnessLevel: 'advice', isHobby: false }]);
        }
    };

    const updateSkillEntry = (index: number, field: keyof SkillEntry, value: string | boolean) => {
        const newSkills = [...skills];
        newSkills[index] = { ...newSkills[index], [field]: value };
        if (field === 'category') {
            newSkills[index].skillName = '';
        }
        setSkills(newSkills);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        const validSkills = skills.filter(s => s.skillName);
        // Allow saving empty if user deleted all skills, though UI prevents removing last one completely 
        // without replacing it with empty. But if it is empty, we just don't save it.

        setSubmitting(true);
        setError('');
        setSuccess('');

        try {
            const skillsCollection = collection(db, 'skills');

            // 1. Delete removed skills
            for (const id of deletedIds) {
                await deleteDoc(doc(db, 'skills', id));
            }

            // 2. Add or Update skills
            for (const skill of validSkills) {
                if (skill.id) {
                    // Update existing
                    await updateDoc(doc(db, 'skills', skill.id), {
                        category: skill.category,
                        skillName: skill.skillName,
                        willingnessLevel: skill.willingnessLevel,
                        isHobby: skill.isHobby,
                        updatedAt: serverTimestamp()
                    });
                } else {
                    // Add new
                    await addDoc(skillsCollection, {
                        userId: user.uid,
                        category: skill.category,
                        skillName: skill.skillName,
                        willingnessLevel: skill.willingnessLevel,
                        isHobby: skill.isHobby,
                        createdAt: serverTimestamp()
                    });
                }
            }

            setSuccess('Skills updated successfully!');
            // Update local state to reflect changes (clear deletedIds)
            setDeletedIds([]);

            // Navigate back to profile after short delay or just show success
            setTimeout(() => router.push('/profile'), 1500);

        } catch (err) {
            console.error('Error saving skills:', err);
            setError('Failed to save skills. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-pattern">
                <Navbar />
                <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="mb-8 animate-fadeIn">
                        <div className="flex items-center gap-3">
                            <button onClick={() => router.push('/profile')} className="text-[#00245D]/60 hover:text-[#00245D] transition-colors">
                                ← Back to Profile
                            </button>
                        </div>
                        <h1 className="text-3xl font-bold text-[#00245D] flex items-center gap-3 mt-4">
                            <span className="w-10 h-10 bg-[#00245D] rounded-xl flex items-center justify-center text-white text-lg shadow-lg">⚽</span>
                            Manage Skills
                        </h1>
                    </div>

                    <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-[#D4C4A8] p-8 animate-fadeIn">
                        {loading ? (
                            <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-4 border-[#99D6EA] border-t-[#00245D]"></div></div>
                        ) : (
                            <>
                                {error && <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm mb-6 flex items-center gap-2"><span>⚠️</span> {error}</div>}
                                {success && <div className="bg-green-50 border border-green-100 text-green-600 px-4 py-3 rounded-xl text-sm mb-6 flex items-center gap-2"><span>✓</span> {success}</div>}

                                <form onSubmit={handleSubmit} className="space-y-5">
                                    {skills.map((skill, index) => (
                                        <div key={index} className="bg-[#D4C4A8]/20 rounded-2xl p-6 space-y-4 border border-[#D4C4A8] shadow-lg hover:shadow-xl transition-shadow animate-fadeIn" style={{ animationDelay: `${index * 0.1}s` }}>
                                            <div className="flex justify-between items-center">
                                                <h3 className="font-bold text-[#00245D] flex items-center gap-2"><span className="w-6 h-6 bg-[#99D6EA]/50 text-[#00245D] rounded-lg flex items-center justify-center text-sm">{index + 1}</span> Skill</h3>
                                                {skills.length > 1 && <button type="button" onClick={() => removeSkillEntry(index)} className="text-red-500 hover:text-red-700 text-sm font-medium hover:bg-red-50 px-3 py-1 rounded-lg transition-colors">Remove</button>}
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-[#00245D] mb-1.5">Category</label>
                                                    <select value={skill.category} onChange={(e) => updateSkillEntry(index, 'category', e.target.value)} className="w-full px-4 py-3 border-2 border-[#D4C4A8] rounded-xl focus:outline-none focus:border-[#00245D] transition-colors bg-white">
                                                        {SKILL_CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-[#00245D] mb-1.5">Skill</label>
                                                    <select value={skill.skillName} onChange={(e) => updateSkillEntry(index, 'skillName', e.target.value)} className="w-full px-4 py-3 border-2 border-[#D4C4A8] rounded-xl focus:outline-none focus:border-[#00245D] transition-colors bg-white">
                                                        <option value="">Select a skill...</option>
                                                        {SKILLS_BY_CATEGORY[skill.category].map((s) => <option key={s} value={s}>{s}</option>)}
                                                    </select>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-[#00245D] mb-2">Willingness Level</label>
                                                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                                                    {WILLINGNESS_OPTIONS.map((opt) => (
                                                        <button key={opt.value} type="button" onClick={() => updateSkillEntry(index, 'willingnessLevel', opt.value)} className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${skill.willingnessLevel === opt.value ? 'bg-[#00245D] text-white shadow-lg shadow-[#00245D]/25' : 'bg-white border-2 border-[#D4C4A8] text-[#00245D] hover:border-[#00245D]'}`} title={opt.description}>{opt.label}</button>
                                                    ))}
                                                </div>
                                            </div>

                                            <label className="flex items-center gap-3 cursor-pointer group">
                                                <input type="checkbox" id={`hobby-${index}`} checked={skill.isHobby} onChange={(e) => updateSkillEntry(index, 'isHobby', e.target.checked)} className="h-5 w-5 text-[#00245D] focus:ring-[#00245D] border-[#D4C4A8] rounded-lg" />
                                                <span className="text-sm text-[#00245D]/70 group-hover:text-[#00245D] transition-colors">This is a hobby skill (not professional)</span>
                                            </label>
                                        </div>
                                    ))}

                                    <button type="button" onClick={addSkillEntry} className="w-full py-4 border-2 border-dashed border-[#D4C4A8] rounded-2xl text-[#00245D]/60 hover:border-[#00245D] hover:text-[#00245D] hover:bg-[#99D6EA]/20 transition-all font-medium">+ Add Another Skill</button>

                                    <div className="flex justify-end pt-4">
                                        <button type="submit" disabled={submitting} className="px-8 py-4 bg-[#00245D] text-white rounded-xl font-semibold shadow-lg shadow-[#00245D]/25 hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0">
                                            {submitting ? <span className="flex items-center gap-2"><span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></span>Saving...</span> : 'Save Changes'}
                                        </button>
                                    </div>
                                </form>
                            </>
                        )}
                    </div>
                </main>
            </div>
        </ProtectedRoute>
    );
}
