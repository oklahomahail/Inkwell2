import devLog from "src/utils/devLogger";
// src/utils/debugOnboardingGate.ts
// Debug utility to test the onboarding gate system in development

/**
 * Debug utilities for testing the onboarding gate system.
 * Only available in development mode.
 */

const LS_KEYS = {
  gate: 'inkwell.onboarding.gate',
  sessionTour: 'inkwell.onboarding.session.tourActive',
};

export const debugOnboardingGate = {
  /**
   * Get current gate status
   */
  getStatus() {
    if (!import.meta.env.DEV) return null;

    try {
      const gate = JSON.parse(localStorage.getItem(LS_KEYS.gate) || '{"status":"pending"}');
      const tourActive = sessionStorage.getItem(LS_KEYS.sessionTour) === '1';

      return {
        gate,
        tourActive,
        shouldShow:
          !tourActive &&
          gate.status === 'pending' &&
          !(gate.status === 'snoozed' && gate.snoozeUntil && Date.now() < gate.snoozeUntil),
      };
    } catch {
      return { error: 'Failed to read gate status' };
    }
  },

  /**
   * Reset gate to initial state (pending)
   */
  reset() {
    if (!import.meta.env.DEV) return;

    localStorage.setItem(LS_KEYS.gate, JSON.stringify({ status: 'pending' }));
    sessionStorage.removeItem(LS_KEYS.sessionTour);
    devLog.debug('🔄 Onboarding gate reset to pending');
  },

  /**
   * Force dismiss the gate
   */
  dismiss() {
    if (!import.meta.env.DEV) return;

    localStorage.setItem(LS_KEYS.gate, JSON.stringify({ status: 'dismissed' }));
    sessionStorage.removeItem(LS_KEYS.sessionTour);
    devLog.debug('❌ Onboarding gate dismissed');
  },

  /**
   * Mark onboarding as completed
   */
  complete() {
    if (!import.meta.env.DEV) return;

    localStorage.setItem(LS_KEYS.gate, JSON.stringify({ status: 'completed' }));
    sessionStorage.removeItem(LS_KEYS.sessionTour);
    devLog.debug('✅ Onboarding gate marked as completed');
  },

  /**
   * Simulate tour active state
   */
  setTourActive(active: boolean) {
    if (!import.meta.env.DEV) return;

    if (active) {
      sessionStorage.setItem(LS_KEYS.sessionTour, '1');
      devLog.debug('🎯 Tour active: true');
    } else {
      sessionStorage.removeItem(LS_KEYS.sessionTour);
      devLog.debug('🎯 Tour active: false');
    }
  },

  /**
   * Snooze for X minutes (for testing)
   */
  snooze(minutes: number = 1) {
    if (!import.meta.env.DEV) return;

    const snoozeUntil = Date.now() + minutes * 60 * 1000;
    localStorage.setItem(
      LS_KEYS.gate,
      JSON.stringify({
        status: 'snoozed',
        snoozeUntil,
      }),
    );
    devLog.debug(`😴 Gate snoozed for ${minutes} minute(s)`);
  },

  /**
   * Log current state to console
   */
  log() {
    if (!import.meta.env.DEV) return;

    const status = this.getStatus();
    devLog.debug('🚪 Onboarding Gate Status:', status);
  },
};

// Expose to window in development
if (import.meta.env.DEV && typeof window !== 'undefined') {
  (window as any).debugOnboardingGate = debugOnboardingGate;
  devLog.debug('🔧 Debug utilities available: window.debugOnboardingGate');
}
