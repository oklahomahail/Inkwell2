# Comprehensive Realtime Subscription Audit Report

## Inkwell Project - Multi-Device Sync Analysis

**Audit Date:** 2025-11-15  
**Scope:** Complete Realtime subscription implementation across all services, stores, and components  
**Status:** Critical for multi-device sync functionality

---

## Executive Summary

The Inkwell codebase implements a sophisticated multi-layer Realtime synchronization system with three primary Realtime implementations:

1. **Legacy chaptersSyncService** - Channel-based subscriptions at service layer
2. **New realtimeService** - Centralized singleton managing all subscriptions
3. **Hook-based subscriptions** - useSections and useChaptersHybrid consuming Realtime events

### Critical Findings:

- **MODERATE RISK**: Multiple unmanaged subscription points with potential for memory leaks
- **RACE CONDITIONS**: Detected in local change detection patterns
- **MULTI-TAB ISSUES**: No cross-tab coordination mechanism implemented
- **NETWORK HANDLING**: Basic reconnection logic without progressive backoff
- **DEDUPLICATION**: Vulnerable to duplicate event processing

---

## 1. Complete Subscription Inventory

### 1.1 Realtime Subscription Points

#### A. chaptersSyncService (Legacy - Primary Implementation)

**File:** `/Users/davehail/Developer/inkwell/src/services/chaptersSyncService.ts`

```typescript
// Lines 194-275: subscribeToChapterChanges()
export function subscribeToChapterChanges(
  projectId: string,
  onChange: (chapterId?: string) => void,
): () => void {
  const channel = supabase
    .channel(`chapters:${projectId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'chapters',
      filter: `project_id=eq.${projectId}`,
    }, async (payload: any) => { ... })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
```

**Characteristics:**

- Simple channel-based pattern
- Filter by project_id
- Handles INSERT, UPDATE, DELETE events
- Returns unsubscribe function
- Directly mutates IndexedDB on events

**Risk Level:** HIGH

- No debouncing at service layer (only in handlers)
- No duplicate detection
- Fires for all remote changes
- No connection lifecycle management

---

#### B. realtimeService (Centralized - Singleton)

**File:** `/Users/davehail/Developer/inkwell/src/sync/realtimeService.ts`

```typescript
// Lines 53-410: Centralized Realtime management
class RealtimeService {
  private channels: Map<string, RealtimeChannel> = new Map();
  private subscriptions: Map<string, Set<string>> = new Map(); // projectId -> Set<table>
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
  private listeners: Set<SyncStateCallback> = new Set();

