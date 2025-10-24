# Chapter Management - Quick Start Guide (Phase 2)

## What's Been Built (Phase 1)

✅ **Complete Data Layer**

- Type definitions for ChapterMeta, ChapterDoc, FullChapter
- Full-featured ChaptersService with IndexedDB storage
- CRUD operations + split/merge/import functionality
- Build verified - no errors

## What to Build Next (Priority Order)

### 1. State Management (Start Here)

Create `src/state/chaptersSlice.ts`:

```typescript
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { ChapterMeta } from '@/types/writing';

interface ChaptersState {
  byId: Record<string, ChapterMeta>;
  byProject: Record<string, string[]>; // ordered chapter IDs
  activeChapterId: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: ChaptersState = {
  byId: {},
  byProject: {},
  activeChapterId: null,
  loading: false,
  error: null,
};

const chaptersSlice = createSlice({
  name: 'chapters',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    loadChapters: (
      state,
      action: PayloadAction<{ projectId: string; chapters: ChapterMeta[] }>,
    ) => {
      const { projectId, chapters } = action.payload;
      state.byProject[projectId] = chapters.map((c) => c.id);
      chapters.forEach((c) => {
        state.byId[c.id] = c;
      });
    },
    addChapter: (state, action: PayloadAction<ChapterMeta>) => {
      const chapter = action.payload;
      state.byId[chapter.id] = chapter;
      if (!state.byProject[chapter.projectId]) {
        state.byProject[chapter.projectId] = [];
      }
      state.byProject[chapter.projectId].push(chapter.id);
    },
    updateChapterMeta: (state, action: PayloadAction<Partial<ChapterMeta> & { id: string }>) => {
      const { id, ...updates } = action.payload;
      if (state.byId[id]) {
        state.byId[id] = { ...state.byId[id], ...updates };
      }
    },
    setActiveChapter: (state, action: PayloadAction<string | null>) => {
      state.activeChapterId = action.payload;
    },
    removeChapter: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      const chapter = state.byId[id];
      if (chapter) {
        delete state.byId[id];
        state.byProject[chapter.projectId] = state.byProject[chapter.projectId].filter(
          (cid) => cid !== id,
        );
      }
    },
    reorderChapters: (
      state,
      action: PayloadAction<{ projectId: string; orderedIds: string[] }>,
    ) => {
      const { projectId, orderedIds } = action.payload;
      state.byProject[projectId] = orderedIds;
      // Update indexes
      orderedIds.forEach((id, index) => {
        if (state.byId[id]) {
          state.byId[id].index = index;
        }
      });
    },
  },
});

export const {
  setLoading,
  loadChapters,
  addChapter,
  updateChapterMeta,
  setActiveChapter,
  removeChapter,
  reorderChapters,
} = chaptersSlice.actions;

export default chaptersSlice.reducer;
```

**Selectors** (`src/state/chaptersSelectors.ts`):

```typescript
import type { RootState } from './store';
import type { ChapterMeta } from '@/types/writing';

export const selectChaptersForProject = (state: RootState, projectId: string): ChapterMeta[] => {
  const ids = state.chapters.byProject[projectId] || [];
  return ids.map((id) => state.chapters.byId[id]).filter(Boolean);
};

export const selectActiveChapter = (state: RootState): ChapterMeta | undefined => {
  return state.chapters.activeChapterId
    ? state.chapters.byId[state.chapters.activeChapterId]
    : undefined;
};

export const selectChapterCount = (state: RootState, projectId: string): number => {
  return (state.chapters.byProject[projectId] || []).length;
};

export const selectChapterStats = (state: RootState, projectId: string) => {
  const chapters = selectChaptersForProject(state, projectId);
  const totalWords = chapters.reduce((sum, c) => sum + c.wordCount, 0);
  const avgWords = chapters.length ? Math.round(totalWords / chapters.length) : 0;
  const longestChapter = chapters.reduce((max, c) => (c.wordCount > max.wordCount ? c : max), {
    wordCount: 0,
  } as ChapterMeta);

  return {
    total: chapters.length,
    totalWords,
    avgWords,
    longest: longestChapter,
    byStatus: {
      draft: chapters.filter((c) => c.status === 'draft').length,
      revising: chapters.filter((c) => c.status === 'revising').length,
      final: chapters.filter((c) => c.status === 'final').length,
    },
  };
};
```

