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
 *     triggerOnProjectCreated();
 *   }
 */

type TourTriggerEvent =
  | 'dashboardView'
  | 'onProjectCreated'
  | 'writingPanelOpen'
  | 'storyPlanningOpen'
  | 'beatSheetCompleted'
  | 'charactersAdded'
  | 'worldBuildingVisited'
  | 'aiIntegrationConfigured'
  | 'timelineVisited'
  | 'analyticsVisited';

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
 */
export function dispatchTourTrigger(
  eventName: TourTriggerEvent,
  payload?: Record<string, unknown>,
) {
  const now = Date.now();
  const lastTrigger = triggerDebounceMap.get(eventName) ?? 0;

  // Debounce: skip if triggered recently
  if (now - lastTrigger < DEBOUNCE_MS) {
    if (import.meta.env.DEV) {
      console.debug(
        `[tour-triggers] Debounced duplicate "${eventName}" (${now - lastTrigger}ms since last)`,
      );
    }
    return;
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
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error(`[tour-triggers] Failed to dispatch "${eventName}":`, error);
    }
  }
}

/**
 * Convenience trigger functions for each tour step
 */

export function triggerDashboardView() {
  dispatchTourTrigger('dashboardView');
}

export function triggerOnProjectCreated(projectId?: string) {
  dispatchTourTrigger('onProjectCreated', { projectId });
}

export function triggerWritingPanelOpen(projectId?: string) {
  dispatchTourTrigger('writingPanelOpen', { projectId });
}

export function triggerStoryPlanningOpen(projectId?: string) {
  dispatchTourTrigger('storyPlanningOpen', { projectId });
}

export function triggerBeatSheetCompleted(beatCount?: number) {
  dispatchTourTrigger('beatSheetCompleted', { beatCount });
}

export function triggerCharactersAdded(characterCount?: number) {
  dispatchTourTrigger('charactersAdded', { characterCount });
}

export function triggerWorldBuildingVisited() {
  dispatchTourTrigger('worldBuildingVisited');
}

export function triggerAiIntegrationConfigured() {
  dispatchTourTrigger('aiIntegrationConfigured');
}

export function triggerTimelineVisited() {
  dispatchTourTrigger('timelineVisited');
}

export function triggerAnalyticsVisited() {
  dispatchTourTrigger('analyticsVisited');
}

/**
 * Resets all debounce timers (useful for testing)
 */
export function resetTriggerDebounce() {
  triggerDebounceMap.clear();
}
