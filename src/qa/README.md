# QA & Development Utilities

Comprehensive QA and debugging tools for IndexedDB schema management and data integrity.

## Overview

This directory contains utilities for:

- **Boot Integrity Checks** - Validate database health at app startup
- **Schema Introspection** - Inspect actual database state vs expected schema
- **Data Export** - Export all IndexedDB data for debugging/backup
- **Data Reset** - Surgically delete local data for development/testing

## Files

### `bootIntegrity.ts`

Boot-time QA utility that validates IndexedDB schema health.

**Features:**

- IndexedDB availability check
- Schema self-healing verification
- Database existence checks
- Store existence checks
- Round-trip data tests (write → read → verify)

**Usage:**

```typescript
import { runBootIntegrityCheck, logBootIntegrityReport } from '@/qa/bootIntegrity';

// Get structured report
const result = await runBootIntegrityCheck();
console.log(result); // { ok: boolean, checks: BootCheckResult[], totalDuration: number }

// Log human-readable report
await logBootIntegrityReport();
```

**Auto-run in Development:**
Boot integrity checks automatically run at app startup in development mode (see [main.tsx](../main.tsx)).

### `dbIntrospection.ts`

Runtime inspection of IndexedDB databases.

**Features:**

- Compare actual vs expected database versions
- Check store existence
- Count records in each store
- Detect missing stores or schema mismatches
- Visual health indicators

**Usage:**

```typescript
import { inspectAllDatabases, logDatabaseIntrospection } from '@/qa/dbIntrospection';

// Get detailed report
const report = await inspectAllDatabases();
// Returns: { databases: DatabaseIntrospection[] }

// Log to console
await logDatabaseIntrospection();
```

**Report Structure:**

```typescript
interface DatabaseIntrospection {
  name: string;
  version: number | null; // Actual version
  expectedVersion: number; // Expected version from schema
  ok: boolean; // Overall health
  stores: StoreIntrospection[];
  error?: string;
}

interface StoreIntrospection {
  name: string;
  expected: boolean; // Expected by schema
  exists: boolean; // Actually present
  count: number | null; // Record count
  error?: string;
}
```

### `dbExport.ts`

Export all IndexedDB data to JSON.

**Features:**

- Export all databases and stores
- Include metadata (timestamp, versions)
- Quick size summary
- Downloadable JSON file

**Usage:**

```typescript
import { exportDatabasesToFile, createFullDatabaseDump, getDatabaseSizes } from '@/qa/dbExport';

// Trigger download
await exportDatabasesToFile();
// Downloads: inkwell-db-export-2024-01-20T12-30-45.json

// Get in-memory dump
const dump = await createFullDatabaseDump();

// Get quick summary
const sizes = await getDatabaseSizes();
// Returns: { name: string, storeCount: number, totalRecords: number }[]
```

### `dbReset.ts`

Delete local IndexedDB data for development/testing.

**Features:**

- Project-specific reset (surgical deletion)
- Nuclear reset (delete all databases)
- Detailed reporting of deleted records
- Safe: Only affects local browser storage, NOT Supabase

**Usage:**

```typescript
import { resetLocalDataForProject, resetAllLocalData } from '@/qa/dbReset';

// Reset specific project (safe)
const result = await resetLocalDataForProject('project-id-123');
console.log(result.summary);
// "Reset local data for project project-id-123. Records deleted: 42."

console.log(result.details);
// [
//   { db: 'inkwell_chapters', store: 'chapter_meta', deleted: 15 },
//   { db: 'inkwell_chapters', store: 'chapter_docs', deleted: 15 },
//   { db: 'inkwell-projects', store: 'projects', deleted: 1 }
// ]

// Nuclear reset (DANGEROUS - requires page reload)
const allResult = await resetAllLocalData();
window.location.reload();
```

**Safety Notes:**

