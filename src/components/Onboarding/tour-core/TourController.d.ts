export interface TourOptions {
  onComplete?: () => void;
  onDismiss?: () => void;
}

export interface StartTourOptions extends TourOptions {
  force?: boolean;
}

export interface SpotlightStep {
  title: string;
  content: string;
  target: string;
  placement?: 'top' | 'right' | 'bottom' | 'left';
}

export interface TourControllerImpl {
  start(tourId: string, options?: TourOptions): void;
  startTour(tourId: string, profileId: string, options?: StartTourOptions): Promise<boolean>;
  getSteps(tourId: string): SpotlightStep[];
  getCurrentTour(): string | null;
  dismiss(): void;
  complete(): void;
}

export const TourController: TourControllerImpl;
