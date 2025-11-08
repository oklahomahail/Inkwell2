# Autosave System

**Version:** v0.9.0+
**Status:** Production-ready with defensive guards

---

## Overview

Inkwell's autosave system provides automatic, transparent persistence of your writing with minimal latency and maximum reliability. Every keystroke is tracked and saved to IndexedDB after a configurable debounce period.

---

## How It Works

### 1. Debounced Persistence

- **Trigger**: Content changes in the editor
- **Debounce**: 2 seconds of idle time (no typing)
- **Storage**: IndexedDB via `enhancedStorageService`
- **Telemetry**: Latency metrics tracked (p50, p95, p99)

### 2. Visual Feedback

The editor status indicator shows:

- **"Saving..."** - Write in progress
- **"Saved"** - Successfully persisted
- **"Error"** - Save failed (with retry button)

### 3. Background Sync

Autosave runs asynchronously and never blocks the editor. If a save fails, the system:

1. Logs the error to telemetry
2. Shows error state in UI
3. Allows manual retry via button

---

## Configuration

### Debounce Threshold

Default: **2000ms** (2 seconds)

Located in: `src/components/Editor/Editor.tsx`

```typescript
const AUTOSAVE_DEBOUNCE_MS = 2000;
```

**Recommendation**: Keep at 2s for optimal balance between save frequency and performance.

### Latency Monitoring

Autosave latency is tracked via telemetry:

- **p50**: Median save time
- **p95**: 95th percentile
- **p99**: 99th percentile

Events emitted: `editor.autosave.latency`

---

## Performance Characteristics

### Typical Latency (Production)

| Metric | Value      | Notes                          |
| ------ | ---------- | ------------------------------ |
| p50    | ~50-150ms  | Most saves                     |
| p95    | ~200-400ms | Slower device or large chapter |
| p99    | ~500-800ms | Heavy load or background tabs  |

### Storage Limits

- **Chapter size**: No hard limit (tested up to 100KB content)
- **Total storage**: Browser-dependent (typically 50MB+ for IndexedDB)
- **Persistence**: Request persistent storage on app boot ([src/main.tsx:34-42](../src/main.tsx#L34-L42))

---

## Error Handling

### Common Failures

| Error                   | Cause                               | Resolution                                   |
| ----------------------- | ----------------------------------- | -------------------------------------------- |
| `QuotaExceededError`    | Storage quota full                  | Clear browser data or request more quota     |
| `IndexedDB unavailable` | Private browsing or disabled        | Re-enable IndexedDB or use standard browsing |
| `Transaction abort`     | Concurrent writes                   | Automatic retry (handled internally)         |
| `Network offline`       | No connection (N/A for local-first) | N/A - autosave works offline                 |

### Recovery Tiers

If autosave fails, the **3-tier recovery system** activates:

1. **Tier 1**: Immediate retry (same method)
2. **Tier 2**: Fallback to localStorage (5MB limit)
3. **Tier 3**: Memory-only snapshot (lost on refresh)

See: [src/services/recoveryService.ts](../src/services/recoveryService.ts)

---

## Troubleshooting

### "Autosave stuck on 'Saving...'"

**Cause**: Write took longer than expected or failed silently.

**Fix**:

1. Check browser console for errors
2. Manually trigger save with Cmd/Ctrl+S
3. Verify IndexedDB is enabled (check `chrome://settings/content/cookies`)

### "Autosave error" banner persists

**Cause**: Repeated save failures (quota, permissions, or corruption).

**Fix**:

1. Click **"Retry"** button in UI
2. Refresh the page (triggers recovery)
3. Check browser storage settings
4. If persistent, export chapter as backup and recreate project

### High p99 latency (>1s)

**Cause**: Large chapters, slow device, or background throttling.

**Fix**:

1. Split large chapters into smaller sections
2. Close unnecessary browser tabs
3. Disable browser extensions that hook into storage APIs
4. Check if device is low on memory

---

## Advanced: Monitoring Autosave

### Developer Console

Enable autosave debug logs:

```javascript
localStorage.setItem('inkwell_debug_autosave', 'true');
```

Then reload the app. Console will show:

- Debounce triggers
- Save start/end timestamps
- Latency measurements
- Error details

### Telemetry Dashboard (Future)

When telemetry backend is deployed, you'll see:

- Aggregate latency percentiles
- Error rates by browser/device
- Success/failure trends

---

## Related Documentation

<!-- - [Recovery System](./recovery.md) - What happens when autosave fails -->

- [Backup System](./backup.md) - Shadow copies and manual backups
- [Privacy & Telemetry](./privacy.md) - What autosave metrics are collected

---

## Technical Details

### Implementation Files

- **Editor Integration**: [src/components/Editor/Editor.tsx](../src/components/Editor/Editor.tsx)
- **Storage Service**: [src/services/enhancedStorageService.ts](../src/services/enhancedStorageService.ts)
- **Recovery Layer**: [src/services/recoveryService.ts](../src/services/recoveryService.ts)
- **Telemetry**: [src/services/telemetry.ts](../src/services/telemetry.ts)

### Debounce Strategy

Uses `lodash.debounce` with `maxWait` option to ensure saves don't wait indefinitely:

```typescript
const debouncedSave = debounce(saveChapter, AUTOSAVE_DEBOUNCE_MS, {
  maxWait: AUTOSAVE_DEBOUNCE_MS * 2, // 4s max
});
```

This guarantees a save every 4 seconds maximum, even during continuous typing.

---

**Last updated**: November 2025
**Tested with**: Chrome 119+, Firefox 120+, Safari 17+
