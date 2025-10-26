/**
 * Tour Service
 * Manages tour state and lifecycle
 */

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
  async start(config: TourConfig): Promise<void> {
    if (this.state.isRunning) {
      console.warn('[TourService] Tour already running, stopping current tour');
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

    // Track tour start
    this.trackEvent('tour_started', { tour_id: config.id });
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

    // Track step progress
    this.trackEvent('tour_step_completed', {
      tour_id: this.state.tourId,
      step_index: this.state.currentStep - 1,
      step_title: currentStep?.title,
    });
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

    this.trackEvent('tour_skipped', {
      tour_id: this.state.tourId,
      step_index: this.state.currentStep,
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

    this.trackEvent('tour_completed', {
      tour_id: this.state.tourId,
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

  /**
   * Track analytics event
   */
  private trackEvent(eventName: string, params?: Record<string, any>): void {
    try {
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', eventName, params);
      }
    } catch (error) {
      console.warn('[TourService] Failed to track event:', error);
    }
  }
}

// Export singleton instance
export const tourService = new TourService();
