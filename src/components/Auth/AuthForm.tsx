import React, { useEffect, useState } from 'react';

import { supabase } from '@/lib/supabaseClient';
import { useGo } from '@/utils/navigate';
import { normalizeSafeRedirect } from '@/utils/safeRedirect';

export type AuthFormMode = 'signin' | 'signup';

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
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // default tab is password on every mount and route
  useEffect(() => {
    setActiveTab('password');
  }, [mode]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setNotice(null);
    setLoading(true);
    try {
      if (activeTab === 'password') {
        if (mode === 'signup') {
          if (!password || password.length < 8) {
            setErr('Use at least 8 characters.');
            setLoading(false);
            return;
          }
          if (password !== confirm) {
            setErr('Passwords do not match.');
            setLoading(false);
            return;
          }
          const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirect)}`,
            },
          });
          if (error) throw error;
          setNotice('Check your email to confirm your account.');
        } else {
          const { error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) throw error;
          go(normalizeSafeRedirect(redirect));
          return;
        }
      } else {
        // Magic Link flow
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirect)}`,
          },
        });
        if (error) throw error;
        setNotice('Magic link sent. Check your email.');
      }
    } catch (e: any) {
      setErr(e?.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const showConfirm = mode === 'signup' && activeTab === 'password';

  const tabBtn = (k: 'password' | 'magic', label: string) => (
    <button
      type="button"
      onClick={() => setActiveTab(k)}
      className={`px-3 py-2 text-sm font-medium ${activeTab === k ? 'text-[#13294B] border-b-2 border-[#D4AF37]' : 'text-slate-500'}`}
    >
      {label}
    </button>
  );

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="flex items-center gap-4 border-b pb-2">
        {tabBtn('password', 'Email & Password')}
        <span className="h-5 w-px bg-slate-200" />
        <span className={`${mode === 'signup' ? 'opacity-50 pointer-events-none' : ''}`}>
          {tabBtn('magic', 'Magic Link')}
        </span>
      </div>

      <div className="space-y-4">
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
          />
        </div>

        {activeTab === 'password' && (
          <>
            <div>
              <label htmlFor="password-input" className="block text-sm font-medium text-slate-700">
                Password
              </label>
              <input
                id="password-input"
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-[#D4AF37]"
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              />
              {mode === 'signin' && (
                <div className="mt-2 text-right">
                  <a href="/reset-password" className="text-sm text-[#13294B] hover:underline">
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
                />
              </div>
            )}
          </>
        )}
      </div>

      {err && <p className="text-sm text-red-600">{err}</p>}
      {notice && <p className="text-sm text-emerald-700">{notice}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-[#13294B] px-4 py-3 font-semibold text-white ring-1 ring-black/5 hover:opacity-90 disabled:opacity-60"
      >
        {loading ? 'Please wait…' : primaryCtaLabel}
      </button>

      {mode === 'signin' && activeTab === 'password' && (
        <p className="text-center text-xs text-slate-500">Trouble signing in? Use Magic Link.</p>
      )}
      {mode === 'signup' && (
        <p className="text-center text-xs text-slate-500">Takes less than a minute.</p>
      )}
    </form>
  );
}
