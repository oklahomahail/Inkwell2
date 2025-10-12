import { useMemo } from 'react';

import { StepWelcome, StepQuickActions, StepProjectCard, StepFinish } from './steps';

interface SpotlightTour {
  start: () => void;
}

export function useSpotlightTour(): SpotlightTour {
  const steps = useMemo(() => [StepWelcome, StepQuickActions, StepProjectCard, StepFinish], []);

  return {
    start: () => {
      // Assuming the tour library is mounted on window
      if (window.__INKWELL_TOUR__) {
        window.__INKWELL_TOUR__.start({ steps });
      } else {
        console.error('Tour library not initialized');
      }
    },
  };
}
