import { useMemo } from 'react';

import { StepWelcome, StepQuickActions, StepProjectCard, StepFinish } from './steps';

interface SpotlightTour {
  start: () => void;
}

export function useSpotlightTour(): SpotlightTour {
  const steps = useMemo(() => [StepWelcome, StepQuickActions, StepProjectCard, StepFinish], []);

  return {
    start: () => {
      try {
        // Use the TourController system instead of looking for window.__INKWELL_TOUR__
        import('../components/Onboarding/tour-core/TourController').then(({ TourController }) => {
          TourController.startTour('spotlight', 'default', {
            onComplete: () => {
              console.log('Spotlight tour completed');
            },
            onDismiss: () => {
              console.log('Spotlight tour dismissed');
            },
          });
        });
      } catch (error) {
        console.error('Failed to start spotlight tour:', error);
      }
    },
  };
}
