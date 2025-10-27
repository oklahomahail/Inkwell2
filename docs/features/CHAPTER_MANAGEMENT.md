# Chapter and Scene Management System

## Overview

The Chapter Management system helps writers organize, structure, and navigate their manuscripts. It ensures each chapter, scene, and clue remains synchronized across the writing and analysis layers, providing a robust foundation for long-form fiction projects.

## Purpose

- Organize manuscripts into hierarchical chapter/scene structure
- Link narrative elements (clues, beats, timeline events) to chapters
- Enable reordering and restructuring without data loss
- Integrate with analytics for word count and pacing metrics
- Support export to multiple formats (PDF, DOCX, ePub)

## Architecture

### Component Structure

**Files:** `src/features/chapters/`

- `ChapterContext.tsx`: Global provider managing chapters and metadata
- `useChapters.ts`: Hook exposing CRUD operations and state
- `ChapterList.tsx`: UI list component with inline editing
- `ChapterEditor.tsx`: Full-screen chapter editing view
- `SceneLinker.tsx`: Component for binding scenes and clues to chapters
- `ChapterAnalytics.tsx`: Word count and pacing visualization

**Supporting Services:**

- `src/services/projectStorage.ts`: IndexedDB persistence layer
- `src/services/analysisService.ts`: Analytics and metrics calculation
- `src/services/exportService.ts`: PDF/DOCX export with chapter structure

### Context Provider (ChapterContext)

Manages global chapter state and operations:

```typescript
interface ChapterContextValue {
  chapters: Chapter[];
  activeChapterId: string | null;
  isLoading: boolean;

  // CRUD Operations
  createChapter: (data: CreateChapterInput) => Promise<Chapter>;
  updateChapter: (id: string, updates: Partial<Chapter>) => Promise<void>;
  deleteChapter: (id: string) => Promise<void>;
  reorderChapters: (sourceId: string, destinationId: string) => Promise<void>;

  // Scene Management
  addScene: (chapterId: string, sceneData: Scene) => Promise<void>;
  removeScene: (chapterId: string, sceneId: string) => Promise<void>;

  // Navigation
  setActiveChapter: (id: string) => void;
  getChapterByOrder: (order: number) => Chapter | null;
}
```

### Hook API (useChapters)

Simplifies chapter operations in components:

```typescript
const {
  chapters, // All chapters for current project
  activeChapter, // Currently selected chapter
  createChapter, // Create new chapter
  updateChapter, // Update existing chapter
  deleteChapter, // Delete chapter (with confirmation)
  reorderChapters, // Drag-and-drop reordering
  isLoading, // Loading state
  error, // Error state
} = useChapters();
```

## Data Model

### Chapter Schema

| Field     | Type      | Description                          |
| --------- | --------- | ------------------------------------ |
| id        | string    | UUID for chapter                     |
| projectId | string    | Parent project reference             |
| title     | string    | User-facing chapter title            |
| order     | number    | Position in manuscript (0-indexed)   |
| scenes    | Scene[]   | Array of linked scenes               |
| notes     | string    | Author notes (markdown supported)    |
| wordCount | number    | Calculated total words               |
| createdAt | timestamp | Creation date                        |
| updatedAt | timestamp | Last modification date               |
| metadata  | object    | Custom metadata (tags, status, etc.) |

### Scene Schema

| Field     | Type     | Description              |
| --------- | -------- | ------------------------ |
| id        | string   | UUID for scene           |
| chapterId | string   | Parent chapter reference |
| title     | string   | Scene title              |
| content   | string   | Scene prose content      |
| order     | number   | Position within chapter  |
| pov       | string   | Point-of-view character  |
| location  | string   | Scene location/setting   |
| clues     | string[] | Array of clue IDs        |
| beats     | string[] | Array of plot beat IDs   |

### Persistence

Data persisted in IndexedDB via `projectStorage.ts`:

**Store**: `chapters`  
**Indexes**:

- `by-project`: Retrieve all chapters for a project
- `by-order`: Sort chapters by position
- `by-updated`: Find recently modified chapters

**Sync Strategy**:

