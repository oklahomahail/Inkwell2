// src/main.tsx - Clean entry point using centralized Providers

import * as Sentry from '@sentry/react';
import React from 'react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import devLog from '@/utils/devLog';

import App from './App';
import { AppProviders } from './AppProviders';
import { initGlobalErrorHandlers } from './boot/globalErrors';
import './index.css';
import './utils/flags';
import { analyticsService } from './services/analytics';
import { Chapters } from './services/chaptersService';
import { emitSessionEnd, emitSessionStart } from './services/telemetry';
import { waitForRoot } from './utils/dom/waitForRoot';
// Initialize storage persistence and monitoring
import { warnIfDifferentOrigin } from './utils/storage/originGuard';
import { ensurePersistentStorage } from './utils/storage/persistence';
// Initialize analytics
// Initialize telemetry

// Initialize development tools in development mode
if (import.meta.env.DEV) {
  import('./dev/index');
  import('./utils/cacheDebug'); // Cache inspection utilities
  import('./utils/recoveryDebug'); // Recovery inspection utilities
}

// Initialize global error handlers first
initGlobalErrorHandlers();

// Request persistent storage and check origin
ensurePersistentStorage().then((result) => {
  if (result.persisted) {
    devLog.debug('✅ [Inkwell] Storage locked in - your data is safe!');
  } else if (result.supported) {
    console.warn(
      '⚠️ [Inkwell] Storage persistence not granted - data may be cleared under storage pressure',
    );
  }
});

warnIfDifferentOrigin();

// Initialize analytics service
analyticsService.initialize().catch((error) => {
  devLog.error('Failed to initialize analytics:', error);
});

// Initialize session telemetry
emitSessionStart();

// Emit session.end on page unload or visibility change to hidden
window.addEventListener('beforeunload', () => {
  emitSessionEnd('unload');
  analyticsService.endSession();
  // Close IndexedDB connections to prevent leaks
  Chapters.close();
});
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    emitSessionEnd('background');
    analyticsService.endSession();
  }
});

// Initialize Service Worker cache cleanup on app boot
// This ensures stale caches don't interfere with fresh assets or tour measurements
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    devLog.debug('🔄 Service Worker controller changed - new version active');
  });

  navigator.serviceWorker.getRegistration().then((reg) => {
    if (reg?.waiting) {
      // Promote waiting SW and skip old one
      reg.waiting.postMessage({ type: 'SKIP_WAITING' });
      devLog.debug('📡 Requested service worker update');
    }
  });
}

// Initialize Sentry for error tracking and performance monitoring
if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    environment: import.meta.env.MODE,
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    replaysSessionSampleRate: import.meta.env.PROD ? 0.01 : 0.1,
    replaysOnErrorSampleRate: 1.0,
    beforeSend(event, _hint) {
      // Filter out profile switching and navigation events that are expected
      if (
        event.exception?.values?.[0]?.value?.includes('Profile not found') ||
        event.exception?.values?.[0]?.value?.includes('Navigation')
      ) {
        return null; // Don't send these events
      }
      return event;
    },
  });
  devLog.debug('🔍 Sentry monitoring initialized for', import.meta.env.MODE);
} else if (import.meta.env.DEV) {
  devLog.debug('ℹ️ Sentry monitoring disabled (no VITE_SENTRY_DSN)');
}

// Sanity check: detect duplicate precache entries (development only)
if (import.meta.env.DEV) {
  (async () => {
    // @ts-ignore injected by workbox
    const m = (self as any)?.__WB_MANIFEST as Array<{ url: string; revision?: string }>;
    if (Array.isArray(m)) {
      const byUrl = new Map<string, Set<string>>();
      for (const e of m) {
        const url = typeof e === 'string' ? e : e.url;
        const rev = typeof e === 'string' ? '' : (e.revision ?? '');
        const set = byUrl.get(url) ?? new Set<string>();
        set.add(rev);
        byUrl.set(url, set);
      }
      for (const [url, revisions] of byUrl.entries()) {
        if (revisions.size > 1) {
          console.warn(
            '[WB] ⚠️ Duplicate precache URL with multiple revisions:',
            url,
            Array.from(revisions),
          );
        }
      }
    }
  })();
}

// Safety net: wait for root element to be available before mounting
// Uses resilient gate with multiple checks to avoid edge races
waitForRoot('root')
  .then((rootEl) => {
    createRoot(rootEl).render(
      <StrictMode>
        <BrowserRouter>
          <AppProviders>
            <App />
          </AppProviders>
        </BrowserRouter>
      </StrictMode>,
    );
  })
  .catch((error) => {
    // Telemetry + minimal user-visible fallback
    console.error('[BOOT] Failed to mount application:', error);
    const body = document.body;
    if (body) {
      const div = document.createElement('div');
      div.className = 'min-h-screen flex items-center justify-center bg-gray-50';
      div.innerHTML = `
        <div class="text-center p-8">
          <h1 class="text-2xl font-bold text-gray-900 mb-4">Failed to start Inkwell</h1>
          <p class="text-gray-600 mb-4">The application failed to initialize. Please refresh the page.</p>
          <button
            onclick="window.location.reload()"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Refresh Page
          </button>
        </div>
      `;
      body.appendChild(div);
    }
  });
