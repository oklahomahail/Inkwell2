import { Navigate, useParams } from 'react-router-dom';

/**
 * Redirect old profile-based routes to new single-user routes
 * Handles legacy URLs like /:profileId/dashboard → /dashboard
 */
export function LegacyProfileRedirect() {
  const params = useParams();
  const restPath = params['*'] || '';

  console.warn(
    `[Legacy Redirect] Old profile route detected, redirecting to: /${restPath || 'dashboard'}`,
  );

  return <Navigate to={`/${restPath || 'dashboard'}`} replace />;
}

/**
 * Redirect old workspace routes to dashboard
 */
export function LegacyWorkspaceRedirect() {
  console.warn('[Legacy Redirect] Old workspace route detected, redirecting to: /dashboard');

  return <Navigate to="/dashboard" replace />;
}
