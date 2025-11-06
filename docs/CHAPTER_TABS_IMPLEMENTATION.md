# Chapter Tabs Implementation Guide

**Status:** Ready to implement
**Target:** v1.0.0-rc.1
**Estimated Time:** 2-3 days

---

## Overview

This document outlines the implementation of a **modular chapter navigation system** for Inkwell, featuring:

1. **Horizontal chapter tabs** (Google Docs-style)
2. **Sidebar navigator** (Scrivener-style)
3. **Drag-and-drop reordering**
4. **Hybrid sync** (IndexedDB ↔ Supabase)
5. **Debounced autosave**

---

## Current State Analysis

### ✅ What Already Exists

**Type Definitions:**

- `Chapter` in [src/types/project.ts](../src/types/project.ts) ✅
- `ChapterMeta`, `ChapterDoc`, `FullChapter` in [src/types/writing.ts](../src/types/writing.ts) ✅

**Services:**

- `chaptersService.ts` - IndexedDB with meta/doc split ✅
- Split storage: `chapter_meta` + `chapter_docs` ✅

**State Management:**

- `ChaptersContext.tsx` - React Context with reducer ✅
- `useChaptersStore.ts` - Zustand store (stub) ⚠️

**Current Schema:**

```typescript
interface Chapter {
  id: string;
  title: string;
  content: string;
  order: number; // Position in book
  wordCount: number;
  status: ChapterStatus;
  createdAt: number | Date;
  updatedAt: number | Date;
  // ... other fields
}
```

### ⚠️ What Needs to Be Built

1. **UI Components** - Chapter tabs and sidebar
2. **Drag-and-drop** - Visual reordering
3. **Hybrid sync** - Supabase cloud persistence
4. **Integration** - Wire into WritingPanel

---

## Implementation Plan

### Phase 1: Type Extensions (30 minutes)

**Goal:** Ensure Chapter type supports hybrid sync

**File:** `src/types/writing.ts`

**Changes Needed:**

1. Add `projectId` to `ChapterMeta` if missing
2. Ensure `updatedAt` is always string (ISO 8601)
3. Add sync status field

```typescript
export interface ChapterMeta {
  id: string;
  projectId: string;
  title: string;
  index: number; // 0-based display order
  summary?: string;
  status: 'draft' | 'revising' | 'final';
  wordCount: number;
  tags?: string[];
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601

  // NEW: Hybrid sync support
  syncStatus?: 'synced' | 'pending' | 'conflict';
  lastSyncedAt?: string; // ISO 8601
}
```

**No breaking changes** - these are additive fields.

---

### Phase 2: ChapterTabs Component (2 hours)

**Goal:** Horizontal scrolling tabs with create/select/reorder

**File:** `src/components/Chapters/ChapterTabs.tsx` (NEW)

**Dependencies:**

- `@dnd-kit/core` - Already in package.json ✅
- `clsx` - Already in package.json ✅

**Component Structure:**

