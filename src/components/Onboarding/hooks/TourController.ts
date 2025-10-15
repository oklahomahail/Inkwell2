export interface StartOptions {
  steps?: number;
  skipStorage?: boolean;
  forceRestart?: boolean;
}

export interface TourState {
  tourId: string;
  variant?: string;
  startedAt: number;
  stepsCount: number;
}

class TourController {
  private activeTour: TourState | null = null;

  startTour(id: string, variant?: string, opts: StartOptions = {}): boolean {
    if (this.isTourRunning(id) && !opts.forceRestart) {
      return false;
    }

    const tourState: TourState = {
      tourId: id,
      variant,
      startedAt: Date.now(),
      stepsCount: opts.steps || 1,
    };

    this.activeTour = tourState;

    if (!opts.skipStorage) {
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(
            `tour:${id}:progress`,
            JSON.stringify({
              stepIndex: 0,
              ...tourState,
            }),
          );
        }
      } catch {
        // ignore storage errors
      }
    }

    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new CustomEvent('tour:start', { detail: tourState }));
    }
    return true;
  }

  isTourRunning(id?: string): boolean {
    if (!this.activeTour) {
      return false;
    }
    return id ? this.activeTour.tourId === id : true;
  }

  endTour(id: string): void {
    if (this.activeTour?.tourId === id) {
      this.activeTour = null;
    }
  }
}

// Singleton instance
export const tourController = new TourController();

export function startTour(id: string, variant?: string, opts?: StartOptions): boolean {
  return tourController.startTour(id, variant, opts);
}

export function isTourRunning(id?: string): boolean {
  return tourController.isTourRunning(id);
}
