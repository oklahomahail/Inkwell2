export type TelemetryEvent =
  | 'autosave.start'
  | 'autosave.success'
  | 'autosave.error'
  | 'editor.autosave.latency';

export function track(event: TelemetryEvent, payload: Record<string, unknown> = {}) {
  try {
    const body = JSON.stringify({ event, ts: Date.now(), payload });
    navigator.sendBeacon?.('/telemetry', new Blob([body], { type: 'application/json' })) ||
      fetch('/telemetry', { method: 'POST', body, keepalive: true }).catch(() => {});
  } catch {}
}
