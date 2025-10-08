// src/main.tsx - Clean entry point using centralized Providers
import * as Sentry from '@sentry/react';
import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './App';
import './index.css';

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
  console.log('ℹ️  Sentry monitoring disabled (no VITE_SENTRY_DSN)');
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
