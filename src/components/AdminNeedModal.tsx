'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { SKILL_CATEGORIES, SkillCategory } from '@/types';

interface AdminNeedModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function AdminNeedModal({ isOpen, onClose, onSuccess }: AdminNeedModalProps) {
    const { user } = useAuth();
    const [submitting, setSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState('');

    const [newNeed, setNewNeed] = useState({
        title: '',
        category: 'Sports & Coaching' as SkillCategory,
        location: '',
        timeline: '',
        overview: '',
        scopeItems: [''],
        requirements: [''],
        additionalInfo: '',
    });

    if (!isOpen) return null;

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
        if (!user || !newNeed.title) return;

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
                // Reset form
                setNewNeed({
                    title: '',
                    category: 'Sports & Coaching' as SkillCategory,
                    location: '',
                    timeline: '',
                    overview: '',
                    scopeItems: [''],
                    requirements: [''],
                    additionalInfo: '',
                });

                // Notify parent and close after a brief delay
                setTimeout(() => {
                    onSuccess();
                    onClose();
                    setSubmitMessage('');
                }, 1500);

            } else {
                setSubmitMessage(`Error: ${data.error}`);
            }
        } catch (error) {
            setSubmitMessage('Failed to create need');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl animate-fadeIn">
                <div className="sticky top-0 z-10 bg-white border-b border-[#D4C4A8]/30 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-[#00245D] flex items-center gap-2">
                        <span>✨</span> Create New Need
                    </h2>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
                    >
                        ✕
                    </button>
                </div>

                <div className="p-6 sm:p-8">
                    <form onSubmit={handleCreateNeed} className="space-y-6">
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
                        <div className="bg-[#D4C4A8]/20 rounded-lg p-5">
                            <h3 className="text-sm font-semibold text-[#00245D] mb-4 flex items-center gap-2">
                                <span className="w-6 h-6 bg-[#00245D] rounded-lg text-white flex items-center justify-center text-xs">📋</span>
                                Key Details
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-[#00245D]/70 mb-1 uppercase tracking-wider">Location</label>
                                    <input
                                        type="text"
                                        value={newNeed.location}
                                        onChange={(e) => setNewNeed({ ...newNeed, location: e.target.value })}
                                        className="w-full px-3 py-2 text-sm bg-white border border-[#D4C4A8] rounded-lg focus:ring-2 focus:ring-[#00245D] focus:border-[#00245D]"
                                        placeholder="e.g., Vancouver, BC or Remote"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-[#00245D]/70 mb-1 uppercase tracking-wider">Timeline</label>
                                    <input
                                        type="text"
                                        value={newNeed.timeline}
                                        onChange={(e) => setNewNeed({ ...newNeed, timeline: e.target.value })}
                                        className="w-full px-3 py-2 text-sm bg-white border border-[#D4C4A8] rounded-lg focus:ring-2 focus:ring-[#00245D] focus:border-[#00245D]"
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
                        <div className="bg-[#99D6EA]/10 rounded-lg p-5 border border-[#99D6EA]/20">
                            <h3 className="text-sm font-semibold text-[#00245D] mb-4 flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    <span className="w-6 h-6 bg-[#00245D] rounded-lg text-white flex items-center justify-center text-xs">🔧</span>
                                    Scope of Work
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setNewNeed({ ...newNeed, scopeItems: [...newNeed.scopeItems, ''] })}
                                    className="text-xs px-3 py-1.5 bg-[#00245D] text-white rounded-lg hover:bg-[#00245D]/80 transition-colors shadow-sm"
                                >
                                    + Add Item
                                </button>
                            </h3>
                            <div className="space-y-3">
                                {newNeed.scopeItems.map((item, index) => (
                                    <div key={index} className="flex gap-2">
                                        <span className="w-8 h-10 flex items-center justify-center text-[#00245D]/60 text-sm font-medium bg-white rounded-lg border border-[#D4C4A8]/30">{index + 1}</span>
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
                                                className="px-2 text-red-500 hover:text-red-700 transition-colors"
                                                title="Remove item"
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Requirements - Dynamic List */}
                        <div className="bg-[#D4C4A8]/10 rounded-lg p-5 border border-[#D4C4A8]/30">
                            <h3 className="text-sm font-semibold text-[#00245D] mb-4 flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    <span className="w-6 h-6 bg-[#00245D] rounded-lg text-white flex items-center justify-center text-xs">📝</span>
                                    Requirements
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setNewNeed({ ...newNeed, requirements: [...newNeed.requirements, ''] })}
                                    className="text-xs px-3 py-1.5 bg-[#00245D] text-white rounded-lg hover:bg-[#00245D]/80 transition-colors shadow-sm"
                                >
                                    + Add Requirement
                                </button>
                            </h3>
                            <div className="space-y-3">
                                {newNeed.requirements.map((item, index) => (
                                    <div key={index} className="flex gap-2">
                                        <span className="w-8 h-10 flex items-center justify-center text-[#99D6EA] bg-white rounded-lg border border-[#D4C4A8]/30 text-lg">•</span>
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
                                                className="px-2 text-red-500 hover:text-red-700 transition-colors"
                                                title="Remove requirement"
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

                        {/* Message & Actions */}
                        {submitMessage && (
                            <div className={`text-sm p-4 rounded-xl border ${submitMessage.includes('Error')
                                    ? 'bg-red-50 text-red-600 border-red-100'
                                    : 'bg-green-50 text-green-600 border-green-100'
                                } animate-fadeIn`}>
                                {submitMessage}
                            </div>
                        )}

                        <div className="pt-4 border-t border-[#D4C4A8]/30 flex flex-col sm:flex-row gap-3">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="flex-1 py-3 bg-[#00245D] text-white rounded-xl font-bold hover:bg-[#00245D]/90 disabled:opacity-70 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                            >
                                {submitting ? 'Creating Need...' : '✨ Create Need'}
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-3 bg-white border-2 border-[#D4C4A8] text-[#00245D] rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
