# Realtime Subscription Audit - Quick Reference Guide

## 30-Second Overview

**Status:** 3 critical issues found in Realtime implementation
**Risk Level:** MEDIUM-HIGH for production multi-device sync
**Action:** Schedule Phase 1 fixes for next sprint (12 hours work)

---

## Critical Issues Quick List

### Issue 1: Memory Leaks (HIGH)

**File:** `src/sync/realtimeService.ts` (Line 207-223)
**Problem:** Debounce timers never cleared on unsubscribe
**Impact:** ~1MB/hour accumulation in long sessions
**Fix Time:** 15 minutes

### Issue 2: Race Condition (HIGH)

**File:** `src/hooks/useSections.ts` (Lines 100-101, 353-375)
**Problem:** Local change flag reset asynchronous (500ms delay)
**Impact:** Can skip remote changes arriving within window
**Fix Time:** 45 minutes

### Issue 3: Disabled Deduplication (HIGH)

**File:** `src/sync/realtimeService.ts` (Line 265)
**Problem:** isOwnChange() hardcoded to return false
**Impact:** Duplicate event processing, UI flickering
**Fix Time:** 30 minutes

---

## High-Risk Issues Summary

| Issue                     | File                | Line    | Risk   | Fix                        |
| ------------------------- | ------------------- | ------- | ------ | -------------------------- |
| Memory leak - listeners   | realtimeService     | 60      | HIGH   | Add removeListener cleanup |
| Memory leak - timers      | realtimeService     | 63      | HIGH   | Clear on unsubscribe       |
| No multi-tab coordination | ALL                 | Various | HIGH   | Implement BroadcastChannel |
| Naive reconnection        | realtimeService     | 162     | MEDIUM | Add exponential backoff    |
| Missing error recovery    | chaptersSyncService | 241     | MEDIUM | Handle errors, retry       |
| No cache eviction         | useSections         | 565     | LOW    | Add TTL cleanup            |

---

## Subscription Points Map

```
Application
├── AppContext (GOOD - proper cleanup)
│   ├── syncQueue listener
│   └── online/offline handlers
│
├── useSections Hook (MEDIUM RISK)
│   ├── subscribeToChapterChanges
│   └── 3-minute auto-sync
│
├── useChaptersHybrid Hook (MEDIUM RISK)
│   └── subscribeToChapterChanges
│
└── realtimeService Singleton (HIGH RISK)
    ├── Memory leaks in debounceTimers
    ├── Memory leaks in listeners
    ├── Disabled deduplication
    └── Naive reconnection

Plus: chaptersSyncService (independently subscribing)
```

**Problem:** 4 independent subscription implementations, 2 subscriptions to same data

---

## Phase 1 Action Items (Do First)

### 1. Fix Debounce Timer Leak (15 min)

```typescript
// src/sync/realtimeService.ts - Add to unsubscribeFromProject():
async unsubscribeFromProject(projectId: string): Promise<void> {
  // Clear all debounce timers for this project
  for (const [key, timer] of Array.from(this.debounceTimers.entries())) {
    if (key.includes(projectId)) {
      clearTimeout(timer);
      this.debounceTimers.delete(key);
    }
  }
  // ... rest of cleanup
}
```

### 2. Enable Deduplication (30 min)

```typescript
// src/sync/realtimeService.ts - Replace isOwnChange():
private recordHashes: Map<string, string> = new Map();

private isOwnChange(record: any): boolean {
  const hash = generateHash(JSON.stringify(record));
  const prevHash = this.recordHashes.get(record.id);
  this.recordHashes.set(record.id, hash);
  return hash === prevHash;
}
```

### 3. Fix Local Change Race (45 min)

```typescript
// src/hooks/useSections.ts - Improve flag handling:
// Instead of setTimeout reset, wait for actual writes:
const markLocalChange = useCallback(async () => {
  isLocalChange.current = true;
  try {
    await indexedDBWrite();
    // Only reset after write + debounce
    await new Promise((r) => setTimeout(r, 600));
  } finally {
    isLocalChange.current = false;
  }
}, []);
```

### 4. Add Listener Cleanup (30 min)

```typescript
// All hooks using listeners should cleanup:
useEffect(() => {
  const listener = (event) => { ... };
  realtimeService.addListener(listener);
  return () => {
    realtimeService.removeListener(listener); // REQUIRED
  };
}, [projectId]);
```

---

## Testing Priorities

### Unit Tests (1 day)

```
[ ] Test debounce timer cleanup
[ ] Test listener removal on unmount
[ ] Test duplicate event detection
[ ] Test local change flag timing
[ ] Test cache eviction
```

### Integration Tests (2 days)

```
[ ] Multi-tab subscription coordination
[ ] Offline to online recovery
[ ] Network flapping (rapid on/off)
[ ] Concurrent edit handling
```

### E2E Tests (1 day)

```
[ ] Cross-device sync (2+ browsers)
[ ] 30-minute offline period recovery
[ ] Large dataset (20+ projects)
```

