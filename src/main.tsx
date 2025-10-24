// src/main.tsx - Clean entry point using centralized Providers
import * as Sentry from '@sentry/react';
import React from 'react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from './App';
import { AppProviders } from './AppProviders';
import './index.css';

// Initialize feature flags system
import './utils/flags';

// Initialize storage persistence and monitoring
import { warnIfDifferentOrigin } from './utils/storage/originGuard';
import { ensurePersistentStorage } from './utils/storage/persistence';

// Request persistent storage and check origin
ensurePersistentStorage().then((result) => {
  if (result.persisted) {
    console.log('✅ [Inkwell] Storage locked in - your data is safe!');
  } else if (result.supported) {
    console.warn(
      '⚠️ [Inkwell] Storage persistence not granted - data may be cleared under storage pressure',
    );
  }
});

warnIfDifferentOrigin();

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
  console.log('🔍 Sentry monitoring initialized for', import.meta.env.MODE);
} else if (import.meta.env.DEV) {
  console.log('ℹ️ Sentry monitoring disabled (no VITE_SENTRY_DSN)');
}

// Safety net: ensure root element exists
const rootEl = document.getElementById('root');
if (!rootEl) {
  // If we land on a stray HTML without root, hard-reload to index.html
  console.error('[BOOT] Root element not found; reloading to index.html');
  window.location.replace('/');
  throw new Error('Root element not found; reloading to index.html');
}

createRoot(rootEl).render(
  <StrictMode>
    <BrowserRouter>
      <AppProviders>
        <App />
      </AppProviders>
    </BrowserRouter>
  </StrictMode>,
);
