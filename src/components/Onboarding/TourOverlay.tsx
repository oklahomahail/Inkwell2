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

export default function TourOverlay({ tourType = 'full-onboarding', onClose, persistKey }: Props) {
  const mounted = useRef(false);
  const profileId = ''; // TODO: Get this from context/props if needed
  const steps = useMemo(() => loadTourPreset(tourType), [tourType]);
  const total = steps.length;
  const [i, setI] = useState(0);
  const { setProgress, setPreferences } = useTutorialStorage?.() ?? {};

  const stripTourQueryParam = useCallback(() => {
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.has('tour')) {
        url.searchParams.delete('tour');
        window.history.replaceState({}, '', url.toString());
      }
    } catch {}
  }, []);

  const onNext = useCallback(() => setI((x) => Math.min(total - 1, x + 1)), [total]);
  const onPrevious = useCallback(() => setI((x) => Math.max(0, x - 1)), []);
  const onComplete = useCallback(async () => {
    const slug = persistKey || tourType; // use persistKey if provided, otherwise use tourType as the slug/key
    const now = Date.now();
    try {
      // 1) persist "completed" progress
      if (setProgress) {
        await setProgress(slug, {
          currentStep: total,
          completedSteps: Array.from({ length: total }, (_, k) => String(k)),
          tourType,
          startedAt: now,
          completedAt: now,
          isCompleted: true,
          totalSteps: total,
          lastActiveAt: now,
        });
      }
      // 2) mark preference completed to short-circuit future auto-starts
      if (setPreferences) {
        await setPreferences({
          neverShowAgain: false,
          remindMeLater: false,
          completedTours: [slug],
          tourDismissals: 0,
        });
      }
      // 3) mark this session as "tour finished" to stop any session-based triggers
      sessionStorage.setItem('inkwell:tour:finished', '1');
      // 4) clear ?tour= param so history/refresh won't retrigger
      stripTourQueryParam();
      // 5) broadcast completion (orchestrator listens)
      window.dispatchEvent(new CustomEvent('inkwell:tour:completed', { detail: { slug } }));
    } catch {
      // non-blocking; still close the overlay
    }
    onClose?.();
  }, [onClose, setProgress, setPreferences, stripTourQueryParam, tourType, total]);

  // Log tour start on first mount
  useEffect(() => {
    try {
      analyticsService.track('tour_started', {
        tourType: tourType === 'full-onboarding' ? 'first_time' : 'feature_tour',
        entryPoint: 'overlay',
        profileId: profileId || undefined,
      });
    } catch {}
  }, [tourType, profileId]); // Include dependencies

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
        const p = await tutorialStorage.getProgress?.(persistKey || tourType);
        if (!cancelled && p && !p.isCompleted) {
          setI(Math.min(total - 1, Math.max(0, p.progress.currentStep ?? 0)));
        }
      } catch {
        /* no-op: fall back to step 0 */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [persistKey, tourType, total]);

  // Persist step changes (debounced per render tick)
  useEffect(() => {
    // skip the very first paint (before we've checked existing progress)
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    try {
      void setProgress?.(persistKey || tourType, {
        currentStep: i,
        completedSteps: [],
        tourType,
        startedAt: Date.now(),
        isCompleted: false,
        totalSteps: total,
        lastActiveAt: Date.now(),
      });
    } catch {}
  }, [i, persistKey, tourType, total, profileId, setProgress]);

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
