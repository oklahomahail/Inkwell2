/**
 * Tour types
 * - Widened to match current usage (center placement, selectors, padding, content, tourId, beforeNavigate returning string)
 * - StartOptions includes onComplete to satisfy useSpotlightTour
 */

export type TourPlacement = 'top' | 'bottom' | 'left' | 'right' | 'auto' | 'center';

export interface TourStep {
  /** CSS selector for the element to highlight */
  target?: string;
  /** Rich/React content or plain text */
  content?: any;
  /** Padding around spotlight/overlay */
  padding?: number;
  /** Optional alternative targeting */
  selectors?: string[];
  /** Preferred placement for tooltip / card */
  placement?: TourPlacement;
  /** Hook before navigating to a route; may return a path string */
  beforeNavigate?: () => void | string | Promise<void> | Promise<string>;
  /** Some code reads a tourId off steps in storage */
  tourId?: string;

  // Allow extra ad-hoc fields used by steps and orchestrators
  [key: string]: any;
}

/** Options passed when starting a tour */
export interface StartOptions {
  force?: boolean;
  /** Called when a tour finishes (needed by useSpotlightTour) */
  onComplete?: () => void;
  [key: string]: any;
}

/** Simple progress model some storage utilities expect */
export interface TourProgress {
  tourId: string;
  stepIndex: number;
  steps?: Array<Pick<TourStep, 'tourId' | 'target'>>;
  completed?: boolean;
  [key: string]: any;
}