- Auto-save after 2 seconds of inactivity (debounced)
- Manual save via "Save Chapter" button
- Conflict resolution: Last-write-wins
- Periodic sync with `analysisService` for word counts

## Writer Workflow

### 1. Creating Chapters

**From Dashboard**:

1. Click "New Chapter" button in sidebar
2. Enter chapter title
3. (Optional) Set chapter order/position
4. Click "Create"

**From Chapter View**:

1. Click "+" icon in chapter navigator
2. Auto-inserts at next position
3. Opens editor immediately

**Keyboard Shortcut**: `Cmd/Ctrl + N` (when in chapter view)

### 2. Editing Chapters

**Inline Edit** (Quick changes):

1. Click chapter title in sidebar
2. Press `Enter` or click edit icon
3. Modify title or notes
4. Press `Enter` or click away to save

**Full Editor** (Content editing):

1. Click chapter in list
2. Opens full-screen editor
3. Write scenes, add content
4. Auto-saves every 2 seconds

### 3. Organizing Chapters

**Reordering**:

- Drag chapter in sidebar to new position
- Automatically updates `order` field
- Preserves scene linkages

**Merging Chapters**:

1. Select chapters to merge (Shift+Click)
2. Right-click → "Merge Chapters"
3. Confirm merge
4. Scenes combined into first chapter

**Splitting Chapters**:

1. Position cursor at split point
2. Click "Split Chapter" in toolbar
3. New chapter created with content after cursor

### 4. Linking Scenes and Clues

**Via SceneLinker Component**:

1. Open chapter editor
2. Click "Link Scene" in sidebar
3. Select existing scene or create new
4. Drag clues from clue panel onto scene
5. Confirms linkage visually

**Via Timeline View**:

- Drag timeline events onto chapter
- Auto-creates scene if needed
- Links beat to chapter and scene

### 5. Using Analytics

**Word Count**:

- Real-time count in chapter editor
- Per-chapter breakdown in analytics panel
- Project total updated automatically

**Pacing Metrics**:

- Scene length distribution
- Chapter balance (visual chart)
- Outlier detection (very short/long chapters)

## Analytics Integration

### Automatic Tracking

`analysisService` monitors chapter changes:

- Word count updated on save
- Scene count tracked per chapter
- POV distribution calculated
- Timeline event density mapped

### Metrics Exposed

```typescript
interface ChapterAnalytics {
  wordCount: number;
  sceneCount: number;
  avgSceneLength: number;
  povBreakdown: Record<string, number>;
  clueReferences: number;
  beatCoverage: number; // % of beats addressed
}
```

### Integration Points

- **Dashboard**: Chapter count, total words
- **Analytics Panel**: Per-chapter metrics, pacing charts
- **Export**: Includes chapter structure in metadata

### Manual Sync

If metrics seem stale:

1. Open Analytics Panel
2. Click "Sync Chapter Data"
3. Re-calculates all chapter metrics

## Export Integration

### Supported Formats

- **PDF**: Chapters as headings, scenes as sections
- **DOCX**: Proper heading styles (H1 for chapters, H2 for scenes)
- **ePub**: Chapter-based table of contents
- **Plain Text**: Markdown-formatted with chapter breaks

### Chapter-Specific Export Options

- Include/exclude chapter notes
- Custom chapter heading format
- Page breaks before chapters
- Chapter numbering style (numeric, roman, spelled-out)

### Usage

```typescript
exportService.exportProject(projectId, {
  format: 'docx',
  includeChapterNotes: false,
  chapterNumbering: 'numeric',
  pageBreakBeforeChapter: true,
});
```

## Troubleshooting

### Chapters Not Saving

**Symptoms**: Edits lost after reload

**Checklist**:

1. Check IndexedDB quota in browser (Settings → Storage)
2. Verify no browser storage restrictions (Private Mode disables IndexedDB)
3. Check browser console for storage errors
4. Inspect network tab for failed sync requests

**Resolution**:

- Clear IndexedDB and re-import project
- Increase browser storage quota
- Use manual save (Cmd/Ctrl + S) frequently

### Scenes Not Linking

**Symptoms**: Scene appears in list but not associated with chapter

**Cause**: Invalid `sceneId` reference or broken index

