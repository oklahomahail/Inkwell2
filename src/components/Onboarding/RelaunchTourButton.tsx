import React, { useCallback } from 'react';

import { useTutorialStorage } from '@/services/tutorialStorage';

import type { TourType } from './steps/Step.types';

// Prefer the real hook if available
let useTour: undefined | (() => { start: (t: TourType) => void; isActive?: boolean });
try {
  useTour = require('./TourProvider').useTour;
} catch {
  useTour = undefined;
}

type Props = {
  tourType?: TourType;
  className?: string;
  label?: string;
  totalSteps?: number; // optional override for reset
};

/**
 * Renders a button that resets and relaunches the onboarding tour.
 * Handles multiple launch strategies:
 * 1. Direct via TourProvider hook (preferred)
 * 2. Event dispatch for OnboardingOrchestrator
 * 3. URL param trigger (fallback)
 */
export default function RelaunchTourButton({
  tourType = 'full-onboarding',
  className,
  label = 'Relaunch Onboarding',
  totalSteps,
}: Props) {
  const tour = useTour?.();
  const { resetProgress } = useTutorialStorage();

  const relaunch = useCallback(async () => {
    try {
      await resetProgress(tourType, totalSteps, tourType);
    } catch {
      // ignore reset errors; we can still attempt to launch
    }

    // Try launch strategies in order of preference:
    // 1. Direct via hook
    if (tour?.start) {
      tour.start(tourType);
      return;
    }

    // 2. Event dispatch for orchestrator
    try {
      window.dispatchEvent(new CustomEvent('inkwell:start-tour', { detail: { tourType } }));
      return;
    } catch {}

    // 3. URL param fallback (if orchestrator supports it)
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('tour', tourType);
      window.location.href = url.toString();
    } catch {
      /* ignore fallback errors */
    }
  }, [tour, tourType, totalSteps, resetProgress]);

  // Don't show while a tour is active
  if (tour?.isActive) return null;

  return (
    <button
      className={className ?? 'px-3 py-2 rounded-xl border hover:bg-gray-50 active:bg-gray-100'}
      onClick={relaunch}
    >
      {label}
    </button>
  );
}