```tsx
import React from 'react';
import clsx from 'clsx';
import { DndContext, closestCenter, useDraggable, useDroppable, DragEndEvent } from '@dnd-kit/core';
import type { ChapterMeta } from '@/types/writing';

interface ChapterTabsProps {
  chapters: ChapterMeta[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onReorder: (newOrder: ChapterMeta[]) => void;
}

export const ChapterTabs: React.FC<ChapterTabsProps> = ({
  chapters,
  activeId,
  onSelect,
  onCreate,
  onReorder,
}) => {
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = chapters.findIndex((c) => c.id === active.id);
    const newIndex = chapters.findIndex((c) => c.id === over.id);

    const reordered = [...chapters];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);
    onReorder(reordered);
  };

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="flex items-center gap-2 overflow-x-auto border-b bg-slate-900 px-3 py-2">
        <button
          onClick={onCreate}
          className="rounded-md bg-slate-700 px-3 py-1 text-sm text-white hover:bg-slate-600 transition-colors shrink-0"
          aria-label="Create new chapter"
        >
          + New Chapter
        </button>
        {chapters.map((ch) => (
          <DraggableTab
            key={ch.id}
            id={ch.id}
            title={ch.title}
            wordCount={ch.wordCount}
            active={activeId === ch.id}
            syncStatus={ch.syncStatus}
            onSelect={() => onSelect(ch.id)}
          />
        ))}
      </div>
    </DndContext>
  );
};

const DraggableTab: React.FC<{
  id: string;
  title: string;
  wordCount: number;
  active: boolean;
  syncStatus?: 'synced' | 'pending' | 'conflict';
  onSelect: () => void;
}> = ({ id, title, wordCount, active, syncStatus, onSelect }) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id });
  const { setNodeRef: setDropRef } = useDroppable({ id });

  return (
    <button
      ref={(node) => {
        setNodeRef(node);
        setDropRef(node);
      }}
      {...listeners}
      {...attributes}
      onClick={onSelect}
      className={clsx(
        'cursor-move rounded-md px-3 py-1.5 text-sm transition-colors shrink-0 relative',
        active
          ? 'bg-blue-600 text-white ring-2 ring-blue-400'
          : 'text-slate-300 hover:bg-slate-800',
      )}
      style={{
        transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
      }}
      title={`${title} (${wordCount} words)`}
    >
      <span className="truncate max-w-[200px] block">{title || 'Untitled'}</span>
      {syncStatus === 'pending' && (
        <span className="absolute top-0 right-0 w-2 h-2 bg-yellow-400 rounded-full" />
      )}
    </button>
  );
};
```

**Styling Notes:**

- Uses existing Tailwind classes
- Horizontal scroll with `overflow-x-auto`
- Active tab has blue ring (`ring-2 ring-blue-400`)
- Truncates long titles at 200px
- Shows yellow dot for unsync'd chapters

---

### Phase 3: SidebarNavigator Component (1 hour)

**Goal:** Collapsible sidebar list of all chapters

**File:** `src/components/Chapters/SidebarNavigator.tsx` (NEW)

**Component Structure:**

```tsx
import React from 'react';
import { Trash2 } from 'lucide-react';
import type { ChapterMeta } from '@/types/writing';

interface SidebarNavigatorProps {
  chapters: ChapterMeta[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
}

export const SidebarNavigator: React.FC<SidebarNavigatorProps> = ({
  chapters,
  activeId,
  onSelect,
  onCreate,
  onDelete,
}) => {
  return (
    <aside className="w-64 border-r bg-slate-950 p-3 text-slate-200 flex flex-col h-full">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
        Chapters ({chapters.length})
      </h2>
      <ul className="space-y-1 flex-1 overflow-y-auto">
        {chapters.map((ch) => (
          <li key={ch.id}>
            <button
              onClick={() => onSelect(ch.id)}
              className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm hover:bg-slate-800 transition-colors ${
                activeId === ch.id ? 'bg-slate-800 text-blue-400' : ''
              }`}
              title={`${ch.title} - ${ch.wordCount} words`}
            >
              <span className="truncate flex-1">{ch.title || 'Untitled'}</span>
              <span className="text-xs text-slate-500 ml-2 shrink-0">
                {formatWordCount(ch.wordCount)}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`Delete "${ch.title}"?`)) {
                    onDelete(ch.id);
                  }
                }}
                className="ml-2 text-xs text-slate-500 hover:text-red-500 transition-colors shrink-0"
                aria-label={`Delete ${ch.title}`}
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </button>
          </li>
        ))}
      </ul>
      <button
        onClick={onCreate}
        className="mt-3 w-full rounded-md bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-500 transition-colors"
      >
        + Add Chapter
      </button>
    </aside>
  );
};

