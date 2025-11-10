export type TelemetryEvent =
  | 'autosave.start'
  | 'autosave.success'
  | 'autosave.error'
  | 'editor.autosave.latency'
  | 'recovery.attempt'
  | 'recovery.success'
  | 'recovery.failure'
  | 'onboarding.started'
  | 'onboarding.completed'
  | 'onboarding.failed'
  | 'onboarding.skipped'
  | 'onboarding.panel_viewed'
  | 'onboarding.welcome.created'
  | 'onboarding.welcome.deleted'
  | 'onboarding.welcome.skipped'
  | 'onboarding.welcome.completed'
  | 'onboarding.tour.seen'
  | 'onboarding.learn_more.clicked'
  | 'telemetry.opt_out_changed'
  | 'export.epub.success'
  | 'export.epub.failure'
  | 'session.start'
  | 'session.end'
  | 'export.run';

// ============================================
// Session Management
// ============================================

const SESSION_KEY = 'inkwell_session_id';

/**
 * Get or create a session ID for this browser tab
 * Session ID is stored in sessionStorage (clears on tab close)
 */
function getSessionId(): string {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    // If sessionStorage unavailable, generate ephemeral ID
    return crypto.randomUUID();
  }
}

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
    const body = JSON.stringify({
      event,
      ts: Date.now(),
      sessionId: getSessionId(),
      ...payload,
    });
    navigator.sendBeacon?.('/api/telemetry', new Blob([body], { type: 'application/json' })) ||
      fetch('/api/telemetry', { method: 'POST', body, keepalive: true }).catch(() => {});
  } catch {
    // Silently fail telemetry errors
  }
}

// ============================================
// Session Events
// ============================================

/**
 * Emit session.start event on app boot
 * Should be called once per page load
 */
export function emitSessionStart(): void {
  track('session.start', { sample: 1 });
}

/**
 * Emit session.end event on app exit
 * @param reason - Why the session is ending (unload, background)
 */
export function emitSessionEnd(reason: 'unload' | 'background'): void {
  track('session.end', { reason, sample: 1 });
}

// ============================================
// Export Events
// ============================================

export type ExportFormat = 'PDF' | 'DOCX' | 'EPUB' | 'MARKDOWN' | 'TXT';
export type ExportChapters = 'all' | 'subset';

/**
 * Emit export.run event when user triggers any export
 * @param format - Export format (PDF, DOCX, EPUB, etc.)
 * @param chapters - Whether all chapters or a subset were exported
 */
export function emitExportRun(format: ExportFormat, chapters: ExportChapters): void {
  track('export.run', { format, chapters, sample: 1 });
}
