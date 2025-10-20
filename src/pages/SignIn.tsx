import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';

import { supabase } from '@/lib/supabaseClient';
import { useGo } from '@/utils/navigate';
import { normalizeSafeRedirect } from '@/utils/safeRedirect';

type AuthMode = 'magic' | 'password';

export default function SignIn() {
  const [searchParams] = useSearchParams();
  const go = useGo();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMode, setAuthMode] = useState<AuthMode>('password');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // If /sign-in?redirect=/p/xyz is used, preserve it after normalizing
  const desiredRedirect = useMemo(
    () => normalizeSafeRedirect(searchParams.get('redirect'), console.warn),
    [searchParams],
  );

  // Check for notice of confirmed email
  useEffect(() => {
    if (searchParams.get('notice') === 'confirmed') {
      setMessage('Email confirmed! You can now sign in.');
    }
  }, [searchParams]);

  // Session guard: if already signed in, skip the page entirely
  // IMPORTANT: Only redirect if session is truthy, never on null during first render
  useEffect(() => {
    let mounted = true;
    // Check for _once sentinel to prevent auto-retry loops
    const hasOnceSentinel = searchParams.get('_once') === '1';

    if (hasOnceSentinel) {
      console.log('[SignIn] Skipping auto-session check due to _once sentinel');
      return; // Don't auto-retry if we're coming from an error with _once=1
    }

    (async () => {
      console.log('[SignIn] Checking for existing session');
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      if (data?.session) {
        console.log('[SignIn] Found active session, redirecting to', desiredRedirect);
        go(desiredRedirect, { replace: true });
      } else {
        console.log('[SignIn] No active session found');
      }
    })();
    return () => {
      mounted = false;
    };
  }, [go, desiredRedirect, searchParams]);

  const handlePasswordSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!email || !password || submitting) return;

      try {
        setSubmitting(true);
        setError(null);
        setMessage(null);

        console.log('[SignIn] Attempting sign in with email/password');

        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        console.log('[SignIn] Sign in successful, redirecting to', desiredRedirect);
        go(desiredRedirect, { replace: true });
      } catch (err) {
        console.error('[SignIn] Sign-in error:', err);
        setError(err instanceof Error ? err.message : 'Sign-in failed');
      } finally {
        setSubmitting(false);
      }
    },
    [email, password, desiredRedirect, submitting, go],
  );

  const handleMagicLinkSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!email || submitting) return;

      try {
        setSubmitting(true);
        setError(null);
        setMessage(null);

        console.log('[SignIn] Attempting sign in with magic link');

        // Build callback URL with the intended destination as a query param
        const callbackUrl = `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(desiredRedirect)}`;

        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: callbackUrl,
          },
        });

        if (error) throw error;

        setMessage('Check your email for the magic link');
      } catch (err) {
        console.error('[SignIn] Magic link error:', err);
        setError(err instanceof Error ? err.message : 'Failed to send magic link');
      } finally {
        setSubmitting(false);
      }
    },
    [email, desiredRedirect, submitting],
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
          Sign in to Inkwell
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
          {/* Auth Method Tabs */}
          <div className="flex mb-6 border-b">
            <button
              className={`px-4 py-2 flex-1 text-center font-medium ${
                authMode === 'password'
                  ? 'text-inkwell-blue border-b-2 border-inkwell-blue'
                  : 'text-gray-500'
              }`}
              onClick={() => setAuthMode('password')}
              type="button"
            >
              Email & Password
            </button>
            <button
              className={`px-4 py-2 flex-1 text-center font-medium ${
                authMode === 'magic'
                  ? 'text-inkwell-blue border-b-2 border-inkwell-blue'
                  : 'text-gray-500'
              }`}
              onClick={() => setAuthMode('magic')}
              type="button"
            >
              Magic Link
            </button>
          </div>

          {/* Success Message */}
          {message && (
            <div
              className="mb-6 p-3 rounded-md"
              style={{ backgroundColor: '#ecfdf5', color: '#047857' }}
            >
              <p className="text-sm font-medium">{message}</p>
            </div>
          )}

          {/* Password Auth Form */}
          {authMode === 'password' && (
            <form className="space-y-6" onSubmit={handlePasswordSubmit}>
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
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium"
                    style={{ color: '#334155' }}
                  >
                    Password
                  </label>
                  <div className="text-sm">
                    <Link
                      to={`/auth/forgot-password${desiredRedirect !== '/dashboard' ? `?redirect=${encodeURIComponent(desiredRedirect)}` : ''}`}
                      style={{ color: '#13294B' }}
                      className="font-medium hover:underline"
                    >
                      Forgot your password?
                    </Link>
                  </div>
                </div>
                <div className="mt-1">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
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
                  {submitting ? 'Signing in...' : 'Sign in'}
                </button>
              </div>
            </form>
          )}

          {/* Magic Link Auth Form */}
          {authMode === 'magic' && (
            <form className="space-y-6" onSubmit={handleMagicLinkSubmit}>
              <div>
                <label
                  htmlFor="magic-email"
                  className="block text-sm font-medium"
                  style={{ color: '#334155' }}
                >
                  Email address
                </label>
                <div className="mt-1">
                  <input
                    id="magic-email"
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
                  {submitting ? 'Sending...' : 'Send magic link'}
                </button>
              </div>
            </form>
          )}

          <div className="text-sm text-center mt-6">
            Don't have an account?{' '}
            <Link
              to={`/sign-up${desiredRedirect !== '/dashboard' ? `?redirect=${encodeURIComponent(desiredRedirect)}` : ''}`}
              style={{ color: '#13294B' }}
              className="font-medium hover:underline"
            >
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