- ⚠️ `resetLocalDataForProject` only affects ONE project's data
- ⚠️ `resetAllLocalData` deletes EVERYTHING and requires page reload
- ⚠️ Neither function affects Supabase - local IndexedDB only
- ⚠️ Use only in development/testing

**Export Format:**

```json
{
  "metadata": {
    "timestamp": "2024-01-20T12:30:45.123Z",
    "databases": ["inkwell_v1", "inkwell_chapters", ...]
  },
  "databases": [
    {
      "name": "inkwell_v1",
      "version": 3,
      "stores": [
        {
          "name": "projects",
          "records": [
            { "id": "abc", "name": "My Novel", ... }
          ]
        }
      ]
    }
  ]
}
```

## Integration

### Development Tools

All QA utilities are integrated into the [IndexedDB DevTools Panel](../components/DevTools/README.md).

**Access:** Press **Ctrl+Alt+D** in development mode

### Auto-Run Checks

Boot integrity checks run automatically at app startup in development:

```typescript
// src/main.tsx
if (import.meta.env.DEV) {
  import('./qa/bootIntegrity').then(({ logBootIntegrityReport }) => {
    logBootIntegrityReport().catch((error) => {
      devLog.error('[BootIntegrity] Failed to run checks:', error);
    });
  });
}
```

### Test Suite

Comprehensive tests for schema management:

- [dbSchema.test.ts](../services/__tests__/dbSchema.test.ts) - 18 test cases covering:
  - Idempotency
  - Upgrade scenarios
  - Error handling
  - Data integrity

## Architecture

### Centralized Schema Registry

All database definitions live in [dbSchema.ts](../services/dbSchema.ts):

```typescript
export const DATABASE_SCHEMAS: DatabaseDefinition[] = [
  MAIN_DATABASE,
  CHAPTERS_DATABASE,
  PROJECTS_DATABASE,
  SYNC_QUEUE_DATABASE,
];
```

### Self-Healing Schema

The schema system uses defensive patterns to handle missing stores:

```typescript
// Instead of version-based migrations:
if (oldVersion < 2) {
  db.createObjectStore('myStore');
}

// Use idempotent checks:
if (!db.objectStoreNames.contains('myStore')) {
  db.createObjectStore('myStore');
}
```

This ensures schemas can self-heal from any starting state.

### Error Handling

Graceful degradation with typed error guards:

```typescript
import { isMissingStoreError } from '@/utils/idbUtils';

try {
  const data = await getDataFromStore();
} catch (error) {
  if (isMissingStoreError(error, 'myStore')) {
    // Gracefully handle missing store
    return [];
  }
  throw error;
}
```

## Development Workflow

1. **Check Schema Health:**

   ```typescript
   await logBootIntegrityReport();
   ```

2. **Inspect Databases:**
   - Press Ctrl+Alt+D to open DevTools panel
   - Or run: `await logDatabaseIntrospection();`
   - Look for "Unexpected stores" warnings

3. **Export Data:**
   - Click "Export DB JSON" in DevTools panel
   - Or run: `await exportDatabasesToFile();`

4. **Reset Local Data:**
   - **Project-specific:** Enter project ID in DevTools and click "Reset Project"
   - **Nuclear option:** Click "Reset All DBs" (confirmation required)
   - Or programmatically: `await resetLocalDataForProject('project-id')`

5. **Run Tests:**
   ```bash
   pnpm test dbSchema.test.ts
   ```

## Performance

All QA utilities are:

- **Development-only** - Tree-shaken from production builds
- **Lazy-loaded** - Minimal impact on app startup
- **Non-blocking** - Use async/await, won't freeze UI

## Related Documentation

- [Database Schema](../services/dbSchema.ts) - Centralized schema registry
- [IndexedDB DevTools](../components/DevTools/README.md) - Visual debugging panel
- [Boot Initialization](../services/dbInitService.ts) - Database initialization service
- [IDB Utils](../utils/idbUtils.ts) - Reusable IndexedDB utilities
