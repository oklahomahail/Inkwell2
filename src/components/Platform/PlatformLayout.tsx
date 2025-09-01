import React from 'react';
import Sidebar from '@/components/Sidebar';
import { useAppContext, View } from '@/context/AppContext';

interface PlatformLayoutProps {
  children: React.ReactNode;
}

const PlatformLayout: React.FC<PlatformLayoutProps> = ({ children }) => {
  const { setView } = useAppContext();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-colors">
      <header className="flex items-center justify-between py-6 px-6 sm:px-8 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4">
          <img
            src="/assets/inkwell-logo.svg"
            alt="Inkwell Logo"
            className="h-12 w-auto transition-all hover:drop-shadow-lg"
          />
          <span className="text-3xl font-extrabold leading-tight font-bold tracking-tight">
            Inkwell
          </span>
        </div>
        <nav className="space-x-6">
          <button
            type="button"
            onClick={() => setView(View.Dashboard)}
            className="text-sm font-medium hover:underline"
          >
            Dashboard
          </button>
          <button
            type="button"
            onClick={() => setView(View.Settings)}
            className="text-sm font-medium hover:underline"
          >
            Settings
          </button>
        </nav>
      </header>

      {/* Main content area with sidebar */}
      <div className="flex flex-1">
        {/* Sidebar */}
        <Sidebar />

        {/* Main content */}
        <main className="flex-1 bg-gradient-to-r from-blue-50 via-white to-blue-50 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 p-6 sm:p-8 shadow-md rounded-xl mx-auto max-w-7xl">
          {children}
        </main>
      </div>

      <footer className="text-center text-xs text-gray-500 dark:text-gray-400 py-6">
        &copy; {new Date().getFullYear()} Inkwell. All rights reserved.
      </footer>
    </div>
  );
};

export default PlatformLayout;
