# Inkwell Telemetry and Privacy

_Last updated: November 2025_
_Version: v0.9.1_

Inkwell is built with privacy and transparency at its core. This document explains what telemetry data is collected, how it's used, and how you can opt out.

---

## 1. Why We Collect Telemetry

Telemetry helps us measure performance, reliability, and feature usage so we can identify bugs and improve user experience.
It never includes your writing or identifiable data.

---

## 2. What We Collect

All telemetry data is **anonymous** and **sample-based** (typically `sample: 1`, meaning 1% of sessions).

| Event                                                        | Purpose                    | Data Collected                                                           |
| ------------------------------------------------------------ | -------------------------- | ------------------------------------------------------------------------ |
| `session.start`                                              | App opened                 | timestamp, sessionId                                                     |
| `session.end`                                                | App closed or backgrounded | timestamp, reason (`unload` or `background`)                             |
| `export.run`                                                 | Export initiated           | export format (`PDF`, `DOCX`, `EPUB`), chapter scope (`all` or `subset`) |
| `autosave.latency`                                           | Internal autosave timing   | latency values only                                                      |
| `recovery.attempt` / `recovery.success` / `recovery.failure` | Error recovery monitoring  | timestamps, tier, success/failure flag                                   |
| `export.epub.success` / `export.epub.failure`                | EPUB export diagnostics    | timestamps only                                                          |
| `onboarding.learn_more.clicked`                              | Onboarding engagement      | timestamp only                                                           |

---

## 3. What We Never Collect

We **never** record, transmit, or log:

- Your project names, chapter titles, or written content
- Any personal information such as name, email, or IP
- Encryption keys or passphrases
- File uploads, exports, or backups
- Browser or system identifiers beyond anonymous session IDs

All events are sent using the Beacon API for minimal impact and no tracking cookies.

---

## 4. Where Data Goes

Telemetry data is transmitted securely to Inkwell's analytics endpoint.
It is stored only in aggregate form and used for internal performance monitoring.

---

## 5. Opting Out

You can disable telemetry at any time.

### In-App:

1. Open **Settings → Privacy**.
2. Uncheck **Enable anonymous telemetry**.
3. Restart the app (optional).

### Manual Override:

Telemetry is controlled by the key `inkwell_telemetry_disabled` in your browser's `localStorage`.
Setting this value to `true` disables all telemetry events.

```js
localStorage.setItem('inkwell_telemetry_disabled', 'true');
```

---

## 6. Technical Details

- Session IDs are ephemeral and regenerated at every app load.
- Events are transmitted via `navigator.sendBeacon()` or a non-blocking fetch.
- Sample rates may vary during beta testing to assess system stability.
- Opt-out preference is always honored, except for diagnostic opt-out confirmation events (`telemetry.opt_out_changed`).

---

## 7. Transparency and Trust

You can view all current event definitions in:

```
src/services/telemetry.ts
```

Developers and testers are encouraged to inspect outbound telemetry calls in the browser console or network tab.

---

## 8. Contact

For questions about data privacy or telemetry design, email:
**[privacy@writewithinkwell.com](mailto:privacy@writewithinkwell.com)**

---

Inkwell is committed to ensuring that your creativity stays private, your words remain yours, and telemetry only ever helps make your writing experience faster, safer, and more reliable.
