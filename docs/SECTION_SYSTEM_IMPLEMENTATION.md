# Section System Implementation Guide

## Overview

This document describes the comprehensive Section System implementation for Inkwell, which extends the previous chapter-only system to support full manuscript structure including prologues, epilogues, acknowledgements, and more.

## Implementation Date

January 2025

## Key Features Implemented

### 1. Section Type System

**File**: `src/types/section.ts`

Defines 10 section types with metadata:

- `chapter` - Main narrative chapters
- `prologue` - Opening scene before main story
- `epilogue` - Closing scene after main story
- `foreword` - Introduction by another author
- `afterword` - Author's notes after story
- `acknowledgements` - Thank you notes
- `dedication` - Dedication to someone
- `title-page` - Book title and author info
- `appendix` - Supplementary material
- `custom` - User-defined section types

Each type includes:

- Label and description
- `includeInWordCount` flag
- `includeInChapterCount` flag

### 2. useSections Hook

**File**: `src/hooks/useSections.ts`

Comprehensive hook for section management with features:

- **Local-first storage**: IndexedDB for immediate persistence
- **Auto-sync**: Debounced (600ms) content synchronization
- **Background sync**: Auto-sync every 3 minutes
- **Real-time updates**: WebSocket-based cross-device sync
- **Offline support**: Works without network, syncs on reconnect

**Key Methods**:

```typescript
createSection(title, type); // Create new section
updateSection(id, updates); // Update section properties
renameSection(id, title); // Rename section
changeSectionType(id, type); // Change section type
deleteSection(id); // Delete section
duplicateSection(id); // Duplicate section
reorderSections(from, to); // Reorder sections
applySectionOrder(newOrder); // Apply new order (AI suggestions)
updateContent(id, content); // Update section content (debounced)
getSectionsByType(type); // Query sections by type
getChapterCount(); // Get count of chapters only
getTotalWordCount(); // Get narrative word count
```

### 3. Book Builder Modal

**File**: `src/components/Sections/BookBuilderModal.tsx`

Comprehensive manuscript organization interface with:

- **Drag-and-drop reordering**: Using `@hello-pangea/dnd`
- **Inline editing**: Title and type changes
- **Section actions**: Duplicate, delete
- **AI-powered ordering**: Claude integration for intelligent sequencing

**AI Suggest Order Feature**:

- Analyzes current section structure
- Considers section types (title pages first, prologues before chapters, etc.)
- Provides logical reading order suggestion
- One-click application

### 4. Section Creator Component

**File**: `src/components/Sections/SectionCreator.tsx`

Flexible section creation interface with:

- **Type selector**: Visual grid of all section types
- **Inline mode**: For sidebar integration
- **Modal mode**: For detailed section creation
- **Type-specific guidance**: Shows description for each type

### 5. Updated Sidebar

**File**: `src/components/Sidebar.tsx`

Enhanced sidebar with:

- **Section list**: Shows all sections with type-specific icons
- **Color-coded icons**: Different colors for each section type
- **Quick actions**: "New" and "Manage" buttons
- **Book Builder access**: Direct access to BookBuilderModal

### 6. Updated Writing Panel

**File**: `src/components/Writing/EnhancedWritingPanel.tsx`

Enhanced writing interface with:

- **Section navigation**: Previous/Next with section type display
- **Section-aware stats**: Displays current section type
- **Auto-save**: Debounced section content synchronization

### 7. Onboarding Choice Component

**File**: `src/components/Onboarding/OnboardingChoice.tsx`

Two-path onboarding flow (partially implemented):

- **Start Writing** (Discoverer Path): Jump straight into Chapter 1
- **Build Your World** (Architect Path): Begin with planning and structure

**Status**: UI complete, requires AppContext integration for full functionality

### 8. Icon System

**File**: `src/lib/sectionIcons.tsx`

Type-specific icons and colors:

- Chapter: BookOpen (amber)
- Prologue: PenLine (blue)
- Epilogue: Star (purple)
- Foreword/Afterword: FileText (slate)
- Acknowledgements: Bookmark (green)
- Dedication: Heart (pink)
- Title Page: File (cyan)
- Appendix: FileCode (orange)
- Custom: BookOpen (gray)

## Architecture

### Data Flow

```
User Action
    ↓
useSections Hook
    ↓
IndexedDB (immediate)
    ↓
Debounced Sync (600ms)
    ↓
Supabase (remote storage)
    ↓
WebSocket (real-time updates)
    ↓
Other Devices
```

### Backward Compatibility

The system maintains full backward compatibility with existing chapters:

- Chapters stored with `type: 'chapter'`
- Existing `useChaptersHybrid` hook still functional
- Migration path from chapters to sections provided

### Section Ordering

Sections are ordered by the `order` field (0-indexed):

- Lower numbers appear first
- Drag-and-drop updates all affected `order` values
- Sorting is always applied when displaying sections

## Usage Examples

### Creating a Section

```typescript
const { createSection } = useSections(projectId);

// Create a chapter
await createSection('Chapter 1', 'chapter');

// Create a prologue
await createSection('Before the Storm', 'prologue');

// Create acknowledgements
await createSection('Thank You', 'acknowledgements');
```

### Reordering Sections

```typescript
const { reorderSections } = useSections(projectId);

// Move section from index 3 to index 1
await reorderSections(3, 1);
```

### Changing Section Type

```typescript
const { changeSectionType } = useSections(projectId);

// Convert a chapter to epilogue
await changeSectionType(sectionId, 'epilogue');
```

