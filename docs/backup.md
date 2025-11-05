# Backup & Recovery System

**Version:** v0.9.0+
**Status:** Production-ready with shadow copies

---

## Overview

Inkwell provides multiple layers of data protection:

1. **Shadow Copies** - Automatic timestamped snapshots in IndexedDB
2. **Manual Backups** - Export entire projects as JSON
3. **Recovery System** - 3-tier fallback when primary storage fails

---

## Shadow Copies (Automatic)

### What Are Shadow Copies?

Shadow copies are automatic, timestamped snapshots of your chapters saved to IndexedDB. They run invisibly in the background without user intervention.

### When Are They Created?

- **Every chapter save** (via autosave or manual save)
- **Before destructive operations** (chapter delete, merge, split)
- **On project export** (preserves state at export time)

### Storage Location

- **Database**: `inkwell_db` (IndexedDB)
- **Object Store**: `shadow_copies`
- **Key Format**: `${projectId}_${chapterId}_${timestamp}`

### Retention Policy

| Event            | Retention                          |
| ---------------- | ---------------------------------- |
| Recent saves     | Last 10 copies per chapter         |
| Old saves        | Automatically pruned after 30 days |
| Export snapshots | Kept until manual cleanup          |

### How to Access Shadow Copies

**Via Developer Console** (for recovery):

```javascript
// List all shadow copies for a chapter
const db = await indexedDB.open('inkwell_db');
const tx = db.transaction('shadow_copies', 'readonly');
const store = tx.objectStore('shadow_copies');
const copies = await store.getAll();
console.log(copies);
```

**Note**: UI for browsing shadow copies is planned for v0.10.0.

---

## Manual Backups

### Export Project as JSON

1. Navigate to **Settings → Backup**
2. Click **"Export Project"**
3. Choose export format:
   - **Full Backup** (JSON) - All project data, chapters, metadata
   - **Chapters Only** (Markdown) - Content without metadata
4. Save file to secure location (cloud storage, external drive)

### What's Included in Full Backup?

- Project metadata (title, description, created date)
- All chapters (content, order, summaries)
- Character profiles
- World-building notes
- Plot analysis data
- Settings and preferences

### What's NOT Included?

- Shadow copies (too large)
- Telemetry data
- Export history
- UI state (sidebar collapsed, theme, etc.)

### Recommended Backup Frequency

| Usage Pattern   | Frequency                    |
| --------------- | ---------------------------- |
| Daily writing   | Weekly                       |
| Active project  | Before major edits           |
| Long-form novel | After each completed chapter |
| Completed draft | Before major revisions       |

---

## Restoring from Backup

### From JSON Backup

1. Navigate to **Settings → Backup**
2. Click **"Import Project"**
3. Select your JSON backup file
4. Review import summary (chapters, word count)
5. Click **"Import"** to restore

**Warning**: Importing will create a NEW project. It does not overwrite existing projects.

### From Shadow Copy (Developer Console)

If you need to restore a specific chapter version from shadow copies:

```javascript
// 1. Find the shadow copy
const db = await indexedDB.open('inkwell_db');
const tx = db.transaction('shadow_copies', 'readonly');
const store = tx.objectStore('shadow_copies');
const copies = await store.getAll();

// 2. Filter by chapter ID and timestamp
const targetCopy = copies.find(
  (c) => c.chapterId === 'your-chapter-id' && c.timestamp === 1234567890000,
);

// 3. Restore content manually
console.log(targetCopy.content);
// Copy content and paste into chapter editor
```

**Note**: UI-based shadow copy browsing coming in v0.10.0.

---

## 3-Tier Recovery System

When primary storage fails (IndexedDB unavailable, quota exceeded, etc.), Inkwell's recovery system automatically falls back through three tiers:

### Tier 1: Immediate Retry

- **Strategy**: Retry same operation with exponential backoff
- **Use case**: Temporary transaction conflicts
- **Telemetry**: `recovery.attempt`

### Tier 2: localStorage Fallback

- **Strategy**: Store chapter content in localStorage (5MB limit)
- **Use case**: IndexedDB temporarily unavailable
- **Telemetry**: `recovery.success` (tier: 2)

### Tier 3: Memory-Only Snapshot

- **Strategy**: Keep unsaved content in React state
- **Use case**: All storage unavailable
- **Telemetry**: `recovery.failure`
- **Warning**: Lost on page refresh

For detailed recovery behavior, see: [src/services/recoveryService.ts](../src/services/recoveryService.ts)

