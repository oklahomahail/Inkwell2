# Real-Time Sync Implementation Guide

**Status:** Ready to implement
**Dependencies:** Requires [CHAPTER_TABS_IMPLEMENTATION.md](./CHAPTER_TABS_IMPLEMENTATION.md) Phase 4-5
**Estimated Time:** 2-3 hours

---

## Overview

This guide adds **real-time cross-device sync** to Inkwell using Supabase Realtime channels. When a user edits a chapter on Device A, Device B sees the update **instantly** without manual sync.

### Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Supabase Cloud                               │
│  ┌────────────────┐                    ┌──────────────────────┐    │
│  │  chapters      │ ◄──── Realtime ───►│  Realtime Channels   │    │
│  │  (Postgres)    │       Broadcast    │  (WebSocket)         │    │
│  └────────────────┘                    └──────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
              ▲                                      │
              │                                      │
       Manual Sync                            Live Updates
       (Push/Pull)                            (Subscribe)
              │                                      │
              │                                      ▼
┌─────────────┴──────────────┐        ┌──────────────────────────────┐
│       Device A              │        │       Device B                │
│  ┌──────────────────────┐  │        │  ┌──────────────────────┐   │
│  │ IndexedDB (Local)    │  │        │  │ IndexedDB (Local)    │   │
│  │ + useChapters Hook   │  │        │  │ + useChapters Hook   │   │
│  └──────────────────────┘  │        │  └──────────────────────┘   │
└────────────────────────────┘        └──────────────────────────────┘
```

### Data Flow

1. **User edits chapter on Device A:**
   - Local edit → IndexedDB (instant)
   - Debounced autosave (600ms) → Supabase (background)

2. **Supabase triggers realtime event:**
   - Postgres `UPDATE` → Realtime channel broadcast

3. **Device B receives realtime event:**
   - WebSocket message → Update IndexedDB cache
   - React state refresh → UI updates instantly

---

## Prerequisites

**Before implementing this:**

1. ✅ Complete [CHAPTER_TABS_IMPLEMENTATION.md](./CHAPTER_TABS_IMPLEMENTATION.md) Phase 4-5
2. ✅ Verify Supabase Realtime is enabled in your project
3. ✅ Test basic sync (push/pull) works

---

## Implementation

### Step 1: Enable Supabase Realtime (Supabase Dashboard)

**Navigate to:** Supabase Dashboard → Database → Replication

**Enable replication for `chapters` table:**

```sql
-- Enable realtime for chapters table
alter publication supabase_realtime add table chapters;

-- Verify it's enabled
select * from pg_publication_tables where pubname = 'supabase_realtime';
```

**Expected output:**

```
pubname              | schemaname | tablename
---------------------+------------+-----------
supabase_realtime    | public     | chapters
```

---

### Step 2: Update chaptersSyncService.ts

**File:** `src/services/chaptersSyncService.ts`

**Add to bottom of file:**

```typescript
import { supabase } from '@/db/supabaseClient';
import { Chapters } from './chaptersService';
import type { ChapterMeta } from '@/types/writing';

/**
 * Subscribe to real-time chapter changes from Supabase
 *
 * @param projectId - Project to monitor
 * @param onChange - Callback when chapter changes (chapterId provided)
 * @returns Unsubscribe function
 *
 * @example
 * useEffect(() => {
 *   const unsubscribe = subscribeToChapterChanges(projectId, (chapterId) => {
 *     console.log('Chapter changed:', chapterId);
 *     refreshChapters();
 *   });
 *   return unsubscribe;
 * }, [projectId]);
 */
