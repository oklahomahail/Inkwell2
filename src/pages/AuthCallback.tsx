import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

import { supabase } from '@/lib/supabaseClient';
import { useGo } from '@/utils/navigate';
import { normalizeSafeRedirect } from '@/utils/safeRedirect';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const go = useGo();

  useEffect(() => {
    let mounted = true;

    (async () => {
      const code = searchParams.get('code');
      const tokenHash = searchParams.get('token_hash');

      if (!code && !tokenHash) {
        go('/sign-in?error=callback', { replace: true });
        return;
      }

      // Exchange the code/token for a Supabase session
      const response = await supabase.auth.exchangeCodeForSession(window.location.href);

      if (!mounted) return;

      if (response?.error || !response?.data?.session) {
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

      const next = searchParams.get('next');
      const redirect = searchParams.get('redirect');
      const redirectTo = normalizeSafeRedirect(next || redirect, console.warn);
      go(redirectTo, { replace: true });
    })();

    return () => {
      mounted = false;
    };
  }, [go, searchParams]);

  return <p>Signing you in...</p>;
}
