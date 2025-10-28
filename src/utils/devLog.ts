/* eslint-disable no-console */
/**
 * Development-only logging utilities
 * Automatically stripped in production builds
 */

const isDev = !import.meta.env.PROD;

/**
 * Development logging object with methods for different log levels
 */
const devLog = {
  debug: (...args: unknown[]) => {
    if (isDev) {
      console.debug(...args);
    }
  },
  warn: (...args: unknown[]) => {
    if (isDev) {
      console.warn(...args);
    }
  },
  error: (...args: unknown[]) => {
    console.error(...args);
    // In production, you might want to send to telemetry
    // if (import.meta.env.PROD) { sendToTelemetry(...args); }
  },
  log: (...args: unknown[]) => {
    if (isDev) {
      devLog.debug(...args);
    }
  },
  trace: (...args: unknown[]) => {
    if (isDev) {
      console.trace(...args);
    }
  },
};

// Default export for convenient usage
export default devLog;

// Named exports for backwards compatibility
export const { debug, warn, error, log, trace } = devLog;

/**
 * Warn to console only in development mode
 */
export const devWarn = (...args: unknown[]) => {
  if (isDev) {
    console.warn(...args);
  }
};

/**
 * Debug to console only in development mode
 */
export const devDebug = (...args: unknown[]) => {
  if (isDev) {
    console.debug(...args);
  }
};

/**
 * Trace to console only in development mode
 */
export const devTrace = (...args: unknown[]) => {
  if (isDev) {
    console.trace(...args);
  }
};

/**
 * Error logging (always logged, but can be enhanced in prod)
 */
export const devError = (...args: unknown[]) => {
  console.error(...args);
  // In production, you might want to send to telemetry
  // if (import.meta.env.PROD) { sendToTelemetry(...args); }
};