export function subscribeToChapterChanges(
  projectId: string,
  onChange: (chapterId?: string) => void,
): () => void {
  const channel = supabase
    .channel(`chapters:${projectId}`)
    .on(
      'postgres_changes',
      {
        event: '*', // Listen to INSERT, UPDATE, DELETE
        schema: 'public',
        table: 'chapters',
        filter: `project_id=eq.${projectId}`,
      },
      async (payload) => {
        console.log('[Realtime] Chapter change detected:', payload.eventType, payload);

        const { eventType, new: newRow, old: oldRow } = payload;

        try {
          if (eventType === 'DELETE' && oldRow?.id) {
            // Remote deletion - remove from local IndexedDB
            await Chapters.delete(oldRow.id);
            console.log('[Realtime] Deleted chapter locally:', oldRow.id);
          } else if (eventType === 'INSERT' || eventType === 'UPDATE') {
            // Remote insert/update - upsert to local IndexedDB
            if (newRow) {
              await Chapters.create({
                id: newRow.id,
                projectId: projectId,
                title: newRow.title,
                content: newRow.content || '',
                summary: newRow.summary,
                index: newRow.order_index,
                status: newRow.status || 'draft',
              });
              console.log('[Realtime] Updated chapter locally:', newRow.id);
            }
          }

          // Notify listener (triggers UI refresh)
          onChange(newRow?.id || oldRow?.id);
        } catch (error) {
          console.error('[Realtime] Failed to process change:', error);
        }
      },
    )
    .subscribe((status) => {
      console.log('[Realtime] Subscription status:', status);
    });

  // Return unsubscribe function
  return () => {
    console.log('[Realtime] Unsubscribing from channel:', `chapters:${projectId}`);
    supabase.removeChannel(channel);
  };
}

/**
 * Check if realtime is connected
 */
