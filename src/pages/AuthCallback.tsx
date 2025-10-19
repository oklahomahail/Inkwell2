import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { supabase } from '@/lib/supabaseClient';

/**
 * Match the same safety behavior as SignIn.tsx.
 */
function normalizeSafeRedirect(raw: string | null): string {
  if (!raw) return '/dashboard';
  if (raw.startsWith('/') && !raw.startsWith('//')) return raw;
  return '/dashboard';
}

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    (async () => {
      // Exchange the "code" in this URL for a Supabase session
      const { data, error } = await supabase.auth.exchangeCodeForSession(window.location.href);

      if (!mounted) return;

      if (error) {
        // Optional: include code for easier debugging
        navigate('/sign-in?error=callback', { replace: true });
        return;
      }

      // Optional: mark that onboarding tour should run on first open.
      // Your dashboard can check this flag on mount and start the tour once,
      // then clear it after completion.
      try {
        // Only set the tour flag if this is the user's very first session.
        // If you have a better signal available (e.g., profile.createdAt),
        // replace this with that check.
        const firstLoginFlag = localStorage.getItem('tourCompleted');
        if (!firstLoginFlag) {
          localStorage.setItem('tourShouldStart', '1');
        }
      } catch {
        // Ignore storage errors
      }

      const redirectTo = normalizeSafeRedirect(searchParams.get('redirect'));
      navigate(redirectTo, { replace: true });
    })();

    return () => {
      mounted = false;
    };
  }, [navigate, searchParams]);

  return <p>Signing you in…</p>;
}
