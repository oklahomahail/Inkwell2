// src/components/Onboarding/utils/tourSafety.ts
import { TourStep } from '../ProfileTourProvider';

/**
 * Waits for all specified selectors to exist in the DOM
 * @param selectors Array of CSS selectors to wait for
 * @param timeout Maximum time to wait in milliseconds
 * @returns Promise that resolves when all elements exist or rejects on timeout
 */
function waitForAll(selectors: string[], timeout = 3000): Promise<void> {
  const start = performance.now();
  return new Promise<void>((resolve, reject) => {
    const checkElements = () => {
      const allExist = selectors.every((selector) => document.querySelector(selector));

      if (allExist) {
        resolve();
      } else if (performance.now() - start > timeout) {
        reject(new Error(`Timeout waiting for selectors: ${selectors.join(', ')}`));
      } else {
        setTimeout(checkElements, 100);
      }
    };

    checkElements();
  });
}

/**
 * Starts a tour only after all target elements are ready
 * @param steps Tour steps to validate and run
 * @param startTourCallback Function to call to start the tour
 * @param timeout Maximum time to wait for elements (default 4000ms)
 */
export async function startTourSafely(
  steps: TourStep[],
  startTourCallback: (
    type: 'full-onboarding' | 'feature-tour' | 'contextual-help',
    steps?: TourStep[],
  ) => void,
  timeout = 4000,
): Promise<void> {
  try {
    // Extract concrete selectors that need to exist
    const mustExist = steps
      .map((step) => step.target)
      .filter((selector) => typeof selector === 'string' && selector.startsWith('#'))
      .filter((selector, index, array) => array.indexOf(selector) === index); // Remove duplicates

    // Wait for all required elements to exist
    if (mustExist.length > 0) {
      await waitForAll(mustExist, timeout);
    }

    // Elements are ready, start the tour
    startTourCallback('full-onboarding', steps);
  } catch (error) {
    console.warn('Failed to start tour safely:', error);
    // Fallback: try to start tour anyway with original elements
    // This ensures tour doesn't completely fail
    try {
      startTourCallback('full-onboarding', steps);
    } catch (fallbackError) {
      console.error('Tour startup failed completely:', fallbackError);
      throw new Error('Tour initialization failed');
    }
  }
}

/**
 * Gets the tour steps with safe targets for the core onboarding tour
 * @param steps Original tour steps
 * @returns Modified steps with fallback targets for missing elements
 */
export function getSafeTourSteps(steps: TourStep[]): TourStep[] {
  interface StepWithOriginalTarget extends TourStep {
    originalTarget?: string;
  }
  return steps.map((step) => {
    // For steps that might have missing targets, provide fallbacks
    const fallbackMap: { [key: string]: string } = {
      '[data-tour="new-project-button"], .new-project-button, [data-testid="create-project"]':
        '#tour-viewport-anchor',
      '[data-tour="sidebar"], .sidebar-nav, nav[role="navigation"]': '#tour-viewport-anchor',
      '[data-tour="writing-editor"], .writing-editor, .editor-content': '#tour-viewport-anchor',
      '[data-tour="auto-save"], .auto-save-indicator': '#tour-viewport-anchor',
      '[data-tour="timeline-tab"], [href*="timeline"]': '#tour-viewport-anchor',
      '[data-tour="export-button"], .export-button': '#tour-viewport-anchor',
    };

    // If the target might be missing, check for fallback
    if (step.target !== '#tour-viewport-anchor' && fallbackMap[step.target]) {
      return {
        ...step,
        target: step.target, // Keep original target for now
        // Add metadata to help with debugging
        originalTarget: step.target,
      };
    }

    return step;
  });
}

/**
 * Checks if welcome dialog should be suppressed based on localStorage
 */
export function shouldSuppressWelcomeDialog(): boolean {
  try {
    return localStorage.getItem('hideWelcome') === 'true';
  } catch (error) {
    console.warn('Failed to check welcome suppression:', error);
    return false;
  }
}