---

## Document Navigation

| Document                          | Purpose                           | Audience   |
| --------------------------------- | --------------------------------- | ---------- |
| REALTIME_AUDIT_INDEX.md           | **START HERE** - Navigation guide | Everyone   |
| REALTIME_AUDIT_SUMMARY.md         | Executive overview & key findings | Leads, PMs |
| REALTIME_AUDIT_REPORT.md          | Complete technical analysis       | Engineers  |
| REALTIME_AUDIT_QUICK_REFERENCE.md | **THIS FILE** - Fast lookup       | Developers |

---

## Risk Assessment Scorecard

| Dimension           | Status   | Score |
| ------------------- | -------- | ----- |
| Single-Device Usage | ✓ Safe   | 8/10  |
| Multi-Device Usage  | ⚠ Risky | 4/10  |
| Production Ready    | ❌ No    | 3/10  |
| Memory Stability    | ❌ Bad   | 2/10  |
| Error Recovery      | ⚠ Basic | 5/10  |
| Network Handling    | ⚠ Basic | 5/10  |

**Overall Score: 4.5/10 (Not production-ready for multi-device)**

---

## Remediation Timeline

**Phase 1 (Critical):** 1 sprint (5 days)

- Fix memory leaks ✓
- Enable deduplication ✓
- Fix race condition ✓
- Add cleanup ✓

**Phase 2 (High Priority):** 1 sprint (5 days)

- Multi-tab coordination ✓
- Exponential backoff ✓
- Error recovery ✓
- Cache eviction ✓

**Phase 3 (Medium Priority):** 2 sprints (10 days)

- Event batching ✓
- Circuit breaker ✓
- Logging ✓
- Performance tuning ✓

**Total Effort:** 3-4 weeks
**Estimated Savings:** ~1MB/hour memory, true multi-device sync

---

## Common Issues Checklist

When using Realtime subscriptions, watch for:

### Memory Leaks

- [ ] Are timers cleared on unsubscribe?
- [ ] Are listeners removed on unmount?
- [ ] Is cache evicted on cleanup?

### Race Conditions

- [ ] Are local/remote changes distinguished?
- [ ] Is unsubscribe atomic?
- [ ] Is flag reset synchronous?

### Multi-Tab Issues

- [ ] Do multiple tabs subscribe to same data?
- [ ] Is there BroadcastChannel coordination?
- [ ] Can IndexedDB handle concurrent writes?

### Network Issues

- [ ] Is reconnection exponential backoff?
- [ ] Is there offline recovery?
- [ ] Are errors retried with jitter?

---

## Key Files to Review

### Priority 1 (Review First)

- `src/sync/realtimeService.ts` - Main issues here
- `src/hooks/useSections.ts` - Race condition here

### Priority 2 (Review Second)

- `src/services/chaptersSyncService.ts` - Duplicate subscriptions
- `src/services/connectivityService.ts` - Good pattern reference

### Priority 3 (Reference)

- `src/context/AppContext.tsx` - Good cleanup pattern
- Test files for coverage insights

---

## Prevention for Future Code

### Subscription Pattern (CORRECT)

```typescript
useEffect(() => {
  // Setup
  const unsubscribe = subscribe(projectId, callback);

  // Cleanup - ALWAYS required
  return () => {
    unsubscribe();
  };
}, [projectId]); // Minimal dependencies
```

### Memory Pattern (CORRECT)

```typescript
// If using timer maps:
private timers = new Map<string, NodeJS.Timeout>();

// Always clean up:
destroy() {
  for (const timer of this.timers.values()) {
    clearTimeout(timer);
  }
  this.timers.clear();
}
```

### Listener Pattern (CORRECT)

```typescript
private listeners = new Set<Callback>();

addListener(cb: Callback) {
  this.listeners.add(cb);
  return () => this.listeners.delete(cb); // Return unsubscribe
}

// In cleanup:
removeListener(cb: Callback) {
  this.listeners.delete(cb);
}
```

---

## Questions to Ask

1. **Q: How long to fix all issues?**
   A: 3-4 weeks (12 hours critical, 16 hours high priority, 24 hours medium)

2. **Q: Is production release blocked?**
   A: Yes, for multi-device scenarios. Safe for single-device.

3. **Q: What breaks without fixes?**
   A: Memory accumulation, race conditions, no cross-tab sync

4. **Q: What's the biggest risk?**
   A: Local/remote change race condition causing data loss

5. **Q: When should we fix this?**
   A: Before any production multi-device release

---

## Support Resources

- Full report: `REALTIME_AUDIT_REPORT.md` (1258 lines, all details)
- Executive summary: `REALTIME_AUDIT_SUMMARY.md` (high-level overview)
- Document index: `REALTIME_AUDIT_INDEX.md` (navigation guide)
- This file: `REALTIME_AUDIT_QUICK_REFERENCE.md` (quick lookup)

---

**Generated:** 2025-11-15
**Audit Scope:** Complete Realtime subscription system
**Status:** Ready for implementation
