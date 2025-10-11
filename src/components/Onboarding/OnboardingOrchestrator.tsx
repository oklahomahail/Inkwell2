// src/components/Onboarding/OnboardingOrchestrator.tsx
import React, { useEffect, useMemo, useState } from 'react';

import { useTutorialStorage } from '../../services/tutorialStorage';

import TourOverlay from './TourOverlay';

import type { TourType } from './steps/Step.types';

/**
 * Minimal, self-contained auto-start logic:
 * - `?tour=` query param: "full" | "feature" | "context"
 * - If no param: auto-start full-onboarding when not completed and not snoozed
 */

export default function OnboardingOrchestrator() {
  const { getProgress, getPreferences, profileId } = useTutorialStorage();
  const [open, setOpen] = useState(false);
  const [tourType, setTourType] = useState<TourType>('full-onboarding');

  // read query param once
  const queryTour = useMemo(() => {
    if (typeof window === 'undefined') return null;
    const q = new URLSearchParams(window.location.search).get('tour');
    if (!q) return null;
    if (q === 'full') return 'full-onboarding';
    if (q === 'feature') return 'feature-tour';
    if (q === 'context') return 'contextual-help';
    return null;
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // 1) explicit query param takes precedence
        if (queryTour) {
          if (!cancelled) {
            setTourType(queryTour as TourType);
            setOpen(true);
          }
          return;
        }
        // 2) otherwise, auto-start full-onboarding if not completed & not snoozed
        const [prefs, progress] = await Promise.all([
          getPreferences(),
          getProgress('tour:full-onboarding'),
        ]);

        const snoozed =
          !!prefs?.remindMeLaterUntil && Date.now() < (prefs?.remindMeLaterUntil ?? 0);
        const never = !!prefs?.neverShowAgain;
        const completed = !!progress?.progress?.isCompleted;

        if (!cancelled && !never && !snoozed && !completed) {
          setTourType('full-onboarding');
          setOpen(true);
        }
      } catch {
        // fail open quietly in dev if needed
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [getPreferences, getProgress, profileId, queryTour]);

  if (!open) return null;
  return <TourOverlay tourType={tourType} onClose={() => setOpen(false)} />;
}
