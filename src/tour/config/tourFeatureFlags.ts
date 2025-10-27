/**
 * Tour Feature Flags Configuration
 * Controls which tour variants are enabled in production
 *
 * Use these flags for gradual rollout and quick kill-switch capability
 */

export interface TourFeatureFlags {
  tour_simpleTour: boolean;
  tour_aiTools: boolean;
  tour_export: boolean;
}

/**
 * Default tour feature flags
 * Set to false for cautious rollout, true for full deployment
 */
export const DEFAULT_TOUR_FLAGS: TourFeatureFlags = {
  tour_simpleTour: true, // Core/default tour
  tour_aiTools: true, // AI Tools tour variant
  tour_export: true, // Export tour variant
};

/**
 * Storage key for tour flags
 */
const TOUR_FLAGS_KEY = 'inkwell:tour:flags';

/**
 * Get current tour feature flags from storage
 */
export function getTourFlags(): TourFeatureFlags {
  try {
    const stored = localStorage.getItem(TOUR_FLAGS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_TOUR_FLAGS, ...parsed };
    }
  } catch (error) {
    console.warn('[TourFlags] Failed to load flags from storage:', error);
  }
  return { ...DEFAULT_TOUR_FLAGS };
}

/**
 * Update tour feature flags (admin/debug use)
 */
export function setTourFlags(flags: Partial<TourFeatureFlags>): void {
  try {
    const current = getTourFlags();
    const updated = { ...current, ...flags };
    localStorage.setItem(TOUR_FLAGS_KEY, JSON.stringify(updated));

    // Notify listeners
    window.dispatchEvent(new CustomEvent('tour:flags-changed', { detail: updated }));
  } catch (error) {
    console.warn('[TourFlags] Failed to save flags to storage:', error);
  }
}

/**
 * Check if a specific tour variant is enabled
 */
export function isTourEnabled(tourKey: keyof TourFeatureFlags): boolean {
  const flags = getTourFlags();
  return flags[tourKey] ?? DEFAULT_TOUR_FLAGS[tourKey];
}

/**
 * Reset all tour flags to defaults
 */
export function resetTourFlags(): void {
  try {
    localStorage.removeItem(TOUR_FLAGS_KEY);
    window.dispatchEvent(new CustomEvent('tour:flags-changed', { detail: DEFAULT_TOUR_FLAGS }));
  } catch (error) {
    console.warn('[TourFlags] Failed to reset flags:', error);
  }
}

/**
 * Subscribe to tour flag changes
 */
export function onTourFlagsChange(callback: (flags: TourFeatureFlags) => void): () => void {
  const handler = (e: Event) => {
    const customEvent = e as CustomEvent<TourFeatureFlags>;
    callback(customEvent.detail);
  };

  window.addEventListener('tour:flags-changed', handler);

  return () => {
    window.removeEventListener('tour:flags-changed', handler);
  };
}

// Expose flags control in development
if (import.meta.env.DEV) {
  (window as any).tourFlags = {
    get: getTourFlags,
    set: setTourFlags,
    reset: resetTourFlags,
    check: isTourEnabled,
  };
}
