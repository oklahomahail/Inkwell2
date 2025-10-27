import React, { useEffect, useState } from 'react';

import { supabase } from '@/lib/supabaseClient';
import { useGo } from '@/utils/navigate';
import { normalizeSafeRedirect } from '@/utils/safeRedirect';

export type AuthFormMode = 'signin' | 'signup';

/**
 * Maps raw Supabase error messages to user-friendly descriptions
 */
function getAuthErrorMessage(
  rawMessage: string,
  mode: AuthFormMode,
  tab: 'password' | 'magic',
): string {
  const lower = rawMessage.toLowerCase();

  // Invalid credentials
  if (lower.includes('invalid') && (lower.includes('credentials') || lower.includes('login'))) {
    return 'The email or password you entered is incorrect. Please try again.';
  }

  // User not found
  if (lower.includes('user') && lower.includes('not found')) {
    return mode === 'signin'
      ? "We couldn't find an account with that email. Please check your email or sign up."
      : 'Unable to create account. Please try again.';
  }

  // Email already registered
  if (lower.includes('already') && lower.includes('registered')) {
    return 'An account with this email already exists. Try signing in instead.';
  }

  // Invalid email format
  if (lower.includes('invalid') && lower.includes('email')) {
    return 'Please enter a valid email address (e.g., you@example.com).';
  }

  // Password too weak
  if (lower.includes('password') && (lower.includes('weak') || lower.includes('strength'))) {
    return 'Please choose a stronger password with at least 8 characters, including letters and numbers.';
  }

  // Rate limiting
  if (lower.includes('rate limit') || lower.includes('too many')) {
    return 'Too many attempts. Please wait a few minutes before trying again.';
  }

  // Email sending issues
  if (lower.includes('email') && (lower.includes('send') || lower.includes('deliver'))) {
    return 'Unable to send email. Please check your email address and try again.';
  }

  // Network issues
  if (lower.includes('network') || lower.includes('connection') || lower.includes('timeout')) {
    return 'Connection issue. Please check your internet connection and try again.';
  }

  // Magic link specific
  if (tab === 'magic' && lower.includes('otp')) {
    return 'Unable to send magic link. Please try again or use email & password sign in.';
  }

  // Signup specific - email confirmation
  if (mode === 'signup' && lower.includes('confirm')) {
    return 'Please check your email to confirm your account before signing in.';
  }

  // Generic fallback with more helpful context
  if (rawMessage) {
    return `Authentication error: ${rawMessage}. Please try again or contact support if the issue persists.`;
  }

  return 'Something went wrong. Please try again or contact support if the issue persists.';
}