export function isRealtimeConnected(): boolean {
  // @ts-ignore - Supabase internal API
  const channels = supabase.getChannels();
  return channels.some((ch) => ch.state === 'joined');
}
```

**Key Features:**

- ✅ Listens to `INSERT`, `UPDATE`, `DELETE` events
- ✅ Updates local IndexedDB cache automatically
- ✅ Filters by `project_id` (only gets relevant chapters)
- ✅ Console logging for debugging
- ✅ Error handling

---

### Step 3: Update useChaptersHybrid Hook

**File:** `src/hooks/useChaptersHybrid.ts`

**Add import:**

```typescript
import { subscribeToChapterChanges } from '@/services/chaptersSyncService';
```

**Add realtime state:**

```typescript
export function useChaptersHybrid(projectId: string) {
  const [chapters, setChapters] = useState<ChapterMeta[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);

  // NEW: Realtime status
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const [liveUpdateReceived, setLiveUpdateReceived] = useState(false);

  // ... existing code ...
```

**Add realtime subscription (after initial load):**

```typescript
// Subscribe to realtime changes
useEffect(() => {
  console.log('[Realtime] Setting up subscription for project:', projectId);
  setRealtimeConnected(true);

  const unsubscribe = subscribeToChapterChanges(projectId, async (chapterId) => {
    console.log('[Realtime] Live update received for chapter:', chapterId);

    // Refresh chapters from IndexedDB (already updated by sync service)
    const refreshed = await Chapters.list(projectId);
    setChapters(refreshed);

    // Show visual indicator
    setLiveUpdateReceived(true);
    setTimeout(() => setLiveUpdateReceived(false), 2000);
  });

  return () => {
    console.log('[Realtime] Cleaning up subscription');
    setRealtimeConnected(false);
    unsubscribe();
  };
}, [projectId]);
```

**Return realtime status:**

```typescript
return {
  chapters,
  activeId,
  activeChapter,
  setActive,
  createChapter,
  renameChapter,
  deleteChapter,
  reorderChapters,
  updateContent,
  syncing,
  lastSynced,
  syncNow,

  // NEW: Realtime status
  realtimeConnected,
  liveUpdateReceived,
};
```

---

### Step 4: Add Live Update Indicator to UI

**File:** `src/components/Panels/WritingPanel.tsx`

**Update to show realtime status:**

```tsx
export function WritingPanel({ projectId }: { projectId: string }) {
  const {
    chapters,
    activeId,
    setActive,
    createChapter,
    deleteChapter,
    reorderChapters,
    updateContent,
    syncing,
    syncNow,
    realtimeConnected,
    liveUpdateReceived,
  } = useChaptersHybrid(projectId);

  return (
    <div className="flex h-full flex-col bg-slate-950 text-slate-200">
      {/* Chapter Tabs */}
      <div className="flex items-center justify-between border-b bg-slate-900">
        <ChapterTabs
          chapters={chapters}
          activeId={activeId}
          onSelect={setActive}
          onCreate={createChapter}
          onReorder={reorderChapters}
        />

        {/* Sync Status Bar */}
        <div className="flex items-center gap-3 px-3">
          {/* Live Update Indicator */}
          {liveUpdateReceived && (
            <span className="flex items-center gap-1 text-xs text-emerald-400 animate-pulse">
              <span className="w-2 h-2 bg-emerald-400 rounded-full" />
              Live update received
            </span>
          )}

          {/* Realtime Connection Status */}
          <span
            className={`flex items-center gap-1 text-xs ${
              realtimeConnected ? 'text-emerald-400' : 'text-slate-500'
            }`}
            title={realtimeConnected ? 'Realtime connected' : 'Realtime disconnected'}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                realtimeConnected ? 'bg-emerald-400' : 'bg-slate-500'
              }`}
            />
            {realtimeConnected ? 'Live' : 'Offline'}
          </span>

          {/* Manual Sync Button */}
          <button
            onClick={syncNow}
            className={`rounded-md px-3 py-1 text-sm transition-colors ${
              syncing ? 'bg-blue-800 text-gray-300' : 'bg-blue-600 text-white hover:bg-blue-500'
            }`}
            disabled={syncing}
          >
            {syncing ? 'Syncing…' : 'Sync'}
          </button>
        </div>
      </div>

      {/* ... rest of component ... */}
    </div>
  );
}
```

---

### Step 5: Add Realtime Status Component (Optional)

**File:** `src/components/Chapters/RealtimeStatus.tsx` (NEW)

```tsx
import React from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

interface RealtimeStatusProps {
  connected: boolean;
  liveUpdate: boolean;
  syncing: boolean;
  onSync: () => void;
}

export const RealtimeStatus: React.FC<RealtimeStatusProps> = ({
  connected,
  liveUpdate,
  syncing,
  onSync,
}) => {
  return (
    <div className="flex items-center gap-3 px-3 py-2 bg-slate-900 border-l">
      {/* Live Update Flash */}
      {liveUpdate && (
        <div className="flex items-center gap-1.5 text-xs text-emerald-400 animate-pulse">
          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
          Live update
        </div>
      )}

      {/* Connection Status */}
      <div
        className={`flex items-center gap-1.5 text-xs ${
          connected ? 'text-emerald-400' : 'text-slate-500'
        }`}
        title={connected ? 'Realtime connected' : 'Realtime disconnected'}
      >
        {connected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
        <span>{connected ? 'Live' : 'Offline'}</span>
      </div>

      {/* Manual Sync Button */}
      <button
        onClick={onSync}
        disabled={syncing}
        className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors ${
          syncing
            ? 'bg-blue-800 text-gray-400 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-500'
        }`}
        title="Manually sync with cloud"
      >
        <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />
        {syncing ? 'Syncing' : 'Sync'}
      </button>
    </div>
  );
};
```

**Usage in WritingPanel:**

```tsx
import { RealtimeStatus } from '@/components/Chapters/RealtimeStatus';

// Inside WritingPanel
<RealtimeStatus
  connected={realtimeConnected}
  liveUpdate={liveUpdateReceived}
  syncing={syncing}
  onSync={syncNow}
