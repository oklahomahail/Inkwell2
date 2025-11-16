/**
 * StrictMode Guard Utility
 *
 * Prevents duplicate execution of async operations caused by React StrictMode's
 * intentional double-mounting in development mode.
 *
 * Usage:
 * ```typescript
 * const createSectionSafe = strictModeGuard(createSection, 'createSection');
 * await createSectionSafe('Chapter 1', 'chapter');
 * ```
 *
 * @param fn - The async function to guard
 * @param label - A label for debugging (shows in console when duplicate detected)
 * @returns A wrapped version of the function that prevents concurrent execution
 */
export function strictModeGuard<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  label: string,
): T {
  let running = false;
  let lastCallTime = 0;
  const MIN_DELAY_MS = 100; // Minimum time between calls

  return (async (...args: Parameters<T>) => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallTime;

    // Skip if already running or called too recently
    if (running || timeSinceLastCall < MIN_DELAY_MS) {
      // eslint-disable-next-line no-console
      console.debug(
        `[StrictGuard:${label}] Skipping duplicate call (running=${running}, delay=${timeSinceLastCall}ms)`,
      );
      return null;
    }

    running = true;
    lastCallTime = now;

    try {
      return await fn(...args);
    } finally {
      // Reset after a short delay to allow for any pending state updates
      setTimeout(() => {
        running = false;
      }, 100);
    }
  }) as T;
}

/**
 * StrictMode Guard for Synchronous Functions
 *
 * Similar to strictModeGuard but for synchronous operations.
 */
export function strictModeGuardSync<T extends (...args: any[]) => any>(fn: T, label: string): T {
  let running = false;
  let lastCallTime = 0;
  const MIN_DELAY_MS = 100;

  return ((...args: Parameters<T>) => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallTime;

    if (running || timeSinceLastCall < MIN_DELAY_MS) {
      // eslint-disable-next-line no-console
      console.debug(
        `[StrictGuard:${label}] Skipping duplicate call (running=${running}, delay=${timeSinceLastCall}ms)`,
      );
      return null;
    }

    running = true;
    lastCallTime = now;

    try {
      return fn(...args);
    } finally {
      setTimeout(() => {
        running = false;
      }, 100);
    }
  }) as T;
}

/**
 * Create a ref-based guard for use in React components
 *
 * Usage in a component:
 * ```typescript
 * const guard = useStrictModeGuard('myOperation');
 *
 * const handleClick = async () => {
 *   if (!guard.canRun()) return;
 *
 *   try {
 *     // Your operation here
 *   } finally {
 *     guard.reset();
 *   }
 * };
 * ```
 */
export interface StrictModeGuardRef {
  canRun: () => boolean;
  reset: () => void;
  forceReset: () => void;
}

export function createStrictModeGuardRef(label: string): StrictModeGuardRef {
  let running = false;
  let lastCallTime = 0;
  const MIN_DELAY_MS = 100;

  return {
    canRun: () => {
      const now = Date.now();
      const timeSinceLastCall = now - lastCallTime;

      if (running || timeSinceLastCall < MIN_DELAY_MS) {
        // eslint-disable-next-line no-console
        console.debug(
          `[StrictGuard:${label}] Operation blocked (running=${running}, delay=${timeSinceLastCall}ms)`,
        );
        return false;
      }

      running = true;
      lastCallTime = now;
      return true;
    },
    reset: () => {
      setTimeout(() => {
        running = false;
      }, 100);
    },
    forceReset: () => {
      running = false;
    },
  };
}
