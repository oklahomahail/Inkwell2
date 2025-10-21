import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { useAuth } from '@/context/AuthContext';

interface RequireAuthProps {
  children: React.ReactNode;
}

/**
 * RequireAuth component that prevents access to protected routes if the user is not authenticated
 * Waits for auth state to be fully loaded before making a decision
 */
export default function RequireAuth({ children }: RequireAuthProps) {
  const { user, session, loading } = useAuth();
  const location = useLocation();

  // While auth is loading, show nothing (or a spinner)
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-inkwell-navy border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Verifying access...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to sign-in with the current path as redirect target
  if (!user || !session) {
    const redirectPath = `/sign-in?view=dashboard&redirect=${encodeURIComponent(location.pathname)}`;
    return <Navigate to={redirectPath} replace state={{ redirect: location.pathname }} />;
  }

  // If authenticated, render the protected content
  return <>{children}</>;
}
