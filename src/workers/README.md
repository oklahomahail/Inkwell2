# Web Workers

This directory contains Web Worker implementations used by Inkwell for offloading heavy computations from the main thread.

## Active Workers

### searchWorker.ts

**Location:** `src/workers/searchWorker.ts` (dynamically imported with Vite hashing)
**Used by:** `searchService.ts`
**Purpose:** Full-text search indexing and query processing

### phraseWorker.ts

**Location:** `src/workers/phraseWorker.ts` (dynamically imported with Vite hashing)
**Used by:** `textAnalysis.ts`
**Purpose:** Phrase analysis and text pattern detection

## Fixed-Path Workers

Some workers need to be served at predictable URLs to avoid Vite hash-based chunking issues that can cause 404s in production.

### autosaveWorker.js

**Location:** `public/workers/autosaveWorker.js` (fixed path, no hashing)
**Used by:** `autosaveWorkerService.ts`
**Purpose:** Document sanitization, checksum calculation, and scene extraction
**URL:** `/workers/autosaveWorker.js`

**Why fixed path?**

- Prevents production 404s from hash mismatches between build artifacts
- Ensures worker is always available at the same URL
- Eliminates cache-related worker loading issues

## Worker Architecture Guidelines

### When to use dynamic import (Vite-hashed):

- Worker file rarely changes
- Used only during specific user actions (search, analysis)
- Acceptable to have slight delay on first load

### When to use fixed path (public/ directory):

- Worker loads frequently (e.g., on every content edit)
- Critical to application functionality
- Must be available immediately without cache issues

## Adding a New Worker

1. **For dynamic workers:** Create in `src/workers/` and import with:

   ```typescript
   new Worker(new URL('@/workers/yourWorker.ts', import.meta.url), { type: 'module' });
   ```

2. **For fixed-path workers:** Create in `public/workers/` as `.js` file and import with:
   ```typescript
   new Worker('/workers/yourWorker.js', { type: 'module' });
   ```

## Testing Workers

All workers should have corresponding test files in `src/services/__tests__/` or `src/utils/__tests__/` that:

- Test main-thread fallback behavior
- Verify correct data processing
- Handle worker initialization failures
- Test timeout and error scenarios
