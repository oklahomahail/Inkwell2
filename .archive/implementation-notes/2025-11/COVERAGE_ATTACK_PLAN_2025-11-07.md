# Coverage Attack Plan

**Generated:** 2025-11-07
**Current Coverage:** 64.85% lines, 78.66% branches, 58.85% functions
**Target Coverage:** 75% lines, 85% branches, 70% functions
**Timeline:** 4-6 weeks of incremental improvements

---

## Executive Summary

After test cleanup, Inkwell's coverage stands at **64.85%** with **77 test files** covering **1,044 tests**. This plan identifies **high-value, low-effort wins** to push coverage to 75%+ while improving code quality and reducing technical debt.

### Current State Analysis

| Category                  | Lines Coverage | Priority Files | Estimated Impact |
| ------------------------- | -------------- | -------------- | ---------------- |
| **Critical Low Coverage** | <25%           | 15 files       | +8-10%           |
| **Medium Coverage**       | 25-65%         | 28 files       | +5-7%            |
| **Good Coverage**         | 65-85%         | 31 files       | +2-3%            |
| **Excellent Coverage**    | 85-100%        | 35 files       | (maintain)       |

---

## Phase 1: Quick Wins (Week 1-2) 🎯

**Target:** +8-10% coverage increase
**Effort:** Low-Medium
**Files:** 15-20 files

### A. Critical Low-Coverage Files (<25%)

These files have **minimal testing** but are **frequently imported** or contain **business logic**:

#### 1. Model Layer (Gateway Pattern) - **Highest Priority**

| File                      | Current   | Target | Why Critical                      |
| ------------------------- | --------- | ------ | --------------------------------- |
| `src/model/chapters.ts`   | **6.98%** | 70%    | Core CRUD operations for chapters |
| `src/model/characters.ts` | **7.85%** | 70%    | Character management gateway      |

**Test Strategy:**

```typescript
// Example test structure for chapters.ts
describe('Chapters Gateway', () => {
  describe('CRUD Operations', () => {
    it('should create chapter with valid metadata');
    it('should list chapters for project');
    it('should update chapter content');
    it('should delete chapter and cleanup');
  });

  describe('Indexing & Search', () => {
    it('should index chapter for search');
    it('should handle bulk operations');
  });
});
```

**Mocking Needs:**

- IndexedDB via `fake-indexeddb`
- Supabase client mock (already available in `setupTests.ts`)

**Estimated Time:** 4-6 hours per file
**Coverage Gain:** +3-4%

---

#### 2. Data Layer - Factory Pattern

| File                    | Current | Target | Why Critical                        |
| ----------------------- | ------- | ------ | ----------------------------------- |
| `src/data/dbFactory.ts` | **25%** | 80%    | Database initialization entry point |

**Test Strategy:**

- Test database creation flow
- Test singleton pattern behavior
- Test error handling for corrupted state

**Estimated Time:** 2 hours
**Coverage Gain:** +0.5%

---

#### 3. UI Components - Low Coverage

| File                                           | Current    | Target | Why Important           |
| ---------------------------------------------- | ---------- | ------ | ----------------------- |
| `src/components/Sections/BookBuilderModal.tsx` | **2.28%**  | 60%    | Critical export feature |
| `src/components/Projects/NewProjectDialog.tsx` | **21.27%** | 70%    | User onboarding flow    |
| `src/components/AI/AISuggestionBox.tsx`        | **22.7%**  | 60%    | AI integration point    |

**Test Strategy:**

```typescript
// BookBuilderModal.test.tsx
describe('BookBuilderModal', () => {
  it('should open and display chapter selection');
  it('should handle export format selection');
  it('should trigger export with correct chapters');
  it('should show loading state during export');
  it('should display error if export fails');
});
```

**Estimated Time:** 3-4 hours per component
**Coverage Gain:** +2-3%

---

#### 4. Services - Business Logic Gaps

| File                               | Current    | Target | Why Important                |
| ---------------------------------- | ---------- | ------ | ---------------------------- |
| `src/services/exportHistory.ts`    | **9.56%**  | 65%    | Export tracking & history    |
| `src/services/storageService.ts`   | **23.17%** | 70%    | Core storage abstraction     |
| `src/services/sectionMigration.ts` | **14.28%** | 70%    | Data migration critical path |

**Test Strategy:**

- Focus on happy path CRUD operations first
- Add error handling tests second
- Test migration scenarios with mock data

**Estimated Time:** 3-4 hours per service
**Coverage Gain:** +2-3%

---

#### 5. Hooks - Low Coverage

| File                       | Current    | Target | Why Important              |
| -------------------------- | ---------- | ------ | -------------------------- |
| `src/hooks/useSync.ts`     | **6.25%**  | 60%    | Realtime sync coordination |
| `src/hooks/useProject.ts`  | **24.69%** | 65%    | Project state management   |
| `src/hooks/useChapters.ts` | **39.39%** | 70%    | Chapter operations hook    |

**Test Strategy:**

```typescript
// useProject.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { useProject } from '../useProject';

describe('useProject', () => {
  it('should load project by ID');
  it('should create new project');
  it('should update project metadata');
  it('should handle project not found');
});
```

