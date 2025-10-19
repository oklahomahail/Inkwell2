import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { supabase } from '@/lib/supabaseClient';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(search);
    const code = params.get('code') || params.get('token_hash');
    const next = params.get('next') || '/profiles';

    (async () => {
      try {
        if (!code) {
          console.error('[AuthCallback] No code found in URL');
          navigate('/sign-in?error=missing_code', { replace: true });
          return;
        }

        console.info('[AuthCallback] Exchanging code for session');
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

        if (exchangeError) {
          console.error('[AuthCallback] Exchange failed:', exchangeError);
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
  }, [search, navigate]);

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
