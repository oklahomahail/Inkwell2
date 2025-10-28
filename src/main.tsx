// src/main.tsx - Clean entry point using centralized Providers

import * as Sentry from '@sentry/react';
import React from 'react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from './App';
import { AppProviders } from './AppProviders';
import { initGlobalErrorHandlers } from './boot/globalErrors';
import './index.css';
import './utils/flags';
import { waitForRoot } from './utils/dom/waitForRoot';
// Initialize storage persistence and monitoring
import { warnIfDifferentOrigin } from './utils/storage/originGuard';
import { ensurePersistentStorage } from './utils/storage/persistence';

// Initialize tour development tools in development mode
if (import.meta.env.DEV) {
  import('./dev/index');
}

// Initialize global error handlers first
initGlobalErrorHandlers();

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
