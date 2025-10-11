// src/components/Onboarding/OnboardingOrchestrator.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';

import analyticsService from '@/services/analyticsService';

import { useTutorialStorage } from '../../services/tutorialStorage';

import { shouldShowTourPrompt as gatingShouldShow, setPromptedThisSession } from './tourGating';
import TourOverlay from './TourOverlay';

const WELCOME_SHOWN_SESSION_KEY = 'inkwell-welcome-shown-this-session';

import type { TourType } from './steps/Step.types';

/**
 * Minimal, self-contained auto-start logic:
 * - `?tour=` query param: "full" | "feature" | "context"
 * - If no param: auto-start full-onboarding when not completed and not snoozed
 */

export function OnboardingOrchestrator() {
  const [open, setOpen] = useState(false);
  const [tourType, setTourType] = useState<TourType>('full-onboarding');
  const launchedThisSession = useRef(false);
  const finishedThisSession = useMemo(
    () => sessionStorage.getItem('inkwell:tour:finished') === '1',
    [],
  );
  const { getPreferences, getProgress } = useTutorialStorage?.() ?? {};

  // Mark welcome modal shown once per session when orchestrator first mounts
  useEffect(() => {
    const already = sessionStorage.getItem(WELCOME_SHOWN_SESSION_KEY) === 'true';
    if (!already) {
      sessionStorage.setItem(WELCOME_SHOWN_SESSION_KEY, 'true');
    }
  }, []);

  // Listen for completion, prevent further auto-starts this session
  useEffect(() => {
    const done = () => {
      launchedThisSession.current = true;
      sessionStorage.setItem('inkwell:tour:launched', '1');
    };
    window.addEventListener('inkwell:tour:completed', done);
    return () => window.removeEventListener('inkwell:tour:completed', done);
  }, []);

  // Auto-start logic (URL param, first-run, etc.)
  useEffect(() => {
    (async () => {
      if (launchedThisSession.current || finishedThisSession) return;

      const url = new URL(window.location.href);
      const q = (url.searchParams.get('tour') as TourType | null) ?? null;

      // If we have prefs/progress that say "completed", do NOT autostart
      const slug = q ?? 'full-onboarding';
      try {
        const [prefs, progress] = await Promise.all([getPreferences?.(), getProgress?.(slug)]);
        const isCompleted =
          (prefs?.completedTours ?? []).includes(slug) || progress?.progress?.isCompleted === true;
        if (isCompleted) {
          // also strip ?tour= so refresh doesn't resurrect it
          if (q) {
            url.searchParams.delete('tour');
            window.history.replaceState({}, '', url.toString());
          }
          return;
        }
      } catch {
        // ignore; proceed on best-effort
      }

      if (q) {
        setTourType(q);
        setOpen(true);
        launchedThisSession.current = true;
        try {
          analyticsService.track('tour_started', { tourType: 'first_time', entryPoint: 'overlay' });
        } catch {}
        // strip the param after opening once
        url.searchParams.delete('tour');
        window.history.replaceState({}, '', url.toString());
        return;
      }

      // First-run gating without URL param
      if (gatingShouldShow()) {
        setTourType('full-onboarding');
        setOpen(true);
        launchedThisSession.current = true;
        try {
          setPromptedThisSession();
        } catch {}
        try {
          analyticsService.track('tour_started', { tourType: 'first_time', entryPoint: 'overlay' });
        } catch {}
      }
    })();
  }, [getPreferences, getProgress, finishedThisSession]);

  // Programmatic starts (from settings, etc.)
  useEffect(() => {
    const handler = (e: Event) => {
      const ev = e as CustomEvent<{ slug?: TourType }>;
      if (launchedThisSession.current || finishedThisSession) return;
      setTourType(ev.detail?.slug ?? 'full-onboarding');
      setOpen(true);
      launchedThisSession.current = true;
    };
    window.addEventListener('inkwell:tour:start', handler as EventListener);
    return () => window.removeEventListener('inkwell:tour:start', handler as EventListener);
  }, [finishedThisSession]);

  if (!open) return null;
  return <TourOverlay tourType={tourType} onClose={() => setOpen(false)} />;
}

export default OnboardingOrchestrator;
