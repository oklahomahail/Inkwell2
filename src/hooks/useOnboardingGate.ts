// src/hooks/useOnboardingGate.ts
import { useCallback } from 'react';

type Status = 'never' | 'pending' | 'snoozed' | 'dismissed' | 'completed';

interface Gate {
  status: Status;
  snoozeUntil?: number; // epoch ms
}

const LS = {
  gate: 'inkwell.onboarding.gate',
  sessionTour: 'inkwell.onboarding.session.tourActive',
};

/**
 * Onboarding gate system to prevent re-entrant welcome modal issues.
 *
 * Provides a single source of truth for onboarding state with:
 * - Persistent gate status in localStorage
 * - Session-scoped tour active tracking
 * - Guard logic to prevent modal auto-opening during tours
 */
export function _useOnboardingGate() {
  const readGate = useCallback((): Gate => {
    try {
      const stored = localStorage.getItem(LS.gate);
      return stored ? JSON.parse(stored) : { status: 'pending' };
    } catch {
      return { status: 'pending' };
    }
  }, []);

  const writeGate = useCallback((gate: Gate) => {
    try {
      localStorage.setItem(LS.gate, JSON.stringify(gate));
    } catch (error) {
      console.warn('Failed to save onboarding gate:', error);
    }
  }, []);

  const setTourActive = useCallback((value: boolean) => {
    try {
      if (value) {
        sessionStorage.setItem(LS.sessionTour, '1');
      } else {
        sessionStorage.removeItem(LS.sessionTour);
      }
    } catch (error) {
      console.warn('Failed to set tour active state:', error);
    }
  }, []);

  const getTourActive = useCallback((): boolean => {
    try {
      return sessionStorage.getItem(LS.sessionTour) === '1';
    } catch {
      return false;
    }
  }, []);

  const shouldShowModal = useCallback((): boolean => {
    // Hard guard: never show modal while a tour is running
    if (getTourActive()) {
      return false;
    }

    const gate = readGate();

    // Don't show if permanently dismissed or completed
    if (gate.status === 'dismissed' || gate.status === 'completed') {
      return false;
    }

    // Don't show if snoozed and snooze period is still active
    if (gate.status === 'snoozed' && gate.snoozeUntil && Date.now() < gate.snoozeUntil) {
      return false;
    }

    // Show for first-time users (status === "pending")
    return gate.status === 'pending';
  }, [readGate, getTourActive]);

  const snoozeModal = useCallback(
    (hours: number = 24) => {
      const snoozeUntil = Date.now() + hours * 60 * 60 * 1000;
      writeGate({ status: 'snoozed', snoozeUntil });
    },
    [writeGate],
  );

  const dismissModal = useCallback(() => {
    writeGate({ status: 'dismissed' });
  }, [writeGate]);

  const completeOnboarding = useCallback(() => {
    writeGate({ status: 'completed' });
  }, [writeGate]);

  const resetGate = useCallback(() => {
    writeGate({ status: 'pending' });
    setTourActive(false);
  }, [writeGate, setTourActive]);

  const getGateStatus = useCallback((): Status => {
    return readGate().status;
  }, [readGate]);

  return {
    // Core gate operations
    readGate,
    writeGate,
    shouldShowModal,

    // Tour state management
    setTourActive,
    getTourActive,

    // Convenience methods
    snoozeModal,
    dismissModal,
    completeOnboarding,
    resetGate,
    getGateStatus,
  };
}

export const useOnboardingGate = _useOnboardingGate;
export type { Gate, Status };
