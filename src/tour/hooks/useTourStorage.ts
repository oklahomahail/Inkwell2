// File: src/tour/hooks/useTourStorage.ts
// Tour state persistence with localStorage

import { useCallback } from 'react';

const STORAGE_PREFIX = 'inkwell_tour';

export function useTourStorage(tourId: string) {
  const getStorageKey = useCallback(
    (suffix: string) => {
      return `${STORAGE_PREFIX}_${tourId}_${suffix}`;
    },
    [tourId],
  );

  const saveProgress = useCallback(
    (stepIndex: number) => {
      localStorage.setItem(getStorageKey('step'), String(stepIndex));
    },
    [getStorageKey],
  );

  const getProgress = useCallback(() => {
    const saved = localStorage.getItem(getStorageKey('step'));
    return saved ? parseInt(saved, 10) : 0;
  }, [getStorageKey]);

  const markComplete = useCallback(() => {
    localStorage.setItem(getStorageKey('completed'), 'true');
  }, [getStorageKey]);

  const isCompleted = useCallback(() => {
    return localStorage.getItem(getStorageKey('completed')) === 'true';
  }, [getStorageKey]);

  const markDismissed = useCallback(() => {
    localStorage.setItem(getStorageKey('dismissed'), 'true');
  }, [getStorageKey]);

  const isDismissed = useCallback(() => {
    return localStorage.getItem(getStorageKey('dismissed')) === 'true';
  }, [getStorageKey]);

  const clearState = useCallback(() => {
    localStorage.removeItem(getStorageKey('step'));
    localStorage.removeItem(getStorageKey('completed'));
    localStorage.removeItem(getStorageKey('dismissed'));
  }, [getStorageKey]);

  return {
    saveProgress,
    getProgress,
    markComplete,
    isCompleted,
    markDismissed,
    isDismissed,
    clearState,
  };
}
