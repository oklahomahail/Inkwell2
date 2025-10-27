import React, { createContext, useContext, useEffect, useState } from 'react';

import { trackPreviewSignedUp } from '@/features/preview/analytics';
import { supabase } from '@/lib/supabaseClient';
import { log } from '@/utils/logger';
import { triggerDashboardView } from '@/utils/tourTriggers';

import type { User, AuthError } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: any | null; // Added session access for components
  loading: boolean;
  signOut: () => Promise<void>;
  signInWithEmail: (email: string, redirectPath?: string) => Promise<{ error: AuthError | null }>;
  signInWithPassword: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUpWithPassword: (email: string, password: string) => Promise<{ error: AuthError | null }>;
}

/**
 * Validates and normalizes a redirect path to prevent open redirects
 * Only allows same-origin paths starting with /
 * @param path - The path to validate
 * @returns Normalized safe path, or /dashboard as fallback
 */
function normalizeSafeRedirect(path: string | null | undefined): string {
  if (!path) return '/dashboard';

  // Only allow same-origin paths: must start with / and not contain protocol/host
  const safePathPattern = /^\/[^\s]*$/;

  // Reject anything that looks like an absolute URL
  if (path.includes('://') || path.startsWith('//')) {
    log.warn('[Auth] Rejected absolute URL redirect:', path);
    return '/dashboard';
  }

  // Validate against safe path pattern
  if (!safePathPattern.test(path)) {
    log.warn('[Auth] Rejected invalid redirect path:', path);
    return '/dashboard';
  }

  return path;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {
    if (import.meta.env.DEV) {
      log.warn('[AuthContext] signOut called on default value (outside provider).');
    }
  },
  signInWithEmail: async () => ({ error: null }),
  signInWithPassword: async () => ({ error: null }),
  signUpWithPassword: async () => ({ error: null }),
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setSession(data.session);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setSession(session);
      setLoading(false);

      // Fire dashboard view trigger on successful sign-in
      if (event === 'SIGNED_IN' && session?.user) {
        triggerDashboardView();

        // Check if user signed up from preview mode
        const urlParams = new URLSearchParams(window.location.search);
        const fromPreview = urlParams.get('from') === 'preview';
        if (fromPreview) {
          trackPreviewSignedUp('preview');
        }
      }

      // Handle password recovery flow
      if (event === 'PASSWORD_RECOVERY') {
        console.log('[Auth] Password recovery event detected');
        // Redirect to password update page
        window.location.href = '/auth/update-password';
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const signInWithEmail = async (email: string, redirectPath?: string) => {
    // Normalize and validate redirect path to prevent open redirects
    const finalRedirect = normalizeSafeRedirect(redirectPath);
    const origin = window.location.origin;

    // Build callback URL with the intended destination as a query param
    // This ensures emailRedirectTo always targets /auth/callback
    const callbackUrl = `${origin}/auth/callback?next=${encodeURIComponent(finalRedirect)}`;

    console.info('[Auth] Sending magic link with:');
    console.info('  - Final redirect destination:', finalRedirect);
    console.info('  - Callback URL (emailRedirectTo):', callbackUrl);
    console.info('  - Origin:', origin);
    console.info('⚠️  IMPORTANT: This callback URL must be whitelisted in Supabase Dashboard!');
    console.info('  - Go to: Supabase → Authentication → URL Configuration → Redirect URLs');
    console.info(`  - Add: ${callbackUrl.split('?')[0]}`);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: callbackUrl,
        shouldCreateUser: true, // Allow new user sign-ups
      },
    });

    if (error) {
      log.error('[Auth] Sign-in failed:', error.message);
    } else {
      console.info('[Auth] Magic link sent successfully! Check your email.');
    }

    return { error };
  };

  const signInWithPassword = async (email: string, password: string) => {
    console.info('[Auth] Attempting to sign in with email/password');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      log.error('[Auth] Password sign-in failed:', error.message);
    } else {
      console.info('[Auth] Password sign-in successful');
    }

    return { error };
  };

  const signUpWithPassword = async (email: string, password: string) => {
    console.info('[Auth] Attempting to sign up with email/password');

    // Build the redirect URL for email confirmation with tour flag
    const origin = window.location.origin;
    const callbackUrl = `${origin}/auth/callback?next=${encodeURIComponent('/dashboard')}&tour=1`;

    console.info('[Auth] Using emailRedirectTo:', callbackUrl);
    console.info('[Auth] Tour auto-start enabled for new signups');

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: callbackUrl,
      },
    });

    if (error) {
      log.error('[Auth] Password sign-up failed:', error.message, error);
    } else {
      console.info(
        '[Auth] Password sign-up successful - tour will auto-start after email confirmation',
      );
    }

    return { error };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signOut,
        signInWithEmail,
        signInWithPassword,
        signUpWithPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