**Fix**:

1. Open Chapter Editor
2. Remove scene link
3. Re-add scene via SceneLinker
4. Confirm `sceneId` in chapter's `scenes` array

**Verify**:

```typescript
console.log(chapter.scenes);
// Should show array of Scene objects
```

### Analytics Mismatch

**Symptoms**: Word count doesn't match manual count

**Cause**: Analytics cache stale or calculation error

**Resolution**:

1. Open Analytics Panel
2. Click "Sync Chapter Data"
3. Manually recount if still incorrect
4. Check for hidden characters (markdown, HTML)

**Debug**:

```typescript
const manualCount = chapter.scenes
  .map((s) => s.content.split(/\s+/).length)
  .reduce((a, b) => a + b, 0);
console.log('Manual:', manualCount, 'Stored:', chapter.wordCount);
```

### Reordering Not Persisting

**Symptoms**: Chapter order resets after reload

**Cause**: Drag-and-drop handler not calling `reorderChapters()`

**Fix**:

- Ensure `onDragEnd` in `ChapterList` calls `reorderChapters()`
- Verify order field updated in database
- Check for race conditions (multiple rapid reorders)

### Export Missing Chapters

**Symptoms**: Some chapters absent from exported document

**Cause**: Chapters filtered out or export limit exceeded

**Checklist**:

- Verify all chapters have `order` field set
- Check export settings for chapter filters
- Ensure no chapters marked as "Draft" (if draft filter enabled)

## Performance Considerations

### Virtualization

Chapter list uses virtual scrolling for 100+ chapters:

- Only renders visible chapters
- Smooth scrolling with windowing
- Memory-efficient for large projects

### Lazy Loading

Scene content loaded on-demand:

- Chapter list shows title/metadata only
- Full content fetched when chapter opened
- Reduces initial load time

### Debounced Saves

Editor auto-saves debounced to 2 seconds:

- Prevents excessive IndexedDB writes
- Batches rapid edits
- Reduces UI jank

### Indexing Strategy

IndexedDB indexes optimized for:

- Fast retrieval by project
- Efficient sorting by order
- Quick lookups by ID

## Testing

### Unit Tests

**File**: `src/features/chapters/__tests__/ChapterContext.test.tsx`

**Coverage**:

- Chapter CRUD operations
- Reordering logic
- Scene linkage
- Error handling
- Context provider behavior

### Integration Tests

**File**: `src/services/__tests__/analysisService.test.ts`

**Coverage**:

- Word count calculation
- Chapter-scene sync
- Export integration
- Metrics accuracy

### Manual QA Checklist

- [ ] Create chapter
- [ ] Rename chapter
- [ ] Reorder via drag-and-drop
- [ ] Add scene to chapter
- [ ] Link clue to scene
- [ ] Delete chapter (with confirmation)
- [ ] Verify word count updates
- [ ] Export project with chapters
- [ ] Reload and verify persistence

### E2E Tests

Playwright tests for full workflows:

```bash
pnpm test:e2e chapters
```

**Scenarios**:

- Create 10 chapters, verify order
- Reorder chapters, confirm persistence
- Link scenes across multiple chapters
- Export to PDF, verify chapter structure

## Best Practices

### Naming Conventions

- **Chapters**: "Chapter 1: Title" or just "Title"
- **Scenes**: "Scene name" or "POV - Location"
- **Notes**: Use Markdown for rich formatting

### Organizational Tips

- Keep chapters balanced (similar word counts)
- Use scenes for POV shifts
- Tag chapters with metadata (Arc, Act, Status)
- Archive removed chapters instead of deleting

### Performance Tips

- Limit scenes per chapter to 10-15 for best performance
- Archive completed chapters to reduce active list size
- Periodically compact IndexedDB via "Optimize Storage"

---

**Last updated:** October 2025  
**Maintainer:** Inkwell Core Team  
**Related Docs:**

- [User Guide](../user/USER_GUIDE.md)
- [Analytics Guide](../features/ANALYTICS.md)
- [Export Formats](../dev/EXPORT_FORMATS.md)
- [IndexedDB Architecture](../dev/INDEXEDDB_ARCHITECTURE.md)
