// src/App.tsx
import React, { StrictMode } from 'react';
import './App.css';

import NavInspector from '@/components/Dev/NavInspector';
import ViewRouter from '@/components/Platform/ViewRouter';
import WritingView from '@/components/Views/WritingView';
import ViewSwitcher from '@/components/ViewSwitcher';
import { AppProvider } from '@/context/AppContext';
import { NavProvider } from '@/context/NavContext';

// Optional, for dev introspection. Safe to remove if you don't want it.

export default function App() {
  return (
    <StrictMode>
      <AppProvider>
        <NavProvider>
          <div className="min-h-screen flex flex-col">
            {/* Top controls */}
            <header className="p-3 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between gap-4">
                <h1 className="text-xl font-semibold">Inkwell</h1>
                <ViewSwitcher />
              </div>
            </header>

            {/* Main content routed by NavContext */}
            <main className="flex-1">
              <ViewRouter renderWriting={() => <WritingView />} />
            </main>

            {/* Dev-only: comment out for production */}
            <footer className="p-3 opacity-70">
              <NavInspector />
            </footer>
          </div>
        </NavProvider>
      </AppProvider>
    </StrictMode>
  );
}
