# Real-Time Sync Integration Example

**Status:** ✅ Ready to integrate
**Files Created:**

- [src/services/chaptersSyncService.ts](../src/services/chaptersSyncService.ts) ✅
- [src/hooks/useChaptersHybrid.ts](../src/hooks/useChaptersHybrid.ts) ✅
- [src/components/Chapters/RealtimeStatus.tsx](../src/components/Chapters/RealtimeStatus.tsx) ✅

---

## Quick Integration Guide

### Step 1: Import the Hook and Component

**In your WritingPanel.tsx or similar:**

```tsx
import { useChaptersHybrid } from '@/hooks/useChaptersHybrid';
import { RealtimeStatus } from '@/components/Chapters/RealtimeStatus';
```

---

### Step 2: Use the Hook

```tsx
export function WritingPanel({ projectId }: { projectId: string }) {
  const {
    chapters,
    activeId,
    getActiveChapter,
    setActive,
    createChapter,
    renameChapter,
    deleteChapter,
    reorderChapters,
    updateContent,
    syncing,
    lastSynced,
    syncNow,
    realtimeConnected,
    liveUpdateReceived,
  } = useChaptersHybrid(projectId);

  // ... rest of your component
}
```

---

### Step 3: Add the Status Component

**In your UI (typically in a header or toolbar):**

```tsx
<div className="flex items-center justify-between border-b bg-slate-900">
  {/* Your existing chapter tabs or navigation */}
  <div className="flex items-center gap-2">{/* Chapter list, tabs, etc. */}</div>

  {/* Real-time Status Indicator */}
  <RealtimeStatus
    connected={realtimeConnected}
    liveUpdate={liveUpdateReceived}
    syncing={syncing}
    lastSynced={lastSynced}
    onSync={syncNow}
  />
</div>
```

---

### Step 4: Display Chapters

```tsx
<div className="p-4">
  <h2>Chapters</h2>
  <ul>
    {chapters.map((chapter) => (
      <li key={chapter.id}>
        <button
          onClick={() => setActive(chapter.id)}
          className={activeId === chapter.id ? 'font-bold' : ''}
        >
          {chapter.title} ({chapter.wordCount} words)
        </button>
        <button onClick={() => deleteChapter(chapter.id)}>Delete</button>
      </li>
    ))}
  </ul>

  <button onClick={() => createChapter('New Chapter')}>+ Add Chapter</button>
</div>
```

---

### Step 5: Edit Content

```tsx
<div className="editor">
  {activeId && (
    <ChapterEditor
      chapterId={activeId}
      onContentChange={(content) => updateContent(activeId, content)}
    />
  )}
</div>
```

---

## Complete Example

```tsx
// src/components/Panels/WritingPanel.tsx
import React, { useState, useEffect } from 'react';
import { useChaptersHybrid } from '@/hooks/useChaptersHybrid';
import { RealtimeStatus } from '@/components/Chapters/RealtimeStatus';

export function WritingPanel({ projectId }: { projectId: string }) {
  const {
    chapters,
    activeId,
    getActiveChapter,
    setActive,
    createChapter,
    renameChapter,
    deleteChapter,
    reorderChapters,
    updateContent,
    syncing,
    lastSynced,
    syncNow,
    realtimeConnected,
    liveUpdateReceived,
  } = useChaptersHybrid(projectId);

  const [activeContent, setActiveContent] = useState('');

  // Load active chapter content
  useEffect(() => {
    if (activeId) {
      getActiveChapter().then((chapter) => {
        if (chapter) {
          setActiveContent(chapter.content);
        }
      });
    }
  }, [activeId]);

  return (
    <div className="flex h-full flex-col bg-slate-950 text-slate-200">
      {/* Header with Status */}
      <div className="flex items-center justify-between border-b bg-slate-900">
        <div className="px-4 py-2">
          <h1 className="text-lg font-semibold">Writing</h1>
        </div>

        <RealtimeStatus
          connected={realtimeConnected}
          liveUpdate={liveUpdateReceived}
          syncing={syncing}
          lastSynced={lastSynced}
          onSync={syncNow}
        />
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Chapter List Sidebar */}
        <aside className="w-64 border-r bg-slate-950 p-3">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
              Chapters ({chapters.length})
            </h2>
            <button
              onClick={() => createChapter()}
              className="rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-500"
            >
              + Add
            </button>
          </div>

          <ul className="space-y-1">
            {chapters.map((ch) => (
              <li key={ch.id}>
                <button
                  onClick={() => setActive(ch.id)}
                  className={`w-full rounded px-2 py-1.5 text-left text-sm transition-colors ${
                    activeId === ch.id ? 'bg-slate-800 text-blue-400' : 'hover:bg-slate-800'
                  }`}
                >
                  <div className="truncate font-medium">{ch.title}</div>
                  <div className="text-xs text-slate-500">{ch.wordCount} words</div>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {/* Editor */}
        <main className="flex-1 overflow-auto">
          {activeId ? (
            <div className="p-6">
              <input
                type="text"
                value={chapters.find((c) => c.id === activeId)?.title || ''}
                onChange={(e) => renameChapter(activeId, e.target.value)}
                className="mb-4 w-full border-b bg-transparent text-2xl font-bold outline-none"
                placeholder="Chapter Title"
              />

              <textarea
                value={activeContent}
                onChange={(e) => {
                  setActiveContent(e.target.value);
                  updateContent(activeId, e.target.value);
                }}
                className="h-full w-full resize-none bg-transparent outline-none"
                placeholder="Start writing..."
              />
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-slate-500">
              Select or create a chapter to begin writing.
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
```

