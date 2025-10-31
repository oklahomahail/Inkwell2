# Type Consolidation Status Report
## Phase 1: Project and Chapter Types

**Date**: 2025-10-30
**Status**: In Progress

---

## ✅ Completed

### 1. Project Type Consolidation
- **DONE**: Created canonical `Project` type in `src/types/project.ts`
- **DONE**: Made EnhancedProject extend Project
- **DONE**: Updated AppContext to import Project from types/project.ts
- **DONE**: Removed local Project interface from AppContext
- **DONE**: Added legacy fields (content, chapters, characters, beatSheet) as optional for backward compatibility

**Result**: Single source of truth for Project type with migration path for legacy code

---

### 2. Chapter Type - Removed scenes property
- **DONE**: Removed `scenes: any` from Chapter in project.ts
- **DONE**: Added re-export of Chapter from project.ts in writing.ts
- **DONE**: Marked Scene as @deprecated in writing.ts
- **DONE**: Kept Scene type temporarily for backward compatibility during migration

**Result**: Chapter no longer has nested scenes - content stored directly

---

## ⚠️ Issues Discovered

### 1. THREE Different Character Types!

**Location 1: `src/types/project.ts`** (Detailed)
```typescript
export interface Character {
  id: string;
  name: string;
  role: CharacterRole; // protagonist, antagonist, etc
  description: string;
  personality: string[];
  backstory: string;
  goals: string;
  conflicts: string;
  appearance: string;
  relationships: CharacterRelationship[];
  appearsInChapters: string[];
  notes: string;
  createdAt: number;
  updatedAt: number;
}
```

**Location 2: `src/types/persistence.ts`** (Minimal - Supabase?)
```typescript
export interface Character extends BaseEntity {
  name: string;
  bio: string;
  traits: Record<string, unknown>;
}
```

**Location 3: `src/types/writing.ts`** (Flexible)
```typescript
export interface Character extends BaseEntity {
  name: string;
  description?: string;
  traits?: Record<string, unknown>;
  tags?: string[];
  [key: string]: any; // very permissive!
}
```

**Problem**: Components import from different files and expect different fields!

---

### 2. Character Type Conflict Error

```
src/components/Planning/CharacterManager.tsx(35,21): error TS2352:
Conversion of type 'Character[]' to type 'Character[]' may be a mistake...
Type 'Character' is missing the following properties: motivation, conflict, arc
```

This suggests there's YET ANOTHER Character type with `motivation`, `conflict`, `arc` fields somewhere!

---

### 3. WritingChapter vs Chapter Confusion

**Current State**:
- `WritingChapter` is an alias for `Chapter` in writing.ts
- But now `Chapter` is re-exported from project.ts
- Old code expected `Chapter.scenes: Scene[]`
- New code has `Chapter.content: string`

**Files Still Using Scene-Based Chapter**:
- `src/components/Panels/WritingPanel.tsx` - creates mock Chapter with scenes
- `src/components/timeline/SceneLinkageSuggestions.tsx` - accesses `chapter.scenes`
- `src/hooks/useWriting.tsx` - type conversion error with Chapter[]
- `src/components/ProjectTemplates/TemplateSelector.tsx` - creates template chapters with scenes

---

## 🔴 Remaining Type Errors (62 total)

### Categories:

1. **EnhancedProject type mismatches** (6 errors)
   - Components trying to create EnhancedProject but missing required fields
   - `characters` and `chapters` are undefined when should be arrays

2. **Character type conflicts** (1 error)
   - CharacterManager expects different Character type

3. **Chapter.scenes access** (2 errors)
   - SceneLinkageSuggestions, TemplateSelector

4. **Template/mock data** (1 error)
   - Templates creating old-format chapters

---

## 📋 Next Steps

### Immediate Priority 1: Resolve Character Types

**Decision Required**: Which Character type is canonical?

**Recommendation**:
- Use `project.ts` Character (most detailed) as canonical
- Rename `persistence.ts` Character → `PersistedCharacter` (Supabase storage format)
- Remove `writing.ts` Character (was just re-exporting anyway)

### Immediate Priority 2: Fix EnhancedProject Creation

**Issue**: Components creating partial EnhancedProject objects

**Files to fix**:
- `src/components/Panels/WritingPanel.tsx:187`
- `src/components/Writing/EnhancedWritingEditor.tsx:259,311`

**Solution**: Provide default values for required arrays:
```typescript
const enhancedProject: EnhancedProject = {
  ...currentProject,
  characters: currentProject.characters || [],
  chapters: currentProject.chapters || [],
  // ... other required fields
}
```

### Priority 3: Remove Scene-based Code

**Components to update/remove**:
1. `WritingPanel.tsx` - Remove scene logic, use chapter content directly
2. `SceneLinkageSuggestions.tsx` - Update to not access `chapter.scenes`
3. `TemplateSelector.tsx` - Fix template creation
4. `useWriting.tsx` - Remove Chapter type conversion

### Priority 4: Update ChapterMeta/ChapterDoc System

**Current State**:
- `ChapterMeta` and `ChapterDoc` in writing.ts are for IndexedDB split storage
- `Chapter` in project.ts is the "full" in-memory representation
- These should remain separate (different purposes)

**Clarification needed**:
- ChapterMeta is lightweight for lists
- ChapterDoc is heavy content for editing
- Chapter is full type for services

This is CORRECT - keep all three but document the distinction!

---

## 🎯 Recommended Action Plan

### Step 1: Character Type Resolution (30 min)
1. Rename persistence.ts Character → PersistedCharacter
2. Keep project.ts Character as canonical
3. Update imports in components

### Step 2: Fix EnhancedProject Instantiation (1 hour)
1. Add helper function `createEnhancedProject(project: Project): EnhancedProject`
2. Provides defaults for all required fields
3. Update 3 files creating EnhancedProject

### Step 3: Remove Scene Access (2 hours)
1. Update WritingPanel to not create mock scenes
2. Fix SceneLinkageSuggestions
3. Fix TemplateSelector
4. Fix useWriting type conversion

### Step 4: Run Full Typecheck (15 min)
1. Verify all errors resolved
2. Document any remaining issues

---

## 📊 Progress Metrics

- **Type consolidations completed**: 2/5 (Project, Chapter)
- **Type conflicts remaining**: 3 (Character, Scene, ChapterMeta/Doc)
- **TypeScript errors**: 62 → ? (in progress)
- **Files requiring updates**: ~20 identified
- **Estimated time remaining**: 4-6 hours

---

## 🚧 Blockers

None currently - can proceed with recommended action plan.

---

## 💡 Key Insights

1. **Scene removal is cascading**: Removing scenes affects ~20 files
2. **Character types are fragmented**: Need to consolidate 3+ definitions
3. **IndexedDB types are separate concern**: ChapterMeta/Doc should stay separate from Chapter
4. **Templates need updating**: Starter templates use old scene-based format

---

**Next Action**: Resolve Character type conflicts before proceeding further.
