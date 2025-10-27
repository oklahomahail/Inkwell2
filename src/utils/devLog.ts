/**
 * Development-only logging utilities
 * Automatically stripped in production builds
 */

const isDev = !import.meta.env.PROD;

/**
 * Log to console only in development mode
 */
export const devLog = (...args: unknown[]) => {
  if (isDev) {
    console.log(...args);
  }
};

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
