export type TelemetryEvent =
  | 'autosave.start'
  | 'autosave.success'
  | 'autosave.error'
  | 'editor.autosave.latency'
  | 'recovery.attempt'
  | 'recovery.success'
  | 'recovery.failure'
  | 'onboarding.welcome.created'
  | 'onboarding.welcome.deleted'
  | 'onboarding.welcome.skipped'
  | 'onboarding.welcome.completed'
  | 'onboarding.tour.seen'
  | 'onboarding.learn_more.clicked'
  | 'telemetry.opt_out_changed';

// ============================================
// Telemetry Opt-Out
// ============================================

const TELEMETRY_DISABLED_KEY = 'inkwell_telemetry_disabled';

/**
 * Check if telemetry is enabled
 * Telemetry is enabled by default unless explicitly disabled
 */
export function isTelemetryEnabled(): boolean {
  try {
    return localStorage.getItem(TELEMETRY_DISABLED_KEY) !== 'true';
  } catch {
    // If localStorage is unavailable, default to enabled
    return true;
  }
}

/**
 * Enable or disable telemetry
 * Changes take effect immediately
 */
export function setTelemetryEnabled(enabled: boolean): void {
  try {
    if (enabled) {
      localStorage.removeItem(TELEMETRY_DISABLED_KEY);
    } else {
      localStorage.setItem(TELEMETRY_DISABLED_KEY, 'true');
    }

    // Emit opt-out event (only if enabling telemetry, since we can't track when disabling)
    if (enabled) {
      track('telemetry.opt_out_changed', { enabled: true, sample: 1 });
    }
  } catch (error) {
    console.warn('[Telemetry] Failed to update opt-out preference:', error);
  }
}

/**
 * Track a telemetry event
 * Respects user's opt-out preference
 */
export function track(event: TelemetryEvent, payload: Record<string, unknown> = {}) {
  // Respect opt-out (except for the opt-out event itself)
  if (!isTelemetryEnabled() && event !== 'telemetry.opt_out_changed') {
    return;
  }

  try {
    const body = JSON.stringify({ event, ts: Date.now(), payload });
    navigator.sendBeacon?.('/telemetry', new Blob([body], { type: 'application/json' })) ||
      fetch('/telemetry', { method: 'POST', body, keepalive: true }).catch(() => {});
  } catch {
    // Silently fail telemetry errors
  }
}
