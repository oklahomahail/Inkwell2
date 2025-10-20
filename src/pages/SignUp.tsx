import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';

import { supabase } from '@/lib/supabaseClient';
import { useGo } from '@/utils/navigate';
import { normalizeSafeRedirect } from '@/utils/safeRedirect';

export default function SignUp() {
  const [searchParams] = useSearchParams();
  const go = useGo();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // If /sign-up?redirect=/p/xyz is used, preserve it after normalizing
  const desiredRedirect = useMemo(
    () => normalizeSafeRedirect(searchParams.get('redirect'), console.warn),
    [searchParams],
  );

  // Use a ref to track if we've logged the session check message
  // to reduce console spam in dev mode with strict effects
  const hasLoggedRef = useRef(false);

  // Session guard: if already signed in, skip the page entirely
  useEffect(() => {
    let mounted = true;
    const logPrefix = '[SignUp]';

    (async () => {
      if (!hasLoggedRef.current) {
        console.log(`${logPrefix} Checking for existing session`);
        hasLoggedRef.current = true;
      }

      const { data } = await supabase.auth.getSession();
      if (!mounted) return;

      if (data?.session) {
        console.log(`${logPrefix} Found active session, redirecting to`, desiredRedirect);
        go(desiredRedirect, { replace: true });
      }
    })();

    return () => {
      mounted = false;
    };
  }, [go, desiredRedirect]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!email || !password || submitting) return;

      try {
        setSubmitting(true);
        setError(null);

        console.log('[SignUp] Attempting to sign up with email/password');

        // Build callback URL with the desired redirect as a query param
        const callbackUrl = `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(desiredRedirect)}`;

        console.log('[SignUp] Using emailRedirectTo:', callbackUrl);

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: callbackUrl,
          },
        });

        if (error) {
          // Handle specific error cases
          if (error.status === 500) {
            console.error('[SignUp] Server error (500):', error);
            setError(
              'Server error. This could be due to email delivery issues. Please try again later or contact support if the problem persists.',
            );
            return;
          }

          if (error.message.includes('already registered')) {
            setError('An account with this email already exists. Please sign in instead.');
            return;
          }

          throw error;
        }

        if (!data?.user) {
          throw new Error('Signup failed: No user data returned');
        }

        if (data.user.identities?.length === 0) {
          // User already exists
          setError('An account with this email already exists. Please sign in instead.');
          return;
        }

        console.log('[SignUp] Sign up successful');

        if (data.user.identities?.[0]?.identity_data?.email_verified) {
          // Email already verified, proceed to dashboard
          go(desiredRedirect, { replace: true });
        } else {
          // Email verification required
          setSuccess(true);
        }
      } catch (err) {
        console.error('[SignUp] Sign-up error:', err);

        // Provide more user-friendly error messages
        if (err instanceof Error) {
          const errorMessage = err.message;
          if (errorMessage.includes('email') && errorMessage.includes('invalid')) {
            setError('Please enter a valid email address.');
          } else if (errorMessage.includes('password') && errorMessage.includes('length')) {
            setError('Password must be at least 6 characters long.');
          } else {
            setError(errorMessage);
          }
        } else {
          setError('Sign-up failed. Please try again later.');
        }
      } finally {
        setSubmitting(false);
      }
    },
    [email, password, desiredRedirect, submitting, go],
  );

  return (
    <div
      className="min-h-screen bg-[#13294B] text-white grid place-items-center isolate py-12 px-4"
      style={{ backgroundColor: '#13294B', color: 'white' }}
    >
      <div className="w-full max-w-md">
        <div className="flex justify-center">
          <img
            src="/brand/inkwell-lockup-dark.svg"
            alt="Inkwell"
            className="h-16 w-auto"
            onError={(e) => {
              console.error('Logo failed to load, falling back to wordmark');
              // First try the logo path
              (e.currentTarget as HTMLImageElement).src = '/logo/inkwell-logo-white.svg';
              // Add a second fallback in case the logo also fails
              (e.currentTarget as HTMLImageElement).onerror = () => {
                console.error('Fallback logo also failed, using text wordmark');
                // Replace the img with a text wordmark as final fallback
                const parent = e.currentTarget.parentElement;
                if (parent) {
                  const wordmark = document.createElement('h1');
                  wordmark.textContent = 'Inkwell';
                  wordmark.className = 'text-3xl font-serif font-bold text-[#D4A537]';
                  parent.replaceChild(wordmark, e.currentTarget);
                }
              };
            }}
          />
        </div>
        <h2
          className="mt-6 text-center text-3xl font-bold tracking-tight"
          style={{ color: 'white' }}
        >
          Create your Inkwell account
        </h2>

        <div
          className="mt-8 rounded-lg shadow-xl p-8 relative overflow-hidden border-t-4"
          style={{
            backgroundColor: 'white',
            color: '#1e293b',
            borderColor: '#D4AF37',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            position: 'relative',
          }}
        >
          {success ? (
            <div className="text-center">
              <div
                className="flex items-center justify-center w-12 h-12 mx-auto rounded-full mb-4"
                style={{ backgroundColor: '#ecfdf5' }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="#047857"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-medium mb-2" style={{ color: '#047857' }}>
                Verification email sent!
              </h3>
              <p className="text-sm mb-4" style={{ color: '#334155' }}>
                Please check your email for a verification link. You'll need to verify your email
                before signing in.
              </p>
              <Link
                to="/sign-in"
                className="text-sm font-medium hover:underline"
                style={{ color: '#13294B' }}
              >
                Return to sign in
              </Link>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium"
                  style={{ color: '#334155' }}
                >
                  Email address
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full rounded-md px-3 py-2"
                    style={{
                      border: '1px solid #cbd5e1',
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                      outline: 'none',
                    }}
                    onFocus={(e) => (e.target.style.border = '1px solid #D4AF37')}
                    onBlur={(e) => (e.target.style.border = '1px solid #cbd5e1')}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium"
                  style={{ color: '#334155' }}
                >
                  Password
                </label>
                <div className="mt-1">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full rounded-md px-3 py-2"
                    style={{
                      border: '1px solid #cbd5e1',
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                      outline: 'none',
                    }}
                    onFocus={(e) => (e.target.style.border = '1px solid #D4AF37')}
                    onBlur={(e) => (e.target.style.border = '1px solid #cbd5e1')}
                  />
                  <p className="mt-1 text-xs" style={{ color: '#64748b' }}>
                    Password must be at least 6 characters
                  </p>
                </div>
              </div>

              {error && (
                <div
                  style={{
                    backgroundColor: '#fef2f2',
                    borderRadius: '0.375rem',
                    padding: '1rem',
                  }}
                >
                  <div style={{ color: '#b91c1c', fontSize: '0.875rem' }}>{error}</div>
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    backgroundColor: '#13294B',
                    color: 'white',
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '0.375rem',
                    fontWeight: '500',
                    fontSize: '0.875rem',
                    display: 'flex',
                    justifyContent: 'center',
                    opacity: submitting ? '0.5' : '1',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                  }}
                  onMouseOver={(e) => {
                    if (!submitting) e.currentTarget.style.opacity = '0.9';
                  }}
                  onMouseOut={(e) => {
                    if (!submitting) e.currentTarget.style.opacity = '1';
                  }}
                >
                  {submitting ? 'Creating account...' : 'Sign up'}
                </button>
              </div>

              <div className="text-sm text-center mt-4">
                Already have an account?{' '}
                <Link
                  to={`/sign-in${
                    desiredRedirect !== '/dashboard'
                      ? `?redirect=${encodeURIComponent(desiredRedirect)}`
                      : ''
                  }`}
                  style={{ color: '#13294B' }}
                  className="font-medium hover:underline"
                >
                  Sign in
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