function formatWordCount(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return count.toString();
}
```

**Features:**

- Shows word count per chapter
- Delete button with confirmation
- Scrollable list (overflow-y-auto)
- Active chapter highlighted

---

### Phase 4: Hybrid Sync Service (3 hours)

**Goal:** Sync IndexedDB ↔ Supabase with conflict resolution

**File:** `src/services/chaptersSyncService.ts` (NEW)

**Supabase Schema:**

```sql
-- Create chapters table
create table chapters (
  id uuid primary key,
  project_id uuid not null,
  title text,
  content text,
  summary text,
  word_count integer default 0,
  order_index integer not null,
  status text check (status in ('draft', 'revising', 'final')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  constraint fk_project foreign key (project_id) references projects(id) on delete cascade
);

-- Index for project queries
create index idx_chapters_project_id on chapters (project_id);
create index idx_chapters_project_order on chapters (project_id, order_index);

-- Row-level security (RLS)
alter table chapters enable row level security;

create policy chapters_user_access on chapters
  for all using (
    auth.uid() in (
      select user_id from projects where id = chapters.project_id
    )
  );

-- Trigger to update updated_at
create or replace function update_chapters_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trigger_chapters_updated_at
  before update on chapters
  for each row
  execute function update_chapters_updated_at();
```

**Service Implementation:**

```typescript
// src/services/chaptersSyncService.ts
import { supabase } from '@/db/supabaseClient';
import { Chapters } from './chaptersService';
import type { ChapterMeta, FullChapter } from '@/types/writing';

/**
 * Push local chapters to Supabase (upload)
 */
export async function pushLocalChanges(projectId: string): Promise<void> {
  const local = await Chapters.list(projectId);
  if (!local.length) return;

  for (const ch of local) {
    // Get full chapter (meta + content)
    const full = await Chapters.get(ch.id);

    // Check if remote exists
    const { data: remote } = await supabase
      .from('chapters')
      .select('updated_at')
      .eq('id', ch.id)
      .maybeSingle();

    const localTime = new Date(ch.updatedAt).getTime();
    const remoteTime = remote ? new Date(remote.updated_at).getTime() : 0;

    // Only push if local is newer
    if (localTime > remoteTime) {
      await supabase.from('chapters').upsert({
        id: ch.id,
        project_id: projectId,
        title: ch.title,
        content: full.content,
        summary: ch.summary,
        word_count: ch.wordCount,
        order_index: ch.index,
        status: ch.status,
        updated_at: ch.updatedAt,
      });
    }
  }
}

/**
 * Pull remote chapters from Supabase (download)
 */
export async function pullRemoteChanges(projectId: string): Promise<ChapterMeta[]> {
  const { data: remote, error } = await supabase
    .from('chapters')
    .select('*')
    .eq('project_id', projectId)
    .order('order_index');

  if (error) throw error;
  if (!remote?.length) return [];

  const merged: ChapterMeta[] = [];

  for (const r of remote) {
    const localMeta = await Chapters.getMeta(r.id).catch(() => null);
    const remoteTime = new Date(r.updated_at).getTime();
    const localTime = localMeta ? new Date(localMeta.updatedAt).getTime() : 0;

    // Only pull if remote is newer
    if (remoteTime > localTime) {
      await Chapters.create({
        id: r.id,
        projectId: projectId,
        title: r.title,
        content: r.content,
        summary: r.summary,
        index: r.order_index,
        status: r.status,
      });

      merged.push({
        id: r.id,
        projectId: projectId,
        title: r.title,
        index: r.order_index,
        summary: r.summary,
        status: r.status,
        wordCount: r.word_count,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      });
    }
  }

  return merged;
}

/**
 * Full bidirectional sync
 */
export async function syncChapters(projectId: string): Promise<void> {
  await pushLocalChanges(projectId);
  await pullRemoteChanges(projectId);
}
```

---

### Phase 5: useChaptersHybrid Hook (2 hours)

**Goal:** React hook that manages chapters with hybrid sync

**File:** `src/hooks/useChaptersHybrid.ts` (NEW)

**Implementation:**

```typescript
import { useEffect, useState, useCallback } from 'react';
import { nanoid } from 'nanoid';
import { Chapters } from '@/services/chaptersService';
import { pushLocalChanges, pullRemoteChanges, syncChapters } from '@/services/chaptersSyncService';
import type { ChapterMeta, FullChapter, CreateChapterInput } from '@/types/writing';

const debounce = (fn: Function, delay = 500) => {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: any[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

export function useChaptersHybrid(projectId: string) {
  const [chapters, setChapters] = useState<ChapterMeta[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);

  // Load chapters on mount
  useEffect(() => {
    (async () => {
      const local = await Chapters.list(projectId);
      setChapters(local);

      // Restore last active chapter
      const lastActive = localStorage.getItem(`lastChapter-${projectId}`);
      if (lastActive && local.some((c) => c.id === lastActive)) {
        setActiveId(lastActive);
      } else if (local.length > 0) {
        setActiveId(local[0].id);
      }

      // Pull remote changes
      await pullRemoteChanges(projectId);
      const refreshed = await Chapters.list(projectId);
      setChapters(refreshed);
    })();
  }, [projectId]);

  // Auto-sync every 3 minutes
  useEffect(() => {
    const interval = setInterval(() => syncNow(), 3 * 60 * 1000);
    window.addEventListener('online', syncNow);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', syncNow);
    };
  }, [projectId]);

  // Sync now (manual trigger)
  const syncNow = async () => {
    setSyncing(true);
    try {
      await syncChapters(projectId);
      const refreshed = await Chapters.list(projectId);
      setChapters(refreshed);
      setLastSynced(new Date());
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setSyncing(false);
    }
  };

  // Create chapter
  const createChapter = async (title = 'Untitled Chapter') => {
    const input: CreateChapterInput = {
      id: nanoid(),
      projectId,
      title,
      content: '',
      index: chapters.length,
      status: 'draft',
    };

    await Chapters.create(input);
    const refreshed = await Chapters.list(projectId);
    setChapters(refreshed);
    setActiveId(input.id);

    // Persist active chapter
    localStorage.setItem(`lastChapter-${projectId}`, input.id!);
  };

  // Rename chapter
  const renameChapter = async (id: string, title: string) => {
    await Chapters.updateMeta(id, { title });
    setChapters((prev) => prev.map((ch) => (ch.id === id ? { ...ch, title } : ch)));
  };

  // Delete chapter
  const deleteChapter = async (id: string) => {
    await Chapters.delete(id);
    setChapters((prev) => prev.filter((ch) => ch.id !== id));
    if (id === activeId) {
      const remaining = chapters.filter((c) => c.id !== id);
      setActiveId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  // Reorder chapters
  const reorderChapters = async (newOrder: ChapterMeta[]) => {
    const reordered = newOrder.map((ch, i) => ({ ...ch, index: i }));

    // Update local IndexedDB
    for (const ch of reordered) {
      await Chapters.updateMeta(ch.id, { index: ch.index });
    }

    setChapters(reordered);
  };

  // Update chapter content (debounced)
  const updateContent = useCallback(
    debounce(async (id: string, content: string) => {
      await Chapters.updateContent(id, content);

      // Update word count
      const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
      await Chapters.updateMeta(id, { wordCount });

      setChapters((prev) => prev.map((ch) => (ch.id === id ? { ...ch, wordCount } : ch)));
    }, 600),
    [],
  );

  // Get active chapter (full content)
  const activeChapter = activeId ? (async () => await Chapters.get(activeId))() : null;

  // Set active chapter
  const setActive = (id: string) => {
    setActiveId(id);
    localStorage.setItem(`lastChapter-${projectId}`, id);
  };

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
  };
}
```

---

### Phase 6: Integration with WritingPanel (1 hour)

**Goal:** Wire ChapterTabs into existing WritingPanel

**File:** `src/components/Panels/WritingPanel.tsx` (MODIFY)

**Changes:**

```tsx
// Add imports
import { ChapterTabs } from '@/components/Chapters/ChapterTabs';
import { SidebarNavigator } from '@/components/Chapters/SidebarNavigator';
import { useChaptersHybrid } from '@/hooks/useChaptersHybrid';

// Inside WritingPanel component
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
  } = useChaptersHybrid(projectId);

  const [showSidebar, setShowSidebar] = useState(true);

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
        <div className="flex items-center gap-2 px-3">
          <button
            onClick={syncNow}
            className={`rounded-md px-3 py-1 text-sm transition-colors ${
              syncing ? 'bg-blue-800 text-gray-300' : 'bg-blue-600 text-white hover:bg-blue-500'
            }`}
          >
            {syncing ? 'Syncing…' : 'Sync'}
          </button>
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="text-sm text-slate-400 hover:text-white"
          >
            {showSidebar ? 'Hide' : 'Show'} Sidebar
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {showSidebar && (
          <SidebarNavigator
            chapters={chapters}
            activeId={activeId}
            onSelect={setActive}
            onCreate={createChapter}
            onDelete={deleteChapter}
          />
        )}

        {/* Editor */}
        <main className="flex-1 overflow-auto">
          {activeId ? (
            <ChapterEditor chapterId={activeId} onContentChange={updateContent} />
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

## Testing Plan

### Unit Tests

1. **ChapterTabs Component**
   - Renders all chapters
   - Calls onCreate when "+ New Chapter" clicked
   - Calls onSelect when tab clicked
   - Calls onReorder after drag-and-drop

2. **SidebarNavigator Component**
   - Renders chapter list
   - Shows word counts
   - Deletes with confirmation

3. **useChaptersHybrid Hook**
   - Loads chapters on mount
   - Creates chapter
   - Updates content (debounced)
   - Syncs with Supabase

### Integration Tests

1. **Full Flow:**
   - Create project
   - Create 3 chapters
   - Write content in each
   - Reorder chapters via drag-and-drop
   - Verify order persists after reload

2. **Sync Flow:**
   - Create chapter on Device A
   - Sync
   - Load on Device B
   - Verify chapter appears

3. **Offline Flow:**
   - Disconnect network
   - Create/edit chapters
   - Reconnect
   - Verify sync completes

---

## Migration Strategy

### Existing Projects

Your current `Chapter` type in `project.ts` already has most fields needed. No migration required for structure.

**Compatibility Layer:**

```typescript
// src/services/chaptersService.ts (add this helper)
function adaptLegacyChapter(legacy: any): ChapterMeta {
  return {
    id: legacy.id,
    projectId: legacy.projectId || 'unknown',
    title: legacy.title,
    index: legacy.order ?? 0,
    summary: legacy.summary,
    status: legacy.status || 'draft',
    wordCount: legacy.wordCount || 0,
    createdAt: new Date(legacy.createdAt).toISOString(),
    updatedAt: new Date(legacy.updatedAt).toISOString(),
  };
}
```

---

## Performance Considerations

### Optimizations

1. **Lazy Load Content**
   - Only load `ChapterDoc` (content) when chapter is active
   - Keep `ChapterMeta` in memory (lightweight)

2. **Debounced Autosave**
   - 600ms debounce on content updates
   - Prevents excessive IndexedDB writes

3. **Virtual Scrolling** (Future)
   - If projects have 100+ chapters, use `@tanstack/react-virtual`
   - Already in package.json ✅

4. **Sync Batching**
   - Sync every 3 minutes or on network reconnect
   - Manual "Sync Now" button for immediate sync

---

## Accessibility

### ARIA Labels

- ChapterTabs: `aria-label="Chapter navigation"`
- Create button: `aria-label="Create new chapter"`
- Delete button: `aria-label="Delete chapter {title}"`

### Keyboard Navigation

- `Tab` - Navigate between tabs
- `Enter` / `Space` - Select tab
- `Delete` - Delete selected chapter (with confirmation)

---

## Next Steps

1. **Week 1: Components**
   - [ ] Create ChapterTabs component
   - [ ] Create SidebarNavigator component
   - [ ] Test drag-and-drop

2. **Week 2: Sync**
   - [ ] Set up Supabase table
   - [ ] Implement chaptersSyncService
   - [ ] Create useChaptersHybrid hook

3. **Week 3: Integration**
   - [ ] Wire into WritingPanel
   - [ ] Test full flow
   - [ ] Add sync indicator UI

---

## Questions?

**Q: Will this break existing projects?**
A: No. The `Chapter` type is compatible. Existing chapters will work.

**Q: What if Supabase is down?**
A: IndexedDB is local-first. App works offline. Sync resumes when back online.

**Q: Can I disable cloud sync?**
A: Yes. Add a feature flag: `VITE_ENABLE_CLOUD_SYNC=false`

---

**Version:** 1.0
**Last Updated:** November 2025
**Status:** Ready to implement
