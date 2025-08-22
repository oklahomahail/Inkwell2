import React from 'react';

const LoadingScreen: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300">
    <div className="text-xl font-semibold leading-snug font-semibold leading-snug font-semibold leading-snug font-semibold leading-snug font-semibold leading-snug animate-pulse">
      Loading your writing space...
    </div>
  </div>
);

export default LoadingScreen;
