import React from 'react';

import { CORE_TOUR_STEPS } from './TourProvider';
import { useTour } from './TourProvider';

interface TestTourComponentProps {
  onTourStart?: () => void;
}

/**
 * Component for testing tour functionality
 */
export function TestTourComponent({
  onTourStart,
  tourType = 'full-onboarding' as const,
}: TestTourComponentProps & { tourType?: 'full-onboarding' | 'feature-tour' | 'contextual-help' }) {
  const { startTour, shouldShowTourPrompt, tourState } = useTour();

  // Create handlers to handle the async calls
  const handleTourStart = async () => {
    await startTour(tourType, CORE_TOUR_STEPS);
    onTourStart?.();
  };

  const handleDuplicateStart = () => {
    void startTour(tourType, CORE_TOUR_STEPS);
  };

  return (
    <div>
      <button onClick={handleTourStart} data-testid="start-tour">
        Start Tour
      </button>
      <button onClick={handleDuplicateStart} data-testid="start-tour-duplicate">
        Start Duplicate Tour
      </button>
      <div data-testid="tour-active">{tourState.isActive ? 'active' : 'inactive'}</div>
      <div data-testid="should-show-prompt">{shouldShowTourPrompt() ? 'true' : 'false'}</div>
    </div>
  );
}
