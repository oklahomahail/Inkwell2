// src/components/Onboarding/TourOverlay.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useTutorialStorage } from '../../services/tutorialStorage';

import { loadTourPreset } from './presetLoaderHelper';

import type { TourType } from './steps/Step.types';

type Props = {
  tourType?: TourType;
  onClose?: () => void;
  /** Optional custom persistence key; defaults to "tour:<tourType>" */
  persistKey?: string;
};

export default function TourOverlay({ tourType = 'full-onboarding', onClose, persistKey }: Props) {
  const steps = useMemo(() => loadTourPreset(tourType), [tourType]);
  const total = steps.length;
  const [i, setI] = useState(0);

  // --- persistence ------------
  const { getProgress, setProgress, profileId } = useTutorialStorage();
  const slug = useMemo(() => persistKey ?? `tour:${tourType}`, [persistKey, tourType]);
  const mounted = useRef(false);

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
    // mark tour complete
    try {
      void setProgress(slug, {
        currentStep: total - 1,
        completedSteps: Array.from({ length: total }, (_, k) => `step-${k}`),
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
