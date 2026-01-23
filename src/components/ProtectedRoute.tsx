'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireOnboarding?: boolean;
}

export default function ProtectedRoute({
  children,
  requireAdmin = false,
  requireOnboarding = false
}: ProtectedRouteProps) {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && userData) {
      if (!user) {
        router.push('/login');
        return;
      }

      // Admin users should always go to admin dashboard, skip onboarding
      if (userData.isAdmin) {
        // If admin is on onboarding page, redirect to admin dashboard
        if (pathname?.startsWith('/onboarding')) {
          router.push('/admin');
          return;
        }
        // If page requires onboarding but user is admin, allow access (admins skip onboarding)
        return;
      }

      // Non-admin users
      if (requireAdmin && !userData.isAdmin) {
        router.push('/dashboard');
        return;
      }

      // Check onboarding requirement for non-admin users
      if (requireOnboarding && !userData.onboardingComplete) {
        router.push('/onboarding/skills');
        return;
      }

      // If user is on onboarding page but already completed onboarding, redirect to dashboard
      if (pathname?.startsWith('/onboarding') && userData.onboardingComplete) {
        router.push('/dashboard');
        return;
      }
    }
  }, [user, userData, loading, router, requireAdmin, requireOnboarding, pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-pattern">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#99D6EA] border-t-[#00245D]"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (requireAdmin && !userData?.isAdmin) {
    return null;
  }

  return <>{children}</>;
}

