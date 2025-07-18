// src/hooks/useDebounce.ts
import { useState, useEffect } from 'react';

/**
 * Debounces a changing value so it only updates after the delay.
 * Useful for reducing frequent updates (e.g., auto-save, live search).
 *
 * @param value - The value to debounce
 * @param delay - Delay in ms before updating
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
