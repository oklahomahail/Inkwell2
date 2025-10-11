import React from 'react';

import StepComplete from './steps/StepComplete';
import StepFeedback from './steps/StepFeedback';
import StepTour from './steps/StepTour';
import StepWelcome from './steps/StepWelcome';

import type { TourType } from './steps/Step.types';

export type StepComponent = React.ComponentType<any>;

export function loadTourPreset(tour: TourType): StepComponent[] {
  switch (tour) {
    case 'full-onboarding':
      return [StepWelcome, StepTour, StepFeedback, StepComplete];
    case 'feature-tour':
      return [StepWelcome, StepTour, StepComplete];
    case 'contextual-help':
      return [StepWelcome, StepComplete];
    default:
      return [StepWelcome, StepComplete];
  }
}
