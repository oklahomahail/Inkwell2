/**
 * Tour Module - Main Exports
 *
 * Centralized exports for all tour-related functionality.
 */

// UI Components
export { default as SpotlightOverlay } from './ui/SpotlightOverlay';
export { SpotlightPortal } from './ui/portal';
export { useSpotlightUI } from './ui/useSpotlightUI';

// Adapters
export { tourAnalytics } from './adapters/analyticsAdapter';
export { useTourRouterAdapter } from './adapters/routerAdapter';

// Configuration
export { defaultTourSteps, defaultTourConfig, DEFAULT_TOUR_ID } from './configs/defaultTour';

// Persistence
export { isTourDone, markTourDone, resetTour, getCompletedTours } from './persistence';

// Entry Points
export { startDefaultTour, shouldAutoStartTour, startTourById } from './tourEntry';

// Integration
export { TourLifecycleIntegration } from './integrations/tourLifecycleIntegration';

// Types (re-export from types file)
export type { TourStep, TourConfig, TourPlacement } from './types';
