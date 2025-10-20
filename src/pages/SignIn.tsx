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
    <div className="flex min-h-screen flex-col justify-center bg-inkwell-blue py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <img src="/logo/inkwell-logo-white.svg" alt="Inkwell" className="h-16 w-auto" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-white">
          Sign in to Inkwell
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white px-4 py-8 shadow-lg border-t-4 border-inkwell-gold sm:rounded-lg sm:px-10 relative overflow-hidden">
          {message ? (
            <div className="text-center text-emerald-600">{message}</div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-inkwell-blue">
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
                    className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-inkwell-gold focus:outline-none focus:ring-inkwell-gold sm:text-sm"
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <div className="text-sm text-red-700">{error}</div>
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex w-full justify-center rounded-md border border-transparent bg-inkwell-blue px-4 py-3 text-sm font-medium text-white shadow-sm hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-inkwell-gold focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