  async subscribeToProject(projectId: string, tables?: SyncTable[]): Promise<void>;
  async unsubscribeFromProject(projectId: string): Promise<void>;
  async unsubscribeAll(): Promise<void>;
}
```

**Subscription Tables:**

- chapters
- sections
- characters
- notes
- project_settings

**Features:**

- Per-project subscription tracking
- Multi-table support per project
- Debouncing (500ms default)
- Change deduplication attempt via `isOwnChange()`
- Status listeners for UI feedback
- Auto-reconnection with 3s delay

**Risk Level:** MODERATE-HIGH

- Debounce cleared per record key (risk: uncleared timers on unmount)
- `isOwnChange()` always returns false (line 265) - duplicate detection disabled
- No cleanup of debounce timers on unsubscribe
- Reconnection logic is naive (fixed 3s delay)

---

### 1.2 Hook-Level Subscriptions

#### A. useSections Hook

**File:** `/Users/davehail/Developer/inkwell/src/hooks/useSections.ts`

```typescript
// Lines 288-321: Real-time subscription in useEffect
useEffect(() => {
  if (!isValidProjectId) return;

  setRealtimeConnected(true);

  const unsubscribe = subscribeToChapterChanges(projectId, async (_chapterId) => {
    if (isLocalChange.current) {
      isLocalChange.current = false;
      return;
    }
    // Refresh sections from IndexedDB
    const refreshed = await Chapters.list(projectId);
    setSections(deduplicateSections(mappedSections));
    setLiveUpdateReceived(true);
    setTimeout(() => setLiveUpdateReceived(false), 2000);
  });

  return () => {
    setRealtimeConnected(false);
    unsubscribe();
  };
}, [projectId, chapterToSection, isValidProjectId, deduplicateSections]);
```

**Issues Identified:**

- Uses `isLocalChange` ref flag for race condition prevention
- Flag reset happens 500ms after local change (line 373-375)
- No guarantee flag is cleared before Realtime event arrives
- Multiple dependencies in useEffect (could cause unnecessary re-subscriptions)

#### B. useChaptersHybrid Hook

**File:** `/Users/davehail/Developer/inkwell/src/hooks/useChaptersHybrid.ts`

```typescript
// Lines 133-150: Real-time subscription
useEffect(() => {
  setRealtimeConnected(true);

  const unsubscribe = subscribeToChapterChanges(projectId, async (_chapterId) => {
    const refreshed = await Chapters.list(projectId);
    setChapters(refreshed);
    setLiveUpdateReceived(true);
    setTimeout(() => setLiveUpdateReceived(false), 2000);
  });

  return () => {
    setRealtimeConnected(false);
    unsubscribe();
  };
}, [projectId]);
```

**Issues Identified:**

- No local change detection (vulnerable to refresh loops)
- Missing `isLocalChange` flag pattern
- Simple 2-second UI pulse only

---

### 1.3 Component-Level Usage

#### RealtimeStatus Component

**File:** `/Users/davehail/Developer/inkwell/src/components/Chapters/RealtimeStatus.tsx`

- Consumer only - displays status
- No subscription management
- Visual indicators: connected dot, sync button, pulse animation on updates

#### EnhancedWritingPanel Component

**File:** `/Users/davehail/Developer/inkwell/src/components/Writing/EnhancedWritingPanel.tsx`

- Uses `useSections` hook
- Passes real-time connected state to RealtimeStatus
- 3-minute auto-sync interval
- Network reconnection handler

---

### 1.4 AppContext Cloud Sync Integration

**File:** `/Users/davehail/Developer/inkwell/src/context/AppContext.tsx` (Lines 432-517)

```typescript
// Cloud sync initialization
const initCloudSync = async () => {
  const { syncQueue } = await import('@/sync/syncQueue');
  const { realtimeService } = await import('@/sync/realtimeService');
  const { supabase } = await import('@/lib/supabaseClient');

  await syncQueue.init();

  // Add sync queue listener
  const updateSyncState = () => { ... };
  syncQueue.addListener(updateSyncState);

  // Monitor online/offline
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    syncQueue.removeListener(updateSyncState);
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
};
```

**Cleanup:** Properly implemented with cleanup function chaining

---

## 2. Subscription Lifecycle Management

### 2.1 Setup Phase

**Current Pattern:**

```
useEffect(() => {
  const unsubscribe = subscribeToChapterChanges(projectId, callback);
  return () => unsubscribe();
}, [projectId]);
```

**Issues:**

1. Dependency on `projectId` only (in useChaptersHybrid)
2. In useSections: Many dependencies causing re-subscriptions
3. No connection waiting - immediately subscribes
4. No auth check before subscribing

### 2.2 Reconnection Logic

**realtimeService Implementation (Lines 162-167):**

```typescript
if (this.config.autoReconnect) {
  setTimeout(() => {
    devLog.log(`[Realtime] Reconnecting to ${channelName}`);
    this.subscribeToTable(projectId, table);
  }, 3000); // Fixed 3-second delay
}
```

**Issues:**

- ❌ No exponential backoff
- ❌ No maximum retry limit
- ❌ No jitter (could cause thundering herd)
- ❌ No detection of persistent network issues
- ✓ Does resubscribe to correct channel

### 2.3 Cleanup Phase

#### chaptersSyncService:

```typescript
return () => {
  supabase.removeChannel(channel);
};
```

**Status:** ✓ Basic cleanup works

#### realtimeService:

```typescript
async unsubscribeFromProject(projectId: string): Promise<void> {
  for (const table of tables) {
    const channelName = `${projectId}:${table}`;
    const channel = this.channels.get(channelName);
    if (channel) {
      await supabase.removeChannel(channel);
      this.channels.delete(channelName);
    }
  }
  this.subscriptions.delete(projectId);
  if (this.activeProjectId === projectId) {
    this.activeProjectId = null;
  }
}
```

**Issues:**

- ✓ Removes from channel map
- ✓ Removes from subscriptions map
- ❌ Does NOT clear debounce timers for this project
- ❌ Does NOT remove listeners for this project
- ❌ Listeners stay in Set forever (memory leak)

#### Debounce Timer Leak:

```typescript
private debounceTimers: Map<string, NodeJS.Timeout> = new Map();