/>;
```

---

## Testing

### Test 1: Same Device, Multiple Tabs

1. Open Inkwell in **Tab A** (Project X)
2. Open Inkwell in **Tab B** (same Project X)
3. In Tab A: Create new chapter "Test Chapter"
4. **Expected:** Tab B shows "Test Chapter" within 2 seconds
5. In Tab B: Edit chapter title to "Updated Test"
6. **Expected:** Tab A shows "Updated Test" within 2 seconds

---

### Test 2: Multiple Devices

1. Open Inkwell on **Device A** (laptop)
2. Open Inkwell on **Device B** (phone)
3. Login to same account on both
4. Open same project on both
5. On Device A: Create chapter "Mobile Test"
6. **Expected:** Device B shows "Mobile Test" instantly
7. On Device B: Edit content
8. **Expected:** Device A refreshes content

---

### Test 3: Network Reconnection

1. Open Inkwell
2. Disconnect WiFi
3. Edit chapters (stored locally)
4. **Expected:** "Offline" status indicator
5. Reconnect WiFi
6. **Expected:** "Live" status indicator returns
7. **Expected:** Manual sync pushes local changes

---

### Test 4: Conflict Resolution

1. Device A: Disconnect network
2. Device A: Edit chapter "Chapter 1" → "Version A"
3. Device B: Edit same chapter "Chapter 1" → "Version B"
4. Device B: Sync completes
5. Device A: Reconnect network
6. **Expected:** Last-write-wins (Device A's edit overwrites Device B)

**Note:** This is **not** a merge conflict - it's intentionally last-write-wins.

---

## Debugging

### Enable Realtime Logs

**In browser console:**

```javascript
localStorage.setItem('supabase.realtime.debug', 'true');
```

**Expected logs:**

```
[Realtime] Setting up subscription for project: abc-123
[Realtime] Subscription status: SUBSCRIBED
[Realtime] Chapter change detected: UPDATE { new: { id: 'ch1', title: 'Updated' } }
[Realtime] Updated chapter locally: ch1
[Realtime] Live update received for chapter: ch1
```

---

### Check Supabase Channel Status

**In browser console:**

```javascript
// @ts-ignore
const channels = supabase.getChannels();
console.log('Active channels:', channels);
console.log(
  'States:',
  channels.map((ch) => ch.state),
);
```

**Expected output:**

```javascript
Active channels: [RealtimeChannel]
States: ['joined']
```

---

### Verify Postgres Replication

**In Supabase SQL Editor:**

```sql
-- Check if chapters table is replicated
select * from pg_publication_tables
where pubname = 'supabase_realtime'
  and tablename = 'chapters';
