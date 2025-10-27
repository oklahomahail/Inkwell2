/**
 * Tour Service
 * Manages tour state and lifecycle
 */

import { tourAnalytics } from './adapters/analyticsAdapter';

import type { TourConfig, TourState } from './TourTypes';

class TourService {
  private state: TourState = {
    isRunning: false,
    currentStep: 0,
    totalSteps: 0,
    tourId: null,
  };

  private config: TourConfig | null = null;
  private listeners: Set<(state: TourState) => void> = new Set();
  private options: { skipMissingAnchors?: boolean; spotlightPadding?: number } = {};
  private escListener?: (e: KeyboardEvent) => void;
  private startTime?: number;

  constructor() {
    // Listen for route changes to refresh anchors
    if (typeof window !== 'undefined') {
      window.addEventListener('tour:refresh', this.refreshAnchors.bind(this));
    }
  }

  /**
   * Configure tour service options
   */
  configure(opts: { skipMissingAnchors?: boolean; spotlightPadding?: number }): void {
    this.options = { ...this.options, ...opts };
  }

  /**
   * Get current configuration options
   */
  getOptions() {
    return { ...this.options };
  }

  /**
   * Subscribe to tour state changes
   */
  subscribe(listener: (state: TourState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify all listeners of state change
   */
  private notify(): void {
    this.listeners.forEach((listener) => listener(this.state));
  }

  /**
   * Get current tour state
   */
  getState(): TourState {
    return { ...this.state };
  }

  /**
   * Check if a tour is currently running
   */
  isRunning(): boolean {
    return this.state.isRunning;
  }

  /**
   * Start a tour with the given configuration
   */
  async start(config: TourConfig, opts?: { forceRestart?: boolean }): Promise<void> {
    if (this.state.isRunning && !opts?.forceRestart) {
      console.warn('[TourService] Tour already running, stopping current tour');
      return;
    }

    if (this.state.isRunning) {
      this.stop();
    }

    this.config = config;
    this.state = {
      isRunning: true,
      currentStep: 0,
      totalSteps: config.steps.length,
      tourId: config.id,
    };

    // Set up ESC key listener
    this.startTime = Date.now();
    this.escListener = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        this.skip();
      }
    };
    window.addEventListener('keydown', this.escListener, { passive: false });

    this.notify();

    // Track tour start using the analytics adapter
    tourAnalytics.started(config.id, {
      totalSteps: config.steps.length,
      showProgress: config.showProgress,
      allowSkip: config.allowSkip,
    });
  }

  /**
   * Go to the next step
   */
  async next(): Promise<void> {
    if (!this.config || !this.state.isRunning) return;

    const currentStep = this.config.steps[this.state.currentStep];

    // Run onNext callback if defined
    if (currentStep?.onNext) {
      await currentStep.onNext();
    }

    // Check if we're at the last step
    if (this.state.currentStep >= this.state.totalSteps - 1) {
      this.complete();
      return;
    }

    // Move to next step
    this.state.currentStep++;
    this.notify();

    // Track step progress using analytics adapter
    tourAnalytics.stepViewed(this.state.tourId!, this.state.currentStep, currentStep?.title);
  }

  /**
   * Go to the previous step
   */
  prev(): void {
    if (!this.state.isRunning || this.state.currentStep === 0) return;

    this.state.currentStep--;
    this.notify();
  }

  /**
   * Skip/cancel the tour
   */
  skip(): void {
    if (!this.state.isRunning) return;

    tourAnalytics.skipped(this.state.tourId!, this.state.currentStep, {
      totalSteps: this.state.totalSteps,
    });

    if (this.config?.onSkip) {
      this.config.onSkip();
    }

    this.teardown();
  }

  /**
   * Complete the tour successfully
   */
  private complete(): void {
    if (!this.state.isRunning) return;

    const durationMs = this.startTime ? Date.now() - this.startTime : 0;

    tourAnalytics.completed(this.state.tourId!, {
      totalSteps: this.state.totalSteps,
      durationMs,
    });

    if (this.config?.onComplete) {
      this.config.onComplete();
    }

    this.teardown();
  }

  /**
   * Teardown tour listeners and cleanup
   */
  private teardown(): void {
    if (this.escListener) {
      window.removeEventListener('keydown', this.escListener);
      this.escListener = undefined;
    }
    this.startTime = undefined;
    this.stop();
  }

  /**
   * Stop the tour and reset state
   */
  stop(): void {
    this.state = {
      isRunning: false,
      currentStep: 0,
      totalSteps: 0,
      tourId: null,
    };
    this.config = null;
    this.notify();
  }

  /**
   * Refresh tour anchors after route changes or DOM updates
   * This re-resolves all step targets to ensure they're still valid
   */
  refreshAnchors(): void {
    if (!this.state.isRunning || !this.config) return;

    // Notify listeners so they can re-render with new anchor positions
    this.notify();

    if (process.env.NODE_ENV === 'development') {
      console.log('[TourService] Refreshing tour anchors for step', this.state.currentStep);
    }
  }
}

// Export singleton instance
export const tourService = new TourService();

// Expose TourService globally in development for debugging
if (import.meta.env.DEV) {
  (window as typeof window & { inkwellTour?: TourService }).inkwellTour = tourService;
}
