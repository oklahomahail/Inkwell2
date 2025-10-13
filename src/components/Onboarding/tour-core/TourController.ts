import { spotlightSteps, SpotlightStep } from './spotlightSteps';

// Module-level state for tour control
let __starting = false;

interface StartTourOptions extends TourOptions {
  force?: boolean;
}

interface TourOptions {
  onComplete?: () => void;
  onDismiss?: () => void;
}

class TourControllerImpl {
  private currentTour: string | null = null;
  private options: TourOptions = {};
  private steps: Record<string, SpotlightStep[]> = {
    spotlight: spotlightSteps,
    simple: [],
  };

  start(tourId: string, options: TourOptions = {}) {
    if (__starting) {
      console.debug(`[TourController] Ignoring duplicate start request for ${tourId}`);
      return;
    }

    __starting = true;
    try {
      console.debug(`[TourController] Starting tour: ${tourId}`);
      this.currentTour = tourId;
      this.options = options;
      // Your existing tour start logic here
    } finally {
      // Release after a tick to swallow immediate duplicate calls
      setTimeout(() => {
        __starting = false;
      }, 0);
    }
  }

  async startTour(
    tourId: string,
    profileId: string,
    options: StartTourOptions = {},
  ): Promise<boolean> {
    // Global killswitch for profiles page
    if ((window as any).__blockToursOnProfiles) {
      console.debug(`[TourController] Tours blocked on profiles page`);
      return false;
    }

    // Dedupe guard - prevent multiple simultaneous starts
    if ((window as any).__tourActiveId) {
      console.debug(`[TourController] Tour already active: ${(window as any).__tourActiveId}`);
      return false;
    }

    const tourType = tourId as 'spotlight' | 'simple';
    if (!this.steps[tourType]) {
      console.warn(`[TourController] Unknown tour type: ${tourType}`);
      return false;
    }

    // Apply default profile if none provided
    const effectiveProfileId = profileId || 'default';

    try {
      // Set active tour ID for deduplication
      (window as any).__tourActiveId = tourType;

      // For spotlight tours, trigger the actual tour system
      if (tourType === 'spotlight') {
        // Get the steps and trigger TourProvider to show the spotlight tour
        const steps = this.steps[tourType];
        if (steps && steps.length > 0) {
          // Dispatch event for TourProvider to handle
          window.dispatchEvent(
            new CustomEvent('inkwell:tour:start-spotlight', {
              detail: { steps, profileId: effectiveProfileId, options },
            }),
          );
          this.start(tourType, options);
          return true;
        }
      } else {
        // For other tour types, use existing logic
        this.start(tourType, options);
        return true;
      }
    } catch (error) {
      console.error(`[TourController] Error starting ${tourType} tour:`, error);
      // Clear active tour ID on error
      (window as any).__tourActiveId = null;
      return false;
    }

    // Clear active tour ID if we get here without starting
    (window as any).__tourActiveId = null;
    return false;
  }

  getSteps(tourId: string): SpotlightStep[] {
    return this.steps[tourId] || [];
  }

  getCurrentTour(): string | null {
    return this.currentTour;
  }

  dismiss() {
    if (this.options.onDismiss) {
      this.options.onDismiss();
    }
    this.currentTour = null;
    // Clear active tour ID
    (window as any).__tourActiveId = null;
  }

  complete() {
    if (this.options.onComplete) {
      this.options.onComplete();
    }
    this.currentTour = null;
    // Clear active tour ID
    (window as any).__tourActiveId = null;
  }
}

export const TourController = new TourControllerImpl();