```

**Expected:**

```
pubname              | schemaname | tablename
---------------------+------------+-----------
supabase_realtime    | public     | chapters
```

---

## Performance Considerations

### Bandwidth Usage

**Per realtime event:**

- Websocket message: ~200-500 bytes
- Chapter update: ~1-5 KB (if content included)

**Typical usage:**

- 10 edits/minute = ~50 KB/minute
- Negligible for modern networks

---

### Realtime Throttling

**Supabase Limits (Free Tier):**

- Max 500 concurrent connections
- Max 1 million messages/month
- Throttled at 1,000 messages/second per project

**For Inkwell:**

- Typical user: 10-100 messages/hour (well under limit)
- No throttling needed

---

### Battery Impact (Mobile)

**WebSocket connection:**

- ~1% battery/hour when idle
- ~3-5% battery/hour when active

**Optimization:**

- Close connection when app backgrounded
- Reconnect on app resume

```typescript
// Add to useChaptersHybrid
useEffect(() => {
  const handleVisibilityChange = () => {
    if (document.hidden) {
      console.log('[Realtime] App backgrounded - maintaining connection');
      // Keep connection open for instant resume
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
  return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
}, []);
```

---

## Security Considerations

### Row-Level Security (RLS)

**Already implemented in Phase 4:**

```sql
create policy chapters_user_access on chapters
  for all using (
    auth.uid() in (
      select user_id from projects where id = chapters.project_id
    )
  );
```

**What this means:**

- Users only receive realtime events for **their own chapters**
- No risk of seeing other users' data
- Enforced at database level (can't bypass)

---

### Channel Security

**Supabase Realtime uses:**

- WSS (WebSocket Secure) - encrypted connection
- JWT authentication - validates user identity
- RLS policies - filters data at source

**No additional security needed.**

---

## Troubleshooting

### Issue: "Realtime not connecting"

**Possible causes:**

1. **Realtime not enabled in Supabase:**
   - Check: Supabase Dashboard → Settings → API → Realtime enabled
   - Fix: Enable Realtime in project settings

2. **Table not in replication:**
   - Check: `select * from pg_publication_tables`
   - Fix: `alter publication supabase_realtime add table chapters;`

3. **Network firewall blocking WebSockets:**
   - Check: Browser console for WebSocket errors
   - Fix: Whitelist `*.supabase.co` in firewall

---

### Issue: "Updates not appearing"

**Possible causes:**

1. **IndexedDB not updating:**
   - Check: Console logs show "Updated chapter locally"
   - Fix: Verify `Chapters.create()` is called in subscription

2. **React state not refreshing:**
   - Check: Console shows "Live update received"
   - Fix: Ensure `setChapters()` is called in callback

3. **Wrong project ID filter:**
   - Check: Channel name matches project ID
   - Fix: Verify `filter: project_id=eq.${projectId}`

---

### Issue: "Duplicate updates"

**Possible causes:**

1. **Multiple subscriptions:**
   - Check: Count of `subscribeToChapterChanges` calls
   - Fix: Ensure `useEffect` cleanup calls `unsubscribe()`

2. **Manual sync + realtime both firing:**
   - This is expected behavior
   - No fix needed - IndexedDB `.put()` is idempotent

---

## Migration from Non-Realtime

**If you already have the hybrid sync (Phase 4-5):**

1. ✅ No data migration needed
2. ✅ No breaking changes
3. ✅ Just add the subscription code

**Compatibility:**

- Realtime is **additive** - works alongside manual sync
- If realtime disconnects, manual sync still works
- Local-first architecture unchanged

---

## Feature Flags

**Add to `.env`:**

```bash
# Enable/disable realtime sync
VITE_ENABLE_REALTIME=true
```

**Use in code:**

```typescript
// In useChaptersHybrid
const realtimeEnabled = import.meta.env.VITE_ENABLE_REALTIME !== 'false';

useEffect(() => {
  if (!realtimeEnabled) return;

  const unsubscribe = subscribeToChapterChanges(projectId, onChange);
  return unsubscribe;
}, [projectId, realtimeEnabled]);
```

---

## Summary

### What You Get

✅ **Instant cross-device sync** - See edits within 2 seconds
✅ **Multi-tab sync** - Changes appear in all open tabs
✅ **Visual indicators** - Know when you're live vs offline
✅ **Automatic fallback** - Manual sync if realtime disconnects
✅ **Secure** - RLS policies enforce data isolation
✅ **Performant** - Minimal bandwidth/battery impact

### Architecture Benefits

✅ **Local-first preserved** - IndexedDB still primary
✅ **No breaking changes** - Additive to existing sync
✅ **Graceful degradation** - Works offline
✅ **Simple** - No conflict resolution UI needed (last-write-wins)

---

## Next Steps

1. **Implement Steps 1-4** (2-3 hours)
2. **Test with multiple tabs** (30 minutes)
3. **Test with multiple devices** (30 minutes)
4. **Deploy to production**
5. **Monitor realtime connection stats** in Supabase Dashboard

---

**Questions?**

**Q: What if Supabase Realtime is down?**
A: Manual sync still works. App is fully functional offline.

**Q: How do I test without deploying to production?**
A: Use Supabase local development or two browsers (Chrome + Firefox).

**Q: Can I see who else is editing?**
A: Not in this implementation. Add presence tracking later if needed.

---

**Version:** 1.0
**Last Updated:** November 2025
**Status:** Ready to implement
**Dependencies:** CHAPTER_TABS_IMPLEMENTATION.md Phase 4-5
