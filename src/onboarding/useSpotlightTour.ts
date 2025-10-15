import { useMemo } from 'react';

import { StepWelcome, StepQuickActions, StepProjectCard, StepFinish } from './steps';

interface SpotlightTour {
  start: () => void;
}

export function useSpotlightTour(): SpotlightTour {
  const steps = useMemo(() => [StepWelcome, StepQuickActions, StepProjectCard, StepFinish], []);

  return {
    start: async () => {
      try {
        // Use the TourController system instead of looking for window.__INKWELL_TOUR__
        const { tourController } = await import('../components/Onboarding/hooks/TourController');
        tourController.startTour('spotlight', 'default', { steps: steps.length });
        // Overlay listens to tour:start event and renders steps internally
      } catch (error) {
        console.error('Failed to start spotlight tour:', error);
      }
    },
  };
}
