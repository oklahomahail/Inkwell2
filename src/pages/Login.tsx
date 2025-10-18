import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

import Logo from '@/components/Logo';
import { useAuth } from '@/context/AuthContext';

const RATE_LIMIT_SECONDS = 30;

export default function _Login() {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const { signInWithEmail } = useAuth();

  // Capture redirect param for deep link support
  const redirectPath = searchParams.get('redirect') ?? undefined;

  // Rate limit countdown
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && rateLimited) {
      setRateLimited(false);
    }
    return undefined;
  }, [countdown, rateLimited]);

  async function _onSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Check rate limit
    if (rateLimited) {
      setError(`Please wait ${countdown} seconds before requesting another link`);
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const { error: signInError } = await signInWithEmail(email, redirectPath);

      if (signInError) {
        // Provide user-friendly error messages
        let friendlyError = signInError.message;

        if (signInError.message.includes('rate limit')) {
          friendlyError = 'Too many attempts. Please try again in a few minutes.';
        } else if (signInError.message.includes('invalid')) {
          friendlyError = 'Please enter a valid email address.';
        } else if (signInError.message.includes('not authorized')) {
          friendlyError = 'Sign-ups are currently restricted. Contact support for access.';
        } else if (
          signInError.message.includes('already used') ||
          signInError.message.includes('expired') ||
          signInError.message.includes('invalid token')
        ) {
          friendlyError =
            'This magic link has expired or already been used. Request a new one below.';
        }

        setError(friendlyError);
        setLoading(false);

        // Log auth error for telemetry
        console.warn('[Auth] Sign-in error:', {
          email,
          error: signInError.message,
          timestamp: new Date().toISOString(),
        });
      } else {
        setSent(true);
        setLoading(false);

        // Set rate limit after successful send
        setRateLimited(true);
        setCountdown(RATE_LIMIT_SECONDS);

        // Log success for telemetry
        console.info('[Auth] Magic link sent:', {
          email,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Network error';
      setError('Unable to connect. Please check your internet connection.');
      setLoading(false);

      // Log network error for telemetry
      console.error('[Auth] Network error:', {
        email,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      });
    }
  }

  if (sent) {
    return (
      <main className="min-h-screen grid grid-cols-1 md:grid-cols-2">
        {/* Left side - Brand */}
        <div className="hidden md:flex items-center justify-center bg-inkwell-navy p-8">
          <div className="text-center">
            <Logo variant="wordmark-dark" size={64} className="mx-auto mb-8 drop-shadow-lg" />
            <h2 className="text-2xl font-light text-white/90 mb-4">Professional Writing Studio</h2>
            <p className="text-white/70 max-w-md leading-relaxed">
              Craft extraordinary stories with tools designed for serious writers.
            </p>
          </div>
        </div>

        {/* Right side - Success message */}
        <div className="flex items-center justify-center bg-white dark:bg-gray-900 p-8">
          <div className="w-full max-w-sm">
            <div className="text-center mb-8 md:hidden">
              <Logo variant="wordmark-light" size={48} className="mx-auto mb-4" />
            </div>

            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-green-600 dark:text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                Check your email
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                We've sent a magic link to{' '}
                <strong className="text-gray-900 dark:text-white">{email}</strong>.
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                Click the link in your email to sign in. The link will expire in 1 hour.
              </p>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <strong>Note:</strong> Email delivery can take up to a minute. Check your spam
                folder if you don't see it.
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => {
                    setSent(false);
                    setEmail('');
                    setRateLimited(false);
                    setCountdown(0);
                  }}
                  className="text-sm text-inkwell-navy dark:text-blue-400 hover:underline"
                >
                  Use a different email
                </button>
                <span className="text-gray-300 dark:text-gray-600">•</span>
                <button
                  onClick={async () => {
                    if (rateLimited) {
                      setError(`Please wait ${countdown} seconds before requesting another link`);
                      return;
                    }
                    setSent(false);
                    await _onSubmit({ preventDefault: () => {} } as React.FormEvent);
                  }}
                  disabled={rateLimited}
                  className="text-sm text-inkwell-navy dark:text-blue-400 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {rateLimited ? `Resend in ${countdown}s` : 'Resend link'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      {/* Left side - Brand */}
      <div className="hidden md:flex items-center justify-center bg-inkwell-navy p-8">
        <div className="text-center">
          <Logo variant="wordmark-dark" size={64} className="mx-auto mb-8 drop-shadow-lg" />
          <h2 className="text-2xl font-light text-white/90 mb-4">Professional Writing Studio</h2>
          <p className="text-white/70 max-w-md leading-relaxed">
            Craft extraordinary stories with tools designed for serious writers.
          </p>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex items-center justify-center bg-white dark:bg-gray-900 p-8">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="text-center mb-8 md:hidden">
            <Logo variant="wordmark-light" size={48} className="mx-auto mb-4" />
          </div>

          <form onSubmit={_onSubmit} className="space-y-6">
            <div className="text-center">
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                Welcome to Inkwell
              </h1>
              <p className="text-gray-600 dark:text-gray-400">Sign in with your email address</p>
            </div>

            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white px-4 py-3 outline-none focus:ring-2 focus:ring-inkwell-navy focus:border-transparent transition-colors"
                autoFocus
              />
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
              </div>
            )}

            <button
              disabled={loading}
              className="w-full rounded-lg bg-inkwell-navy hover:bg-inkwell-navy-700 disabled:opacity-60 text-white py-3 font-medium transition-colors shadow-sm hover:shadow-md"
            >
              {loading ? 'Sending magic link…' : 'Send magic link'}
            </button>

            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              We'll email you a link to sign in. No password needed.
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}
