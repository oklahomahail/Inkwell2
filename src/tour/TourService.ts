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

    this.stop();
  }

  /**
   * Complete the tour successfully
   */
  private complete(): void {
    if (!this.state.isRunning) return;

    tourAnalytics.completed(this.state.tourId!, {
      totalSteps: this.state.totalSteps,
    });

    if (this.config?.onComplete) {
      this.config.onComplete();
    }

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
}

// Export singleton instance
export const tourService = new TourService();
