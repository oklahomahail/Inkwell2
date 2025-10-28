import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import AuthFooter from '../components/Auth/AuthFooter';
import { AuthForm } from '../components/Auth/AuthForm';
import { AuthFormMode } from '../components/Auth/AuthForm';
import { normalizeSafeRedirect } from '../utils/safeRedirect';

interface AuthPageProps {
  mode: AuthFormMode;
}

export default function AuthPage({ mode }: AuthPageProps) {
  const [searchParams] = useSearchParams();

  // Add debugging on mount
  useEffect(() => {
    console.log('[AuthPage] Rendering AuthPage component', { mode });

    // Report rendering status to the window for debugging
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('inkwell:debug', {
          detail: { component: 'AuthPage', status: 'rendered', mode },
        }),
      );
    }
  }, [mode]);

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

  // Note: We no longer need to handle session redirect logic here
  // The AnonOnlyRoute component will handle redirects for authenticated users
  // This avoids any race conditions or double-rendering issues

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
            src="/assets/brand/inkwell-lockup-dark.svg"
            alt="Inkwell"
            className="h-16 w-auto"
            onError={(e) => {
              const img = e.currentTarget as HTMLImageElement | null;
              if (!img) return;

              // Stop loops
              img.onerror = null;

              // Try fallback src if not already tried
              if (img.dataset.fallbackApplied !== '1') {
                img.dataset.fallbackApplied = '1';
                img.src = '/assets/brand/inkwell-wordmark.svg';
                return;
              }

              // Final text fallback when both images fail
              const parent = img.parentElement;
              if (parent) {
                parent.innerHTML = `<span class="text-3xl font-serif font-bold text-[#D4A537]">Inkwell</span>`;
              } else {
                // As absolute fallback, hide the broken image
                img.style.display = 'none';
              }
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
