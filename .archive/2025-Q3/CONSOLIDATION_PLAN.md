# Inkwell Codebase Consolidation Plan

## v0.6.0 - Stability, Structure, and Story Organization

**Generated**: 2025-10-30
**Status**: Planning Phase
**Priority**: CRITICAL - Must complete before feature development

---

## Executive Summary

Deep dive audit revealed **critical duplications and conflicts** that risk data corruption and maintenance burden:

- ❌ Two classes named `EnhancedStorageService` with different implementations
- ❌ Type conflicts: `Project` vs `EnhancedProject`, `Chapter` vs `WritingChapter` vs `ChapterMeta`
- ❌ Dual storage systems: localStorage AND IndexedDB with no migration path
- ❌ Scene-based vs Chapter-based writing systems coexisting
- ⚠️ 3 separate backup systems
- ⚠️ 7+ editor components with unclear hierarchy
- ⚠️ Incomplete Zustand store duplicating ChaptersContext

---

## Phase 1: Critical Type System Consolidation (Week 1)

### Goal: Single source of truth for data models

### 1.1 Project Type Unification

**Files to modify:**

- `src/context/AppContext.tsx` (remove local Project interface)
- `src/types/project.ts` (keep EnhancedProject as canonical)
- All imports across codebase

**Changes:**

```typescript
// REMOVE from AppContext.tsx:
export interface Project {
  chapters: any; // ❌ any type!
  characters: never[]; // ❌ never[]!
  // ...
}

// USE from types/project.ts everywhere:
export interface Project {
  id: string;
  name: string;
  description: string;
  chapters: Chapter[]; // ✅ properly typed
  characters: Character[]; // ✅ properly typed
  // ...
}
```

**Risk**: HIGH - touches 50+ files
**Testing**: All CRUD operations on projects
**Estimated time**: 2 days

---

### 1.2 Chapter Type Consolidation

**Files to modify:**

- `src/types/writing.ts` (consolidate Chapter types)
- Remove Scene-based types entirely

**Final type structure:**

```typescript
// Core chapter types (KEEP)
export interface ChapterMeta {
  id: string;
  projectId: string;
  title: string;
  index: number;
  status: 'draft' | 'revising' | 'final';
  wordCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ChapterDoc {
  id: string;
  content: string;  // HTML/markdown content
  version: number;
}

export interface FullChapter extends ChapterMeta {
  content: string;
  version: number;
}

// REMOVE these:
export interface Scene { ... }           // ❌ Remove
export interface Chapter { scenes: ... } // ❌ Remove scenes property
export type WritingChapter = Chapter;    // ❌ Remove alias
```

**Risk**: HIGH - touches 150+ files referencing Scene
**Testing**: Chapter CRUD, content persistence
**Estimated time**: 3 days

---

## Phase 2: Storage System Consolidation (Week 2)

### Goal: Single, clear storage architecture

### 2.1 Resolve `EnhancedStorageService` Name Collision

**Files to rename/consolidate:**

- `src/services/storageService.ts` → REMOVE (merge into enhanced)
- `src/services/enhancedStorageService.ts` → Rename to `projectStorageService.ts`

**Changes:**

1. Merge functionality from both into single service
2. Remove `@ts-nocheck` directive from storageService
3. Keep enhanced version's safety features:
   - Quota-aware writes
   - Offline queueing
   - Auto-snapshot integration
4. Update all imports (24 files)

**Risk**: CRITICAL - wrong imports could cause data loss
**Testing**: Full save/load cycle, offline mode
**Estimated time**: 2 days

---

### 2.2 Choose Storage Strategy

**Option A: Full IndexedDB Migration** (RECOMMENDED)

- Migrate all project data to IndexedDB
- Keep localStorage only for preferences (theme, UI state)
- Use chaptersService architecture for all data
- Benefits: Better performance, quota management, offline support
- Risk: Migration script required for existing users

**Option B: Hybrid Approach**

- Projects metadata in localStorage
- Chapter content in IndexedDB (current state)
- Keep dual system but document clearly
- Benefits: Lower migration risk
- Risk: Continued complexity

**Decision Required**: Discuss with team
**Estimated time**: 1 week for migration script + testing

---

### 2.3 Backup System Consolidation

**Files to consolidate:**

- `src/services/backupService.ts` (REMOVE)
- `src/services/backupServices.ts` (REMOVE - appears to be duplicate file)
- `src/services/backupExport.ts` (KEEP - most complete)

**Changes:**

1. Use `backupExport.ts` as canonical backup system
2. Remove generic backup services
3. Integrate backup hooks into main storage service
4. Clear separation: "backup" = recovery, "export" = sharing

**Risk**: LOW - backup is failsafe, not critical path
**Testing**: Backup creation, restoration
**Estimated time**: 1 day

---

## Phase 3: Scene → Chapter Migration (Week 3)

### Goal: Remove scene-based system entirely

### 3.1 Component Removal