export function AuthForm({
  mode,
  redirect,
  primaryCtaLabel,
}: {
  mode: AuthFormMode;
  redirect: string;
  primaryCtaLabel: string;
}) {
  const go = useGo();
  const [activeTab, setActiveTab] = useState<'password' | 'magic'>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Default tab is password on every mount and route
  useEffect(() => {
    setActiveTab('password');
  }, [mode]);

  // Prepare the callback URL for auth redirects - ensure we use the consistent naming for params
  const emailRedirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirect)}`;

  // Mode-specific validation and submission logic
  const handleSignIn = async () => {
    if (activeTab === 'password') {
      // Sign in with email/password
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      go(normalizeSafeRedirect(redirect));
      return;
    } else {
      // Magic Link flow (only available for sign-in)
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo,
        },
      });

      if (error) throw error;
      setNotice('Magic link sent. Check your email.');
      // Optional: redirect to a "check email" page instead
      // go('/check-email?mode=signin', { replace: true });
    }
  };

  const handleSignUp = async () => {
    // Sign up requires email/password validation
    if (!password || password.length < 8) {
      setErr('Use at least 8 characters.');
      return false;
    }

    if (password !== confirm) {
      setErr('Passwords do not match.');
      return false;
    }

    // Create new account with optional full name
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo,
        data: { full_name: fullName || undefined },
      },
    });

    if (error) throw error;

    // If using email confirmation (recommended), show a message
    setNotice('Check your email to confirm your account.');
    // Optional: redirect to a "check email" page instead
    // go('/check-email?mode=signup', { replace: true });

    return true;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setNotice(null);
    setLoading(true);

    try {
      if (mode === 'signup') {
        await handleSignUp();
      } else {
        await handleSignIn();
      }
    } catch (e: any) {
      // Map Supabase errors to user-friendly messages
      const errorMessage = getAuthErrorMessage(e?.message || '', mode, activeTab);
      setErr(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const showConfirm = mode === 'signup' && activeTab === 'password';

  // Mode-specific UI helpers
  const tabBtn = (k: 'password' | 'magic', label: string) => (
    <button
      type="button"
      onClick={() => setActiveTab(k)}
      className={`px-3 py-2 text-sm font-medium ${activeTab === k ? 'text-[#13294B] border-b-2 border-[#D4AF37]' : 'text-slate-500'}`}
      aria-pressed={activeTab === k}
    >
      {label}
    </button>
  );

  // Mode-specific labels and hints
  const emailPlaceholder = mode === 'signin' ? 'Enter your email' : 'Enter your email address';
  const passwordPlaceholder =
    mode === 'signin' ? 'Enter your password' : 'Create a strong password';
  const passwordLabel = mode === 'signin' ? 'Password' : 'Create password';

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {/* Tab selector - only show Magic Link option for sign-in */}
      <div className="flex items-center gap-4 border-b pb-2">
        {tabBtn('password', 'Email & Password')}
        {mode === 'signin' && (
          <>
            <span className="h-5 w-px bg-slate-200" />
            {tabBtn('magic', 'Magic Link')}
          </>
        )}
      </div>

      <div className="space-y-4">
        {/* Full Name field - only for sign-up */}
        {mode === 'signup' && (
          <div>
            <label htmlFor="fullname-input" className="block text-sm font-medium text-slate-700">
              Full name
            </label>
            <input
              id="fullname-input"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-[#D4AF37]"
              autoComplete="name"
              placeholder="Enter your full name"
            />
          </div>
        )}

        {/* Email field - common to both modes */}
        <div>
          <label htmlFor="email-input" className="block text-sm font-medium text-slate-700">
            Email address
          </label>
          <input
            id="email-input"
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-[#D4AF37]"
            autoComplete="email"
            placeholder={emailPlaceholder}
          />
        </div>

        {activeTab === 'password' && (
          <>
            <div>
              <label htmlFor="password-input" className="block text-sm font-medium text-slate-700">
                {passwordLabel}
              </label>
              <input
                id="password-input"
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-[#D4AF37]"
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                placeholder={passwordPlaceholder}
                minLength={mode === 'signup' ? 8 : undefined}
              />
              {mode === 'signin' && (
                <div className="mt-2 text-right">
                  <a
                    href="/auth/forgot-password"
                    className="text-sm text-[#13294B] hover:underline"
                  >
                    Forgot your password?
                  </a>
                </div>
              )}
            </div>

            {showConfirm && (
              <div>
                <label
                  htmlFor="confirm-password-input"
                  className="block text-sm font-medium text-slate-700"
                >
                  Confirm password
                </label>
                <input
                  id="confirm-password-input"
                  required
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-[#D4AF37]"
                  autoComplete="new-password"
                  placeholder="Confirm your password"
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Error and notification handling */}
      {err && <p className="text-sm text-red-600">{err}</p>}
      {notice && <p className="text-sm text-emerald-700">{notice}</p>}

      {/* Mode-specific submission button */}
      <button
        type="submit"
        disabled={loading}
        className={`w-full rounded-xl bg-[#13294B] text-white px-4 py-3 font-semibold ring-1 ring-black/5 hover:opacity-90 disabled:opacity-60`}
        data-testid={`${mode}-button`}
      >
        {loading
          ? 'Please wait…'
          : mode === 'signup'
            ? 'Create account'
            : activeTab === 'password'
              ? 'Sign in'
              : 'Send magic link'}
      </button>

      {/* Mode-specific helper text */}
      {mode === 'signin' && activeTab === 'password' && (
        <p className="text-center text-xs text-slate-500">
          Trouble signing in? Try the Magic Link tab for password-free sign in.
        </p>
      )}
      {mode === 'signin' && activeTab === 'magic' && (
        <p className="text-center text-xs text-slate-500">
          We'll email you a secure link for password-free access to your account.
        </p>
      )}
      {mode === 'signup' && (
        <p className="text-center text-xs text-slate-500">
          By creating an account, you agree to our Terms of Service and Privacy Policy.
        </p>
      )}

      {/* Account switching links removed - now handled by AuthFooter component */}
    </form>
  );
}
