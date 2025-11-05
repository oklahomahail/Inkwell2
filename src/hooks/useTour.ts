// src/hooks/useTour.ts
/**
 * useTour Hook - Universal Tour Controller
 *
 * Provides a centralized controller for managing contextual mini-tours.
 * Features:
 * - Selector-based filtering: Only shows steps for visible DOM elements
 * - Keyboard navigation: Arrow keys, Escape
 * - Completion tracking: localStorage persistence
 * - Runtime validation: Graceful fallback for missing anchors
 *
 * Usage:
 * ```tsx
 * const { isActive, currentStep, start, next, prev, end } = useTour();
 *
 * // Start a tour
 * <button onClick={() => start('gettingStarted')}>Start Tour</button>
 *
 * // Tour will automatically show TourTooltip if isActive === true
 * ```
 */

import { useState, useCallback, useEffect } from 'react';

import { getTourSet, markTourCompleted, isTourCompleted } from '@/data/tourSets';
import type { TourStep } from '@/data/tourSets';

interface UseTourReturn {
  isActive: boolean;
  currentSet: string | null;
  currentStep: TourStep | null;
  index: number;
  steps: TourStep[];
  totalSteps: number;
  start: (setKey: string, force?: boolean) => boolean;
  next: () => void;
  prev: () => void;
  end: () => void;
  skip: () => void;
}

/**
 * Global tour state (singleton pattern)
 * This ensures only one tour can be active at a time across the entire app
 */
let globalTourState: {
  isActive: boolean;
  currentSet: string | null;
} = {
  isActive: false,
  currentSet: null,
};

export function useTour(): UseTourReturn {
  const [isActive, setIsActive] = useState(false);
  const [currentSet, setCurrentSet] = useState<string | null>(null);
  const [steps, setSteps] = useState<TourStep[]>([]);
  const [index, setIndex] = useState(0);

  /**
   * Filter steps to only include those with visible anchors
   */
  const filterVisibleSteps = useCallback((allSteps: TourStep[]): TourStep[] => {
    return allSteps.filter((step) => {
      const element = document.querySelector(step.selector);
      if (!element) {
        console.warn(`[Tour] Anchor not found for step "${step.id}": ${step.selector}`);
        return false;
      }
      return true;
    });
  }, []);

  /**
   * End tour without marking as completed
   */
  const end = useCallback(() => {
    setIsActive(false);
    setCurrentSet(null);
    setSteps([]);
    setIndex(0);

    // Update global state
    globalTourState = { isActive: false, currentSet: null };

    if (import.meta.env.DEV) {
      console.warn('[Tour] Tour ended');
    }
  }, []);

  /**
   * Start a tour
   *
   * @param setKey - Tour set ID from TOUR_SETS
   * @param force - If true, skip completion check and restart tour
   * @returns true if tour started, false if already completed or not found
   */
  const start = useCallback(
    (setKey: string, force = false): boolean => {
      // Check if tour is already completed (unless forced)
      if (!force && isTourCompleted(setKey)) {
        if (import.meta.env.DEV) {
          console.warn(`[Tour] Tour "${setKey}" already completed. Use force=true to restart.`);
        }
        return false;
      }

      // Get tour set
      const tourSet = getTourSet(setKey);
      if (!tourSet) {
        console.error(`[Tour] Tour set "${setKey}" not found`);
        return false;
      }

      // Filter visible steps
      const visibleSteps = filterVisibleSteps(tourSet.steps);
      if (visibleSteps.length === 0) {
        console.warn(`[Tour] No visible anchors found for tour "${setKey}"`);
        return false;
      }

      // End any active tour first
      if (globalTourState.isActive) {
        if (import.meta.env.DEV) {
          console.warn('[Tour] Ending previous tour before starting new one');
        }
        end();
      }

      // Start tour
      setSteps(visibleSteps);
      setCurrentSet(setKey);
      setIndex(0);
      setIsActive(true);

      // Update global state
      globalTourState = { isActive: true, currentSet: setKey };

      if (import.meta.env.DEV) {
        console.warn(`[Tour] Started tour "${setKey}" with ${visibleSteps.length} steps`);
      }
      return true;
    },
    [filterVisibleSteps, end],
  );

  /**
   * Move to next step (or end tour if on last step)
   */
  const next = useCallback(() => {
    if (!isActive) return;

    if (index < steps.length - 1) {
      setIndex((prev) => prev + 1);
    } else {
      // Last step - complete tour
      if (currentSet) {
        markTourCompleted(currentSet);
        if (import.meta.env.DEV) {
          console.warn(`[Tour] Completed tour "${currentSet}"`);
        }
      }
      end();
    }
  }, [isActive, index, steps.length, currentSet, end]);

  /**
   * Move to previous step
   */
  const prev = useCallback(() => {
    if (!isActive || index === 0) return;
    setIndex((prev) => prev - 1);
  }, [isActive, index]);

  /**
   * Skip tour and mark as completed
   */
  const skip = useCallback(() => {
    if (currentSet) {
      markTourCompleted(currentSet);
      if (import.meta.env.DEV) {
        console.warn(`[Tour] Skipped and marked tour "${currentSet}" as completed`);
      }
    }
    end();
  }, [currentSet, end]);

  /**
   * Keyboard navigation
   */
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          end();
          break;
        case 'ArrowRight':
          next();
          break;
        case 'ArrowLeft':
          prev();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, next, prev, end]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (globalTourState.isActive) {
        globalTourState = { isActive: false, currentSet: null };
      }
    };
  }, []);

  return {
    isActive,
    currentSet,
    currentStep: steps[index] || null,
    index,
    steps,
    totalSteps: steps.length,
    start,
    next,
    prev,
    end,
    skip,
  };
}

/**
 * Check if any tour is currently active (useful for global UI state)
 */
export function isTourActive(): boolean {
  return globalTourState.isActive;
}

/**
 * Get the ID of the currently active tour (if any)
 */
export function getActiveTourId(): string | null {
  return globalTourState.currentSet;
}
