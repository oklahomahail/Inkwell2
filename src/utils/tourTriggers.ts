/**
 * Tour Trigger Event Utilities
 *
 * Provides debounced, idempotent event dispatchers for tour progression.
 * Prevents double-firing in React 19 strict mode and other edge cases.
 *
 * Usage:
 *   import { triggerOnProjectCreated } from './tourTriggers';
 *
 *   // In your CreateProject component
 *   function handleCreateProject() {
 *     // ... create project logic
 *     const success = triggerOnProjectCreated();
 *     if (!success) {
 *       console.log('Event was debounced or failed to dispatch');
 *     }
 *   }
 */

/**
 * Type-safe event payload definitions
 */
export interface TourEventPayloads {
  dashboardView: Record<string, never>;
  onProjectCreated: { projectId?: string };
  writingPanelOpen: { projectId?: string };
  storyPlanningOpen: { projectId?: string };
  beatSheetCompleted: { beatCount?: number };
  charactersAdded: { characterCount?: number };
  worldBuildingVisited: Record<string, never>;
  aiIntegrationConfigured: Record<string, never>;
  timelineVisited: Record<string, never>;
  analyticsVisited: Record<string, never>;
}

type TourTriggerEvent = keyof TourEventPayloads;

/**
 * Debounce map to prevent duplicate triggers within a short window
 */
const triggerDebounceMap = new Map<TourTriggerEvent, number>();

/**
 * Debounce window in milliseconds
 */
const DEBOUNCE_MS = 300;

/**
 * Generic trigger dispatcher with debouncing
 *
 * @param eventName - Name of the tour trigger event
 * @param payload - Optional custom event detail
 * @returns true if event was dispatched, false if debounced or failed
 */
export function dispatchTourTrigger<T extends TourTriggerEvent>(
  eventName: T,
  payload?: TourEventPayloads[T],
): boolean {
  // SSR safety check
  if (typeof window === 'undefined') {
    if (import.meta.env.DEV) {
      console.warn(`[tour-triggers] Skipping "${eventName}" - window is undefined (SSR context)`);
    }
    return false;
  }

  const now = Date.now();
  const lastTrigger = triggerDebounceMap.get(eventName) ?? 0;

  // Debounce: skip if triggered recently
  if (now - lastTrigger < DEBOUNCE_MS) {
    if (import.meta.env.DEV) {
      console.debug(
        `[tour-triggers] Debounced duplicate "${eventName}" (${now - lastTrigger}ms since last)`,
      );
    }
    return false;
  }

  // Update debounce map
  triggerDebounceMap.set(eventName, now);

  // Dispatch custom event
  try {
    window.dispatchEvent(
      new CustomEvent(eventName, {
        detail: payload ?? {},
      }),
    );

    if (import.meta.env.DEV) {
      console.info(`[tour-triggers] Dispatched "${eventName}"`, payload);
    }
    return true;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error(`[tour-triggers] Failed to dispatch "${eventName}":`, error);
    }
    return false;
  }
}

/**
 * Convenience trigger functions for each tour step
 * All return true if dispatched successfully, false if debounced/failed
 */

export function triggerDashboardView(): boolean {
  return dispatchTourTrigger('dashboardView', {});
}

export function triggerOnProjectCreated(projectId?: string): boolean {
  return dispatchTourTrigger('onProjectCreated', { projectId });
}

export function triggerWritingPanelOpen(projectId?: string): boolean {
  return dispatchTourTrigger('writingPanelOpen', { projectId });
}

export function triggerStoryPlanningOpen(projectId?: string): boolean {
  return dispatchTourTrigger('storyPlanningOpen', { projectId });
}

export function triggerBeatSheetCompleted(beatCount?: number): boolean {
  return dispatchTourTrigger('beatSheetCompleted', { beatCount });
}

export function triggerCharactersAdded(characterCount?: number): boolean {
  return dispatchTourTrigger('charactersAdded', { characterCount });
}

export function triggerWorldBuildingVisited(): boolean {
  return dispatchTourTrigger('worldBuildingVisited', {});
}

export function triggerAiIntegrationConfigured(): boolean {
  return dispatchTourTrigger('aiIntegrationConfigured', {});
}

export function triggerTimelineVisited(): boolean {
  return dispatchTourTrigger('timelineVisited', {});
}

export function triggerAnalyticsVisited(): boolean {
  return dispatchTourTrigger('analyticsVisited', {});
}

/**
 * Resets all debounce timers (useful for testing)
 */
export function resetTriggerDebounce() {
  triggerDebounceMap.clear();
}
