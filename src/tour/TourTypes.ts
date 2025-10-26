/**
 * Spotlight Tour Types
 * Defines step structure and tour state for the onboarding tour
 */

export interface SpotlightStep {
  /** Stable selector for the target element */
  target: string;
  /** Title of the step */
  title: string;
  /** Description/content of the step */
  content: string;
  /** Optional: Placement of the popover relative to target */
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  /** Optional: Whether to disable interaction with the page while step is active */
  disableInteraction?: boolean;
  /** Optional: Callback to run before showing this step */
  beforeShow?: () => void | Promise<void>;
  /** Optional: Callback to run after this step is completed */
  onNext?: () => void | Promise<void>;
}

export interface TourConfig {
  /** Unique identifier for the tour */
  id: string;
  /** Tour steps */
  steps: SpotlightStep[];
  /** Whether to show progress (e.g., "Step 2 of 5") */
  showProgress?: boolean;
  /** Whether to allow skipping the tour */
  allowSkip?: boolean;
  /** Callback when tour completes */
  onComplete?: () => void;
  /** Callback when tour is skipped */
  onSkip?: () => void;
}

export interface TourState {
  /** Whether a tour is currently active */
  isRunning: boolean;
  /** Current step index (0-based) */
  currentStep: number;
  /** Total number of steps */
  totalSteps: number;
  /** Current tour ID */
  tourId: string | null;
}
