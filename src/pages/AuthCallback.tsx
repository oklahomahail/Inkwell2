import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { supabase } from '@/lib/supabaseClient';

/**
 * Validates and normalizes a redirect path to prevent open redirects
 * Only allows same-origin paths starting with /
 * @param path - The path to validate
 * @returns Normalized safe path, or /profiles as fallback
 */
function normalizeSafeRedirect(path: string | null): string {
  if (!path) return '/profiles';

  // Only allow same-origin paths: must start with / and not contain protocol/host
  // Regex: starts with /, followed by any non-whitespace chars (but no // which could be protocol)
  const safePathPattern = /^\/[^\s]*$/;

  // Reject anything that looks like an absolute URL
  if (path.includes('://') || path.startsWith('//')) {
    console.warn('[AuthCallback] Rejected absolute URL redirect:', path);
    return '/profiles';
  }

  // Validate against safe path pattern
  if (!safePathPattern.test(path)) {
    console.warn('[AuthCallback] Rejected invalid redirect path:', path);
    return '/profiles';
  }

  return path;
}

export default function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check both query params and hash params (Supabase might use either)
    const searchParams = new URLSearchParams(location.search);
    const hashParams = new URLSearchParams(location.hash.substring(1));

    const code =
      searchParams.get('code') ||
      searchParams.get('token_hash') ||
      hashParams.get('access_token') ||
      hashParams.get('refresh_token');

    const nextParam = searchParams.get('next') || hashParams.get('next');
    const next = normalizeSafeRedirect(nextParam);

    console.log('[AuthCallback] Starting auth callback with params:', {
      hasCode: !!code,
      codeLength: code?.length,
      nextParam,
      normalizedNext: next,
      fullURL: window.location.href,
      pathname: location.pathname,
      search: location.search,
      hash: location.hash,
      searchParams: Object.fromEntries(searchParams.entries()),
      hashParams: Object.fromEntries(hashParams.entries()),
    });

    (async () => {
      try {
        if (!code) {
          console.error('[AuthCallback] No code found in URL');
          console.error('[AuthCallback] Full URL was:', window.location.href);
          navigate('/sign-in?error=missing_code', { replace: true });
          return;
        }

        console.info('[AuthCallback] Exchanging code for session');
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

        if (exchangeError) {
          console.error('[AuthCallback] Exchange failed:', exchangeError);
          // Check for specific error types
          if (
            exchangeError.message?.includes('expired') ||
            exchangeError.message?.includes('used')
          ) {
            throw new Error('This link has expired or been used. Please request a new one.');
          }
          throw exchangeError;
        }

        console.info('[AuthCallback] Session created, redirecting to:', next);
        navigate(next, { replace: true });
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'Unknown error';
        console.error('[AuthCallback] Callback failed:', errorMessage);
        setError(errorMessage);
        navigate(`/sign-in?error=callback_failed&details=${encodeURIComponent(errorMessage)}`, {
          replace: true,
        });
      }
    })();
  }, [location.search, location.hash, navigate]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-inkwell-blue">
        <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
          <h2 className="mb-4 text-2xl font-bold text-red-600">Authentication Failed</h2>
          <p className="text-gray-700 mb-4">We couldn't complete your sign-in. Please try again.</p>
          <p className="text-sm text-gray-500 mb-4">Error: {error}</p>
          <button
            onClick={() => navigate('/sign-in', { replace: true })}
            className="w-full rounded-md bg-inkwell-blue px-4 py-2 font-medium text-white
                       transition-colors duration-150
                       hover:bg-inkwell-gold
                       focus:outline-none focus:ring-2 focus:ring-inkwell-gold focus:ring-offset-2"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-inkwell-blue">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <div className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-gray-200 border-t-inkwell-blue"></div>
          <h2 className="text-2xl font-bold text-gray-900">Signing you in...</h2>
          <p className="mt-2 text-gray-600">Please wait while we complete your authentication.</p>
        </div>
      </div>
    </div>
  );
}
