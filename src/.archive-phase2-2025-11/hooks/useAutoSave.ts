import { useEffect, useRef } from 'react';

export interface UseAutoSaveOptions<T = string> {
  value: T;
  delay: number; // ms
  onSave: (latest: T) => void | Promise<void>;
  onBeforeSave?: () => void;
  onError?: (err: unknown) => void;
  flushOnUnmount?: boolean; // default true
}

/**
 * Trailing-only debounced auto-save hook with deduplication.
 *
 * Behavior:
 * - Debounces: cancels old timer on each value change
 * - Trailing-only: saves when delay expires, not on mount
 * - De-duped: skips save if value equals last successfully saved value
 * - Unmount: optionally flushes pending save (exactly once, never duplicates)
 */
export default function useAutoSave<T = string>({
  value,
  delay,
  onSave,
  onBeforeSave,
  onError,
  flushOnUnmount = true,
}: UseAutoSaveOptions<T>) {
  const timerRef = useRef<number | null>(null);
  const inFlightRef = useRef(false);
  const lastSavedRef = useRef<T | undefined>(undefined);
  const lastScheduledRef = useRef<T | undefined>(undefined);
  const unmountedRef = useRef(false);

  // Clear a timer safely
  const clearTimer = () => {
    if (timerRef.current != null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  // Schedule trailing save for current value
  useEffect(() => {
    if (unmountedRef.current) return;

    // If this value equals last saved, do nothing
    if (value === lastSavedRef.current) return;

    clearTimer();
    lastScheduledRef.current = value;

    timerRef.current = window.setTimeout(async () => {
      // guard: if already unmounted, bail
      if (unmountedRef.current) return;

      // avoid overlapping saves
      if (inFlightRef.current) return;

      inFlightRef.current = true;
      try {
        onBeforeSave?.();
        const latest = lastScheduledRef.current!;
        await onSave(latest);
        lastSavedRef.current = latest;
      } catch (e) {
        onError?.(e);
      } finally {
        inFlightRef.current = false;
      }
    }, delay) as unknown as number;

    // cancel pending timer if value changes again before delay
    return clearTimer;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, delay, onSave]);

  // Unmount: flush once or cancel
  useEffect(() => {
    return () => {
      unmountedRef.current = true;
      if (!flushOnUnmount) {
        clearTimer();
        return;
      }
      const pending = timerRef.current != null;
      clearTimer();
      if (pending && !inFlightRef.current) {
        // final trailing flush for last scheduled value
        const latest = lastScheduledRef.current;
        if (latest != null && latest !== lastSavedRef.current) {
          // fire and forget; this is unmount path
          try {
            onBeforeSave?.();
            void Promise.resolve(onSave(latest))
              .then(() => {
                lastSavedRef.current = latest;
              })
              .catch((e) => onError?.(e));
          } catch (e) {
            onError?.(e);
          }
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flushOnUnmount, onSave]);
}
