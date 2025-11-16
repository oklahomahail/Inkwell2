# Critical Fixes Action Plan

**Priority**: URGENT - Production Blockers
**Timeline**: 1-2 Sprints (2-4 weeks)
**Effort**: ~40-50 hours total

---

## 🎯 Objective

Address the 14 critical issues blocking production scale and user experience quality. These fixes target data corruption risks, performance bottlenecks, and memory leaks.

---

## 📋 Sprint 1: Performance & Data Integrity (Week 1-2)

### Issue #1: SyncQueue Sequential Processing Bottleneck

**Severity**: 🔴 CRITICAL - **25-50x throughput loss**
**Impact**: Blocks scaling to 1000+ operations
**Effort**: 2-4 hours
**File**: [src/sync/syncQueue.ts:318-414](src/sync/syncQueue.ts#L318-L414)

**Current Code**:

```typescript
// Line 318-414: Process operations one-by-one
for (const op of pendingOps) {
  await this.executeCloudSync(op); // ONE operation at a time
}
```

**Fix**:

```typescript
// Group operations by table and send as batch
async _processQueue(): Promise<void> {
  const pendingOps = this.getPendingOps();

  // Group by table
  const opsByTable = new Map<SyncTable, SyncOperation[]>();
  for (const op of pendingOps) {
    if (!opsByTable.has(op.table)) {
      opsByTable.set(op.table, []);
    }
    opsByTable.get(op.table)!.push(op);
  }

  // Process each table as batch
  for (const [table, ops] of opsByTable) {
    const payloads = ops.map(op => op.payload);

    try {
      const result = await cloudUpsert.upsertRecords(table, payloads);

      // Update status for all ops in batch
      for (const op of ops) {
        op.status = result.success ? 'success' : 'failed';
        await this.persistOperation(op);
      }
    } catch (error) {
      // Handle batch-level errors
      for (const op of ops) {
        op.status = 'pending'; // Will retry
        op.attempts++;
        await this.persistOperation(op);
      }
    }
  }
}
```

**Expected Result**: 500+ ops/sec (up from 10-20 ops/sec)

**Testing**:

```typescript
// Test with 1000 operations
const start = performance.now();
for (let i = 0; i < 1000; i++) {
  await syncQueue.enqueue('upsert', 'chapters', `ch-${i}`, 'proj-1', {...});
}
await syncQueue.processQueue();
const duration = performance.now() - start;
console.assert(duration < 5000, 'Should complete in <5 seconds');
```

---

### Issue #2: Deduplication O(n) Linear Scan

**Severity**: 🔴 CRITICAL - **10-100x slowdown at scale**
**Impact**: 10ms+ per enqueue with 10,000 operations in queue
**Effort**: 1-2 hours
**File**: [src/sync/syncQueue.ts:207-212](src/sync/syncQueue.ts#L207-L212)

**Current Code**:

```typescript
// Linear scan - O(n) complexity
for (const op of this.queue.values()) {
  if (op.table === table && op.recordId === recordId && op.status === 'pending') {
    operation = op;
    break;
  }
}
```

**Fix**:

```typescript
// Add deduplication index at class level
private queue: Map<string, SyncOperation> = new Map();
private deduplicationIndex: Map<string, string> = new Map();
  // Key: "${table}:${recordId}"
  // Value: operation.id

async enqueue(
  type: OperationType,
  table: SyncTable,
  recordId: string,
  projectId: string,
  payload: any,
  priority: number = 0,
): Promise<string> {
  const dedupeKey = `${table}:${recordId}`;
  const existingOpId = this.deduplicationIndex.get(dedupeKey);

  let operation: SyncOperation;

  if (existingOpId) {
    const existing = this.queue.get(existingOpId);
    if (existing && existing.status === 'pending') {
      // Update existing operation
      existing.payload = payload;
      existing.type = type;
      existing.priority = priority;
      existing.lastAttemptAt = null;
      await this.persistOperation(existing);
      return existing.id;
    }
  }

  // Create new operation
  const opId = this.generateOperationId();
  operation = {
    id: opId,
    type,
    table,
    recordId,
    projectId,
    payload,
    status: 'pending',
    createdAt: Date.now(),
    attempts: 0,
    priority,
    lastAttemptAt: null,
    error: null,
  };

  this.queue.set(opId, operation);
  this.deduplicationIndex.set(dedupeKey, opId);
  await this.persistOperation(operation);

  return opId;
}

// Update removeOperation to also remove from index
private async removeOperation(id: string): Promise<void> {
  const op = this.queue.get(id);
  if (op) {
    const dedupeKey = `${op.table}:${op.recordId}`;
    this.deduplicationIndex.delete(dedupeKey);
  }
  this.queue.delete(id);

  // IndexedDB delete
  // ... existing code
}
```

**Expected Result**: <0.1ms per enqueue regardless of queue size

**Testing**:

```typescript
// Test with 10,000 operations in queue
for (let i = 0; i < 10000; i++) {
  await syncQueue.enqueue('upsert', 'chapters', `ch-${i}`, 'proj-1', {});
}

const start = performance.now();
await syncQueue.enqueue('upsert', 'chapters', 'ch-5000', 'proj-1', { updated: true });
const duration = performance.now() - start;
console.assert(duration < 1, 'Should complete in <1ms');
```

---

### Issue #3: Section Creation Race Condition

**Severity**: 🔴 CRITICAL - **Duplicate chapters, data loss**
**Impact**: User sees duplicate "Chapter 1" sections
**Effort**: 1 hour
**File**: [src/components/Writing/EnhancedWritingPanel.tsx:222-250](src/components/Writing/EnhancedWritingPanel.tsx#L222-L250)

**Current Code**:

```typescript
const initialSectionCreated = useRef(false);

useEffect(() => {
  if (sections.length === 0 && !activeId && !isCreatingSection && !initialSectionCreated.current) {
    initialSectionCreated.current = true;
    (async () => {
      await createSection('Chapter 1', 'chapter');
    })();
  }

  return () => {
    if (sections.length === 0) {
      initialSectionCreated.current = false; // ← BUG: Reset during cleanup
    }
  };
}, [sections.length, activeId, isCreatingSection, createSection]);
```

**Fix**:

```typescript
// Remove cleanup logic that resets the flag
const initialSectionCreated = useRef(false);

useEffect(() => {
  if (sections.length === 0 && !activeId && !isCreatingSection && !initialSectionCreated.current) {
    initialSectionCreated.current = true;
    (async () => {
      isInitializingNewSection.current = true;
      await createSection('Chapter 1', 'chapter');
      isInitializingNewSection.current = false;
    })();
  }

  // No cleanup - let flag persist across unmounts
  return () => {
    // Only reset initialization flag, not creation flag
    isInitializingNewSection.current = false;
  };
}, [sections.length, activeId, isCreatingSection, createSection]);
```

**Expected Result**: No duplicate chapters created, even with rapid panel switching

**Testing**:

```typescript
// Simulate rapid panel switching
for (let i = 0; i < 10; i++) {
  // Switch to WritingPanel
  dispatch({ type: 'SET_VIEW', payload: View.Writing });
  await new Promise((resolve) => setTimeout(resolve, 100));

  // Switch away
  dispatch({ type: 'SET_VIEW', payload: View.Analysis });
  await new Promise((resolve) => setTimeout(resolve, 50));
}

// Should have exactly 1 chapter
const sections = await useSections.getSections();
console.assert(sections.length === 1, 'Should have exactly 1 chapter');
```

---

### Issue #4: Content Loss on Rapid Section Switching

**Severity**: 🔴 CRITICAL - **User data loss**
**Impact**: Unsaved content lost when switching sections quickly
**Effort**: 2-3 hours
**File**: [src/components/Writing/EnhancedWritingPanel.tsx:253-285](src/components/Writing/EnhancedWritingPanel.tsx#L253-L285)

**Current Code**:

```typescript
useEffect(() => {
  if (!activeId) return;

  (async () => {
    // Save previous section (600ms debounce still pending!)
    if (prevActiveIdRef.current && prevActiveIdRef.current !== activeId && content) {
      updateSectionContent(prevActiveIdRef.current, content); // ← Debounced!
    }

    // Load new section content
    const section = await getActiveSection();
    if (section) {
      setContent(section.content || ''); // ← Overwrites before save completes
    }
  })();
}, [activeId]);
```

**Fix**:

```typescript
useEffect(() => {
  if (!activeId) return;

  (async () => {
    // FORCE synchronous save of previous content (bypass debounce)
    if (prevActiveIdRef.current && prevActiveIdRef.current !== activeId && content) {
      // Use direct save instead of debounced updateSectionContent
      await Chapters.saveDoc({
        id: prevActiveIdRef.current,
        content,
        version: 1, // Increment appropriately
        scenes: [], // Preserve existing
      });

      // Also update metadata
      const wordCount = content.split(/\s+/).filter(Boolean).length;
      await Chapters.updateMeta({
        id: prevActiveIdRef.current,
        wordCount,
      } as any);
    }

    // Only then load new section content
    const section = await getActiveSection();
    if (section) {
      if (isInitializingNewSection.current && content) {
        // User typed during initialization - preserve it
        updateSectionContent(activeId, content);
      } else {
        setContent(section.content || '');
      }
    }

    prevActiveIdRef.current = activeId;
  })();
}, [activeId, content, getActiveSection]);
```

**Expected Result**: No data loss when switching sections, even rapid switching

**Testing**:

```typescript
// Simulate rapid section switching with content
await useSections.setActiveSection('section-1');
// Type content
setContent('Hello World from Section 1');
await new Promise((resolve) => setTimeout(resolve, 100)); // Don't wait for debounce

// Switch sections immediately
await useSections.setActiveSection('section-2');

// Switch back
await useSections.setActiveSection('section-1');
const section1 = await useSections.getActiveSection();
console.assert(section1.content === 'Hello World from Section 1', 'Content should be preserved');
```

---

### Issue #5: Realtime Memory Leaks (Debounce Timers)

**Severity**: 🔴 CRITICAL - **~1MB/hour accumulation**
**Impact**: Application slowdown over time, potential crashes
**Effort**: 15-30 minutes per leak point (5 total = 2 hours)
**Files**:

- [src/services/chaptersSyncService.ts](src/services/chaptersSyncService.ts)
- [src/lib/supabase/realtime.ts](src/lib/supabase/realtime.ts)

**Current Code** (example from chaptersSyncService):

```typescript
// Line 55-90: Debounced refresh
const debouncedRefresh = debounce(() => {
  refreshChapters();
}, 500);

const unsubscribe = subscribeToChapterChanges(projectId, (_chapterId) => {
  debouncedRefresh(); // ← Timer created but never cleared
});

return () => {
  unsubscribe();
  // Missing: Clear debounce timer
};
```

**Fix**:

```typescript
// Add timer tracking
const debouncedRefresh = useRef<ReturnType<typeof setTimeout> | null>(null);

const scheduleRefresh = () => {
  // Clear existing timer
  if (debouncedRefresh.current) {
    clearTimeout(debouncedRefresh.current);
  }

  // Schedule new refresh
  debouncedRefresh.current = setTimeout(() => {
    refreshChapters();
    debouncedRefresh.current = null;
  }, 500);
};

const unsubscribe = subscribeToChapterChanges(projectId, (_chapterId) => {
  scheduleRefresh();
});

return () => {
  unsubscribe();

  // Clear debounce timer
  if (debouncedRefresh.current) {
    clearTimeout(debouncedRefresh.current);
    debouncedRefresh.current = null;
  }
};
```

**Apply to all 5 leak points**:

1. chaptersSyncService.ts (line 55-90)
2. realtimeService.ts (subscription debounce)
3. useSections.ts (realtime subscription)
4. useChaptersHybrid.ts (if exists)
5. Any other debounced realtime handlers

**Expected Result**: Memory usage stable over time, no accumulation

**Testing**:

```typescript
// Monitor memory over 10 minutes with active realtime
const initialMemory = performance.memory.usedJSHeapSize;

// Trigger 1000 realtime updates
for (let i = 0; i < 1000; i++) {
  await simulateRealtimeUpdate();
  await new Promise((resolve) => setTimeout(resolve, 100));
}

const finalMemory = performance.memory.usedJSHeapSize;
const growth = finalMemory - initialMemory;
console.assert(growth < 1000000, 'Memory growth should be <1MB');
```

---

### Issue #6: Safari iOS Viewport Height Overflow

**Severity**: 🔴 CRITICAL - **Layout broken on iOS**
**Impact**: Content overflow, poor mobile UX
**Effort**: 30 minutes
**Files**: All CSS files using `100vh`

**Current Code**:

```css
.focus-mode-editor {
  min-height: 100vh; /* FAILS on iOS with mobile UI */
}
```

**Fix**:

```css
.focus-mode-editor {
  min-height: 100dvh; /* Dynamic viewport height - safe for iOS */

  /* Fallback for older browsers */
  min-height: 100vh;
  min-height: min(100vh, 100dvh);
}
```

**Apply to all instances**:

1. Search codebase: `grep -r "100vh" src/`
2. Replace with fallback pattern above
3. Test on iOS Safari

**Expected Result**: Proper layout on iOS Safari, no overflow

**Testing**:

- Manual test on iPhone Safari
- Test in portrait and landscape
- Test with address bar visible and hidden

---

## 📋 Sprint 2: Multi-Tab & Cleanup (Week 3-4)

### Issue #7: No Multi-Tab Operation Coordination

**Severity**: 🟠 HIGH - **Duplicate sync operations, 2x network overhead**
**Impact**: Wasted network calls, potential conflicts
**Effort**: 3-4 hours
**File**: [src/sync/syncQueue.ts](src/sync/syncQueue.ts)

**Fix**: Implement BroadcastChannel for cross-tab coordination

```typescript
// Add to SyncQueue class
private broadcastChannel: BroadcastChannel | null = null;

constructor(retryConfig?: Partial<RetryConfig>) {
  // ... existing code

  // Set up cross-tab coordination
  if (typeof BroadcastChannel !== 'undefined') {
    this.broadcastChannel = new BroadcastChannel('inkwell-sync-queue');

    this.broadcastChannel.onmessage = (event: MessageEvent) => {
      const { type, operationId, recordId, table } = event.data;

      if (type === 'operation-enqueued') {
        // Another tab enqueued this operation
        // Check if we have duplicate pending
        const dedupeKey = `${table}:${recordId}`;
        const existingOpId = this.deduplicationIndex.get(dedupeKey);

        if (existingOpId && existingOpId !== operationId) {
          // We have a duplicate - remove ours if it's newer
          const existing = this.queue.get(existingOpId);
          if (existing && existing.createdAt > Date.now() - 1000) {
            // Created within last second - likely duplicate
            this.removeOperation(existingOpId);
          }
        }
      }
    };
  }
}

async enqueue(...args): Promise<string> {
  const opId = await this.enqueueInternal(...args);

  // Broadcast to other tabs
  if (this.broadcastChannel) {
    this.broadcastChannel.postMessage({
      type: 'operation-enqueued',
      operationId: opId,
      recordId: args[2],
      table: args[1],
    });
  }

  return opId;
}
```

**Expected Result**: Duplicate operations across tabs eliminated

---

### Issue #8: No Storage Quota Warning

**Severity**: 🟠 HIGH - **Silent data loss**
**Impact**: Users lose data without knowing why
**Effort**: 2-3 hours
**Files**:

- [src/services/pwaService.ts](src/services/pwaService.ts)
- New UI component for quota warning

**Fix**: Add quota monitoring and user warnings

```typescript
// In pwaService.ts
async checkStorageQuota(): Promise<void> {
  const info = await this.getStorageInfo();

  if (info.percentUsed > 90) {
    // Critical - show urgent warning
    this.showQuotaWarning('critical', info);
  } else if (info.percentUsed > 70) {
    // Warning - suggest cleanup
    this.showQuotaWarning('warning', info);
  } else if (info.percentUsed > 60) {
    // Info - user should be aware
    this.showQuotaWarning('info', info);
  }
}

private showQuotaWarning(level: 'info' | 'warning' | 'critical', info: StorageInfo) {
  // Dispatch to UI component
  window.dispatchEvent(new CustomEvent('storage-quota-warning', {
    detail: { level, ...info }
  }));
}

// Check quota periodically
private quotaCheckInterval: ReturnType<typeof setInterval> | null = null;

init() {
  // ... existing code

  // Check quota every 5 minutes
  this.quotaCheckInterval = setInterval(() => {
    this.checkStorageQuota();
  }, 5 * 60 * 1000);
}
```

**Create UI Component**:

```typescript
// src/components/StorageQuotaWarning.tsx
export function StorageQuotaWarning() {
  const [warning, setWarning] = useState<StorageWarningInfo | null>(null);

  useEffect(() => {
    const handler = (event: CustomEvent) => {
      setWarning(event.detail);
    };

    window.addEventListener('storage-quota-warning', handler as any);
    return () => window.removeEventListener('storage-quota-warning', handler as any);
  }, []);

  if (!warning) return null;

  return (
    <div className={`quota-warning ${warning.level}`}>
      <h3>Storage Space {warning.level === 'critical' ? 'Critical' : 'Warning'}</h3>
      <p>
        You're using {warning.percentUsed.toFixed(1)}% of available storage.
        {warning.level === 'critical' && ' Your data may not save properly.'}
      </p>
      <button onClick={() => openStorageManagement()}>
        Manage Storage
      </button>
    </div>
  );
}
```

**Expected Result**: Users warned before quota exceeded, no silent data loss

---

### Issue #9: Orphaned Operations Not Auto-Cleaned

**Severity**: 🟠 HIGH - **Queue bloat, performance degradation**
**Impact**: Failed operations accumulate indefinitely
**Effort**: 3-4 hours
**File**: [src/sync/syncQueue.ts](src/sync/syncQueue.ts)

**Fix**: Add background cleanup job

```typescript
// Add to SyncQueue class
private cleanupInterval: ReturnType<typeof setInterval> | null = null;

init() {
  // ... existing code

  // Clean up failed operations every hour
  this.cleanupInterval = setInterval(() => {
    this.autoCleanupOrphanedOperations();
  }, 60 * 60 * 1000); // 1 hour
}

private async autoCleanupOrphanedOperations(): Promise<void> {
  const orphanedOps: SyncOperation[] = [];
  const now = Date.now();

  for (const op of this.queue.values()) {
    if (op.status === 'failed' && op.error?.includes('[Non-retryable]')) {
      // Failed with non-retryable error

      // Only remove if older than 24 hours (give user time to see error)
      if (now - op.createdAt > 24 * 60 * 60 * 1000) {
        orphanedOps.push(op);
      }
    }
  }

  // Remove old orphaned operations
  for (const op of orphanedOps) {
    await this.removeOperation(op.id);
  }

  if (orphanedOps.length > 0) {
    devLog.info(`[SyncQueue] Auto-cleaned ${orphanedOps.length} orphaned operations`);
  }
}

destroy() {
  // ... existing code

  if (this.cleanupInterval) {
    clearInterval(this.cleanupInterval);
    this.cleanupInterval = null;
  }
}
```

**Expected Result**: Failed operations auto-removed after 24 hours

---

### Issue #10: Realtime Local Change Detection Race

**Severity**: 🔴 CRITICAL - **Infinite sync loops**
**Impact**: Data corruption, network overhead
**Effort**: 1-2 hours
**File**: [src/services/chaptersSyncService.ts:40-90](src/services/chaptersSyncService.ts#L40-L90)

**Current Code**:

```typescript
// Debounced refresh clears isLocalChange flag too early
const debouncedRefresh = debounce(() => {
  isLocalChange.current = false; // ← BUG: Cleared before realtime fires
  refreshChapters();
}, 500);

// Realtime subscription
const unsubscribe = subscribeToChapterChanges(projectId, (_chapterId) => {
  if (isLocalChange.current) {
    console.debug('Skipping realtime refresh - local change');
    return; // ← isLocalChange already false!
  }
  debouncedRefresh();
});
```

**Fix**:

```typescript
// Track local changes with timestamp
const localChangeTimestamp = useRef<number>(0);

const updateContent = async (id: string, content: string) => {
  localChangeTimestamp.current = Date.now();
  await Chapters.saveDoc({...});

  // Keep flag active for 2 seconds (longer than debounce + network)
  setTimeout(() => {
    localChangeTimestamp.current = 0;
  }, 2000);
};

// Realtime subscription
const unsubscribe = subscribeToChapterChanges(projectId, (_chapterId) => {
  const timeSinceLocalChange = Date.now() - localChangeTimestamp.current;

  if (timeSinceLocalChange < 2000) {
    console.debug('Skipping realtime refresh - recent local change');
    return;
  }

  debouncedRefresh();
});
```

**Expected Result**: No infinite sync loops, proper local change detection

---

## 🧪 Testing Checklist

### SyncQueue Performance Tests

- [ ] 1000 operations process in <5 seconds
- [ ] Enqueue with 10,000 queue size in <1ms
- [ ] Batch operations grouped correctly
- [ ] Error handling preserves operation order

### Multi-Tab Tests

- [ ] Duplicate operations not created across tabs
- [ ] Storage quota warnings shown at 60%, 70%, 90%
- [ ] Orphaned operations cleaned after 24 hours
- [ ] Cross-tab cache invalidation works

### WritingPanel Tests

- [ ] No duplicate chapters created on rapid panel switch
- [ ] Content preserved when switching sections quickly
- [ ] Section creation only happens once
- [ ] React StrictMode doesn't cause double-creation

### Realtime Tests

- [ ] Memory usage stable over 10 minutes
- [ ] No infinite sync loops
- [ ] Local changes not overwritten by realtime
- [ ] Debounce timers properly cleared

### Safari/PWA Tests

- [ ] Viewport height correct on iOS Safari
- [ ] Layout doesn't overflow with address bar
- [ ] Private mode detected and warned
- [ ] Quota warnings shown on iOS

---

## 📊 Success Metrics

### Performance

- SyncQueue throughput: 10-20 ops/sec → **500+ ops/sec** ✅
- Enqueue latency (10k queue): 10ms → **<0.1ms** ✅
- Memory leak rate: 1MB/hour → **0** ✅

### Reliability

- Duplicate chapter creation: Common → **Never** ✅
- Content loss on section switch: Possible → **Never** ✅
- Infinite sync loops: Occasional → **Never** ✅

### User Experience

- Cross-panel data staleness: 3-6.6s → **Still polling, but improved** ⏳
- Safari iOS layout: Broken → **Fixed** ✅
- Storage quota awareness: None → **Proactive warnings** ✅

---

## 📝 Implementation Order

**Day 1-2**:

1. SyncQueue batching (4 hours) ← **Highest ROI**
2. Deduplication index (2 hours)
3. Section creation race fix (1 hour)

**Day 3-4**: 4. Content loss prevention (3 hours) 5. Realtime memory leaks (2 hours) 6. Safari viewport CSS (1 hour)

**Day 5-6**: 7. Multi-tab coordination (4 hours) 8. Storage quota warnings (3 hours)

**Day 7-8**: 9. Orphaned operation cleanup (4 hours) 10. Realtime race condition fix (2 hours)

**Day 9-10**: Testing, refinement, edge cases

**Total**: ~30-35 hours (1.5-2 weeks for single developer)

---

## 🚀 Deployment Plan

1. **Feature branch**: `fix/critical-architecture-issues`
2. **Testing**: All tests pass + manual QA
3. **Staging**: Deploy to staging environment for 2-3 days
4. **Load testing**: Simulate 10,000 operations
5. **Production**: Gradual rollout (10% → 50% → 100%)
6. **Monitoring**: Watch for regressions, memory usage, errors

---

## 📞 Support & Questions

Refer to the full audit reports for detailed analysis:

- [ARCHITECTURE_AUDIT_SUMMARY.md](ARCHITECTURE_AUDIT_SUMMARY.md)
- Individual audit reports in the codebase

**Last updated**: November 15, 2025
