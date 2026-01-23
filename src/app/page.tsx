'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import Logo from '@/components/Logo';
import { BRANDING, LANDING_FEATURES, LANDING_STATS } from '@/lib/branding';

export default function Home() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user && userData) {
      // Admin users go to admin dashboard
      if (userData.isAdmin) {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    }
  }, [user, userData, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-pattern">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#94C2E0] border-t-[#00245D]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-pattern">
      {/* Decorative Elements - hidden on mobile to prevent overflow */}
      <div className="hidden md:block absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#94C2E0] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute top-40 right-10 w-96 h-96 bg-[#00245D] rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-[#94C2E0] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 container mx-auto px-4 sm:px-6 py-4 sm:py-6 flex justify-between items-center">
        <Logo size="lg" showText={false} />
        <div className="flex items-center gap-2 sm:gap-4">
          <Link href="/login" className="text-[#00245D] hover:text-[#00245D]/70 font-medium transition-colors text-sm sm:text-base">Sign In</Link>
          <Link href="/register" className="bg-[#00245D] text-white px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl font-medium hover:shadow-lg hover:shadow-[#00245D]/25 transition-all hover:-translate-y-0.5 text-sm sm:text-base whitespace-nowrap">Get Started</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 container mx-auto px-4 sm:px-6 py-12 md:py-24">
        <div className="text-center max-w-4xl mx-auto animate-fadeIn">
          {/* Together We Dare Image */}
          <div className="mb-6 md:mb-8 flex justify-center px-4">
            <Image
              src="/together-we-dare-transparent.png"
              alt="Together We Dare"
              width={600}
              height={193}
              unoptimized
              priority
              className="w-full max-w-[400px] md:max-w-[600px] h-auto"
            />
          </div>

          <div className="inline-flex items-center gap-2 bg-white/80 text-[#00245D] px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-medium mb-4 md:mb-6 border border-[#94C2E0]">
            <span className="w-2 h-2 bg-[#00245D] rounded-full animate-pulse"></span>
            {BRANDING.heroTagline}
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-black text-[#00245D] mb-4 md:mb-6 leading-tight">
            <span className="text-[#004CC8] drop-shadow-[0_2px_4px_rgba(0,36,93,0.5)]">{BRANDING.portalName}</span>
          </h2>
          {/* TODO: Pending final copy from client - update in src/lib/branding.ts */}
          <p className="text-base md:text-lg lg:text-xl text-[#00245D]/80 mb-8 md:mb-10 max-w-2xl mx-auto leading-relaxed whitespace-pre-line px-2">
            {BRANDING.heroDescription}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="group bg-[#00245D] text-white px-8 py-4 rounded-2xl font-semibold text-lg shadow-xl shadow-[#00245D]/25 hover:shadow-2xl hover:shadow-[#00245D]/30 transition-all hover:-translate-y-1 flex items-center justify-center gap-2">
              {BRANDING.ctaJoin}
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </Link>
            <Link href="/login" className="bg-white text-[#00245D] px-8 py-4 rounded-2xl font-semibold text-lg border-2 border-[#00245D] hover:bg-[#00245D] hover:text-white transition-all hover:-translate-y-1">{BRANDING.ctaSignIn}</Link>
          </div>
        </div>

        {/* Features */}
        {/* TODO: Pending final copy from client - update in src/lib/branding.ts */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mt-16 md:mt-24 max-w-5xl mx-auto">
          {LANDING_FEATURES.map((f, i) => (
            <div key={i} className="group bg-white rounded-2xl md:rounded-3xl p-6 md:p-8 shadow-lg shadow-[#00245D]/10 border border-[#D4C4A8] hover:shadow-xl hover:shadow-[#94C2E0]/60 transition-all hover:-translate-y-2 animate-fadeIn" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className={`w-14 h-14 ${f.color} rounded-2xl flex items-center justify-center text-2xl mb-5 shadow-lg group-hover:scale-110 transition-transform`}>{f.icon}</div>
              <h3 className="text-xl font-bold text-[#00245D] mb-3">{f.title}</h3>
              <p className="text-[#00245D]/70 leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>

        {/* Stats Section */}
        <div className="mt-16 md:mt-24 bg-[#00245D] rounded-2xl md:rounded-3xl p-6 md:p-10 max-w-4xl mx-auto shadow-2xl shadow-[#00245D]/25">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 text-center text-white">
            {LANDING_STATS.map((s, i) => (
              <div key={i} className="py-2 sm:py-0">
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1">{s.number}</div>
                <div className="text-[#94C2E0] text-xs sm:text-sm">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 container mx-auto px-4 sm:px-6 py-8 md:py-10 text-center">
        <p className="text-[#00245D]/60">{BRANDING.footerText}</p>
      </footer>
    </div>
  );
}
