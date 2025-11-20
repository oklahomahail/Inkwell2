# IndexedDB DevTools

Development-only tools for inspecting and debugging IndexedDB databases.

## Features

### Schema Introspection

- Real-time inspection of all IndexedDB databases
- Version checking (expected vs actual)
- Store existence verification
- **Unexpected stores detection** - identifies stores not in schema registry
- Record counts for each store
- Visual health indicators (OK/Issues)

### Data Export

- One-click export of all IndexedDB data to JSON
- Downloads a timestamped file (e.g., `inkwell-db-export-2024-01-20.json`)
- Includes metadata (timestamp, database versions)
- Useful for debugging and data recovery

### Local Data Reset

- **Project-specific reset** - Delete all local data for a specific project ID
- **Nuclear reset** - Delete ALL IndexedDB databases (requires confirmation)
- Automatic introspection refresh after reset
- Safe: Only affects local browser storage, NOT Supabase

## Usage

### Keyboard Shortcut

Press **Ctrl+Alt+D** (or **Cmd+Alt+D** on Mac) in development mode to toggle the DevTools panel.

### Programmatic Access

```typescript
// Import introspection utilities
import { inspectAllDatabases, logDatabaseIntrospection } from '@/qa/dbIntrospection';

// Get detailed report (includes unexpectedStores)
const report = await inspectAllDatabases();
console.log(report);
// Each database now includes: { ..., unexpectedStores: string[] }

// Log human-readable report to console
await logDatabaseIntrospection();

// Import export utilities
import { exportDatabasesToFile, createFullDatabaseDump } from '@/qa/dbExport';

// Export to file
await exportDatabasesToFile();

// Get in-memory dump
const dump = await createFullDatabaseDump();

// Import reset utilities
import { resetLocalDataForProject, resetAllLocalData } from '@/qa/dbReset';

// Reset specific project (safe, surgical)
const result = await resetLocalDataForProject('project-id-123');
console.log(result.summary); // "Reset local data for project project-id-123. Records deleted: 42."

// Nuclear option: delete ALL databases (requires page reload)
const allResult = await resetAllLocalData();
window.location.reload(); // Required after nuclear reset
```

## Architecture

### Components

**`IndexedDbDevToolsPanel.tsx`**

- React component for visual inspection
- Modal overlay with database health dashboard
- Refresh and export buttons

**`src/qa/dbIntrospection.ts`**

- Schema introspection utilities
- Compares actual database state vs expected schema
- Returns detailed reports with version, store existence, and record counts

**`src/qa/dbExport.ts`**

- Data export utilities
- Creates JSON snapshots of all databases
- Handles file download with proper timestamps

**`src/qa/dbReset.ts`**

- Local data reset utilities
- Project-specific deletion by field matching
- Nuclear reset option for all databases
- WARNING: Only affects local browser storage, NOT Supabase

### Integration

The DevTools panel is integrated into the main app via [App.tsx](../../App.tsx):

1. Lazy-loaded component (dev-only)
2. Keyboard shortcut handler (Ctrl+Alt+D)
3. State management with React hooks
4. Conditional rendering based on `import.meta.env.DEV`

## Development Only

All DevTools components are **development-only** and will not be included in production builds. They are:

- Tree-shaken from production bundles
- Wrapped in `import.meta.env.DEV` checks
- Lazy-loaded to minimize impact on dev performance

## Safety Notes

### Project Reset vs Nuclear Reset

**Project Reset** (`resetLocalDataForProject`):

- ✅ Safe for development - only deletes data for ONE project
- ✅ Surgically removes records by matching `projectId` field
- ✅ Automatically refreshes introspection after deletion
- ⚠️ Only affects local IndexedDB, NOT Supabase
- Use case: Testing with clean slate for specific project

**Nuclear Reset** (`resetAllLocalData`):

- ⚠️ DANGEROUS - Deletes ALL IndexedDB databases
- ⚠️ Requires page reload after execution
- ⚠️ Cannot be undone
- ⚠️ Requires confirmation dialog
- Use case: Complete local state reset during development

### Unexpected Stores

When the DevTools panel shows "Unexpected stores detected":

- These are stores that exist in the database but aren't in the schema registry
- They may be leftovers from old migrations or experiments
- They won't break anything, but indicate schema drift
- Consider either:
  1. Adding them to the schema registry if they're intentional
  2. Creating a migration to remove them if they're obsolete

## Related Files

- [dbIntrospection.ts](../../qa/dbIntrospection.ts) - Schema introspection utilities
- [dbExport.ts](../../qa/dbExport.ts) - Data export utilities
- [dbReset.ts](../../qa/dbReset.ts) - Data reset utilities
- [dbSchema.ts](../../services/dbSchema.ts) - Centralized schema registry
- [bootIntegrity.ts](../../qa/bootIntegrity.ts) - Boot-time integrity checks
