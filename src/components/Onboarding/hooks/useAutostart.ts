import { useEffect, useRef } from 'react';

import { useTour } from '../TourProvider';

const isSuppressed = () => !!sessionStorage.getItem('inkwell:tour:suppress');

export function useSimpleTourAutostart() {
  const { startTour } = useTour();
  const startedRef = useRef(false);

  useEffect(() => {
    if (import.meta.env.DEV) console.info('[tour:auto] simple effect fired');
    if (isSuppressed()) {
      if (import.meta.env.DEV) console.info('[tour:auto] suppressed by route');
      return;
    }

    // React 19 double-effect guard + microtask token
    if (startedRef.current) {
      if (import.meta.env.DEV) console.info('[tour:auto] already started this session');
      return;
    }
    startedRef.current = true;

    queueMicrotask(() => {
      if (isSuppressed()) {
        if (import.meta.env.DEV) console.info('[tour:auto] suppressed after microtask');
        return;
      }

      // Feature gates + session markers go here...
      if (import.meta.env.DEV) console.info('[tour:auto] starting quick tour');
      startTour('full-onboarding');
    });
  }, [startTour]);
}

function waitForAnchor(selector: string, timeoutMs = 3000): Promise<Element | null> {
  return new Promise((resolve) => {
    const start = performance.now();
    function tick() {
      const el = document.querySelector(selector);
      if (el) {
        if (import.meta.env.DEV) console.info('[spotlight] anchor found?', true, { selector });
        return resolve(el);
      }
      if (performance.now() - start > timeoutMs) {
        if (import.meta.env.DEV) console.info('[spotlight] anchor timeout after', timeoutMs, 'ms');
        return resolve(null);
      }
      requestAnimationFrame(tick);
    }
    tick();
  });
}

export function useSpotlightAutostart() {
  const { startTour } = useTour();
  const startedRef = useRef(false);

  useEffect(() => {
    if (isSuppressed()) {
      if (import.meta.env.DEV) console.info('[spotlight:auto] suppressed by route');
      return;
    }
    if (startedRef.current) return;
    startedRef.current = true;

    (async () => {
      const anchor = await waitForAnchor('[data-spotlight="inbox"]', 3000);
      if (!anchor) {
        if (import.meta.env.DEV) console.info('[spotlight] no anchor, abort');
        return;
      }
      if (import.meta.env.DEV) console.info('[spotlight] anchor found, launching');
      startTour('feature-tour');
    })();
  }, [startTour]);
}