**Files to REMOVE:**

- `src/components/Writing/EnhancedWritingEditor.tsx`
- `src/components/Panels/WritingPanel.tsx` (scene-based)
- `src/components/Writing/SceneEditor.tsx`
- `src/components/Writing/SceneList.tsx`
- `src/components/Writing/SceneHeader.tsx`
- `src/components/Writing/SceneHeaderTypes.ts`
- `src/components/Writing/SceneNavigationPanel.tsx`

**Files to UPDATE:**

- `src/components/Views/WritingView.tsx` → use ChapterWritingPanel

**Changes:**

```typescript
// BEFORE (WritingView.tsx):
import EnhancedWritingEditor from '../Writing/EnhancedWritingEditor';
return <EnhancedWritingEditor />;

// AFTER:
import ChapterWritingPanel from '../Writing/ChapterWritingPanel';
return <ChapterWritingPanel projectId={currentProjectId} />;
```

**Risk**: MEDIUM - users accustomed to old UI
**Testing**: Full writing workflow, chapter navigation
**Estimated time**: 2 days

---

### 3.2 Remove Scene Storage Methods

**Files to modify:**

- `src/services/storageService.ts` (or projectStorageService after rename)

**Methods to REMOVE:**

- `saveScene()`
- `updateScene()`
- `loadScenes()`
- Any localStorage keys with `scenes` in them

**Risk**: LOW - moving to chapter-only storage
**Estimated time**: 1 day

---

### 3.3 Update Export Services

**Files to modify:**

- `src/services/exportService.ts`
- `src/services/professionalExportService.ts`
- `src/exports/manuscriptAssembler.ts`

**Changes:**

- Remove scene-level export
- Update to work with chapters only
- Simplify manuscript assembly (no scene joining needed)

**Risk**: LOW - export is output-only
**Testing**: Export all formats (MD, DOCX, EPUB, PDF)
**Estimated time**: 2 days

---

## Phase 4: State Management Cleanup (Week 4)

### 4.1 Remove Incomplete Zustand Store

**File to REMOVE:**

- `src/stores/useChaptersStore.ts` (incomplete, duplicates ChaptersContext)

**Files to check for imports:**

- Search codebase for `useChaptersStore` usage
- Update any imports to use ChaptersContext instead

**Risk**: LOW - appears unused
**Estimated time**: 1 hour

---

### 4.2 Document Context Architecture

**Files to CREATE:**

- `docs/architecture/STATE_MANAGEMENT.md`

**Content:**

```markdown
# State Management Architecture

## Context Providers

### AppContext

- **Purpose**: Global app state
- **Manages**: Projects, current project, theme, view routing
- **Storage**: localStorage (`inkwell_projects`, `inkwell_current_project_id`)
- **Use when**: Accessing project list, theme, navigation

### ChaptersContext

- **Purpose**: Chapter UI state
- **Manages**: Active chapter, chapter list for project
- **Storage**: localStorage (`lastChapter-{projectId}`)
- **Use when**: Chapter navigation, chapter metadata

### EditorContext

- **Purpose**: Track active TipTap editor instance
- **Manages**: Current editor ref
- **Storage**: None (runtime only)
- **Use when**: Need to access editor programmatically

## Services (Not State)

### chaptersService

- **Purpose**: Chapter persistence
- **Storage**: IndexedDB
- **Use when**: Saving/loading chapter content
```

**Risk**: NONE - documentation only
**Estimated time**: 2 hours

---

## Phase 5: Editor Hierarchy Documentation (Week 4)

### 5.1 Audit Editor Components

**Need to read and document:**

- TipTapEditor.tsx (base?)
- WritingEditor.tsx (wrapper?)
- FocusModeEditor.tsx (variant?)
- WhiteEditor.tsx (styling?)
- LazyTipTapEditor.tsx (code-split?)
- FallbackEditor.tsx (error boundary)

**Create diagram showing:**

```
┌─────────────────────────────────────┐
│     ChapterWritingPanel             │
│  (High-level chapter UI)            │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│        TipTapEditor                 │
│   (Core editor component)           │
└──────────────┬──────────────────────┘
               │
               ├──► FocusModeEditor (focus mode wrapper)
               └──► WhiteEditor (styled variant)

Utilities:
- LazyTipTapEditor (code-split version)
- FallbackEditor (error handling)
```

**Files to CREATE:**

- `docs/architecture/EDITOR_COMPONENTS.md`

**Risk**: NONE - documentation only
**Estimated time**: 4 hours

---

## Phase 6: Search Service Documentation (Week 4)

### 6.1 Document Search Architecture

**Files to CREATE:**

- `docs/architecture/SEARCH_SYSTEM.md`

**Content:**