private debounceChange(change: RealtimeChange): void {
  const key = `${change.table}:${change.new?.id || change.old?.id}`;
  const existing = this.debounceTimers.get(key);
  if (existing) {
    clearTimeout(existing);
  }
  const timer = setTimeout(() => {
    this.processChange(change);
    this.debounceTimers.delete(key); // ✓ Cleared on fire
  }, this.config.changeDebounce);
  this.debounceTimers.set(key, timer);
}
```

**Memory Leak Risk:** HIGH

- If changes stop arriving, timers remain in map forever
- No cleanup on unsubscribe or component unmount
- Example: User edits chapter, stops, logs out → timer leaks

---

## 3. Memory Leak Risk Assessment

### 3.1 Critical Memory Leak Points

#### 1. Realtime Listener References (realtimeService)

**Severity:** HIGH

```typescript
private listeners: Set<SyncStateCallback> = new Set();

addListener(callback: SyncStateCallback): void {
  this.listeners.add(callback);
  // NO REMOVAL MECHANISM PROVIDED
}

removeListener(callback: SyncStateCallback): void {
  this.listeners.delete(callback);
}
```

**Issue:** AppContext adds listeners but components also add them

- AppContext (line 477): `syncQueue.addListener(updateSyncState)`
- Each EnhancedWritingPanel instance that subscribes creates closure over stale state
- Listeners are never removed if component unmounts

**Impact:** Each component mount → listener stays forever

---

#### 2. Debounce Timer Map (realtimeService)

**Severity:** HIGH

**Scenario:**

1. User edits Chapter 1
2. Timer queued for `chapters:ch1` (500ms debounce)
3. User navigates away (component unmounts, unsubscribeFromProject called)
4. Realtime event fires after 200ms - timer still in map
5. Component remounts 100ms later - new timer for same record
6. Original timer fires 300ms later - processChange runs with stale projectId

**Result:** Stale change processing, memory grows unbounded

**Fix Needed:**

```typescript
async unsubscribeFromProject(projectId: string): Promise<void> {
  // Clear ALL debounce timers for this project
  for (const [key, timer] of this.debounceTimers.entries()) {
    if (key.startsWith(`${projectId}:`)) {
      clearTimeout(timer);
      this.debounceTimers.delete(key);
    }
  }
  // ... rest of cleanup
}
```

---

#### 3. chaptersSyncService Channel References

**Severity:** MEDIUM

```typescript
export function subscribeToChapterChanges(
  projectId: string,
  onChange: (chapterId?: string) => void,
): () => void {
  const channel = supabase.channel(`chapters:${projectId}`);
  // ...
  return () => {
    supabase.removeChannel(channel);
  };
}
```

**Issue:** Multiple calls to this function create multiple channels with same name

- useSections creates one subscription per hook instance
- useChaptersHybrid creates another (different hook)
- Supabase may not deduplicate identical channel names
- Result: Multiple listeners for same changes

---

#### 4. localStorage References in useSections

**Severity:** LOW

```typescript
const contentCache = useRef<Map<string, { content: string; timestamp: number }>>(new Map());

// Lines 565-614: loadSectionContent() never evicts entries
const now = Date.now();
if (cached && now - cached.timestamp < 5 * 60 * 1000) {
  return cached.content;
}
// TTL check but NEVER cleans up expired entries
```

**Issue:** Cache grows unbounded if many sections accessed

- 5-minute TTL checked but entries not removed
- Hundreds of sections → megabytes of memory

**Fix:** Implement cache eviction on unsubscribe or timer-based cleanup

---

### 3.2 Memory Leak Risk Matrix

| Component                      | Risk   | Cause                             | Impact                    |
| ------------------------------ | ------ | --------------------------------- | ------------------------- |
| realtimeService listeners      | HIGH   | Listeners never removed           | Grows with each component |
| realtimeService debounceTimers | HIGH   | Timers not cleared on unsubscribe | Unbounded map growth      |
| chaptersSyncService channels   | MEDIUM | Multiple channels same name       | Duplicate event handling  |
| useSections contentCache       | LOW    | No eviction on cleanup            | Slow growth over time     |
| AppContext sync listeners      | MEDIUM | Added but unclear removal         | Listener accumulation     |

---

## 4. Race Conditions in Subscription Handlers

### 4.1 Local Change Detection Race (useSections)

**Implementation (Lines 100-101, 353-354):**

```typescript
const isLocalChange = useRef(false);

// When user makes change:
isLocalChange.current = true;

