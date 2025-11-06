import React, { useCallback, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { supabase } from '@/lib/supabaseClient';
import devLog from '@/utils/devLog';
import { normalizeSafeRedirect } from '@/utils/safeRedirect';

export default function ForgotPassword() {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Preserve any redirect param
  const redirect = normalizeSafeRedirect(searchParams.get('redirect'), console.warn);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!email || submitting) return;

      try {
        setSubmitting(true);
        setError(null);

        devLog.debug('[ForgotPassword] Sending password reset email');

        // Create the reset URL with the redirect parameter preserved
        const resetUrl = `${window.location.origin}/auth/update-password?redirect=${encodeURIComponent(redirect)}`;

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: resetUrl,
        });

        if (error) throw error;

        // Always show success even if the email doesn't exist for security reasons
        setSuccess(true);
      } catch (err) {
        devLog.error('[ForgotPassword] Error:', err);
        setError(err instanceof Error ? err.message : 'Failed to send reset email');
      } finally {
        setSubmitting(false);
      }
    },
    [email, submitting, redirect],
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
              devLog.error('Logo failed to load, falling back to icon');
              // First try the icon path
              (e.currentTarget as HTMLImageElement).src = '/brand/inkwell-icon.svg';
              // Add a second fallback in case the logo also fails
              (e.currentTarget as HTMLImageElement).onerror = () => {
                devLog.error('Fallback logo also failed, using text wordmark');
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
          Reset your password
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
                Password reset email sent
              </h3>
              <p className="text-sm mb-4" style={{ color: '#334155' }}>
                If an account exists for {email}, you'll receive an email with instructions to reset
                your password.
              </p>
              <Link
                to={`/sign-in${redirect !== '/dashboard' ? `?redirect=${encodeURIComponent(redirect)}` : ''}`}
                className="text-sm font-medium hover:underline"
                style={{ color: '#13294B' }}
              >
                Return to sign in
              </Link>
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
                  {submitting ? 'Sending...' : 'Send reset instructions'}
                </button>
              </div>

              <div className="text-sm text-center mt-4">
                <Link
                  to={`/sign-in${redirect !== '/dashboard' ? `?redirect=${encodeURIComponent(redirect)}` : ''}`}
                  style={{ color: '#13294B' }}
                  className="font-medium hover:underline"
                >
                  Back to sign in
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
