import React from 'react';

import { CORE_TOUR_STEPS } from './TourProvider';
import { useTour } from './TourProvider';

interface TestTourComponentProps {
  onTourStart?: () => void;
}

/**
 * Component for testing tour functionality
 */
export function TestTourComponent({ onTourStart }: TestTourComponentProps) {
  const { startTour, shouldShowTourPrompt, tourState } = useTour();

  return (
    <div>
      <button
        onClick={() => {
          startTour('full-onboarding', CORE_TOUR_STEPS);
          onTourStart?.();
        }}
        data-testid="start-tour"
      >
        Start Tour
      </button>
      <button
        onClick={() => startTour('full-onboarding', CORE_TOUR_STEPS)}
        data-testid="start-tour-duplicate"
      >
        Start Duplicate Tour
      </button>
      <div data-testid="tour-active">{tourState.isActive ? 'active' : 'inactive'}</div>
      <div data-testid="should-show-prompt">{shouldShowTourPrompt() ? 'true' : 'false'}</div>
    </div>
  );
}
