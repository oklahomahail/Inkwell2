# IndexedDB DevTools - Quick Reference

Press **Ctrl+Alt+D** (or **Cmd+Alt+D** on Mac) in development mode to access the DevTools panel.

## Panel Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│ IndexedDB DevTools (Inkwell)                [Refresh] [Export] [×] │
│ Schema introspection, record counts, export snapshot                │
├─────────────────────────────────────────────────────────────────────┤
│ [Project ID: _______________] [Reset Project]     [Reset All DBs]  │
├─────────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ inkwell_v1 (expected v3, actual 3)                   [OK]       │ │
│ ├─────────────────────────────────────────────────────────────────┤ │
│ │ Store          Count    Status    Error                         │ │
│ │ projects         12     exists                                  │ │
│ │ settings          5     exists                                  │ │
│ │ sessions          3     exists                                  │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ inkwell_chapters (expected v1, actual 1)   [Issues detected]   │ │
│ ├─────────────────────────────────────────────────────────────────┤ │
│ │ Store          Count    Status    Error                         │ │
│ │ chapter_meta     45     exists                                  │ │
│ │ chapter_docs     45     exists                                  │ │
│ ├─────────────────────────────────────────────────────────────────┤ │
│ │ ⚠️ Unexpected stores detected (not in schema):                  │ │
│ │   • old_chapters                                                │ │
│ │   • legacy_sections                                             │ │
│ │ These stores exist but aren't defined in the schema registry.  │ │
│ └─────────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────┤
│ Total: 4 databases, 7 stores              3 / 4 databases healthy  │
└─────────────────────────────────────────────────────────────────────┘
```

## Features

### 1. Schema Introspection

- **Real-time inspection** - Shows current state of all IndexedDB databases
- **Version checking** - Compares expected vs actual database versions
- **Store verification** - Checks if all required stores exist
- **Record counts** - Shows how many records in each store
- **Health indicators** - Visual badges for OK/Issues status
- **Unexpected stores** - Detects stores not defined in schema (leftovers from migrations)

### 2. Data Export

- **One-click export** - Click "Export DB JSON" button
- **Timestamped files** - Downloads as `inkwell-db-export-2024-01-20T12-30-45.json`
- **Complete snapshot** - Includes all databases, stores, and records
- **Metadata included** - Timestamps, versions, and database names

### 3. Local Data Reset

- **Project-specific reset:**
  - Enter project ID in the input field
  - Click "Reset Project" button
  - Deletes all local data for that project (chapters, metadata, etc.)
  - Automatically refreshes introspection
  - Shows summary: "Reset local data for project X. Records deleted: 42."

- **Nuclear reset:**
  - Click "Reset All DBs" button
  - Confirmation dialog: "DANGER: This will delete ALL local data..."
  - Deletes all IndexedDB databases
  - Reloads the page automatically
  - Use only when you need a complete clean slate

## Safety Notes

### What Gets Reset

**Project Reset** deletes:

- All chapters for the project (`inkwell_chapters.chapter_meta`, `inkwell_chapters.chapter_docs`)
- The project record itself (`inkwell-projects.projects`, `inkwell_v1.projects`)
- Any other stores with matching `projectId` field

**Nuclear Reset** deletes:

- `inkwell_v1` - Main database
- `inkwell_chapters` - Chapters database
- `inkwell-projects` - Projects database
- `inkwell-sync-queue` - Sync queue database

### What's NOT Affected

⚠️ **IMPORTANT:** Reset functions ONLY affect local browser storage.

**NOT RESET:**

- ✅ Supabase data (remote database)
- ✅ Other users' data
- ✅ Server-side storage
- ✅ Authentication state
- ✅ User preferences (localStorage)

After reset, you can re-sync from Supabase to restore data.

## Common Use Cases

### 1. Testing Clean State

```typescript
// Reset specific project for testing
await resetLocalDataForProject('my-test-project-id');
// Now create fresh test data
```

### 2. Debugging Schema Issues

1. Press Ctrl+Alt+D to open DevTools
2. Click "Refresh" to inspect current schema
3. Look for "Unexpected stores" warnings
4. Check version mismatches (expected vs actual)
5. Export data if needed for analysis

### 3. Recovering from Corruption

1. Export current data (backup): Click "Export DB JSON"
2. Reset affected project or all databases
3. Reload page to reinitialize schema
4. Re-sync from Supabase

### 4. Development Workflow

```typescript
// During development, you might:
1. Make schema changes in dbSchema.ts
2. Press Ctrl+Alt+D to open DevTools
3. Click "Reset All DBs" to clear old schema
4. Reload page - schema auto-initializes with new version
5. Click "Refresh" to verify new schema
```

## Keyboard Shortcuts

| Shortcut                 | Action                |
| ------------------------ | --------------------- |
| `Ctrl+Alt+D` (Win/Linux) | Toggle DevTools panel |
| `Cmd+Alt+D` (Mac)        | Toggle DevTools panel |
| `Esc`                    | Close DevTools panel  |

## Programmatic Access

All DevTools features are available programmatically:

```typescript
// In browser console or code
import { inspectAllDatabases } from '@/qa/dbIntrospection';
import { exportDatabasesToFile } from '@/qa/dbExport';
import { resetLocalDataForProject } from '@/qa/dbReset';

// Inspect
const report = await inspectAllDatabases();
console.log(report);

// Export
await exportDatabasesToFile();

// Reset
const result = await resetLocalDataForProject('project-id-123');
console.log(result.summary);
```

## Related Documentation

- [DevTools Component README](src/components/DevTools/README.md) - Technical details
- [QA Utilities README](src/qa/README.md) - All QA tools documentation
- [Database Schema](src/services/dbSchema.ts) - Schema registry
- [Boot Integrity Checks](src/qa/bootIntegrity.ts) - Startup validation

## Development Only

⚠️ **This panel is only available in development mode.**

In production builds:

- The panel code is tree-shaken (removed from bundle)
- The keyboard shortcut does nothing
- All DevTools imports are stripped

This ensures zero impact on production performance and bundle size.