```markdown
# Search System Architecture

## Layered Design (Bottom to Top)

### Layer 1: searchService.ts

- **Purpose**: Core search engine
- **Algorithm**: BM25 ranking with inverted index
- **Use when**: Building custom search features
- **API**: `search(query, corpus)` → ranked results

### Layer 2: enhancedSearchService.ts

- **Purpose**: Performance optimization layer
- **Features**: Web Worker delegation, main-thread fallback
- **Use when**: Need performant search with large corpus
- **API**: Same as searchService but async

### Layer 3: smartSearchService.ts

- **Purpose**: AI-enhanced semantic search
- **Features**: Query parsing, suggestions, history, Claude ranking
- **Use when**: User-facing search (recommended)
- **API**: `semanticSearch()`, `getSearchSuggestions()`

## Usage Guidelines

**For component developers**: Use `smartSearchService`
**For search features**: Use `enhancedSearchService`
**For custom algorithms**: Use `searchService`
```

**Risk**: NONE - documentation only
**Estimated time**: 2 hours

---

## Testing Strategy

### Regression Test Suite

**Must pass before consolidation is complete:**

1. **Project CRUD**
   - ✅ Create new project
   - ✅ Load existing project
   - ✅ Update project metadata
   - ✅ Delete project

2. **Chapter Operations**
   - ✅ Create chapter
   - ✅ Edit chapter content
   - ✅ Reorder chapters
   - ✅ Delete chapter
   - ✅ Autosave triggers

3. **Persistence**
   - ✅ Content persists across page refresh
   - ✅ Offline mode works
   - ✅ No data loss on storage quota errors

4. **Export**
   - ✅ Export to Markdown
   - ✅ Export to DOCX
   - ✅ Export to EPUB
   - ✅ Export to PDF

5. **Backup/Restore**
   - ✅ Create backup
   - ✅ Restore from backup
   - ✅ No data corruption

---

## Migration Script Requirements

### For Existing Users

**Script: `scripts/migrate-v0.6.0.ts`**

Must handle:

1. **Scene → Chapter migration**
   - Detect projects with Scene[] data
   - Convert Scene → Chapter (flatten hierarchy)
   - Preserve content and metadata
   - Delete old scene keys

2. **localStorage → IndexedDB migration** (if Option A chosen)
   - Read from `inkwell_enhanced_projects`
   - Write to IndexedDB via chaptersService
   - Backup before migration
   - Verify data integrity

3. **Type updates**
   - Update Project objects to new schema
   - Remove deprecated fields
   - Add missing required fields with defaults

**Testing:**

- Create test projects with old data format
- Run migration
- Verify all data accessible in new format
- Test rollback if migration fails

---

## Rollout Plan

### Phase Sequence (4 weeks)

```
Week 1: Critical Types     ████████░░░░
Week 2: Storage            ░░░░░░░░████
Week 3: Scene Removal      ░░░░░░░░░░░░████
Week 4: Docs & Cleanup     ░░░░░░░░░░░░░░░░████
```

### Risk Mitigation

1. **Create feature flag**: `ENABLE_V06_CONSOLIDATION`
2. **Dual-write period**: Write to both old and new systems for 1 week
3. **Backup enforcement**: Force backup before any migration
4. **Staged rollout**: Incremental phases with testing gates

### Rollback Strategy

If critical issues found:

1. Revert to tagged version `v0.5.x`
2. User data preserved in old format (dual-write ensures this)
3. Fix issues and retry migration

---

## Success Metrics

### Code Quality

- ✅ Zero `@ts-nocheck` directives
- ✅ Zero `any` types in core interfaces
- ✅ <5 ESLint warnings
- ✅ 100% TypeScript strict mode compliance

### Performance

- ✅ Chapter load time <100ms
- ✅ Autosave debounce working (no excessive saves)
- ✅ Search results in <200ms for 100k word corpus

### Data Integrity

- ✅ Zero reports of data loss
- ✅ Successful migration for 100% of test projects
- ✅ Backup/restore cycle 100% successful

---

## Post-Consolidation Benefits

1. **Clearer codebase**: New developers onboard faster
2. **Type safety**: Catch bugs at compile time
3. **Simpler architecture**: Less cognitive overhead
4. **Better performance**: Single storage system optimized
5. **Reduced bugs**: Fewer edge cases from dual systems

---

## Immediate Next Steps

1. ✅ Review this plan with team
2. ✅ Create feature branch: `consolidation/v0.6.0`
3. ✅ Set up staging environment for testing
4. ⬜ Begin Phase 1: Type consolidation
5. ⬜ Create migration scripts
6. ⬜ Write regression tests

---

## Questions for Team Discussion

1. **Storage strategy**: Full IndexedDB (Option A) or Hybrid (Option B)?
2. **Migration timing**: All at once or incremental over multiple releases?
3. **Breaking changes**: Acceptable for v0.6.0 or need v1.0.0?
4. **User communication**: How to notify users of data migration?
5. **Backup requirement**: Force backup before upgrade or optional?

---

**Document Status**: DRAFT - Awaiting Team Review
**Last Updated**: 2025-10-30
**Next Review**: Before starting Phase 1
