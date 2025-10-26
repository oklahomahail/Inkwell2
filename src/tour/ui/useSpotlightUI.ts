import { useEffect, useState, useCallback } from 'react';

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

  // Update anchor rect when step changes or viewport changes
  const updateAnchorRect = useCallback(() => {
    if (!currentStep?.selectors || currentStep.selectors.length === 0) {
      setAnchorRect(null);
      return;
    }

    // Try each selector until we find a matching element
    let target: HTMLElement | null = null;
    for (const selector of currentStep.selectors) {
      target = document.querySelector(selector) as HTMLElement;
      if (target) break;
    }

    if (!target) {
      console.warn(
        `[SpotlightTour] Target element not found for selectors: ${currentStep.selectors.join(', ')}`,
      );
      setAnchorRect(null);
      return;
    }

    const rect = getAnchorRect(target);
    setAnchorRect(rect);

    // Compute optimal placement based on available viewport space
    const optimalPlacement = computeOptimalPlacement(rect);
    setPlacement(optimalPlacement);
  }, [currentStep?.selectors]);

  // Subscribe to TourService state (to be implemented with TourService integration)
  useEffect(() => {
    // TODO: Replace with actual TourService subscription
    // For now, this is a placeholder that demonstrates the expected interface
    // Example:
    // const unsubscribe = tourService.subscribe((state) => {
    //   setIsActive(state.isActive);
    //   setCurrentStep(state.currentStep);
    //   setIndex(state.currentIndex);
    //   setTotal(state.steps.length);
    // });
    // return unsubscribe;

    // Placeholder: no-op for now
    return () => {};
  }, []);

  // Update anchor rect when step changes
  useEffect(() => {
    if (!isActive || !currentStep) {
      setAnchorRect(null);
      return;
    }

    updateAnchorRect();

    // Listen for viewport changes
    const onResize = () => updateAnchorRect();
    const onScroll = () => updateAnchorRect();

    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onScroll, true);

    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [isActive, currentStep, updateAnchorRect]);

  // Action callbacks (to be integrated with TourService and analytics)
  const next = useCallback(() => {
    // TODO: Integrate with TourService.next() and analytics
    // Example:
    // tourService.next();
    // logAnalyticsEvent('tour_step_viewed', { step: index + 1, totalSteps: total });
    console.log('[SpotlightTour] next()');
  }, [index, total]);

  const prev = useCallback(() => {
    // TODO: Integrate with TourService.prev()
    console.log('[SpotlightTour] prev()');
  }, []);

  const skip = useCallback(() => {
    // TODO: Integrate with TourService.skip() and analytics
    // Example:
    // tourService.skip();
    // logAnalyticsEvent('tour_skipped', { atStep: index + 1, totalSteps: total });
    console.log('[SpotlightTour] skip()');
  }, [index, total]);

  const close = useCallback(() => {
    // TODO: Integrate with TourService.close()
    console.log('[SpotlightTour] close()');
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