### Getting Section Statistics

```typescript
const { getChapterCount, getTotalWordCount, getSectionsByType } = useSections(projectId);

const chapterCount = getChapterCount(); // Only chapters
const totalWords = getTotalWordCount(); // Narrative sections only
const prologues = getSectionsByType('prologue');
```

## Integration Points

### Components Using Sections

1. **Sidebar** - Lists all sections with navigation
2. **EnhancedWritingPanel** - Displays and edits active section
3. **BookBuilderModal** - Manages section organization
4. **SectionCreator** - Creates new sections

### Hooks and Services

1. **useSections** - Main section management hook
2. **Chapters Service** - Underlying storage layer (IndexedDB + Supabase)
3. **chaptersSyncService** - Handles synchronization

## TODO / Future Work

### Phase 1: Complete Core Integration

1. **Update AppContext**:
   - Add `createProject` method
   - Add `setActiveProject` method
   - Add `creationMode` field to Project type
   - Support initial sections array in project creation

2. **Complete Onboarding Flow**:
   - Wire up OnboardingChoice to AppContext
   - Implement project creation with initial sections
   - Add onboarding trigger logic

3. **Migration System**:
   - Add automatic migration from chapters to sections
   - Preserve existing chapter data
   - Add migration status tracking

### Phase 2: Enhanced Features

1. **Section Templates**:
   - Pre-defined templates for each section type
   - Custom template creation and storage
   - Template marketplace/sharing

2. **Section Grouping**:
   - Group sections into "Parts" (Part I, Part II, etc.)
   - Collapsible groups in sidebar
   - Part-level statistics

3. **Export Enhancements**:
   - Section-aware PDF/DOCX export
   - Custom ordering for different formats
   - Include/exclude sections per export

4. **Analytics Integration**:
   - Section-specific word count tracking
   - Writing streaks by section type
   - Time spent per section

### Phase 3: Advanced Features

1. **AI Section Suggestions**:
   - Suggest missing sections (e.g., "Add a prologue?")
   - Analyze section balance
   - Recommend chapter splits

2. **Section Dependencies**:
   - Mark sections as dependent on others
   - Visual dependency graph
   - Completion tracking

3. **Collaborative Sections**:
   - Per-section permissions
   - Section-level comments
   - Review workflows

## Testing Recommendations

### Manual Testing

1. **Create Different Section Types**:
   - Create one of each type
   - Verify icons and colors display correctly
   - Check sidebar organization

2. **Reordering**:
   - Drag sections in BookBuilderModal
   - Verify order persists after refresh
   - Test edge cases (first/last positions)

3. **AI Suggestions**:
   - Create intentionally mis-ordered sections
   - Request AI ordering
   - Verify suggested order makes sense

4. **Navigation**:
   - Navigate between sections using prev/next buttons
   - Verify content loads correctly
   - Check auto-save behavior

### Automated Testing

1. **useSections Hook Tests**:
   - Test section CRUD operations
   - Test ordering logic
   - Test sync behavior

2. **Component Tests**:
   - BookBuilderModal drag-and-drop
   - SectionCreator type selection
   - Sidebar section list rendering

3. **Integration Tests**:
   - Full section lifecycle (create → edit → reorder → delete)
   - Multi-device sync simulation
   - Offline/online transitions

## Performance Considerations

1. **Debouncing**: Content updates are debounced (600ms) to reduce sync frequency
2. **Background Sync**: Auto-sync every 3 minutes prevents data loss
3. **Local-First**: IndexedDB ensures immediate UI responsiveness
4. **Lazy Loading**: Large manuscripts could benefit from virtualized lists

## Security Considerations

1. **Input Validation**: Section titles and content are validated
2. **Type Safety**: TypeScript ensures type correctness
3. **Rate Limiting**: AI suggestions are rate-limited via `/api/ai/simple`
4. **Data Integrity**: Atomic updates prevent race conditions

## Dependencies

### New Dependencies

- `@hello-pangea/dnd` v18.0.1 - Drag-and-drop functionality

### Existing Dependencies Used

- `lucide-react` - Icons
- `nanoid` - ID generation
- `@anthropic-ai/sdk` - AI features (already installed)

## File Structure

```
src/
├── components/
│   ├── Onboarding/
│   │   ├── OnboardingChoice.tsx (NEW)
│   │   └── WelcomeModal.tsx (existing)
│   ├── Sections/
│   │   ├── BookBuilderModal.tsx (NEW)
│   │   └── SectionCreator.tsx (NEW)
│   ├── Sidebar.tsx (UPDATED)
│   └── Writing/
│       └── EnhancedWritingPanel.tsx (UPDATED)
├── hooks/
│   ├── useChaptersHybrid.ts (existing)
│   └── useSections.ts (NEW)
├── lib/
│   └── sectionIcons.tsx (NEW)
└── types/
    └── section.ts (NEW)
```

## Summary

The Section System provides a robust, extensible foundation for full manuscript management in Inkwell. It maintains backward compatibility while enabling authors to structure their work with professional-grade organization tools.

Key achievements:

- ✅ 10 section types with rich metadata
- ✅ Comprehensive section management hook
- ✅ Drag-and-drop organization interface
- ✅ AI-powered section ordering
- ✅ Real-time cross-device synchronization
- ✅ Offline-first architecture
- ✅ Type-safe implementation
- ✅ All TypeScript checks passing

The system is ready for integration testing and can be extended with additional features as outlined in the roadmap above.