// Realtime callback:
if (isLocalChange.current) {
  isLocalChange.current = false;
  return; // Skip refresh
}
```

**Race Condition Scenario:**

```
T=0ms:   User types character
T=0ms:   isLocalChange = true
T=1ms:   onChange triggers (debounced to 600ms)
T=50ms:  Another user edits same chapter on different device
T=50ms:  Realtime event arrives
T=50ms:  Check: isLocalChange.current === true ✓ Skip refresh
T=50ms:  RACE: Flag not reset yet, so we skip REMOTE change!
T=100ms: Flag reset callback fires (from setTimeout 500ms ago) - TOO LATE
T=100ms: Remote content lost, conflict not detected
```

**Issues:**

1. Reset happens via setTimeout (line 374-375) - asynchronous
2. Race window: 50-600ms where flag is true for all changes
3. Uses `useRef` which persists across renders, but not persisted to disk
4. No transaction ID or version checking for actual conflicts

**Vulnerable Code:**

```typescript
const creatingSection = useCallback(
  async (title = 'Untitled Section', type: SectionType = 'chapter') => {
    if (creatingSection.current) {
      console.debug('[useSections] Ignoring duplicate createSection call');
      return null;
    }
    try {
      creatingSection.current = true;
      // ... create section
    } finally {
      setTimeout(() => {
        creatingSection.current = false;
      }, 500); // 500ms window for duplicate detection
    }
  },
  // ...
);
```

**Problem:** The 500ms delay is arbitrary - what if IndexedDB write takes 1s?

---

### 4.2 Unsubscribe Race (useEffect cleanup)

**Scenario:**

```
T=0ms:   User navigates away from project
T=0ms:   useEffect cleanup runs: unsubscribe()
T=0ms:   removeChannel() called
T=1ms:   Realtime event arrives (was queued server-side)
T=1ms:   Callback fires on ghost listener
T=1ms:   Chapters.list() called - may throw if index closed
```

**Issues:**

1. Async unsubscribe (uses `await removeChannel()`)
2. No guarantee channel is removed before event arrives
3. Callback may still fire after cleanup
4. Can cause: "Cannot access property 'id' of undefined" errors

---

### 4.3 Deduplication Race (realtimeService)

**Issue: `isOwnChange()` Always Disabled (Line 265)**

```typescript
private isOwnChange(record: any): boolean {
  // TODO: Implement client fingerprinting to detect own changes
  // For now, assume all changes are from other devices
  return false; // ALWAYS FALSE!
}
```

**Consequence:**

1. User edits chapter locally
2. Change sent to Supabase
3. Realtime event received for same change
4. Change processed again (duplicate)
5. Result: Race conditions with server state

**Real Scenario:**

```
T=0:   Local edit: Chapter title "Foo" → "Foo Bar"
T=0:   upsert sent to Supabase
T=10:  Realtime event: {old: "Foo", new: "Foo Bar"}
T=10:  Received as remote change → refresh UI
T=10:  But we already have "Foo Bar" locally!
T=10:  UI flickers, user confusion
```

---

## 5. Error Handling and Reconnection Logic

### 5.1 realtimeService Error States (Lines 150-168)

```typescript
.subscribe((status) => {
  if (status === 'SUBSCRIBED') {
    devLog.log(`[Realtime] Subscribed to ${channelName}`);
    this.updateStatus('connected');
  } else if (status === 'CHANNEL_ERROR') {
    devLog.error(`[Realtime] Error subscribing to ${channelName}`);
    this.updateStatus('error');
  } else if (status === 'TIMED_OUT') {
    devLog.warn(`[Realtime] Subscription timeout for ${channelName}`);
    this.updateStatus('disconnected');

    if (this.config.autoReconnect) {
      setTimeout(() => {
        devLog.log(`[Realtime] Reconnecting to ${channelName}`);
        this.subscribeToTable(projectId, table);
      }, 3000);
    }
  }
});
```

**Issues:**

| Status                         | Handling                       | Issue                                   |
| ------------------------------ | ------------------------------ | --------------------------------------- |
| SUBSCRIBED                     | ✓ Set to connected             | Good                                    |
| CHANNEL_ERROR                  | ✗ Set to error (not connected) | **MISSING:** No reconnect attempt       |
| TIMED_OUT                      | ✓ Reconnect after 3s           | **ISSUE:** No exponential backoff       |
| (No handling for other states) | ✗                              | **Missing:** Other error states ignored |

**Gaps:**

1. CHANNEL_ERROR doesn't trigger reconnection (permanent failure state)
2. No maximum retry limit (could retry forever)
3. No jitter (3000ms exactly - thundering herd with 20 channels)
4. No connection stability check (keeps retrying offline)
5. No alerting to user about persistent errors

---

### 5.2 chaptersSyncService Callback Error Handling (Lines 241-266)

```typescript
try {
  if (eventType === 'DELETE' && oldRow?.id) {
    await Chapters.remove(oldRow.id);
  } else if (eventType === 'INSERT' || eventType === 'UPDATE') {
    if (newRow) {
      const input: CreateChapterInput = { ... };
      await Chapters.create(input);
    }
  }
  onChange(newRow?.id || oldRow?.id);
} catch (error) {
  console.error('[Realtime] Failed to process change:', error);
  // **NO RECOVERY** - callback never called, UI never updated
}
```

**Issues:**

1. ❌ Errors silently logged
2. ❌ `onChange()` NOT called if error occurs
3. ❌ No retry mechanism
4. ❌ IndexedDB errors could permanently break sync
5. ❌ User has no visibility into failure

**Example Failure:**

```
User has 1000 chapters
Event: DELETE chapter 500
Chapters.remove(500) throws "quota exceeded"
Error logged
onChange() NEVER called
UI still shows chapter 500
User confused why deletion didn't work
```

---

### 5.3 Network Interruption Handling

**Current Approach:**

```typescript
// In useSections (Lines 276-282)
useEffect(() => {
  const handleOnline = () => {
    syncNow(); // Manual sync
  };

  window.addEventListener('online', handleOnline);
  return () => window.removeEventListener('online', handleOnline);
}, [syncNow]);
```

**Issues:**

1. ✓ Manual sync on reconnect (good)
2. ✗ Realtime connection NOT reestablished automatically
3. ✗ No waiting for connection to stabilize (could flap)
4. ✗ No timeout for offline period

**What's Missing:**

```
Offline for 30 minutes → come back online
→ syncNow() triggered
→ But Realtime channel might not be ready yet
→ syncNow() succeeds but misses live updates for 5 more seconds
```

---

## 6. Multi-Tab Subscription Coordination

### 6.1 Current Implementation: NONE

**File Scan Result:**

```
grep -r "SharedWorker\|BroadcastChannel\|IndexedDB.*events\|storage.*event"
  → No cross-tab communication found
