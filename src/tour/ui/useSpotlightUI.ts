import { useEffect, useState, useCallback } from 'react';

import devLog from '@/utils/devLog';

import { getSpotlightSteps } from '../getSpotlightSteps';
import { tourService } from '../TourService';

import { getAnchorRect } from './geometry';

import type { TourStep, TourPlacement } from '../types';

/**
 * useSpotlightUI
 *
 * React hook to subscribe to TourService state and manage overlay rendering.
 * - Resolves the current target element via data-tour-id
 * - Computes anchor rect and optimal placement
 * - Provides next/prev/skip/close callbacks that integrate with TourService and analytics
 * - Handles viewport changes and target element updates
 *
 * Returns:
 * - isActive: boolean - whether the tour is currently running
 * - currentStep: TourStep | null - the current step definition
 * - index: number - current step index (0-based)
 * - total: number - total number of steps
 * - anchorRect: DOMRect | null - the target element's bounding rect
 * - placement: Placement - optimal tooltip placement
 * - next/prev/skip/close: callbacks for user actions
 */
export function useSpotlightUI() {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState<TourStep | null>(null);
  const [index, setIndex] = useState(0);
  const [total, setTotal] = useState(0);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const [placement, setPlacement] = useState<TourPlacement>('bottom');

  // Update anchor rect when step changes
  const updateAnchorRect = useCallback(() => {
    if (!currentStep?.selectors || currentStep.selectors.length === 0) {
      setAnchorRect(null);
      return;
    }

    // Try each selector until we find a matching element
    let target: HTMLElement | null = null;
    for (const selector of currentStep.selectors) {
      target = document.querySelector(selector) as HTMLElement;
      if (target) {
        devLog.debug(`[SpotlightTour] Found target for selector: ${selector}`);
        break;
      }
    }

    if (!target) {
      devLog.debug(
        `[SpotlightTour] Target element not found for selectors: ${currentStep.selectors.join(', ')}`,
      );
      devLog.debug(
        `[SpotlightTour] Current step: ${currentStep.title}. Ensure the tour anchor elements are present in the DOM.`,
      );
      // Log error detail in object form to help debugging but don't console.error to avoid polluting logs
      devLog.warn('[SpotlightTour] Missing tour anchor!', {
        step: currentStep.title,
        selectors: currentStep.selectors,
        suggestion: 'Check that data-tour-id attributes are present on the required elements',
      });
      setAnchorRect(null);
      return;
    }

    const rect = getAnchorRect(target);
    setAnchorRect(rect);

    // Compute optimal placement based on available viewport space
    const optimalPlacement = computeOptimalPlacement(rect);
    setPlacement(optimalPlacement);
  }, [currentStep?.selectors, currentStep?.title]);

  // Subscribe to TourService state and listen for tour start events
  useEffect(() => {
    // Store current steps configuration
    let currentSteps: TourStep[] = [];

    // Subscribe to TourService state changes
    const unsubscribe = tourService.subscribe((state) => {
      setIsActive(state.isRunning);
      setIndex(state.currentStep);
      setTotal(state.totalSteps);

      // Get the current step from the stored config
      if (state.isRunning && state.currentStep < currentSteps.length) {
        setCurrentStep(currentSteps[state.currentStep] || null);
      } else {
        setCurrentStep(null);
      }
    });

    // Helper to extract selectors from target (handles both strings and functions)
    const extractSelectors = (target: any): string[] => {
      if (typeof target === 'function') {
        // Call function to get element, then try to extract meaningful selectors from it
        const element = target();
        if (element) {
          const selectors: string[] = [];

          // Try to build selectors from the element's attributes
          if (element.id) {
            selectors.push(`#${element.id}`);
          }
          if (element.className) {
            const classes = element.className
              .split(' ')
              .filter((c: string) => c && !c.startsWith('spotlight-'))
              .slice(0, 3); // Limit to first 3 classes for specificity
            if (classes.length > 0) {
              selectors.push(`.${classes.join('.')}`);
            }
          }
          if (element.getAttribute('data-tour-id')) {
            selectors.push(`[data-tour-id="${element.getAttribute('data-tour-id')}"]`);
          }
          if (element.tagName) {
            selectors.push(element.tagName.toLowerCase());
          }

          return selectors.length > 0 ? selectors : ['body']; // Fallback to body if no selectors found
        }
        return ['body']; // Fallback if function returns null
      }
      return [target as string];
    };

    // Listen for tour start event from the launcher
    const handleStartTour = (event: CustomEvent) => {
      // Clear any crash shield state
      try {
        sessionStorage.removeItem('inkwell:tour:crash-shield');
      } catch (error) {
        devLog.warn('[useSpotlightUI] Failed to clear crash shield state:', error);
      }

      const spotlightSteps = getSpotlightSteps();

      if (spotlightSteps.length === 0) {
        devLog.warn('[useSpotlightUI] No spotlight steps available');
        return;
      }

      // Convert SpotlightStep[] to TourStep[] format
      currentSteps = spotlightSteps.map((step, idx) => {
        // Extract selectors from target (the spotlight steps already have selector arrays as functions)
        const selectors =
          typeof step.target === 'function'
            ? (() => {
                // The target function in SpotlightStep already contains selector logic
                // Extract those selectors by examining what the function would try
                const el = step.target();
                if (el) {
                  // If we found an element, we can use data-tour-id or construct selectors
                  const dataId = el.getAttribute('data-tour-id');
                  if (dataId) return [`[data-tour-id="${dataId}"]`];
                  if (el.id) return [`#${el.id}`];
                  return [el.tagName.toLowerCase()];
                }
                return ['body'];
              })()
            : [step.target as string];

        return {
          id: `step-${idx}`,
          selectors,
          title: step.title,
          body: step.content,
          placement: step.placement || 'bottom',
          beforeNavigate: step.beforeShow,
          onAdvance: step.onNext,
        } as TourStep;
      });

      // Start the tour with TourService using the old config format
      const tourConfig = {
        id: 'spotlight',
        steps: spotlightSteps.map((step, _idx) => {
          const targetSelector =
            typeof step.target === 'function'
              ? (() => {
                  const el = step.target();
                  if (el) {
                    const dataId = el.getAttribute('data-tour-id');
                    if (dataId) return `[data-tour-id="${dataId}"]`;
                    if (el.id) return `#${el.id}`;
                    return el.tagName.toLowerCase();
                  }
                  return 'body';
                })()
              : (step.target as string);

          return {
            target: targetSelector,
            title: step.title,
            content: step.content,
            placement: step.placement || 'bottom',
          };
        }),
        showProgress: true,
        allowSkip: true,
      };

      tourService.start(tourConfig, { forceRestart: event.detail?.opts?.restart });
    };

    window.addEventListener('inkwell:start-tour', handleStartTour as EventListener);

    return () => {
      unsubscribe();
      window.removeEventListener('inkwell:start-tour', handleStartTour as EventListener);
    };
  }, []);

  // Update anchor rect when step changes
  useEffect(() => {
    if (!isActive || !currentStep) {
      setAnchorRect(null);
      return;
    }

    let retryTimeoutId: ReturnType<typeof setTimeout> | undefined;

    // Add longer delay to ensure DOM is ready and all async operations complete
    // This prevents "[SpotlightTour] Missing tour anchor" errors by ensuring the target element is rendered
    const timeoutId = setTimeout(() => {
      updateAnchorRect();

      // Retry once if the element isn't found (helps with late-rendering components)
      retryTimeoutId = setTimeout(() => {
        updateAnchorRect();
      }, 500);
    }, 1500); // Increased from 1000ms to 1500ms for more stable DOM

    // Listen for viewport changes
    const onResize = () => updateAnchorRect();
    const onScroll = () => updateAnchorRect();

    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onScroll, true);

    return () => {
      clearTimeout(timeoutId);
      if (retryTimeoutId) {
        clearTimeout(retryTimeoutId);
      }
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [isActive, currentStep, updateAnchorRect]);

  // Action callbacks integrated with TourService
  const next = useCallback(() => {
    tourService.next();
  }, []);

  const prev = useCallback(() => {
    tourService.prev();
  }, []);

  const skip = useCallback(() => {
    tourService.skip();
  }, []);

  const close = useCallback(() => {
    tourService.stop();
  }, []);

  return {
    isActive,
    currentStep,
    index,
    total,
    anchorRect,
    placement,
    next,
    prev,
    skip,
    close,
  };
}

/**
 * Compute optimal tooltip placement based on available viewport space.
 * Prefers 'bottom', but falls back to 'top', 'right', or 'left' if there's insufficient space.
 */
function computeOptimalPlacement(rect: DOMRect): TourPlacement {
  const vh = window.innerHeight;
  const vw = window.innerWidth;

  const spaceBelow = vh - rect.bottom;
  const spaceAbove = rect.top;
  const spaceRight = vw - rect.right;
  const spaceLeft = rect.left;

  const minSpace = 200; // Minimum space required for tooltip

  // Prefer bottom
  if (spaceBelow >= minSpace) return 'bottom';
  // Fallback to top
  if (spaceAbove >= minSpace) return 'top';
  // Fallback to right
  if (spaceRight >= minSpace) return 'right';
  // Fallback to left
  if (spaceLeft >= minSpace) return 'left';

  // Default to bottom if no space is sufficient
  return 'bottom';
}
