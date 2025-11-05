# IndexedDB Optimization — Chapter Cache Implementation

**Status:** ✅ Implemented (v0.9.0-beta)
**Sprint:** Week 1 — Performance & Offline Hardening
**Acceptance Criteria:** p95 < 250ms, p50 < 150ms, no stale reads across tabs

---

## Overview

Implemented chapter-level LRU cache with TTL, cross-tab invalidation, and telemetry to optimize IndexedDB query performance.

## Architecture

### 1. Cache Layer (`src/services/chapterCache.ts`)

**Features:**

- **LRU Eviction:** Max 100 entries, least-recently-used eviction
- **TTL:** 5-minute expiration per entry
- **Cross-Tab Sync:** BroadcastChannel for invalidation messages
- **Automatic Cleanup:** TTL checks on every `get()`

**Cache Keys:**

```typescript
chapterList: {
  projectId;
} // ChapterMeta[]
chapterMeta: {
  chapterId;
} // ChapterMeta
chapterDoc: {
  chapterId;
} // ChapterDoc
```

**API:**

```typescript
// Basic operations
chapterCache.get<T>(key: CacheKey): T | null
chapterCache.set<T>(key: CacheKey, data: T): void

// Invalidation
chapterCache.invalidate(keys: CacheKey[]): void
chapterCache.invalidateProject(projectId: string): void
chapterCache.clear(): void

// Helpers
withChapterListCache(projectId, fetcher)
withChapterMetaCache(chapterId, fetcher)
```

### 2. Telemetry (`src/utils/perf.ts`)

**Metrics Tracking:**

- Rolling window of last 1000 query latencies
- Real-time p50/p95 percentile calculation
- Automatic threshold warnings (p95 > 250ms, p50 > 150ms)

**API:**

```typescript
// Wrap queries with automatic timing
await trackChapterQuery('getChapters', async () => {
  return await chaptersService.list(projectId);
});

// Get current metrics
const { p50, p95, count, mean } = getChapterQueryMetrics();
```

### 3. Integration Points

#### Model Gateway (`src/model/chapters.ts`)

- `getChapters()` → uses `withChapterListCache()`
- `getChapter()` → tracks with `trackChapterQuery()`
- All mutations → invalidate cache via `chapterCache.invalidate()`

#### Chapters Service (`src/services/chaptersService.ts`)

Cache invalidation added to:

- `updateMeta()` → invalidates list + meta
- `updateWordCount()` → invalidates list + meta
- `saveDoc()` → invalidates list + doc
- `reorder()` → invalidates entire project
- `remove()` → invalidates list + meta + doc

#### Sync Service (`src/services/syncService.ts`)

- `pullNow()` → invalidates entire project after cloud sync

---

## Performance Targets

| Metric         | Target  | Monitoring              |
| -------------- | ------- | ----------------------- |
| p50 latency    | < 150ms | Auto-logged if exceeded |
| p95 latency    | < 250ms | Auto-logged if exceeded |
| Stale reads    | 0       | Cross-tab invalidation  |
| Cache hit rate | > 70%   | Manual inspection       |

---

## Usage Examples

### Reading Chapters (Cached)

```typescript
// In React components via useChapters hook
const { chapters, loading } = useChapters(projectId);
// → Automatically uses cache layer
// → Tracks query metrics
```

### Mutating Chapters (Auto-Invalidation)

```typescript
// Update chapter content
await updateChapterContent(projectId, chapterId, newContent);
// → Saves to IndexedDB
// → Invalidates cache for chapterList + chapterMeta
// → Broadcasts invalidation to other tabs

// Reorder chapters
await reorderChapters(projectId, ['ch1', 'ch2', 'ch3']);
// → Updates all chapter indexes
// → Invalidates entire project cache
// → Broadcasts to other tabs
```

### Cross-Tab Behavior

```
Tab A: Loads chapters → Cache populated
Tab B: Updates chapter → Invalidates cache + broadcasts
Tab A: Receives broadcast → Cache invalidated
Tab A: Re-reads chapters → Fresh data from IndexedDB
```

---

## Testing

### Unit Tests (`src/services/__tests__/chapterCache.test.ts`)

Verifies:

- ✅ Basic cache operations (get/set)
- ✅ TTL expiration
- ✅ LRU eviction
- ✅ Key invalidation
- ✅ Project-scoped invalidation
- ✅ Statistics reporting

Run tests:

```bash
npm test chapterCache
```

### Manual Cross-Tab Testing

1. Open two browser tabs
2. Tab 1: Load project with chapters
3. Tab 2: Modify a chapter
4. Tab 1: Reload chapter list
5. **Verify:** Tab 1 shows updated data

### Performance Verification

```typescript
// In browser console after using the app:
import { getChapterQueryMetrics } from '@/utils/perf';

console.log(getChapterQueryMetrics());
// { p50: 45, p95: 120, count: 250, mean: 62 }
```

---

## Configuration

Adjust cache behavior in `src/services/chapterCache.ts`:

```typescript
const CACHE_MAX_ENTRIES = 100; // Max cached items
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const BROADCAST_CHANNEL_NAME = 'inkwell:chapter-cache';
```

Adjust metric thresholds in `src/utils/perf.ts`:

```typescript
if (metrics.p95 > 250 || metrics.p50 > 150) {
  console.warn(`[Chapter Query] ...`);
}
```

---

## Migration Notes

- **No breaking changes:** Cache layer is transparent to existing code
- **Feature flag:** Uses existing `CHAPTER_MODEL` flag
- **Backward compatible:** Legacy localStorage path unaffected
- **Progressive enhancement:** If BroadcastChannel unavailable, cache still works (single-tab mode)

---

## Monitoring & Maintenance

### Production Monitoring

1. Check console for threshold warnings: `[Chapter Query] getChapters - p50: XXms, p95: XXms`
2. Inspect cache stats: `chapterCache.getStats()`
3. Clear cache if needed: `chapterCache.clear()`

### Common Issues

**Cache not invalidating across tabs:**

- Check browser console for BroadcastChannel errors
- Verify both tabs are on same origin

**High cache miss rate:**

- Check TTL (5 min default)
- Verify LRU capacity (100 entries default)

**Queries still slow:**

- Check IndexedDB performance (browser DevTools)
- Verify chapter content size (large docs = slower)
- Consider increasing cache size or TTL

---

## Future Enhancements

- [ ] Persist cache to localStorage for faster initial loads
- [ ] Add cache prewarming on app startup
- [ ] Implement cache compression for large ChapterDoc content
- [ ] Add cache hit rate telemetry
- [ ] Adaptive TTL based on mutation frequency

---

## Related Files

**Core Implementation:**

- `src/services/chapterCache.ts` — Cache service
- `src/utils/perf.ts` — Telemetry utilities
- `src/model/chapters.ts` — Gateway integration
- `src/services/chaptersService.ts` — Service hooks
- `src/services/syncService.ts` — Sync integration

**Tests:**

- `src/services/__tests__/chapterCache.test.ts`

**Documentation:**

- This file
- Sprint plan in project README