```

**What's Missing:**

1. ❌ No SharedWorker to centralize subscriptions
2. ❌ No BroadcastChannel for tab coordination
3. ❌ No storage events for change notification
4. ❌ Each tab independently subscribes to all projects
5. ❌ Multiple Realtime connections for identical data

**Scenario - Critical Issue:**

```
Browser with 3 tabs open (all Inkwell):
- Tab A: Chapter editor
- Tab B: Dashboard
- Tab C: Settings

Both Tab A and Tab B subscribe to Realtime for same project
→ 2 WebSocket connections for identical data
→ Each receives same events
→ Both update IndexedDB with same data
→ Potential race conditions in writes

User edits chapter in Tab A:
→ Tab A syncs to Supabase
→ Realtime event to both Tab A and Tab B
→ Both try to update IndexedDB
→ IDB transactions may conflict
```

### 6.2 Duplicate Subscription Prevention

**Current Code (realtimeService Lines 127-131):**

```typescript
private async subscribeToTable(projectId: string, table: SyncTable): Promise<void> {
  const channelName = `${projectId}:${table}`;

  // Don't subscribe twice
  if (this.channels.has(channelName)) {
    devLog.debug(`[Realtime] Already subscribed to ${channelName}`);
    return;
  }
  // ... create channel
}
```

**Issue:** Only prevents duplicate subscriptions WITHIN same instance

- realtimeService is singleton (good)
- BUT chaptersSyncService also creates subscriptions independently
- So we still get duplicates:
  - realtimeService subscription to chapters
  - chaptersSyncService subscription to chapters (via useSections)
  - Result: 2 channels, 2 callbacks

---

## 7. Network Interruption Impact Analysis

### 7.1 Offline Period - 5 Minutes

**Current Flow:**

```
T=0:   Offline (WiFi disconnects)
T=0:   subscribeToChapterChanges callback NOT called (no server events)

T=30s: User edits Chapter 1 locally
T=30s: onChange → Chapters.update()
T=30s: Change saved to IndexedDB ✓

T=3:   User in different tab edits Chapter 2 on different device
T=3:   Server receives remote change
T=3:   Realtime event queued (for online client)
T=3:   Local client offline → event NOT delivered

T=5:   Network reconnects
T=5:   'online' event fired
T=5:   syncNow() called

T=6:   syncNow() completes
T=6:   Chapter 1: local newer → pushed ✓
T=6:   Chapter 2: merged with remote ✓
       BUT: Gap of 5 minutes where local client didn't know about Chapter 2 changes
```

**Issues:**

1. ✓ Manual sync recovers state
2. ✗ 5-minute gap in awareness
3. ✗ User can't see that Chapter 2 changed
4. ✗ If user opens Chapter 2 tab during gap, they see stale content
5. ✗ No "loading" indicator during recovery

### 7.2 Intermittent Connectivity (WiFi flapping)

**Scenario:**

```
T=0:   WiFi signal weak
T=0:   Realtime: TIMED_OUT
T=0:   Reconnect scheduled (3s)

