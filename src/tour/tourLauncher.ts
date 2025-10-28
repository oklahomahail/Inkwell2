// src/tour/tourLauncher.ts - Centralized tour launcher (single source of truth)
import devLog from "src/utils/devLogger";

import analyticsService from '@/services/analyticsService';

// Only one tour: Spotlight (the cinematic walkthrough)
export type TourId = 'spotlight';

export interface TourLaunchOptions {
  restart?: boolean;
  source?: string; // For analytics: 'help_menu', 'command_palette', 'keyboard', 'url', etc.
}

export interface TourController {
  start: (opts?: TourLaunchOptions) => void;
  reset: () => void;
}

/**
 * Global tour launcher interface
 * Provides a single entry point for launching tours from anywhere in the app
 */
declare global {
  interface Window {
    InkwellTour?: {
      start: (id: TourId, opts?: TourLaunchOptions) => void;
      reset: (id: TourId) => void;
      isAvailable: (id: TourId) => boolean;
    };
  }
}

/**
 * Register tour controllers
 * Call this once at app boot with your tour implementation functions
 */
export function registerTours(controllers: Record<TourId, TourController>) {
  window.InkwellTour = {
    start: (id: TourId, opts?: TourLaunchOptions) => {
      const controller = controllers[id];
      if (!controller) {
        console.warn(`[TourLauncher] Unknown tour: ${id}`);
        return;
      }

      // Track analytics if source is provided
      if (opts?.source) {
        try {
          analyticsService.track('tour_start', {
            tour_id: id,
            source: opts.source,
            restart: opts.restart || false,
          });
        } catch (error) {
          console.warn('[TourLauncher] Analytics tracking failed:', error);
        }
      }

      devLog.debug(`[TourLauncher] Starting tour: ${id}`, opts);
      controller.start(opts);
    },

    reset: (id: TourId) => {
      const controller = controllers[id];
      if (!controller) {
        console.warn(`[TourLauncher] Unknown tour: ${id}`);
        return;
      }

      devLog.debug(`[TourLauncher] Resetting tour: ${id}`);
      controller.reset();

      // Track analytics
      try {
        analyticsService.track('tour_reset', { tour_id: id });
      } catch (error) {
        console.warn('[TourLauncher] Analytics tracking failed:', error);
      }
    },

    isAvailable: (id: TourId) => {
      return id in controllers;
    },
  };

  devLog.debug('[TourLauncher] Tours registered:', Object.keys(controllers));
}

/**
 * Start a tour (convenience function)
 */
export function startTour(id: TourId, opts?: TourLaunchOptions) {
  if (!window.InkwellTour) {
    console.error('[TourLauncher] Tours not registered. Call registerTours() first.');
    return;
  }

  window.InkwellTour.start(id, opts);
}

/**
 * Reset tour progress (convenience function)
 */
export function resetTour(id: TourId) {
  if (!window.InkwellTour) {
    console.error('[TourLauncher] Tours not registered. Call registerTours() first.');
    return;
  }

  window.InkwellTour.reset(id);
}

/**
 * Check if a tour is available
 */
export function isTourAvailable(id: TourId): boolean {
  return window.InkwellTour?.isAvailable(id) ?? false;
}

/**
 * Bind global keyboard shortcut (Shift + ?)
 */
export function bindTourShortcut() {
  window.addEventListener('keydown', (e) => {
    // Shift + ? to open spotlight tour
    const isShiftQuestion = e.shiftKey && e.key === '?';

    if (isShiftQuestion) {
      e.preventDefault();
      startTour('spotlight', { source: 'keyboard' });
    }
  });

  devLog.debug('[TourLauncher] Keyboard shortcut bound: Shift + ?');
}

/**
 * Handle tour launch from URL params
 * Example: /dashboard?tour=spotlight&restart=1
 */
export function handleTourDeepLink() {
  if (typeof window === 'undefined') return;

  const params = new URLSearchParams(window.location.search);
  const tourId = params.get('tour') as TourId | null;
  const restart = params.get('restart') === '1';

  if (tourId && isTourAvailable(tourId)) {
    devLog.debug(`[TourLauncher] Launching tour from URL: ${tourId}`);

    // Small delay to ensure app is fully loaded
    setTimeout(() => {
      startTour(tourId, { restart, source: 'url' });

      // Clean up URL params
      const url = new URL(window.location.href);
      url.searchParams.delete('tour');
      url.searchParams.delete('restart');
      window.history.replaceState({}, '', url.toString());
    }, 1000);
  }
}
