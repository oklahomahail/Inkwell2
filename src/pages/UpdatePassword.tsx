import React, { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { supabase } from '@/lib/supabaseClient';
import { useGo } from '@/utils/navigate';
import { normalizeSafeRedirect } from '@/utils/safeRedirect';

export default function UpdatePassword() {
  const go = useGo();
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Preserve any redirect param
  const redirect = normalizeSafeRedirect(searchParams.get('redirect'), console.warn);

  // Check if we're in a password reset flow with a valid hash
  useEffect(() => {
    const checkResetFlowValid = async () => {
      // The URL hash contains the access token when coming from a password reset email
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const hasResetToken = hashParams.has('access_token') || hashParams.has('type');

      if (!hasResetToken) {
        // Not in a valid password reset flow, redirect to sign in
        go('/sign-in', { replace: true });
      }
    };

    checkResetFlowValid();
  }, [go]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Basic validation
      if (!password || password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }

      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      try {
        setSubmitting(true);
        setError(null);

        console.log('[UpdatePassword] Updating password');

        const { error } = await supabase.auth.updateUser({
          password,
        });

        if (error) throw error;

        console.log('[UpdatePassword] Password updated successfully');
        setSuccess(true);

        // Auto-redirect after a short delay
        setTimeout(() => {
          go(redirect, { replace: true });
        }, 1500);
      } catch (err) {
        console.error('[UpdatePassword] Error updating password:', err);
        setError(err instanceof Error ? err.message : 'Failed to update password');
      } finally {
        setSubmitting(false);
      }
    },
    [password, confirmPassword, go, redirect],
  );

  return (
    <div
      className="min-h-screen bg-[#13294B] text-white grid place-items-center isolate py-12 px-4"
      style={{ backgroundColor: '#13294B', color: 'white' }}
    >
      <div className="w-full max-w-md">
        <div className="flex justify-center">
          <img
            src="/assets/brand/inkwell-lockup-dark.svg"
            alt="Inkwell"
            className="h-16 w-auto"
            onError={(e) => {
              console.error('Logo failed to load, falling back to wordmark');
              // First try the logo path
              (e.currentTarget as HTMLImageElement).src = '/assets/brand/inkwell-wordmark.svg';
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
          Set new password
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
                Password updated!
              </h3>
              <p className="text-sm mb-4" style={{ color: '#334155' }}>
                Your password has been successfully updated. You can now sign in with your new
                password.
              </p>
              <Link
                to={`/sign-in${redirect !== '/dashboard' ? `?redirect=${encodeURIComponent(redirect)}` : ''}`}
                className="text-sm font-medium hover:underline"
                style={{ color: '#13294B' }}
              >
                Continue to sign in
              </Link>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium"
                  style={{ color: '#334155' }}
                >
                  New password
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

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium"
                  style={{ color: '#334155' }}
                >
                  Confirm new password
                </label>
                <div className="mt-1">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
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
                  {submitting ? 'Updating...' : 'Update password'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