T=1s:  WiFi slightly improves → navigator.onLine = true
T=1s:  'online' event fired → syncNow() called
T=1s:  Realtime subscription might still be in timeout state

T=2s:  WiFi fails again → navigator.onLine = false
T=2s:  'offline' event fired
T=2s:  Earlier reconnect (T=3s) might fire and try to subscribe

T=3s:  Multiple reconnect attempts collide
T=3s:  Race condition: subscribing while offline
```

**Result:** Channels left in inconsistent states, connections leak

---

## 8. Duplicate Event Handling

### 8.1 Sources of Duplicates

#### 1. Multiple Subscriptions (Same Record)

```
realtimeService subscribes to chapters:proj-123
chaptersSyncService subscribes to chapters:proj-123
  ↓
Both receive: {eventType: 'UPDATE', new: {id: 'ch-1', title: 'Foo'}}
  ↓
Two separate Chapters.update() calls
  ↓
IDB transaction race
```

#### 2. Retry Without Dedup

```typescript
// realtimeService line 265
private isOwnChange(record: any): boolean {
  return false; // NEVER detects own changes
}
```

**Consequence:**

- User edits "Chapter 1 title"
- Local IndexedDB update
- Upsert sent to Supabase
- Event: {new: {id: 'ch-1', title: 'Chapter 1 title'}}
- Received as remote change
- Unnecessary re-fetch from IndexedDB
- Triggers another onChange callback

#### 3. Component Re-mounting

```typescript
// useSections Lines 288-321
useEffect(() => {
  const unsubscribe = subscribeToChapterChanges(projectId, async (_chapterId) => {
    // Callback
  });
  return () => unsubscribe();
}, [projectId, chapterToSection, isValidProjectId, deduplicateSections]);
```

**Issue:** Dependencies include `deduplicateSections` (a useCallback)

- Every parent render changes `deduplicateSections` instance
- useEffect re-runs
- Old subscription unsubscribes
- New subscription subscribes
- Brief gap where changes might be missed
- Or: subscriptions briefly overlap

---

### 8.2 Duplicate Event Flood Scenario

**Setup:**

- Chapter has 10 related notes
- Each note edit triggers separate update event
- All within 50ms

**Timeline:**

```
T=0:   Note 1 changed → Realtime event
T=10:  Note 2 changed → Realtime event
T=20:  Note 3 changed → Realtime event
...
T=50:  All 10 events in flight

T=50:  realtimeService receives first event
T=50:  Debounce started (500ms timer for `notes:proj-123`)

T=100: realtimeService receives remaining 9 events
T=100: All clear existing timer, restart it (500ms)
T=100: Last timer set for T=600

T=600: processChange() fires ONCE with only last event
T=600: Earlier 9 events processed only if onChange called
```

**Result:** Depends on onChange implementation (could miss updates or flood)

---

## 9. Performance Considerations

### 9.1 Connection Pooling

**Current Approach:** No pooling

```typescript
// Each call to subscribeToProject creates new channels
async subscribeToProject(projectId: string, tables?: SyncTable[]): Promise<void> {
  const tablesToSubscribe = tables || this.getAllSyncTables();

  for (const table of tablesToSubscribe) {
    await this.subscribeToTable(projectId, table); // NEW channel
  }
}
```

**Issues:**

1. 5 tables × 20 projects = 100 channels
2. Each channel = 1 WebSocket message queue
3. Memory: Each channel holds buffer of events
4. CPU: Each channel has independent event loop

**Recommendation:** Use single WebSocket with multiplexing (Supabase already does this but inefficiently)

### 9.2 Event Queue Backpressure

**Problem:** No rate limiting

```typescript
private async processChange(change: RealtimeChange): Promise<void> {
  // ...
  await hydrationService.hydrateProject({...});
}
```

**Scenario:**

- 1000 chapters changed on server
- 1000 Realtime events queued
- Each event spawns hydration (full project re-fetch)
- CPU at 100%, UI freezes

**Missing:** Coalescing changes, batch processing, priority queue

### 9.3 IndexedDB Transaction Overhead

**Current:**

```typescript
try {
  if (eventType === 'UPDATE') {
    await Chapters.create(input); // Creates transaction
  }
  onChange(); // Triggers component re-render
} catch (error) {
  // Transaction failed, component never updated
}
```

**Issues:**

- Each event = separate IndexedDB transaction
- No batching
- No write coalescing

---

## 10. Recommendations for Improvements

### 10.1 Critical (Fix Immediately)

#### 1. Fix Memory Leaks in realtimeService

```typescript
async unsubscribeFromProject(projectId: string): Promise<void> {
  // Clear ALL debounce timers for this project
  for (const [key, timer] of Array.from(this.debounceTimers.entries())) {
    if (key.includes(projectId)) {
      clearTimeout(timer);
      this.debounceTimers.delete(key);
    }
  }

  // Remove listeners for this project
  const projectListeners = new Set(this.listeners);
  this.listeners.clear();
  // Re-add non-project-specific listeners if needed

  // ... existing cleanup ...
}
```

#### 2. Implement Duplicate Detection

```typescript
private recordHashes: Map<string, string> = new Map();

