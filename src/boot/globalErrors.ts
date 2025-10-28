import devLog from "@/utils/devLogger";
/**
 * Global error handlers for unhandled errors and promise rejections
 * In dev: logs to console
 * In prod: can be extended to send to telemetry/analytics
 */

const isProd = import.meta.env.PROD;

/**
 * Initialize global error handlers
 */
export function initGlobalErrorHandlers() {
  // Handle uncaught JavaScript errors
  window.addEventListener('error', (e) => {
    if (!isProd) {
      console.error('[window.error]', e.error ?? e.message);
    }
    // In production, you might want to send to analytics/telemetry
    // Example: sendToTelemetry({ type: 'error', error: e.error, message: e.message });
  });

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (e) => {
    if (!isProd) {
      console.error('[unhandledrejection]', e.reason);
    }
    // In production, you might want to send to analytics/telemetry
    // Example: sendToTelemetry({ type: 'unhandledRejection', reason: e.reason });
  });

  if (!isProd) {
    devLog.debug('✅ Global error handlers initialized');
  }
}
