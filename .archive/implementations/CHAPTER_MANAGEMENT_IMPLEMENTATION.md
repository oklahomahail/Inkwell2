# Chapter Management Implementation - Phase 1

## Completed Components

### ✅ 1. Data Model (`src/types/writing.ts`)

Added comprehensive chapter management types:

```typescript
interface ChapterMeta {
  id: string;
  projectId: string;
  title: string;
  index: number; // display order
  summary?: string;
  status: 'draft' | 'revising' | 'final';
  wordCount: number; // denormalized for fast UI
  sceneCount?: number;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

interface ChapterDoc {
  id: string;
  content: string; // editor-serialized content
  version: number; // optimistic locking
  scenes?: Scene[];
}

interface FullChapter extends ChapterMeta {
  content: string;
  version: number;
  scenes?: Scene[];
}
```

**Why Split Meta/Doc?**

- Fast chapter lists without loading content
- Safe autosave (meta updates don't block content)
- Quick analytics (word counts, status) without full load

### ✅ 2. Chapters Service (`src/services/chaptersService.ts`)

Complete CRUD service with IndexedDB storage:

#### Core Operations

- `list(projectId)` - Get all chapters for project (sorted by index)
- `get(id)` - Get full chapter (meta + content)
- `getMeta(id)` - Get metadata only (fast)
- `create(input)` - Create new chapter
- `updateMeta(input)` - Update chapter metadata
- `updateWordCount(id, count)` - Update word count (called by editor)
- `saveDoc(doc)` - Save chapter content
- `remove(id)` - Delete chapter

#### Advanced Operations

- `duplicate(id)` - Duplicate a chapter
- `split(id, splitPoint, newTitle)` - Split chapter at cursor
- `mergeWithNext(id)` - Merge with next chapter
- `reorder(projectId, orderedIds)` - Reorder chapters
- `importFromDocument(projectId, content)` - Auto-split document into chapters

#### Analytics Support

- `getCount(projectId)` - Get chapter count
- `getTotalWordCount(projectId)` - Get total project word count
- `exportChapters(projectId)` - Export all chapters in order

#### Storage

- **IndexedDB** with two stores:
  - `chapter_meta` - Lightweight metadata
  - `chapter_docs` - Heavy content
- Indexes on `projectId` and `projectId+index` for fast queries
- Ready for future Supabase sync

---

## Next Steps (Phase 2)

### State Management

Create Redux/Zustand slice for chapters:

```typescript
// src/state/chaptersSlice.ts
interface ChaptersState {
  byId: Record<string, ChapterMeta>;
  byProject: Record<string, string[]>; // ordered ids
  activeChapterId?: string;
  loading: boolean;
  error: string | null;
}

// Actions
-LOAD_CHAPTERS -
  CREATE_CHAPTER -
  UPDATE_CHAPTER_META -
  UPDATE_CHAPTER_CONTENT -
  SET_ACTIVE_CHAPTER -
  REORDER_CHAPTERS -
  DELETE_CHAPTER -
  SPLIT_CHAPTER -
  MERGE_CHAPTERS;
```

**Selectors:**

```typescript
selectChaptersForProject(state, projectId);
selectActiveChapter(state);
selectChapterCount(state, projectId);
selectChapterStats(state, projectId);
```

### UI Components

#### 1. Chapter Sidebar (`src/components/Writing/Chapters/ChapterSidebar.tsx`)

- List of chapters with drag-and-drop reordering
- Each item shows: title, status pill, word count
- Search/filter box
- "New Chapter" button
- Right-click context menu (Duplicate, Split, Merge, Delete)

#### 2. Chapter Header (`src/components/Writing/Chapters/ChapterHeader.tsx`)

- Inline title editing
- Status dropdown
- Word count display
- Chapter navigation (prev/next arrows)
- Chapter actions menu

#### 3. Chapter Manager (`src/components/Writing/Chapters/ChapterManager.tsx`)

- Create chapter modal
- Split chapter modal (with preview)
- Merge confirmation dialog
- Import from document wizard

#### 4. Writing Panel Integration

Update `WritingPanel.tsx`:

- Load active chapter from state
- Auto-save content + word count
- Chapter scope for sessions
- Keyboard shortcuts

### Keyboard Shortcuts

| Shortcut         | Action                    |
| ---------------- | ------------------------- |
| `Cmd+Shift+N`    | New chapter               |
| `Option+Cmd+→`   | Next chapter              |
| `Option+Cmd+←`   | Previous chapter          |
| `Cmd+Shift+S`    | Split at cursor           |
| `Cmd+Shift+M`    | Merge with next           |
| `Cmd+K` then `C` | Command palette: chapters |

### Analytics Integration

Update `AnalyticsPanel.tsx` and Dashboard:

```typescript
// Dashboard tiles
- Chapters: selectChapterCount(projectId)
- Avg Words/Chapter: totalWords / chapterCount
- Longest Chapter: max(chapters.map(c => c.wordCount))

// New Analytics tiles
- Chapter Progress: finalChapters / totalChapters
- Draft Chapters: chapters.filter(c => c.status === 'draft').length
- Chapters This Week: filter by createdAt
```

### Export Integration

Update export service to use chapter-based export:

```typescript
// src/services/exportService.ts
async exportManuscript(projectId: string, format: ExportFormat) {
  const chapters = await Chapters.exportChapters(projectId);

  for (const chapter of chapters) {
    appendHeading(chapter.title);
    appendContent(chapter.content);
    if (format !== 'single-file') {
      createPageBreak();
    }
  }
}
```

### Migration Path

For existing projects with single document:

1. **Auto-detect** button in Writing panel:
   - "This project has a single document. Split into chapters?"
2. **Import wizard**:
   - Preview detected chapters
   - Edit titles
   - Adjust split points
   - Confirm import
3. **Backup**:
   - Keep original document hidden
   - Allow rollback for 30 days

---

## Implementation Order

### Week 1: State & Storage ✅

- [x] Data model
- [x] Chapters service
- [x] IndexedDB setup
- [ ] State slice
- [ ] Selectors

### Week 2: Core UI

- [ ] ChapterSidebar component
- [ ] ChapterHeader component
- [ ] Writing panel integration
- [ ] Auto-save hookup

### Week 3: Advanced Features

- [ ] ChapterManager modals
- [ ] Split/merge functionality
- [ ] Drag-and-drop reordering
- [ ] Keyboard shortcuts

### Week 4: Analytics & Export

- [ ] Dashboard chapter count
- [ ] Analytics tiles
- [ ] Export integration
- [ ] Import wizard

### Week 5: Polish

- [ ] Command palette
- [ ] Empty states
- [ ] Loading states
- [ ] Error handling
- [ ] Documentation

---

## Testing Plan

### Unit Tests

- [ ] chaptersService CRUD operations
- [ ] Split/merge logic
- [ ] Word count calculation
- [ ] Import from document

### Integration Tests

- [ ] Create chapter → updates UI
- [ ] Edit content → saves automatically
- [ ] Reorder chapters → persists order
- [ ] Delete chapter → removes from list

### E2E Tests

- [ ] Full chapter workflow
- [ ] Multi-chapter writing session
- [ ] Export multi-chapter manuscript
- [ ] Import existing document

---

## Performance Considerations

### Optimizations

1. **Lazy Loading**: Load chapter content only when active
2. **Debounced Saves**: Autosave content every 2-3 seconds
3. **Virtual Scrolling**: For projects with 100+ chapters
4. **Index Caching**: Cache chapter list in memory

### Metrics to Track

- Time to load chapter list
- Time to switch chapters
- Autosave latency
- IndexedDB query performance

---

## Future Enhancements

### Advanced Features

1. **Chapter Templates**: Genre-specific chapter structures
2. **Chapter Goals**: Target word count per chapter
3. **Chapter Notes**: Private notes attached to chapters
4. **Chapter Tags**: Categorize chapters (POV, timeline, etc.)
5. **Version History**: Track chapter revisions
6. **Collaborative Editing**: Real-time multi-user chapters

### Integrations

1. **Timeline**: Link chapters to timeline events
2. **Characters**: Track character appearances per chapter
3. **Beat Sheets**: Map beats to chapters
4. **World Building**: Link locations/rules to chapters

---

## Migration Guide for Existing Users

### Scenario 1: Single Document Project

```
Before: One big document with all content
After: Multiple chapters, each independently editable

Migration:
1. Click "Split into Chapters" button
2. App detects chapter headings
3. Preview split
4. Confirm
5. Original backed up for 30 days
```

### Scenario 2: Already Using Scenes

```
Before: Chapters with embedded scenes
After: Enhanced chapter management + existing scenes

Migration:
1. Automatic - no action needed
2. Scenes preserved within chapters
3. New features available immediately
```

### Scenario 3: Fresh Project

```
No migration needed - use chapter management from start
```

---

## API Documentation

### Service API

```typescript
// Create a chapter
const chapter = await Chapters.create({
  projectId: 'proj_123',
  title: 'Chapter 1: The Beginning',
  content: '<p>Once upon a time...</p>',
  status: 'draft',
});

// List all chapters
const chapters = await Chapters.list('proj_123');

// Get full chapter
const fullChapter = await Chapters.get('chapter_456');

// Update content
await Chapters.saveDoc({
  id: 'chapter_456',
  content: updatedHTML,
  version: fullChapter.version + 1,
});

// Update metadata
await Chapters.updateMeta({
  id: 'chapter_456',
  title: 'Chapter 1: The New Beginning',
  status: 'revising',
});

// Split chapter
const { first, second } = await Chapters.split(
  'chapter_456',
  5000, // split at character position 5000
  'Chapter 2',
);

// Merge chapters
const merged = await Chapters.mergeWithNext('chapter_456');

// Reorder
await Chapters.reorder('proj_123', ['chapter_3', 'chapter_1', 'chapter_2']);

// Import from document
const imported = await Chapters.importFromDocument('proj_123', existingDocumentContent);
```

---

## Summary

✅ **Phase 1 Complete**: Data model and service layer

- Robust IndexedDB storage
- Full CRUD operations
- Advanced features (split, merge, import)
- Analytics support
- Export-ready

🚧 **Phase 2 Next**: State management and UI

- Redux/Zustand integration
- React components
- Editor integration
- User interactions

📋 **Total Estimated Time**: 4-5 weeks for full implementation
📊 **Impact**: Resolves chapter tracking, enables better organization, powers analytics
