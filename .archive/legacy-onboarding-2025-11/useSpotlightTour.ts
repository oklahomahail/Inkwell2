import { useMemo } from 'react';

import { StepWelcome, StepQuickActions, StepProjectCard, StepFinish } from './steps';

interface SpotlightTour {
  start: () => void;
}

export function useSpotlightTour(): SpotlightTour {
  const steps = useMemo(() => [StepWelcome, StepQuickActions, StepProjectCard, StepFinish], []);

  return {
    start: async () => {
      // Defer tour start until DOM is ready and anchors are present
      const tryStart = async (attempt = 0) => {
        const anchors = document.querySelectorAll('[data-spotlight-id]');
        if (anchors.length === 0 && attempt < 5) {
          console.warn('No anchors found, retrying...');
          setTimeout(() => tryStart(attempt + 1), 300);
          return;
        }
        try {
          const { tourController } = await import('../components/Onboarding/hooks/TourController');
          tourController.startTour('spotlight', 'default', { steps: steps.length });
        } catch (error) {
          console.error('Failed to start spotlight tour:', error);
        }
      };
      requestAnimationFrame(() => tryStart());
    },
  };
}
