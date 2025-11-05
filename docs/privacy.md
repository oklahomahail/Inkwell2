# Privacy & Telemetry

**Inkwell** respects your privacy and is designed with user control in mind.

## What We Collect

Inkwell collects **minimal, anonymized usage data** to help us improve the application. All telemetry is:

- **PII-free**: No personal information, content, titles, or identifiable data
- **Opt-out**: You can disable telemetry at any time in Settings
- **Sample-based**: Only high-level usage metrics are tracked

### Session Metrics

- `session.start` - When the app starts (session ID only)
- `session.end` - When the app closes or tab goes to background (reason: unload/background)

**Payload example:**

```json
{
  "event": "session.start",
  "ts": 1699999999999,
  "sessionId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "sample": 1
}
```

### Export Metrics

- `export.run` - When you trigger an export (format and chapter scope only)
- `export.epub.success` - When EPUB export succeeds
- `export.epub.failure` - When EPUB export fails

**Payload example:**

```json
{
  "event": "export.run",
  "ts": 1699999999999,
  "sessionId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "format": "PDF",
  "chapters": "all",
  "sample": 1
}
```

### Autosave & Recovery Metrics

- `autosave.start`, `autosave.success`, `autosave.error` - Autosave lifecycle events
- `editor.autosave.latency` - Performance metrics (p50, p95, p99 percentiles)
- `recovery.attempt`, `recovery.success`, `recovery.failure` - Recovery system events

**Payload example:**

```json
{
  "event": "editor.autosave.latency",
  "ts": 1699999999999,
  "sessionId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "p50": 120,
  "p95": 350,
  "p99": 580,
  "sample": 1
}
```

### Onboarding Metrics

- `onboarding.welcome.created` - Welcome project created
- `onboarding.welcome.deleted` - Welcome project deleted
- `onboarding.welcome.skipped` - Welcome project skipped
- `onboarding.welcome.completed` - Welcome project completed
- `onboarding.tour.seen` - Onboarding tour viewed
- `onboarding.learn_more.clicked` - Learn more link clicked

**Payload example:**

```json
{
  "event": "onboarding.tour.seen",
  "ts": 1699999999999,
  "sessionId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "sample": 1
}
```

## What We DON'T Collect

Inkwell **never** collects:

- Your project content, chapter text, or writing
- Project titles, character names, or any creative work
- Personal information (name, email, location, IP address)
- Keystroke data or editing behavior
- File names or project structure details

## Session IDs

Each browser tab gets a unique, random session ID (UUID v4) stored in `sessionStorage`. This ID:

- Is **not** tied to your identity
- Is **not** stored server-side
- Is **cleared** when you close the tab
- Is used only to group events from the same session

## How to Opt Out

You can disable telemetry at any time:

1. Open **Settings** (gear icon in sidebar)
2. Find **Privacy & Data** section
3. Toggle **"Allow usage analytics"** to OFF

Once disabled, Inkwell will stop sending telemetry events immediately. Your preference is saved in `localStorage` and persists across sessions.

## Data Retention

- Telemetry data is stored for **90 days** maximum
- No long-term user profiles are created
- No cross-session tracking or fingerprinting
- All data is aggregated for anonymized metrics only

## Questions?

If you have questions about privacy or data collection, please:

- Open an issue: [github.com/inkwell-app/inkwell/issues](https://github.com/inkwell-app/inkwell/issues)
- Review the source code: All telemetry logic is in `src/services/telemetry.ts`

---

**Last Updated:** 2025-11-05
**Version:** v0.9.0 Beta
