import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { supabase } from '@/lib/supabaseClient';

/**
 * Only allow same-origin, absolute paths like "/dashboard" or "/p/123".
 * Everything else falls back to "/dashboard".
 */
function normalizeSafeRedirect(raw: string | null): string {
  if (!raw) return '/dashboard';
  try {
    // Must start with a single "/" and not be protocol/host-prefixed
    if (raw.startsWith('/') && !raw.startsWith('//')) return raw;
    return '/dashboard';
  } catch {
    return '/dashboard';
  }
}

export default function SignIn() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // If /sign-in?redirect=/p/xyz is used, preserve it
  const desiredRedirect = useMemo(
    () => normalizeSafeRedirect(searchParams.get('redirect')),
    [searchParams],
  );

  // Session guard: if already signed in, skip the page entirely
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      if (data.session) {
        navigate(desiredRedirect, { replace: true });
      }
    })();
    return () => {
      mounted = false;
    };
  }, [navigate, desiredRedirect]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitting(true);
      setError(null);
      setMessage(null);

      try {
        const emailRedirectTo = `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(
          desiredRedirect,
        )}`;

        const { error: signInError } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo },
        });

        if (signInError) {
          setError(signInError.message || 'Unable to send magic link.');
          return;
        }

        setMessage(
          'Check your email for a magic link. It can take up to a minute. Remember to check spam.',
        );
      } catch (err) {
        setError('Unexpected error while sending the magic link.');
      } finally {
        setSubmitting(false);
      }
    },
    [email, desiredRedirect],
  );

  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-semibold mb-4">Sign in to Inkwell</h1>
      <form onSubmit={handleSubmit} className="space-y-3">
        <label className="block">
          <span className="block text-sm mb-1">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded border px-3 py-2"
            placeholder="you@example.com"
            autoComplete="email"
          />
        </label>

        <button type="submit" disabled={submitting} className="w-full rounded px-3 py-2 border">
          {submitting ? 'Sending…' : 'Send magic link'}
        </button>

        {!!message && <p className="text-sm text-green-700">{message}</p>}
        {!!error && <p className="text-sm text-red-700">{error}</p>}
      </form>
    </div>
  );
}