**Estimated Time:** 2-3 hours per hook
**Coverage Gain:** +2%

---

### B. Utility Functions - Easy Wins

These are **pure functions** with minimal dependencies:

| File                                | Current    | Target | Time | Impact |
| ----------------------------------- | ---------- | ------ | ---- | ------ |
| `src/utils/perf.ts`                 | **15.09%** | 90%    | 1h   | +0.5%  |
| `src/lib/sectionIcons.tsx`          | **5.66%**  | 80%    | 1h   | +0.3%  |
| `src/features/preview/analytics.ts` | **12%**    | 75%    | 1.5h | +0.3%  |

**Test Strategy:**

- Test each exported function independently
- Use snapshot testing for icon rendering
- Mock analytics calls with `vi.fn()`

---

## Phase 2: Medium-Lift Improvements (Week 3-4) 🏗️

**Target:** +5-7% coverage increase
**Effort:** Medium
**Files:** 20-25 files

### A. Services with Moderate Coverage (25-65%)

| File                                     | Current    | Target | Complexity                   |
| ---------------------------------------- | ---------- | ------ | ---------------------------- |
| `src/services/chaptersService.ts`        | **35.18%** | 70%    | High - IndexedDB + Supabase  |
| `src/services/enhancedStorageService.ts` | **43.69%** | 70%    | Medium - Storage abstraction |
| `src/services/tutorialStorage.ts`        | **37.74%** | 65%    | Low - localStorage wrapper   |
| `src/services/storageManager.ts`         | **60.66%** | 75%    | Medium - Quota management    |

**Test Strategy:**

```typescript
// chaptersService.test.ts
describe('ChaptersService', () => {
  describe('Supabase Integration', () => {
    it('should sync chapter to Supabase');
    it('should handle offline mode gracefully');
    it('should resolve conflicts on sync');
  });

  describe('IndexedDB Operations', () => {
    it('should cache chapters locally');
    it('should invalidate cache on update');
  });
});
```

**Mocking Strategy:**

- Use `setupSupabaseMock()` from `test/supabaseMock.ts`
- Mock `navigator.onLine` for offline tests
- Use `fake-indexeddb` for local storage

**Estimated Time:** 4-6 hours per service
**Coverage Gain:** +4-5%

---

### B. React Context Providers

| File                              | Current    | Target | Why Important            |
| --------------------------------- | ---------- | ------ | ------------------------ |
| `src/context/AppContext.tsx`      | **66.12%** | 80%    | Global app state         |
| `src/context/ChaptersContext.tsx` | **73.05%** | 85%    | Chapter state management |
| `src/context/ClaudeProvider.tsx`  | **35.48%** | 70%    | AI integration state     |

**Test Strategy:**

```typescript
// AppContext.test.tsx
import { renderHook } from '@testing-library/react';
import { AppProvider, useAppContext } from '../AppContext';

describe('AppContext', () => {
  it('should initialize with default state');
  it('should update theme preference');
  it('should set current project');
  it('should persist state to localStorage');
});
```

**Estimated Time:** 3-4 hours per context
**Coverage Gain:** +1-2%

---

### C. Complex Components (50-70% coverage)

| File                                                       | Current    | Target | Complexity |
| ---------------------------------------------------------- | ---------- | ------ | ---------- |
| `src/components/CommandPalette/CommandPaletteProvider.tsx` | **52.58%** | 75%    | High       |
| `src/components/Layout/MainLayout.tsx`                     | **66.04%** | 80%    | High       |
| `src/components/Writing/EnhancedWritingPanel.tsx`          | **73.11%** | 85%    | Very High  |

**Test Strategy:**

- Use `renderWithProviders()` from `test/testUtils.tsx`
- Focus on user interactions (keyboard shortcuts, commands)
- Test keyboard navigation and accessibility

**Estimated Time:** 5-8 hours per component
**Coverage Gain:** +2-3%

---

## Phase 3: High-Value Integration Tests (Week 5-6) 🎯

**Target:** +2-3% coverage increase
**Effort:** High
**Focus:** Critical user flows

### A. End-to-End User Flows

#### 1. Project Creation → First Chapter → Export

**Coverage Targets:**

- `src/components/Projects/NewProjectDialog.tsx` → 70%
- `src/model/chapters.ts` → 70%
- `src/features/export/ExportModal.tsx` → 60%

**Test Strategy:**

```typescript
// e2e/project-lifecycle.test.tsx
describe('Project Lifecycle', () => {
  it('should create project, add chapter, and export', async () => {
    const { user } = renderWithProviders(<App />, {
      route: '/dashboard',
      authState: { user: createMockUser() }
    });

    // 1. Create new project
    await user.click(screen.getByRole('button', { name: /new project/i }));
    await user.type(screen.getByLabelText(/project name/i), 'My Novel');
    await user.click(screen.getByRole('button', { name: /create/i }));

    // 2. Add first chapter
    await user.click(screen.getByRole('button', { name: /new chapter/i }));
    await user.type(screen.getByRole('textbox'), 'Chapter 1 content...');

    // 3. Export project
    await user.click(screen.getByRole('button', { name: /export/i }));
    expect(screen.getByText(/export complete/i)).toBeInTheDocument();
  });
});
```