### 2. Custom Hook for Chapter Document

Create `src/hooks/useChapterDocument.ts`:

```typescript
import { useState, useEffect, useCallback } from 'react';
import { Chapters } from '@/services/chaptersService';
import type { ChapterDoc } from '@/types/writing';

export function useChapterDocument(chapterId?: string) {
  const [doc, setDoc] = useState<ChapterDoc | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!chapterId) {
      setDoc(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    Chapters.get(chapterId)
      .then((fullChapter) => {
        if (!cancelled) {
          setDoc({
            id: fullChapter.id,
            content: fullChapter.content,
            version: fullChapter.version,
            scenes: fullChapter.scenes,
          });
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [chapterId]);

  const updateContent = useCallback(
    (content: string) => {
      if (!doc) return;
      setDoc({ ...doc, content, version: doc.version + 1 });
    },
    [doc],
  );

  return { doc, loading, error, updateContent };
}
```

### 3. Auto-save Hook

Create `src/hooks/useAutosave.ts`:

```typescript
import { useEffect, useRef } from 'react';

export function useAutosave(
  callback: () => void | Promise<void>,
  deps: React.DependencyList,
  delay = 3000, // 3 seconds
) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      callbackRef.current();
    }, delay);

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, deps);
}
```

### 4. Update Dashboard to Show Chapter Count

Edit `src/components/Panels/DashboardPanel.tsx`:

```tsx
import { useSelector } from 'react-redux';
import { selectChapterCount } from '@/state/chaptersSelectors';

// Inside component:
const chapterCount = useSelector((state) => selectChapterCount(state, currentProject?.id || ''));

// Add fourth tile:
<div className="flex items-center gap-3">
  <BookOpen className="w-5 h-5 text-indigo-500" />
  <div>
    <p className="text-sm text-gray-500">Chapters</p>
    <p className="font-semibold">{chapterCount}</p>
  </div>
</div>;
```

### 5. Simple Chapter Sidebar (MVP)

Create `src/components/Writing/Chapters/ChapterSidebar.tsx`:

```tsx
import { Plus, Book } from 'lucide-react';
import React from 'react';
import { useSelector, useDispatch } from 'react-redux';

import { Chapters } from '@/services/chaptersService';
import { addChapter, setActiveChapter, loadChapters } from '@/state/chaptersSlice';
import { selectChaptersForProject, selectActiveChapter } from '@/state/chaptersSelectors';

interface Props {
  projectId: string;
}

export default function ChapterSidebar({ projectId }: Props) {
  const dispatch = useDispatch();
  const chapters = useSelector((state) => selectChaptersForProject(state, projectId));
  const activeChapter = useSelector(selectActiveChapter);

  // Load chapters on mount
  React.useEffect(() => {
    Chapters.list(projectId).then((chaps) => {
      dispatch(loadChapters({ projectId, chapters: chaps }));
    });
  }, [projectId, dispatch]);

  const handleCreateChapter = async () => {
    const newChapter = await Chapters.create({
      projectId,
      title: `Chapter ${chapters.length + 1}`,
    });
    dispatch(addChapter(newChapter));
    dispatch(setActiveChapter(newChapter.id));
  };

  const handleSelectChapter = (id: string) => {
    dispatch(setActiveChapter(id));
  };

  return (
    <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Chapters</h2>
          <button
            onClick={handleCreateChapter}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            title="New Chapter"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-gray-500">{chapters.length} chapters</p>
      </div>

      {/* Chapter List */}
      <div className="flex-1 overflow-y-auto">
        {chapters.length === 0 ? (
          <div className="p-4 text-center">
            <Book className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm text-gray-500 mb-3">No chapters yet</p>
            <button
              onClick={handleCreateChapter}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Create first chapter
            </button>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {chapters.map((chapter) => (
              <button
                key={chapter.id}
                onClick={() => handleSelectChapter(chapter.id)}
                className={`
                  w-full text-left p-3 rounded-lg transition-colors
                  ${
                    activeChapter?.id === chapter.id
                      ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-500'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                  }
                `}
              >
                <div className="font-medium text-sm text-gray-900 dark:text-white truncate">
                  {chapter.title}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-500">{chapter.wordCount} words</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      chapter.status === 'final'
                        ? 'bg-green-100 text-green-700'
                        : chapter.status === 'revising'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {chapter.status}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

### 6. Integrate into Writing Panel

Edit `src/components/Panels/WritingPanel.tsx`:

```tsx
import ChapterSidebar from '@/components/Writing/Chapters/ChapterSidebar';
import { useChapterDocument } from '@/hooks/useChapterDocument';
import { useAutosave } from '@/hooks/useAutosave';
import { Chapters } from '@/services/chaptersService';
import { useSelector } from 'react-redux';
import { selectActiveChapter } from '@/state/chaptersSelectors';

// Inside component:
const activeChapter = useSelector(selectActiveChapter);
const { doc, updateContent } = useChapterDocument(activeChapter?.id);

// Auto-save chapter content
useAutosave(
  async () => {
    if (doc && activeChapter) {
      await Chapters.saveDoc(doc);
      // Update word count
      const wordCount = countWords(doc.content);
      await Chapters.updateWordCount(activeChapter.id, wordCount);
    }
  },
  [doc?.content],
  3000,
);

// Render:
return (
  <div className="flex h-full">
    <ChapterSidebar projectId={currentProject.id} />
    <div className="flex-1">
      {/* Existing editor, but use doc.content instead of project.content */}
      <TipTapEditor
        value={doc?.content || ''}
        onChange={updateContent}
        // ... other props
      />
    </div>
  </div>
);
```

---

## Development Workflow

### Step 1: State Setup (30 min)

1. Create `chaptersSlice.ts`
2. Create `chaptersSelectors.ts`
3. Add to Redux store

### Step 2: Hooks (20 min)

1. Create `useChapterDocument.ts`
2. Create `useAutosave.ts`

### Step 3: MVP UI (1 hour)

1. Create simple `ChapterSidebar.tsx`
2. Test: Create chapter, select chapter, see word count

### Step 4: Integration (1 hour)

1. Update `WritingPanel.tsx` to use chapters
2. Hook up auto-save
3. Test: Write in chapter, auto-saves, word count updates

### Step 5: Dashboard (15 min)

1. Add chapter count to Dashboard
2. Test: Create chapter, see count update

**Total MVP Time: ~3 hours**

---

## Testing the MVP

### Manual Test Flow

1. **Create Project**: Go to Dashboard, create new project
2. **Open Writing Panel**: Should show "No chapters" message
3. **Create First Chapter**: Click "Create first chapter"
   - Should create "Chapter 1"
   - Should become active (highlighted)
4. **Write Content**: Type some text
   - After 3 seconds, should auto-save
   - Word count should update
5. **Create Second Chapter**: Click "+" button
   - Should create "Chapter 2"
   - Should switch to it
6. **Switch Back**: Click "Chapter 1"
   - Should load previous content
7. **Check Dashboard**: Go to Dashboard
   - Should show "Chapters: 2"

### Console Verification

```javascript
// Check IndexedDB
Chapters.list('your-project-id').then(console.log);

// Check active chapter
const state = store.getState();
console.log(state.chapters.activeChapterId);
console.log(state.chapters.byId);
```

---

## Next Features (After MVP)

Once MVP works:

1. Drag-and-drop reordering
2. Chapter context menu (delete, duplicate, split, merge)
3. Keyboard shortcuts
4. Chapter header with title editing
5. Analytics integration
6. Export integration

---

## Questions?

**Q: Do I need Redux or can I use Context?**
A: Either works. Redux is better for larger apps, Context is simpler for MVP.

**Q: Can I skip IndexedDB and use localStorage?**
A: For MVP, yes. But IndexedDB is better for large documents.

**Q: How do I migrate existing single-document projects?**
A: Wait until MVP works, then add import wizard.

**Q: What about Supabase sync?**
A: Phase 3. Local-first for now.

---

## Support

If you hit issues:

1. Check browser console for errors
2. Verify IndexedDB in DevTools → Application → IndexedDB
3. Check Redux DevTools for state
4. Review `chaptersService.ts` for service errors
