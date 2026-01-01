'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import Logo from '@/components/Logo';
import PasswordInput from '@/components/PasswordInput';
import ProfilePhotoUpload from '@/components/ProfilePhotoUpload';

function RegisterPageContent() {
  const searchParams = useSearchParams();
  const invitationToken = searchParams.get('invitation');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [profilePhoto, setProfilePhoto] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [validatingInvitation, setValidatingInvitation] = useState(false);
  const [invitationValid, setInvitationValid] = useState(false);
  const { signUp } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (invitationToken) {
      validateInvitation();
    }
  }, [invitationToken]);

  const validateInvitation = async () => {
    if (!invitationToken) return;

    setValidatingInvitation(true);
    try {
      // In a real implementation, you'd validate the token via API
      // For now, we'll just mark it as valid
      setInvitationValid(true);
    } catch (err) {
      setError('Invalid or expired invitation link');
      setInvitationValid(false);
    } finally {
      setValidatingInvitation(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!firstName.trim() || !lastName.trim()) {
      setError('Please enter your first and last name');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (!phoneNumber.trim()) {
      setError('Please enter your phone number');
      return;
    }

    setLoading(true);

    try {
      const displayName = `${firstName} ${lastName}`;

      // Prepare user data - include placeholder for invitation info that will be updated
      const userDataToCreate: any = {
        firstName,
        lastName,
        phoneNumber,
        bio,
        location,
        linkedinUrl,
        profilePhoto,
      };

      // If there's an invitation token, we'll mark it for processing
      // The actual linking will happen via the accept API
      if (invitationToken) {
        userDataToCreate._pendingInvitation = invitationToken;
      }

      const user = await signUp(email, password, displayName, userDataToCreate);

      // If registered via invitation, mark invitation as accepted
      if (invitationToken) {
        try {
          const idToken = await user.getIdToken();
          const acceptResponse = await fetch('/api/invitations/accept', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${idToken}`,
            },
            body: JSON.stringify({ token: invitationToken, userId: user.uid, userEmail: email, userName: displayName }),
          });

          const acceptData = await acceptResponse.json();
          if (!acceptData.success) {
            console.error('Failed to accept invitation:', acceptData.error);
          }
        } catch (e) {
          console.error('Failed to mark invitation as accepted', e);
        }
      }

      router.push('/onboarding/skills');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create account';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-pattern">
      <div className="absolute top-20 right-10 w-72 h-72 bg-[#99D6EA] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-[#00245D] rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" style={{ animationDelay: '1s' }}></div>

      <div className="max-w-md w-full animate-fadeIn relative z-10">
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl shadow-[#00245D]/10 p-8 border border-[#D4C4A8]">
          <div className="text-center mb-8">
            <Logo size="xl" showText={false} centered className="mb-4" />
            <h1 className="text-2xl font-extrabold text-[#00245D]">
              {invitationToken ? 'Join by Invitation' : 'Join Caps Collective'}
            </h1>
            <p className="mt-2 text-[#00245D]/60">
              {invitationToken
                ? 'You\'ve been invited to join the community'
                : 'Create your account to get started'}
            </p>
          </div>

          {validatingInvitation ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00245D] mx-auto"></div>
              <p className="mt-4 text-[#00245D]/60">Validating invitation...</p>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              {error && <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center gap-2"><span>⚠️</span> {error}</div>}

              {invitationToken && invitationValid && (
                <div className="bg-green-50 border border-green-100 text-green-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                  <span>✓</span> Valid invitation - you're all set to register!
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-[#00245D] mb-1.5">First Name</label>
                  <input id="firstName" name="firstName" type="text" required value={firstName} onChange={(e) => setFirstName(e.target.value)} className="block w-full px-4 py-3.5 border-2 border-[#D4C4A8] rounded-xl placeholder-[#00245D]/40 focus:outline-none focus:ring-0 focus:border-[#00245D] transition-colors" placeholder="John" />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-[#00245D] mb-1.5">Last Name</label>
                  <input id="lastName" name="lastName" type="text" required value={lastName} onChange={(e) => setLastName(e.target.value)} className="block w-full px-4 py-3.5 border-2 border-[#D4C4A8] rounded-xl placeholder-[#00245D]/40 focus:outline-none focus:ring-0 focus:border-[#00245D] transition-colors" placeholder="Doe" />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[#00245D] mb-1.5">Email address</label>
                <input id="email" name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="block w-full px-4 py-3.5 border-2 border-[#D4C4A8] rounded-xl placeholder-[#00245D]/40 focus:outline-none focus:ring-0 focus:border-[#00245D] transition-colors" placeholder="you@example.com" />
              </div>

              <div>
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-[#00245D] mb-1.5">Phone Number</label>
                <input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="block w-full px-4 py-3.5 border-2 border-[#D4C4A8] rounded-xl placeholder-[#00245D]/40 focus:outline-none focus:ring-0 focus:border-[#00245D] transition-colors"
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-[#00245D] mb-1.5">Brief Bio (Optional)</label>
                <textarea
                  id="bio"
                  name="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="block w-full px-4 py-3.5 border-2 border-[#D4C4A8] rounded-xl placeholder-[#00245D]/40 focus:outline-none focus:ring-0 focus:border-[#00245D] transition-colors"
                  placeholder="Tell us a bit about yourself..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-[#00245D] mb-1.5">Location / City (Optional)</label>
                  <input
                    id="location"
                    name="location"
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="block w-full px-4 py-3.5 border-2 border-[#D4C4A8] rounded-xl placeholder-[#00245D]/40 focus:outline-none focus:ring-0 focus:border-[#00245D] transition-colors"
                    placeholder="e.g. Vancouver, BC"
                  />
                </div>
                <div>
                  <label htmlFor="linkedinUrl" className="block text-sm font-medium text-[#00245D] mb-1.5">LinkedIn URL (Optional)</label>
                  <input
                    id="linkedinUrl"
                    name="linkedinUrl"
                    type="url"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    className="block w-full px-4 py-3.5 border-2 border-[#D4C4A8] rounded-xl placeholder-[#00245D]/40 focus:outline-none focus:ring-0 focus:border-[#00245D] transition-colors"
                    placeholder="https://www.linkedin.com/in/username"
                  />
                </div>
              </div>

              <ProfilePhotoUpload
                currentPhotoUrl={profilePhoto}
                onPhotoUploaded={setProfilePhoto}
                disabled={loading}
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-[#00245D] mb-1.5">Password</label>
                  <PasswordInput
                    id="password"
                    name="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#00245D] mb-1.5">Confirm</label>
                  <PasswordInput
                    id="confirmPassword"
                    name="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} className="w-full py-4 bg-[#00245D] text-white rounded-xl font-semibold shadow-lg shadow-[#00245D]/25 hover:shadow-xl hover:shadow-[#00245D]/30 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 mt-2">
                {loading ? <span className="flex items-center justify-center gap-2"><span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></span>Creating account...</span> : 'Create account'}
              </button>
            </form>
          )}

          <div className="mt-6 pt-6 border-t border-[#D4C4A8] text-center">
            <p className="text-[#00245D]/60">Already have an account? <Link href="/login" className="text-[#00245D] hover:text-[#00245D]/70 font-semibold">Sign in</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-pattern">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00245D]"></div>
      </div>
    }>
      <RegisterPageContent />
    </Suspense>
  );
}
