export type TourType = 'full-onboarding' | 'feature-tour' | 'contextual-help';

export interface StepProps {
  stepIndex: number;
  totalSteps: number;
  onNext: () => void;
  onPrevious: () => void;
  onComplete: () => void;
  context?: Record<string, unknown>;
}
