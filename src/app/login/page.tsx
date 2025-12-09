'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import Logo from '@/components/Logo';
import PasswordInput from '@/components/PasswordInput';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, userData, user } = useAuth();
  const router = useRouter();

  // Redirect based on user role after login
  useEffect(() => {
    if (user && userData) {
      if (userData.isAdmin) {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    }
  }, [user, userData, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
      // Redirection will be handled by useEffect
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign in';
      setError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-pattern">
      {/* Decorative Elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-[#99D6EA] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#00245D] rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" style={{ animationDelay: '1s' }}></div>

      <div className="max-w-md w-full animate-fadeIn relative z-10">
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl shadow-[#00245D]/10 p-8 border border-[#D4C4A8]">
          <div className="text-center mb-8">
            <Logo size="xl" showText={false} centered className="mb-4" />
            <h1 className="text-2xl font-extrabold text-[#00245D]">Caps Collective</h1>
            <p className="mt-2 text-[#00245D]/60">Sign in to your account</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                <span>⚠️</span> {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#00245D] mb-1.5">Email address</label>
              <input id="email" name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="block w-full px-4 py-3.5 border-2 border-[#D4C4A8] rounded-xl placeholder-[#00245D]/40 focus:outline-none focus:ring-0 focus:border-[#00245D] transition-colors" placeholder="you@example.com" />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#00245D] mb-1.5">Password</label>
              <PasswordInput
                id="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>

            <button type="submit" disabled={loading} className="w-full py-4 bg-[#00245D] text-white rounded-xl font-semibold shadow-lg shadow-[#00245D]/25 hover:shadow-xl hover:shadow-[#00245D]/30 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0">
              {loading ? <span className="flex items-center justify-center gap-2"><span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></span>Signing in...</span> : 'Sign in'}
            </button>

            <div className="text-center">
              <Link href="/forgot-password" className="text-sm text-[#00245D] hover:text-[#00245D]/70 font-medium">Forgot your password?</Link>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-[#D4C4A8] text-center">
            <p className="text-[#00245D]/60">Don&apos;t have an account? <Link href="/register" className="text-[#00245D] hover:text-[#00245D]/70 font-semibold">Sign up</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}

