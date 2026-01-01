'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { Need } from '@/types';

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

export default function SearchPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Need[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || query.length < 2) return;

    setLoading(true);
    setSearched(true);

    try {
      const token = await user?.getIdToken();
      const response = await fetch('/api/needs', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (data.success) {
        const searchQuery = query.toLowerCase().trim();
        const filteredNeeds = data.data.needs.filter((need: Need) =>
          need.title.toLowerCase().includes(searchQuery) ||
          need.description.toLowerCase().includes(searchQuery) ||
          need.category.toLowerCase().includes(searchQuery)
        );
        setResults(filteredNeeds);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

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
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8 animate-fadeIn">
            <h1 className="text-3xl font-bold text-[#00245D] flex items-center gap-3">
              <span className="w-10 h-10 bg-[#00245D] rounded-xl flex items-center justify-center text-white text-lg shadow-lg">🔍</span>
              Search
            </h1>
            <p className="mt-2 text-[#00245D]/60">Find community needs by skills, organizations, or sectors.</p>
          </div>

          <form onSubmit={handleSearch} className="mb-8">
            <div className="flex gap-3 bg-white/95 backdrop-blur-sm p-2 rounded-2xl shadow-xl hover:shadow-2xl transition-shadow shadow-[#00245D]/10 border border-[#D4C4A8]">
              <div className="flex-1 relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#00245D]/40">🔍</span>
                <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search for needs by title, description, or category..." className="w-full pl-12 pr-4 py-4 border-0 rounded-xl focus:ring-0 focus:outline-none text-[#00245D] placeholder-[#00245D]/40 bg-transparent" />
              </div>
              <button type="submit" disabled={loading || query.length < 2} className="px-8 py-4 bg-[#00245D] text-white rounded-xl font-semibold shadow-lg shadow-[#00245D]/25 hover:shadow-xl hover:shadow-[#00245D]/30 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0">
                {loading ? <span className="flex items-center gap-2"><span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></span>Searching</span> : 'Search'}
              </button>
            </div>
          </form>

          {searched && (
            <div className="animate-fadeIn">
              <h2 className="text-lg font-bold text-[#00245D] mb-4 flex items-center gap-2">
                Results <span className="text-sm font-normal text-[#00245D]/60 bg-[#D4C4A8]/50 px-3 py-1 rounded-full">{results.length} found</span>
              </h2>

              {results.length === 0 ? (
                <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-12 text-center border border-[#D4C4A8] shadow-lg">
                  <div className="text-5xl mb-4">🔍</div>
                  <p className="text-[#00245D]/60 text-lg">No needs found for &quot;{query}&quot;</p>
                  <p className="text-[#00245D]/40 text-sm mt-2">Try different keywords or check spelling</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {results.map((need, i) => (
                    <div
                      key={need.id}
                      onClick={() => router.push(`/needs/${need.id}`)}
                      className="group bg-white/95 backdrop-blur-sm rounded-2xl p-6 border border-[#D4C4A8] shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 animate-fadeIn cursor-pointer"
                      style={{ animationDelay: `${i * 0.05}s` }}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className={`w-12 h-12 ${getCategoryColor(need.category)} rounded-xl flex items-center justify-center text-xl shadow-lg group-hover:scale-110 transition-transform`}>
                          {CATEGORY_ICONS[need.category] || '📋'}
                        </div>
                        <span className="text-xs font-medium text-[#00245D]/60 bg-[#D4C4A8]/50 px-3 py-1 rounded-full">
                          {need.category}
                        </span>
                      </div>
                      <h3 className="font-bold text-[#00245D] text-lg group-hover:text-[#00245D]/70 transition-colors">
                        {need.title}
                      </h3>
                      <p className="mt-2 text-sm text-[#00245D]/60 line-clamp-2">
                        {need.description}
                      </p>
                      <div className="mt-4 flex items-center text-[#00245D] text-sm font-medium">
                        View details
                        <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
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