---

## Cloud vs Local Storage

### Inkwell is Local-First

All data is stored **locally** in your browser:

- **IndexedDB**: Primary storage (chapters, projects, metadata)
- **localStorage**: Settings, feature flags, recovery snapshots
- **sessionStorage**: Session ID, temporary UI state

### No Cloud Sync (Yet)

Inkwell does NOT currently sync to cloud services. Your data lives only on your device.

**Backup Recommendations**:

1. Export projects regularly as JSON
2. Store backups in cloud storage (Google Drive, Dropbox, iCloud)
3. Keep local copies on external drives
4. Use version control (Git) for exported Markdown files

**Future**: Cloud sync via Supabase is planned for v1.0.0.

---

## Air-Gap Test (Offline Reliability)

To verify Inkwell works without network access:

### Test Procedure

1. **Disconnect network** (airplane mode or disable WiFi)
2. **Open Inkwell** (should load from service worker cache)
3. **Create/edit chapters** (autosave should work normally)
4. **Export project** (download should trigger locally)
5. **Reconnect network** (no data loss expected)

### Expected Behavior

- ✅ App loads instantly from cache
- ✅ All features work (editing, exporting, analytics)
- ✅ Autosave persists to IndexedDB
- ✅ No network errors or degraded performance

### What Doesn't Work Offline?

- Telemetry events (queued until online, then sent via beacon)
- External API calls (if using AI assistant features)
- Supabase auth refresh (session expires after token TTL)

---

## Troubleshooting

### "Storage quota exceeded" error

**Cause**: Browser storage limit reached (typically 50-100MB).

**Fix**:

1. Export old projects and delete them
2. Clear browser cache (Settings → Privacy → Clear browsing data)
3. Request persistent storage (automatic on app boot)

### Lost unsaved work after crash

**Cause**: App closed before autosave completed.

**Fix**:

1. Check shadow copies (see "From Shadow Copy" section above)
2. Check localStorage for recovery snapshot:
   ```javascript
   localStorage.getItem('inkwell_recovery_snapshot');
   ```
3. If Tier 3 recovery was active, data may be lost (memory-only)

### Backup file won't import

**Cause**: Corrupted JSON or version incompatibility.

**Fix**:

1. Validate JSON syntax: [jsonlint.com](https://jsonlint.com)
2. Check file was exported from Inkwell (should have `version` field)
3. If from older version, migration may be needed (contact support)

### Shadow copies not being created

**Cause**: IndexedDB disabled or storage unavailable.

**Fix**:

1. Check browser settings: Enable "Cookies and site data"
2. Disable private browsing mode
3. Verify IndexedDB is supported: `'indexedDB' in window`

---

## Best Practices

### For Active Projects

- Export weekly as JSON
- Keep 3 rotating backup copies (weekly-1, weekly-2, weekly-3)
- Store in 2 locations (cloud + local)

### Before Major Changes

- Export immediately before:
  - Deleting chapters
  - Merging/splitting chapters
  - Bulk find/replace operations
  - Upgrading Inkwell to new version

### Long-Term Archival

- Export completed projects as:
  - JSON (for future import)
  - Markdown (for version control)
  - PDF/EPUB (for distribution)
- Store in durable location (not just browser storage)

---

## Related Documentation

- [Autosave System](./autosave.md) - How automatic saves work
- [Exporting Projects](./exporting.md) - Export formats and options
- [Privacy & Telemetry](./privacy.md) - What backup metrics are collected

---

## Technical Details

### Shadow Copy Schema

```typescript
interface ShadowCopy {
  id: string; // ${projectId}_${chapterId}_${timestamp}
  projectId: string;
  chapterId: string;
  timestamp: number; // Unix milliseconds
  content: string; // Chapter Markdown
  wordCount: number;
  trigger: 'autosave' | 'manual' | 'export' | 'destructive';
}
```

### Storage Keys

| Key                         | Store        | Purpose           |
| --------------------------- | ------------ | ----------------- |
| `projects`                  | IndexedDB    | Project metadata  |
| `chapters`                  | IndexedDB    | Chapter content   |
| `shadow_copies`             | IndexedDB    | Automatic backups |
| `inkwell_recovery_snapshot` | localStorage | Tier 2 recovery   |
| `inkwell_feature_flags`     | localStorage | Settings          |

---

**Last updated**: November 2025
**Tested with**: Chrome 119+, Firefox 120+, Safari 17+
