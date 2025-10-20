import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { supabase } from '@/lib/supabaseClient';
import { useGo } from '@/utils/navigate';
import { normalizeSafeRedirect } from '@/utils/safeRedirect';

export default function SignIn() {
  const [searchParams] = useSearchParams();
  const go = useGo();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // If /sign-in?redirect=/p/xyz is used, preserve it after normalizing
  const desiredRedirect = useMemo(
    () => normalizeSafeRedirect(searchParams.get('redirect'), console.warn),
    [searchParams],
  );

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

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!email || submitting) return;

      try {
        setSubmitting(true);
        setError(null);

        // Add debug for what redirect URL we're using - ensure it includes both redirect and view params
        // view=dashboard is important as it seems to be used by Supabase in production
        const callbackUrl = `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(desiredRedirect)}&view=dashboard`;
        console.log('[SignIn] Using redirect URL:', callbackUrl);

        try {
          const { error, data } = await supabase.auth.signInWithOtp({
            email,
            options: {
              emailRedirectTo: callbackUrl,
            },
          });

          // Log the actual redirect URL that Supabase is using (could be different)
          console.log('[SignIn] Supabase response:', { error, data });

          if (error) throw error;
        } catch (authError) {
          console.error('[SignIn] Supabase auth error:', authError);
          throw authError; // Re-throw for the outer catch block
        }

        if (error) throw error;
        setMessage('Check your email for the magic link');
      } catch (err) {
        console.error('Sign-in error:', err);
        setError(err instanceof Error ? err.message : 'Sign-in failed');
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
          <img src="/logo/inkwell-logo-white.svg" alt="Inkwell" className="h-16 w-auto" />
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
          {message ? (
            <div className="text-center font-medium" style={{ color: '#047857' }}>
              {message}
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
        </div>
      </div>
    </div>
  );
}
