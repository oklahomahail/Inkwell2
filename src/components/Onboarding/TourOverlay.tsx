// src/components/Onboarding/TourOverlay.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { analyticsService } from '../../services/analyticsService';
import { useTutorialStorage } from '../../services/tutorialStorage';

import { loadTourPreset } from './presetLoaderHelper';

import type { TourType } from './steps/Step.types';

type Props = {
  tourType?: TourType;
  onClose?: () => void;
  /** Optional custom persistence key; defaults to "tour:<tourType>" */
  persistKey?: string;
};

export default function _TourOverlay({ tourType = 'full-onboarding', onClose, persistKey }: Props) {
  const steps = useMemo(() => loadTourPreset(tourType), [tourType]);
  const total = steps.length;
  const [i, setI] = useState(0);
  const startTime = useRef(Date.now());

  // --- persistence ------------
  const { getProgress, setProgress, profileId } = useTutorialStorage();
  const slug = useMemo(() => persistKey ?? `tour:${tourType}`, [persistKey, tourType]);
  const mounted = useRef(false);

  // Log tour start on first mount
  useEffect(() => {
    try {
      analyticsService.track('tour_started', {
        tourType: tourType === 'full-onboarding' ? 'first_time' : 'feature_tour',
        entryPoint: 'overlay',
        profileId: profileId || undefined,
      });
    } catch {}
  }, []); // fire once when overlay appears

  // Log step changes
  useEffect(() => {
    try {
      analyticsService.trackTourStepCompleted(tourType, i, `step-${i}`, Date.now());
    } catch {}
  }, [i, tourType, profileId, total]);

  // Load last progress (if any) on first mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const p = await getProgress(slug);
        if (!cancelled && p && !p.progress.isCompleted) {
          setI(Math.min(total - 1, Math.max(0, p.progress.currentStep ?? 0)));
        }
      } catch {
        /* no-op: fall back to step 0 */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [getProgress, slug, total]);

  const onNext = useCallback(() => setI((x) => Math.min(total - 1, x + 1)), [total]);
  const onPrevious = useCallback(() => setI((x) => Math.max(0, x - 1)), []);
  const onComplete = useCallback(() => {
    // log tour complete
    try {
      analyticsService.trackTourCompleted(tourType, total, Date.now() - startTime.current, 0);
    } catch {}
    // mark tour complete
    try {
      void setProgress(_slug, {
        currentStep: total - 1,
        _completedSteps: Array.from({ length: total }, (_, _k) => `step-${k}`),
        tourType,
        startedAt: Date.now(),
        completedAt: Date.now(),
        isCompleted: true,
        totalSteps: total,
        lastActiveAt: Date.now(),
      });
    } catch {}
    onClose?.();
  }, [onClose, setProgress, slug, total, tourType]);

  // Persist step changes (debounced per render tick)
  useEffect(() => {
    // skip the very first paint (before we've checked existing progress)
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    try {
      void setProgress(slug, {
        currentStep: i,
        completedSteps: [],
        tourType,
        startedAt: Date.now(),
        isCompleted: false,
        totalSteps: total,
        lastActiveAt: Date.now(),
      });
    } catch {}
  }, [i, slug, tourType, total, profileId]);

  const Step = steps[i];
  if (!Step) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/30">
      <div className="absolute inset-x-0 bottom-0 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2">
        <div className="bg-white rounded-2xl shadow-xl mx-auto md:min-w-[560px]">
          <Step
            stepIndex={i}
            totalSteps={total}
            onNext={onNext}
            onPrevious={onPrevious}
            onComplete={onComplete}
          />
        </div>
      </div>
    </div>
  );
}