**Estimated Time:** 8-12 hours
**Coverage Gain:** +2-3%

---

#### 2. AI Suggestion Flow

**Coverage Targets:**

- `src/components/AI/AISuggestionBox.tsx` → 60%
- `src/services/claudeService.ts` → 75%
- `src/context/ClaudeProvider.tsx` → 70%

**Test Strategy:**

- Mock Claude API responses
- Test streaming response handling
- Test error states and retries

**Estimated Time:** 6-8 hours
**Coverage Gain:** +1-2%

---

## Implementation Guidelines

### Testing Tools Available

```typescript
// From test/testUtils.tsx
import {
  renderWithProviders, // Full provider wrapper
  createMockUser, // Supabase user factory
  createMockSession, // Auth session factory
  mockStorage, // Mock localStorage/IndexedDB
  setupFakeTimers, // Vitest fake timers
  flushPromises, // Async helper
} from '@/test/testUtils';
```

### Mock Setup Patterns

#### 1. IndexedDB Tests

```typescript
import 'fake-indexeddb/auto';

beforeEach(() => {
  // Reset IndexedDB between tests
  indexedDB = new IDBFactory();
});
```

#### 2. Supabase Tests

```typescript
import { mockSupabase } from '@/test/supabaseMock';

beforeEach(() => {
  mockSupabase.auth.getSession.mockResolvedValue({
    data: { session: createMockSession() },
    error: null,
  });
});
```

#### 3. Component Tests

```typescript
import { renderWithProviders } from '@/test/testUtils';

test('should render with auth', () => {
  renderWithProviders(<MyComponent />, {
    authState: { user: createMockUser() },
    route: '/dashboard',
  });
});
```

---

## Success Metrics

### Coverage Targets by Phase

| Phase        | Target Lines | Target Branches | Target Functions | Timeline  |
| ------------ | ------------ | --------------- | ---------------- | --------- |
| **Baseline** | 64.85%       | 78.66%          | 58.85%           | (current) |
| **Phase 1**  | 72-75%       | 82%             | 65%              | Week 1-2  |
| **Phase 2**  | 77-80%       | 85%             | 70%              | Week 3-4  |
| **Phase 3**  | 80%+         | 87%             | 73%              | Week 5-6  |

### Quality Gates

- ✅ No skipped tests (currently 24 skipped)
- ✅ No test files in archive folders
- ✅ All critical paths have integration tests
- ✅ Coverage never decreases (enforced by CI)

---

## Priority Matrix

### Highest ROI (Do First)

1. **Model Layer** (`chapters.ts`, `characters.ts`) - **+3-4% coverage**
2. **BookBuilderModal** - **+1.5% coverage**, critical UX
3. **Storage Services** - **+2% coverage**, core functionality
4. **Project Hooks** - **+2% coverage**, state management

### Medium ROI (Do Second)

5. **Context Providers** - **+1-2% coverage**, good test infrastructure exists
6. **Complex Components** - **+2-3% coverage**, user-facing
7. **Service Layer Gaps** - **+2% coverage**, business logic

### Lower ROI (Do Last)

8. **Utility Functions** - **+1% coverage**, low complexity but many files
9. **Pure Functions** - **+0.5% coverage**, easy wins for morale

---

## Appendix: Coverage Hotspots

### Files with Zero Function Coverage

| File                                | Lines | Functions | Action            |
| ----------------------------------- | ----- | --------- | ----------------- |
| `src/model/chapters.ts`             | 6.98% | **0%**    | Phase 1 priority  |
| `src/model/characters.ts`           | 7.85% | **0%**    | Phase 1 priority  |
| `src/data/dbFactory.ts`             | 25%   | **0%**    | Phase 1 quick win |
| `src/features/preview/analytics.ts` | 12%   | **0%**    | Phase 1 easy      |
| `src/lib/sectionIcons.tsx`          | 5.66% | **0%**    | Phase 1 easy      |

### Files with <50% Branch Coverage

| File                                              | Branches   | Why Important           |
| ------------------------------------------------- | ---------- | ----------------------- |
| `src/components/AI/AISuggestionBox.tsx`           | **30.76%** | AI integration critical |
| `src/lib/supabaseClient.ts`                       | **25%**    | Auth initialization     |
| `src/export/templates/analysisSummary.ts`         | **23.52%** | Export quality          |
| `src/components/Writing/EnhancedWritingPanel.tsx` | **49.15%** | Core editor             |

---

## Next Steps

1. **Review this plan** with the team
2. **Create GitHub issues** for Phase 1 tasks
3. **Set up coverage tracking** in CI (already done ✅)
4. **Start with model layer tests** (highest impact)
5. **Track progress weekly** using coverage reports

**Estimated Total Time:** 80-120 hours across 4-6 weeks
**Expected Coverage Gain:** +15-20% lines, +8-10% branches, +12-15% functions
