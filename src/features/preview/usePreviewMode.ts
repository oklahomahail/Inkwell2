/**
 * Preview Mode Hook
 * Provides utilities to check if user is in preview mode
 * and disable certain features accordingly
 */

import { useLocation } from 'react-router-dom';

import { isInPreviewMode } from './isPreviewRoute';

export interface PreviewModeState {
  isPreview: boolean;
  canSave: boolean;
  canExport: boolean;
  canUseAI: boolean;
  getDisabledMessage: (feature: string) => string;
}

/**
 * Hook to check if user is in preview mode and what features are disabled
 */
export function usePreviewMode(): PreviewModeState {
  const location = useLocation();
  const isPreview = isInPreviewMode(location.pathname);

  return {
    isPreview,
    canSave: !isPreview,
    canExport: !isPreview,
    canUseAI: !isPreview,
    getDisabledMessage: (feature: string) =>
      `${feature} is available after you create a free account`,
  };
}
