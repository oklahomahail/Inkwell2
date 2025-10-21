import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import AuthFooter from '@/components/Auth/AuthFooter';
import { AuthForm } from '@/components/Auth/AuthForm';
import { AuthFormMode } from '@/components/Auth/AuthForm';
import AuthHeader from '@/components/Auth/AuthHeader';
import { useAuth } from '@/context/AuthContext';
import { useGo } from '@/utils/navigate';
import { normalizeSafeRedirect } from '@/utils/safeRedirect';

interface AuthPageProps {
  mode: AuthFormMode;
}

export default function AuthPage({ mode }: AuthPageProps) {
  const [searchParams] = useSearchParams();
  const go = useGo();

  // If ?redirect=/path is used, preserve it after normalizing
  const desiredRedirect = useMemo(
    () => normalizeSafeRedirect(searchParams.get('redirect'), console.warn),
    [searchParams],
  );

  // State for notices (like email confirmed)
  const [notice, setNotice] = useState<string | null>(null);

  // Check for notice of confirmed email
  useEffect(() => {
    if (searchParams.get('notice') === 'confirmed') {
      setNotice('Email confirmed! You can now sign in.');
    }
  }, [searchParams]);

  // Use a ref to track if we've logged the session check message
  const hasLoggedRef = useRef(false);
  // Track if we're redirecting to avoid race conditions
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Session guard: if already signed in, skip the page entirely
  // Get auth context outside the effect to follow React's rules of hooks
  const { session, loading } = useAuth();

  useEffect(() => {
    let mounted = true;
    const logPrefix = '[AuthPage]';

    // We no longer need _once sentinel since RequireAuth handles loading states properly
    // but we'll keep a local ref to prevent race conditions during redirects

    (async () => {
      if (!hasLoggedRef.current) {
        console.log(`${logPrefix} Checking for existing session`);
        hasLoggedRef.current = true;
      }

      try {
        // Wait for the auth state to be fully hydrated
        if (loading || !mounted) return;

        if (session) {
          console.log(`${logPrefix} Found active session, redirecting to`, desiredRedirect);
          // Prevent multiple redirects
          if (!isRedirecting) {
            setIsRedirecting(true);
            // No need for _once parameter anymore with proper auth flow
            go(desiredRedirect, { replace: true });
          }
        } else {
          console.log(`${logPrefix} No active session found, staying on auth page`);
        }
      } catch (error) {
        console.error(`${logPrefix} Error checking session:`, error);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [go, desiredRedirect, searchParams, isRedirecting]);

  // Configure mode-specific UI elements
  const chrome = useMemo(() => {
    if (mode === 'signup') {
      return {
        title: 'Create your Inkwell account',
        subtitle: 'Create your account to start writing with Inkwell.',
        primaryCtaLabel: 'Create account',
        headerAccent: 'border-b-2 border-[#D4AF37]', // solid border
        badge: (
          <span className="ml-2 inline-flex items-center rounded-full bg-[#D4AF37] px-2 py-0.5 text-xs font-medium text-[#13294B]">
            New
          </span>
        ),
      };
    }
    return {
      title: 'Sign in to Inkwell',
      subtitle: 'Welcome back, pick up where you left off.',
      primaryCtaLabel: 'Sign in',
      headerAccent: 'border-b-2 border-dashed border-[#D4AF37]', // dashed border
      badge: null,
    };
  }, [mode]);

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
              console.error('Logo failed to load, falling back to wordmark');
              // First try the logo path
              (e.currentTarget as HTMLImageElement).src = '/brand/logos/inkwell-wordmark-gold.svg';
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
          className={`mt-6 text-center text-3xl font-bold tracking-tight inline-flex items-center ${chrome.headerAccent}`}
          style={{ color: 'white' }}
        >
          {chrome.title}
          {chrome.badge}
        </h2>
        <p className="mt-4 text-center text-lg text-white/85">{chrome.subtitle}</p>

        <div
          className="mt-8 rounded-lg shadow-xl p-8 relative overflow-hidden border-t-4"
          style={{
            backgroundColor: 'white',
            color: '#1e293b',
            borderColor: '#D4AF37',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          }}
        >
          <AuthHeader
            title={mode === 'signin' ? 'Sign in to Inkwell' : 'Create your Inkwell account'}
            subtitle={
              mode === 'signin'
                ? 'Welcome back, pick up where you left off.'
                : 'Start crafting your stories today.'
            }
            logoSrc="/brand/inkwell-lockup-horizontal.svg"
            className="text-inkwell-gold mb-6"
          />

          {notice && (
            <div
              className="mb-6 p-4 rounded-md flex items-center"
              style={{ backgroundColor: '#ecfdf5', color: '#047857' }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2 flex-shrink-0"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-sm font-medium">{notice}</p>
            </div>
          )}

          <AuthForm
            mode={mode}
            redirect={desiredRedirect}
            primaryCtaLabel={chrome.primaryCtaLabel}
          />

          <AuthFooter mode={mode === 'signin' ? 'signin' : 'signup'} redirect={desiredRedirect} />
        </div>
      </div>
    </div>
  );
}