---

## Testing the Integration

### Test 1: Create Chapter

1. Click "+ Add" button
2. See new "Untitled Chapter" appear in sidebar
3. Chapter automatically becomes active

**Expected:** New chapter in list, editor opens

---

### Test 2: Edit Content

1. Type in the editor
2. Wait 600ms (debounce delay)
3. Check browser console for "[Hook] Updated content"

**Expected:** Content saved to IndexedDB

---

### Test 3: Real-Time Sync (Multi-Tab)

1. Open same project in two tabs
2. Tab A: Create chapter "Test"
3. Tab B: See green flash "Live update"
4. Tab B: See "Test" chapter appear

**Expected:** ~2 second latency

---

### Test 4: Manual Sync

1. Click "Sync" button
2. See button change to "Syncing" with spinning icon
3. After completion, see status return to "Sync"

**Expected:** Manual sync completes, lastSynced updates

---

### Test 5: Offline Mode

1. Disconnect network (toggle WiFi off)
2. See status change from "Live" (green) to "Offline" (gray)
3. Edit chapters (still works locally)
4. Reconnect network
5. See status change back to "Live"
6. Auto-sync triggers

**Expected:** Graceful offline operation

---

## Debugging

### Enable Console Logs

All functions log to console with prefixes:

- `[Hook]` - useChaptersHybrid hook
- `[Sync]` - chaptersSyncService
- `[Realtime]` - Real-time subscriptions

**Filter in console:**

```javascript
// Show only sync logs
console.filter('[Sync]');

// Show only realtime logs
console.filter('[Realtime]');
```

---

### Check Supabase Connection

```javascript
// In browser console
supabase.getChannels();
// Expected: [RealtimeChannel { state: 'joined' }]
```

---

### Verify IndexedDB

```javascript
// In browser DevTools → Application → IndexedDB
// Should see: inkwell_chapters
//   - chapter_meta (your chapters)
//   - chapter_docs (your content)
```

---

## Common Issues

### Issue: "Live" status not showing

**Solution:**

1. Check Supabase Realtime is enabled (Step 1)
2. Verify `chapters` table is in replication:
   ```sql
   select * from pg_publication_tables where tablename = 'chapters';
   ```

---

### Issue: Changes not syncing

**Solution:**

1. Check browser console for errors
2. Verify Supabase URL and API key in `.env`
3. Test manual sync button - does it error?

---

### Issue: "Cannot find module '@/lib/supabase'"

**Solution:**
Update import in `chaptersSyncService.ts`:

```typescript
// Change this:
import { supabase } from '@/lib/supabase';

// To match your actual path, e.g.:
import { supabase } from '@/supabase/client';
```

---

## Next Steps

1. ✅ Test in development
2. ✅ Verify multi-tab sync
3. ✅ Test on mobile (if PWA)
4. ✅ Deploy to production
5. ✅ Monitor Supabase Dashboard for realtime connections

---

**Version:** 1.0
**Last Updated:** November 2025
**Status:** Ready for production
