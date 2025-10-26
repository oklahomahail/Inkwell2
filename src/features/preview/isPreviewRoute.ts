/**
 * Preview Route Utilities
 * Helpers for detecting and managing preview mode routes
 */

import featureFlagService from '@/services/featureFlagService';

/**
 * Check if the current pathname is a preview route
 */
export function isPreviewRoute(pathname: string): boolean {
  return pathname.startsWith('/preview');
}

/**
 * Check if preview mode is enabled via feature flag
 */
export function isPreviewModeEnabled(): boolean {
  return featureFlagService.isEnabled('free_preview');
}

/**
 * Check if currently in an active preview session
 * (preview route AND feature flag enabled)
 */
export function isInPreviewMode(pathname: string = window.location.pathname): boolean {
  return isPreviewRoute(pathname) && isPreviewModeEnabled();
}