private isOwnChange(record: any): boolean {
  const key = `${record.id}`;
  const hash = generateHash(record);
  const previousHash = this.recordHashes.get(key);

  if (hash === previousHash) {
    return true; // We saw this exact state
  }

  this.recordHashes.set(key, hash);
  return false;
}
```

#### 3. Fix Race Condition in Local Change Flag

```typescript
// Instead of setTimeout, use promise chaining
private localChangePromise: Promise<void> | null = null;

const markLocalChange = async () => {
  isLocalChange.current = true;
  this.localChangePromise = new Promise((resolve) => {
    // Wait for actual IndexedDB write to complete
    Chapters.updateMeta(...).then(() => {
      // Wait for debounce
      setTimeout(() => {
        isLocalChange.current = false;
        resolve();
      }, 600);
    });
  });
};
```

#### 4. Add Listener Cleanup

```typescript
// In hook:
useEffect(() => {
  const handleRealtimeChange = (state) => { ... };
  realtimeService.addListener(handleRealtimeChange);

  return () => {
    realtimeService.removeListener(handleRealtimeChange); // REQUIRED
  };
}, [projectId]);
```

---

### 10.2 High Priority (Implement Next Sprint)

#### 1. Implement Multi-Tab Coordination

```typescript
// new file: src/sync/multiTabCoordinator.ts
class MultiTabCoordinator {
  private channel: BroadcastChannel;

  constructor() {
    this.channel = new BroadcastChannel('inkwell-sync');
    this.channel.onmessage = (event) => {
      if (event.data.type === 'REALTIME_EVENT') {
        // Only tab with active project processes events
        if (this.isActiveTab()) {
          this.processEvent(event.data);
        }
      }
    };
  }

  broadcastEvent(event: RealtimeChange) {
    this.channel.postMessage({ type: 'REALTIME_EVENT', ...event });
  }

  private isActiveTab(): boolean {
    // Use page visibility API
    return !document.hidden;
  }
}
```

#### 2. Implement Progressive Backoff

```typescript
private getReconnectDelay(attempt: number): number {
  const baseDelay = 1000; // 1 second
  const maxDelay = 30000; // 30 seconds
  const jitter = Math.random() * 1000; // ±1s jitter

  const delay = Math.min(
    maxDelay,
    baseDelay * Math.pow(2, attempt)
  ) + jitter;

  return Math.round(delay);
}
```

#### 3. Add Error Recovery to Callbacks

```typescript
private async processChange(change: RealtimeChange): Promise<void> {
  try {
    await hydrationService.hydrateProject({...});
  } catch (error) {
    if (isNonRetryableError(error)) {
      // User facing error
      notifyUser('Sync failed - please refresh');
    } else {
      // Retry later
      this.enqueueRetry(change);
    }
  }
}

private enqueueRetry(change: RealtimeChange, attempt = 0) {
  const delay = this.getReconnectDelay(attempt);
  setTimeout(() => {
    this.processChange(change).catch(() => {
      if (attempt < 5) this.enqueueRetry(change, attempt + 1);
    });
  }, delay);
}
```

#### 4. Add Content Cache Eviction

```typescript
const clearContentCache = useCallback(() => {
  const now = Date.now();
  const maxAge = 5 * 60 * 1000; // 5 minutes

  for (const [key, cached] of contentCache.current.entries()) {
    if (now - cached.timestamp > maxAge) {
      contentCache.current.delete(key);
    }
  }
}, []);

