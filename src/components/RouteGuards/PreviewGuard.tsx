/**
 * Preview Guard Component
 * Ensures preview routes are only accessible when:
 * 1. Free preview feature flag is enabled
 * 2. User is NOT authenticated
 *
 * - If flag is off → redirects to /signup
 * - If user is logged in → redirects to /dashboard
 * - Otherwise → allows access to preview
 */

import React from 'react';
import { Navigate } from 'react-router-dom';

import { useAuth } from '@/context/AuthContext';
import { isPreviewModeEnabled } from '@/features/preview/isPreviewRoute';

export interface PreviewGuardProps {
  children: React.ReactNode;
}

export function PreviewGuard({ children }: PreviewGuardProps) {
  const { user, loading } = useAuth();
  const isPreviewEnabled = isPreviewModeEnabled();

  // While loading auth status, show nothing to prevent flashing
  if (loading) {
    return null;
  }

  // If feature flag is off, redirect to signup
  if (!isPreviewEnabled) {
    console.info('[PreviewGuard] Feature flag disabled, redirecting to signup');
    return <Navigate to="/signup" replace />;
  }

  // If user is authenticated, redirect to dashboard
  if (user) {
    console.info('[PreviewGuard] User authenticated, redirecting to dashboard');
    return <Navigate to="/dashboard" replace />;
  }

  // User is unauthenticated and feature flag is on - allow preview access
  return <>{children}</>;
}

export default PreviewGuard;
