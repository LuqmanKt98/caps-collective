'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import Pagination from '@/components/Pagination';
import Link from 'next/link';
import AdminNeedModal from '@/components/AdminNeedModal';
import { Need, SKILL_CATEGORIES, SkillCategory, NeedResponse } from '@/types';

interface CategoryStat {
  category: SkillCategory;
  count: number;
}

const CATEGORY_ICONS: Record<string, string> = {
  'Sports & Coaching': '⚽',
  'Youth Development': '🌱',
  'Event Planning': '🎉',
  'Facilities & Equipment': '🏟️',
  'Education': '📚',
  'Healthcare': '🏥',
  'Technology': '💻',
  'Media': '📺',
  'Marketing': '📢',
  'Finance': '💰',
  'Legal': '⚖️',
  'Trades': '🔧',
  'Real Estate': '🏠',
  'Consulting': '💼',
  'Arts & Entertainment': '🎨',
  'Non-Profit': '❤️',
  'Government': '🏛️',
  'Other': '📋',
};

export default function NeedsBoardPage() {
  const { user, isAdmin } = useAuth();
  const [categoryStats, setCategoryStats] = useState<CategoryStat[]>([]);
  const [needs, setNeeds] = useState<Need[]>([]);
  const [userResponses, setUserResponses] = useState<NeedResponse[]>([]);
  const [isAddNeedModalOpen, setIsAddNeedModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<SkillCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  const fetchNeeds = async () => {
    try {
      setLoading(true);
      const token = await user?.getIdToken();

      const [needsRes, responsesRes] = await Promise.all([
        fetch('/api/needs', {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        }),
        token ? fetch(`/api/need-responses?userOnly=true`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }) : Promise.resolve({ ok: false, json: () => Promise.resolve({ success: false }) })
      ]);

      const needsData = await needsRes.json();

      if (needsData.success) {
        setNeeds(needsData.data.needs);
        setCategoryStats(needsData.data.categoryStats);
      }

      // Handle user responses if logged in
      if (token && responsesRes.ok) {
        const responsesData = await responsesRes.json();
        if (responsesData.success) {
          setUserResponses(responsesData.data.responses);
        }
      }
    } catch (error) {
      console.error('Error fetching needs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNeeds();
  }, [user]);

  // Memoized filtering for both category and search query
  const filteredNeeds = useMemo(() => {
    let result = needs;

    // Filter by category if selected
    if (selectedCategory) {
      result = result.filter(n => n.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(n =>
        n.title.toLowerCase().includes(query) ||
        n.description.toLowerCase().includes(query) ||
        n.category.toLowerCase().includes(query)
      );
    }

    return result;
  }, [needs, selectedCategory, searchQuery]);

  // Pagination logic
  const totalPages = Math.ceil(filteredNeeds.length / itemsPerPage);
  const paginatedNeeds = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredNeeds.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredNeeds, currentPage, itemsPerPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchQuery]);

  const getCategoryColor = (cat: string) => {
    const colors: Record<string, string> = {
      'Sports & Coaching': 'bg-[#00245D]',
      'Youth Development': 'bg-[#99D6EA]',
      'Event Planning': 'bg-[#00245D]',
      'Facilities & Equipment': 'bg-[#99D6EA]',
      'Education': 'bg-[#99D6EA]',
      'Healthcare': 'bg-[#00245D]',
      'Technology': 'bg-[#00245D]',
      'Media': 'bg-[#00245D]',
      'Marketing': 'bg-[#99D6EA]',
      'Finance': 'bg-[#99D6EA]',
      'Legal': 'bg-[#00245D]',
      'Trades': 'bg-[#99D6EA]',
      'Real Estate': 'bg-[#00245D]',
      'Consulting': 'bg-[#00245D]',
      'Arts & Entertainment': 'bg-[#99D6EA]',
      'Non-Profit': 'bg-[#00245D]',
      'Government': 'bg-[#99D6EA]',
    };
    return colors[cat] || 'bg-[#00245D]';
  };

  return (
    <ProtectedRoute requireOnboarding>
      <div className="min-h-screen bg-pattern">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8 animate-fadeIn flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-[#00245D] flex items-center gap-3">
                <span className="w-10 h-10 bg-[#00245D] rounded-xl flex items-center justify-center text-white text-lg shadow-lg">📋</span>
                Needs Board
              </h1>
              <p className="mt-2 text-[#00245D]/60">Browse community needs by category and see where you can help.</p>
            </div>
            {isAdmin && (
              <button
                onClick={() => setIsAddNeedModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 bg-[#00245D] text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-[#00245D]/90 transition-all hover:-translate-y-0.5 shadow-lg hover:shadow-xl"
              >
                <span>+</span> Add Need
              </button>
            )}
          </div>

          {/* Search Bar */}
          <div className="mb-6 animate-fadeIn">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-shadow p-2 border border-[#D4C4A8]">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#00245D]/40 text-lg">🔍</span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search needs by title, description, or category..."
                  className="w-full pl-12 pr-4 py-3 border-0 rounded-xl focus:ring-2 focus:ring-[#00245D] focus:outline-none text-[#00245D] placeholder-[#00245D]/40 bg-transparent"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#00245D]/40 hover:text-[#00245D] transition-colors"
                    title="Clear search"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
            {searchQuery && (
              <p className="mt-2 text-sm text-[#00245D]/60">
                Showing results for &quot;{searchQuery}&quot; • {filteredNeeds.length} {filteredNeeds.length === 1 ? 'need' : 'needs'} found
              </p>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-4 border-[#99D6EA] border-t-[#00245D]"></div></div>
          ) : (
            <>
              {/* Category Tiles */}
              <div className="mb-8">
                <h2 className="text-lg font-bold text-[#00245D] mb-4">Categories</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                  <button onClick={() => setSelectedCategory(null)} className={`p-4 rounded-2xl text-center transition-all hover:-translate-y-1 ${selectedCategory === null ? 'bg-[#00245D] text-white shadow-xl shadow-[#00245D]/25' : 'bg-white/95 backdrop-blur-sm border border-[#D4C4A8] hover:shadow-xl shadow-lg'}`}>
                    <div className="text-2xl mb-2">📋</div>
                    <div className="font-semibold text-sm">All</div>
                    <div className={`text-xs mt-1 ${selectedCategory === null ? 'text-[#99D6EA]' : 'text-[#00245D]/60'}`}>{needs.length} needs</div>
                  </button>
                  {categoryStats.map((stat, i) => (
                    <button key={stat.category} onClick={() => setSelectedCategory(stat.category)} className={`p-4 rounded-2xl text-center transition-all hover:-translate-y-1 animate-fadeIn ${selectedCategory === stat.category ? `${getCategoryColor(stat.category)} text-white shadow-xl` : 'bg-white/95 backdrop-blur-sm border border-[#D4C4A8] hover:shadow-xl shadow-lg'}`} style={{ animationDelay: `${i * 0.05}s` }}>
                      <div className="text-2xl mb-2">{CATEGORY_ICONS[stat.category] || '📋'}</div>
                      <div className={`font-semibold text-sm ${selectedCategory === stat.category ? 'text-white' : 'text-[#00245D]'}`}>{stat.category}</div>
                      <div className={`text-xs mt-1 ${selectedCategory === stat.category ? 'text-white/80' : 'text-[#00245D]/60'}`}>{stat.count} needs</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Needs List */}
              <div>
                <h2 className="text-lg font-bold text-[#00245D] mb-4 flex items-center gap-2">
                  {selectedCategory ? `${selectedCategory} Needs` : 'All Needs'}
                  <span className="text-sm font-normal text-[#00245D]/60 bg-[#00245D]/5 px-3 py-1 rounded-full">{filteredNeeds.length} results</span>
                </h2>

                {filteredNeeds.length === 0 ? (
                  <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-12 text-center border border-[#D4C4A8] shadow-lg">
                    <div className="text-5xl mb-4">🔍</div>
                    <p className="text-[#00245D]/60 text-lg">No active needs found.</p>
                    {isAdmin && (
                      <button
                        onClick={() => setIsAddNeedModalOpen(true)}
                        className="mt-6 inline-flex items-center gap-2 bg-[#00245D] text-white px-6 py-2.5 rounded-xl font-medium hover:bg-[#00245D]/90 transition-all hover:-translate-y-0.5 shadow-lg hover:shadow-xl"
                      >
                        <span>+</span> Add New Need
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {paginatedNeeds.map((need, i) => {
                        const userResponse = userResponses.find(r => r.needId === need.id);
                        return (
                          <Link key={need.id} href={`/needs/${need.id}`} className="group bg-white/95 backdrop-blur-sm rounded-2xl p-6 border border-[#D4C4A8] shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 animate-fadeIn relative" style={{ animationDelay: `${i * 0.05}s` }}>
                            <div className="flex items-start justify-between mb-4">
                              <div className={`w-12 h-12 ${getCategoryColor(need.category)} rounded-xl flex items-center justify-center text-xl shadow-lg group-hover:scale-110 transition-transform`}>{CATEGORY_ICONS[need.category] || '📋'}</div>
                              <div className="flex flex-col items-end gap-2">
                                <span className="text-xs font-medium text-[#00245D]/60 bg-[#00245D]/5 px-3 py-1 rounded-full">{need.category}</span>
                                {userResponse && (
                                  <span className={`text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap shadow-sm ${userResponse.status === 'accepted' ? 'bg-green-100 text-green-700 border border-green-200' :
                                    userResponse.status === 'declined' ? 'bg-red-100 text-red-700 border border-red-200' :
                                      userResponse.status === 'reviewed' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                                        'bg-yellow-100 text-yellow-700 border border-yellow-200'
                                    }`}>
                                    {userResponse.status === 'accepted' ? '✓ Accepted' :
                                      userResponse.status === 'declined' ? '✗ Declined' :
                                        userResponse.status === 'reviewed' ? '👀 Reviewed' :
                                          '⏳ Pending'}
                                  </span>
                                )}
                              </div>
                            </div>
                            <h3 className="font-bold text-[#00245D] text-lg group-hover:text-[#00245D]/70 transition-colors">{need.title}</h3>
                            <p className="mt-2 text-sm text-[#00245D]/60 line-clamp-2">{need.description}</p>
                            <div className="mt-4 flex items-center text-[#00245D] text-sm font-medium">
                              {userResponse ? 'View response details' : 'View matches'} <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            </div>
                          </Link>
                        );
                      })}
                    </div>

                    {/* Pagination Controls */}
                    <Pagination
                      currentPage={currentPage}
                      totalItems={filteredNeeds.length}
                      itemsPerPage={itemsPerPage}
                      onPageChange={setCurrentPage}
                      className="mt-8"
                    />
                  </>
                )}
              </div>
            </>
          )}
        </main>

        {/* Admin Add Need Modal */}
        <AdminNeedModal
          isOpen={isAddNeedModalOpen}
          onClose={() => setIsAddNeedModalOpen(false)}
          onSuccess={fetchNeeds}
        />
      </div>
    </ProtectedRoute>
  );
}


