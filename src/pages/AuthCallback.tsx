import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

import { supabase } from '@/lib/supabaseClient';
import { useGo } from '@/utils/navigate';
import { normalizeSafeRedirect } from '@/utils/safeRedirect';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const go = useGo();

  // Get preferred redirect destination or default to dashboard
  const next = searchParams.get('next');
  const redirect = searchParams.get('redirect');
  const redirectTo = normalizeSafeRedirect(next || redirect || '/dashboard', console.warn);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        // First, check if we have a code parameter (Supabase v2+)
        const code = searchParams.get('code');

        // Fall back to token_hash for older flows
        const tokenHash = searchParams.get('token_hash');

        if (!code && !tokenHash) {
          console.warn('[AuthCallback] Missing code or token_hash parameter');
          go('/sign-in?error=callback', { replace: true });
          return;
        }

        // Exchange the code/token for a Supabase session
        let response;

        if (code) {
          // Preferred method for Supabase v2+
          response = await supabase.auth.exchangeCodeForSession(code);
        } else {
          // Legacy method using full URL
          response = await supabase.auth.exchangeCodeForSession(window.location.href);
        }

        if (!mounted) return;

        if (response?.error || !response?.data?.session) {
          console.warn('[AuthCallback] Failed to exchange code for session:', response?.error);
          go('/sign-in?error=callback', { replace: true });
          return;
        }

        // Optional: mark that onboarding tour should run on first open.
        try {
          const firstLoginFlag = localStorage.getItem('tourCompleted');
          if (!firstLoginFlag) {
            localStorage.setItem('tourShouldStart', '1');
          }
        } catch {
          // Ignore storage errors
        }

        // Redirect to the desired page after successful authentication
        go(redirectTo, { replace: true });
      } catch (err) {
        console.warn('[AuthCallback] Failed:', err);
        go('/sign-in?error=callback', { replace: true });
      }
    })();

    return () => {
      mounted = false;
    };
  }, [go, searchParams, redirectTo]);

  return <p>Signing you in...</p>;
}
