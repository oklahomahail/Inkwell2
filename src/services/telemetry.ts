// Lightweight telemetry stub — safe for browser builds and CI.

export type TelemetryEvent =
  | 'autosave.start'
  | 'autosave.success'
  | 'autosave.error'
  | 'backup.start'
  | 'backup.success'
  | 'backup.error'
  | 'restore.start'
  | 'restore.success'
  | 'restore.error';

export function track(event: TelemetryEvent, payload: Record<string, unknown> = {}) {
  try {
    const body = JSON.stringify({ event, ts: Date.now(), payload });
    // Prefer sendBeacon to avoid blocking
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/telemetry', new Blob([body], { type: 'application/json' }));
    } else {
      fetch('/telemetry', { method: 'POST', body, keepalive: true }).catch(() => {});
    }
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.debug(`[telemetry] ${event}`, payload);
    }
  } catch (err) {
    if (import.meta.env.DEV) console.warn('[telemetry] failed', err);
  }
}
