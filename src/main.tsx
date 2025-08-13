// src/main.tsx - Complete setup with all providers
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { AppProvider } from '@/context/AppContext';
import { ToastProvider } from '@/context/ToastContext';
import './index.css';

const container = document.getElementById('root');
if (!container) throw new Error('Failed to find the root element');

const root = createRoot(container);

root.render(
  <React.StrictMode>
    <ToastProvider>
      <AppProvider>
        <App />
      </AppProvider>
    </ToastProvider>
  </React.StrictMode>,
);

// Note: AppProvider already includes ClaudeProvider internally
// Order: ToastProvider > AppProvider (includes ClaudeProvider) > App