// Run periodically
useEffect(() => {
  const interval = setInterval(clearContentCache, 60000); // Every minute
  return () => clearInterval(interval);
}, [clearContentCache]);
```

---

### 10.3 Medium Priority (Polish & Optimization)

1. **Add Connectivity Checks Before Reconnect**
   - Use `navigator.connection` API
   - Skip reconnect if on slow network
   - Exponential backoff even longer for 2G

2. **Implement Event Batching**
   - Coalesce multiple updates to same record
   - Batch hydration calls
   - Reduce IndexedDB transaction count

3. **Add Comprehensive Logging**
   - Log subscription lifecycle
   - Log all error states
   - Structured logging (JSON) for debugging

4. **Implement Circuit Breaker Pattern**
   - Stop retrying after N failures in M seconds
   - Require manual intervention to reset
   - Alert user of persistent failures

5. **Cache Channel State**
   - Track whether channel is "ready"
   - Don't send events until SUBSCRIBED
   - Buffer changes during reconnection

---

## 11. Testing Recommendations

### 11.1 Unit Tests Needed

```typescript
// Test 1: Memory leak detection
it('should clear all debounce timers on unsubscribe', async () => {
  const service = RealtimeService.getInstance();
  await service.subscribeToProject('proj-1');

  // Simulate changes
  service.handleChange('chapters', { eventType: 'UPDATE', new: { id: 'ch-1' } });
  service.handleChange('sections', { eventType: 'UPDATE', new: { id: 'sec-1' } });

  // Verify timers exist
  expect(service['debounceTimers'].size).toBeGreaterThan(0);

  // Unsubscribe
  await service.unsubscribeFromProject('proj-1');

  // All timers should be cleared
  expect(service['debounceTimers'].size).toBe(0);
});

// Test 2: Local change race condition
it('should not skip remote changes after local edit completes', async () => {
  const { getActiveSection, updateContent } = useSections(projectId);

  // Simulate local edit
  await updateContent(sectionId, 'New content');

  // Immediately simulate remote change
  await waitFor(() => {
    simulateRealtimeEvent({
      eventType: 'UPDATE',
      new: { id: sectionId, content: 'Remote change' },
    });
  });

  // Wait for debounce and local change flag reset
  await waitFor(
    () => {
      const active = await getActiveSection();
      expect(active.content).toBe('Remote change'); // Should see remote change
    },
    { timeout: 1000 },
  );
});

// Test 3: Duplicate event handling
it('should not process duplicate events', async () => {
  const mockUpdate = vi.spyOn(Chapters, 'create');

  const change = {
    eventType: 'UPDATE',
    new: { id: 'ch-1', title: 'Test', version: 1 },
  };

  // Simulate duplicate
  simulateRealtimeEvent(change);
  simulateRealtimeEvent(change);

  await waitFor(() => {
    // Should only update once
    expect(mockUpdate).toHaveBeenCalledTimes(1);
  });
});
```

### 11.2 Integration Tests

1. Multi-tab sync coordination
2. Offline → online recovery
3. Network flapping scenarios
4. Large dataset sync performance
5. Concurrent edits conflict resolution

### 11.3 E2E Tests

1. Cross-device sync (browser + mobile)
2. 30-minute offline period
3. Airplane mode toggle
4. VPN reconnection
5. 3G network conditions

---

## 12. Summary Table

| Area                   | Status              | Risk   | Recommendation             |
| ---------------------- | ------------------- | ------ | -------------------------- |
| Subscription Setup     | Implemented         | LOW    | Add auth checks            |
| Lifecycle Management   | Implemented         | MEDIUM | Fix cleanup code           |
| Memory Leaks           | Not Addressed       | HIGH   | Urgent fix needed          |
| Race Conditions        | Partially Mitigated | MEDIUM | Improve flag handling      |
| Error Handling         | Basic               | HIGH   | Add recovery logic         |
| Reconnection           | Implemented         | MEDIUM | Add exponential backoff    |
| Multi-Tab Coordination | Not Implemented     | HIGH   | Implement BroadcastChannel |
| Network Interruptions  | Handled             | MEDIUM | Add stability checks       |
| Duplicate Events       | Not Addressed       | MEDIUM | Implement dedup            |
| Performance            | Unoptimized         | MEDIUM | Add batching/pooling       |

---

## Conclusion

The Realtime subscription implementation in Inkwell is **functionally complete** but suffers from **critical memory leaks**, **race condition vulnerabilities**, and **missing multi-device coordination**. The codebase would benefit from:

1. **Immediate:** Fix memory leaks in debounce timers and listeners
2. **Urgent:** Implement duplicate event detection
3. **High Priority:** Add multi-tab coordination
4. **Important:** Improve error recovery and user feedback

The system works for single-device, light-usage scenarios but will degrade under:

- Multi-device concurrent editing
- Long-running browser sessions (memory accumulation)
- Network instability (retries without backoff)
- High-frequency updates (duplicate processing)

Estimated remediation time: **2-3 sprints** for comprehensive fixes.
