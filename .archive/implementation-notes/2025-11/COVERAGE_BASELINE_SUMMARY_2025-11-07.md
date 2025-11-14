# Coverage Baseline Summary

**Date:** 2025-11-07
**Branch:** main
**Commit:** c0ecd43

---

## 1. Coverage Report (Baseline Data)

### Overall Coverage

```
Total Lines:      64.85% (9,911 / 15,282)
Total Branches:   78.66% (1,707 / 2,170)
Total Functions:  58.85% (512 / 870)
Total Statements: 64.85% (9,911 / 15,282)
```

### Coverage by Directory

| Directory      | Lines    | Branches | Functions | Notes                                   |
| -------------- | -------- | -------- | --------- | --------------------------------------- |
| **adapters**   | 79.93%   | 70.96%   | 72.22%    | Good - Character/Chapter adapters       |
| **components** | ~60% avg | ~70% avg | ~40% avg  | Mixed - PWA excellent, AI/Sections poor |
| **constants**  | 100%     | 100%     | N/A       | ✅ Perfect - Brand constants            |
| **context**    | 66% avg  | 74% avg  | 30% avg   | ⚠️ Low function coverage                |
| **data**       | 25%      | 100%     | 0%        | ❌ Critical gap - dbFactory             |
| **domain**     | 100%     | 100%     | 100%      | ✅ Perfect - Schema versioning          |
| **editor**     | 100%     | 88.23%   | 100%      | ✅ Excellent                            |
| **export**     | 75% avg  | 50% avg  | 70% avg   | ⚠️ Poor branch coverage                 |
| **features**   | 25% avg  | 13% avg  | 10% avg   | ❌ Critical gaps                        |
| **hooks**      | 45% avg  | 65% avg  | 40% avg   | ⚠️ Medium coverage                      |
| **lib**        | 40% avg  | 50% avg  | 20% avg   | ❌ Poor coverage                        |
| **model**      | **7%**   | 100%     | **0%**    | 🚨 **CRITICAL GAP**                     |
| **onboarding** | 93%      | 90%      | 100%      | ✅ Excellent                            |
| **services**   | 60% avg  | 75% avg  | 65% avg   | ⚠️ Mixed - Good sync, poor storage      |
| **types**      | 100%     | 100%     | 100%      | ✅ Perfect - Type helpers               |
| **utils**      | 73.82%   | 83%      | 77.23%    | ✅ Good overall                         |
| **validation** | 66.26%   | 50%      | 33.33%    | ⚠️ Schema validation gaps               |

---

## 2. Test Infrastructure Context

### Test Configuration

**File:** `vitest.config.ts`

```typescript
{
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [
      './test/setupIndexedDB.ts',
      './src/setupTests.ts',
      './vitest.setup.ts'
    ],
    coverage: {
      enabled: true,
      provider: 'v8',
      thresholds: {
        lines: 64,        // Enforced in CI ✅
        functions: 50,
        branches: 60,
        statements: 64,
      },
    },
  }
}
```

### Test Scripts (package.json)

```json
{
  "test": "vitest run --reporter=verbose",
  "test:typecheck": "tsc --noEmit -p tsconfig.test.json && vitest run",
  "test:ci": "pnpm typecheck:test && vitest run",
  "test:run": "vitest run",
  "test:coverage": "vitest run --coverage"
}
```

### CI Integration

- **Pre-commit:** Runs `tsc --noEmit` on staged files
- **Pre-push:** Runs full test suite with coverage
- **GitHub Actions:** Runs `pnpm test:ci` (typecheck + tests)

### Global Mocks & Setup

**Setup Files:**

1. `test/setupIndexedDB.ts` - fake-indexeddb configuration
2. `src/setupTests.ts` - Supabase client mock, navigator mocks
3. `vitest.setup.ts` - Global test utilities

**Available Test Utilities:**

```typescript
// From test/testUtils.tsx
import {
  renderWithProviders, // Wraps component with AppProvider, AuthProvider, Router
  createMockUser, // Factory for Supabase User
  createMockSession, // Factory for Auth Session
  mockStorage, // Mock localStorage/IndexedDB with quota
  resetStorageMocks, // Reset storage between tests
  createMockAnalytics, // Mock analytics service
  createMockEventBus, // Mock event bus
  mockOnlineStatus, // Mock navigator.onLine
  simulateNetworkEvent, // Trigger online/offline events
  setupFakeTimers, // Vitest fake timers helper
  waitForPromises, // Flush microtask queue
  flushPromises, // Async test helper
} from '@/test/testUtils';
```

---

## 3. Source File Structure & Patterns

### Directory Tree (Simplified)

```
src/
├── adapters/          # Data model adapters (79% coverage ✅)
├── components/        # React components (60% avg ⚠️)
│   ├── AI/           # AI suggestion UI (22% ❌)
│   ├── Auth/         # Auth forms (65% ⚠️)
│   ├── Dashboard/    # Dashboard view (86% ✅)
│   ├── Layout/       # Main layout (66% ⚠️)
│   ├── Panels/       # Side panels (73% ✅)
│   ├── PWA/          # PWA features (95% ✅)
│   ├── Sections/     # Book builder (2% 🚨)
│   └── Writing/      # Editor panel (73% ✅)
├── constants/         # Brand constants (100% ✅)
├── context/          # React contexts (66% avg ⚠️)
├── data/             # Database layer (25% 🚨)
├── domain/           # Domain logic (100% ✅)
├── editor/           # Editor components (100% ✅)
├── export/           # Export utilities (75% ⚠️)
├── features/         # Feature modules (25% 🚨)
├── hooks/            # Custom React hooks (45% ❌)
├── lib/              # Library wrappers (40% ❌)
├── model/            # Gateway pattern (7% 🚨 CRITICAL)
├── onboarding/       # Onboarding system (93% ✅)
├── services/         # Business logic (60% ⚠️)
│   ├── chapters*     # Chapter CRUD (35% ❌)
│   ├── storage*      # Storage services (40% ❌)
│   ├── sync*         # Sync services (70% ✅)
│   └── pwa*          # PWA services (74% ✅)
├── types/            # TypeScript types (100% ✅)
├── utils/            # Utility functions (73% ✅)
│   ├── storage/     # Storage helpers (92% ✅)
│   └── dom/         # DOM utilities (70% ⚠️)
└── validation/       # Schema validation (66% ⚠️)

Total: 109 source files
Tests: 77 test files (1,044 passing tests, 24 skipped)
```

---

## 4. Test Audit Report Summary

**Source:** `TEST_AUDIT_REPORT.md` (from cleanup on 2025-11-07)

### Before Cleanup (103 total test files)

| Category     | Count | Percentage |
| ------------ | ----- | ---------- |
| ❌ Obsolete  | 3     | 2.9%       |
| ⚠️ Redundant | 3     | 2.9%       |
| 🔧 Stale     | 3     | 2.9%       |
| ✅ Current   | 94    | 91.3%      |

### After Cleanup (77 test files remain)

- **Deleted 9 files** (obsolete/duplicate/stale)
- **Removed 20 tests** (1,064 → 1,044)
- **Coverage improved** from 63.13% → 64.85% (+1.72%)

### Remaining Quality Issues

1. **24 Skipped Tests** - Need investigation/fixes
   - 5 in `AnalyticsPanel.test.tsx` (timing/polling issues)
   - Multiple in other files

2. **Test Organization**
   - Most tests in `__tests__/` subdirectories ✅
   - Some tests still at file level (should migrate)

---

## 5. Coverage Hotspots (Prioritized)

### 🚨 Critical (0-25% coverage)

**Must fix - Business critical paths:**

| File                                           | Lines      | Functions  | Why Critical                 |
| ---------------------------------------------- | ---------- | ---------- | ---------------------------- |
| `src/model/chapters.ts`                        | **6.98%**  | **0%**     | Core chapter CRUD gateway    |
| `src/model/characters.ts`                      | **7.85%**  | **0%**     | Character management gateway |
| `src/components/Sections/BookBuilderModal.tsx` | **2.28%**  | **0%**     | Export feature UI            |
| `src/services/exportHistory.ts`                | **9.56%**  | **9.09%**  | Export tracking              |
| `src/features/preview/analytics.ts`            | **12%**    | **0%**     | Preview analytics            |
| `src/services/sectionMigration.ts`             | **14.28%** | **20%**    | Data migration               |
| `src/utils/perf.ts`                            | **15.09%** | **7.69%**  | Performance monitoring       |
| `src/components/Projects/NewProjectDialog.tsx` | **21.27%** | **11.11%** | Project creation             |
| `src/services/storageService.ts`               | **23.17%** | **16.66%** | Storage abstraction          |
| `src/components/AI/AISuggestionBox.tsx`        | **22.7%**  | **7.14%**  | AI suggestions UI            |

**Estimated Impact:** +10-12% coverage if all addressed

---

### ⚠️ Medium (25-65% coverage)

**Should improve - Core functionality:**

| File                                                | Lines      | Functions  | Why Important           |
| --------------------------------------------------- | ---------- | ---------- | ----------------------- |
| `src/data/dbFactory.ts`                             | **25%**    | **0%**     | Database initialization |
| `src/export/utils/svgCapture.ts`                    | **30.3%**  | **28.57%** | SVG export for diagrams |
| `src/services/chaptersService.ts`                   | **35.18%** | **43.75%** | Chapter CRUD + sync     |
| `src/context/ClaudeProvider.tsx`                    | **35.48%** | **66.66%** | AI state management     |
| `src/components/Storage/StorageStatusIndicator.tsx` | **36.06%** | **42.85%** | Storage UI              |
| `src/services/tutorialStorage.ts`                   | **37.74%** | **77.77%** | Tutorial persistence    |
| `src/hooks/useChapters.ts`                          | **39.39%** | **12.5%**  | Chapter operations hook |
| `src/features/export/ExportModal.tsx`               | **43.07%** | **20%**    | Export modal UI         |
| `src/services/enhancedStorageService.ts`            | **43.69%** | **60%**    | Enhanced storage API    |
| `src/hooks/useSections.ts`                          | **45.15%** | **66.66%** | Section operations      |

**Estimated Impact:** +8-10% coverage if all addressed

---

### ✅ Good (65-85% coverage)

**Maintain and improve incrementally:**

| File                                              | Lines  | Notable Gaps                         |
| ------------------------------------------------- | ------ | ------------------------------------ |
| `src/context/AppContext.tsx`                      | 66.12% | Low function coverage (11.11%)       |
| `src/components/Layout/MainLayout.tsx`            | 66.04% | Low function coverage (18.75%)       |
| `src/services/claudeService.ts`                   | 67.14% | Branch coverage opportunities        |
| `src/components/Sidebar.tsx`                      | 69.5%  | Low function coverage (33.33%)       |
| `src/services/recoveryService.ts`                 | 70.55% | Branch coverage gaps                 |
| `src/components/AnalyticsPanel.tsx`               | 73.01% | 5 skipped tests to fix               |
| `src/context/ChaptersContext.tsx`                 | 73.05% | Low function coverage (27.77%)       |
| `src/services/connectivityService.ts`             | 73.57% | Good overall                         |
| `src/components/Writing/EnhancedWritingPanel.tsx` | 73.11% | **Branch: 49.15%**, **Func: 15.62%** |

**Estimated Impact:** +4-5% coverage if all addressed

---

## 6. Quick Reference: Testing Patterns

### Component Test Template

```typescript
/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test/testUtils';

describe('MyComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render with required props', () => {
    render(<MyComponent />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('should integrate with auth context', () => {
    const { user } = renderWithProviders(<MyComponent />, {
      authState: { user: createMockUser() }
    });
    // Test auth-dependent behavior
  });
});
```

### Service Test Template

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MyService } from '../myService';

describe('MyService', () => {
  let service: MyService;

  beforeEach(() => {
    service = new MyService();
  });

  it('should perform CRUD operations', async () => {
    const result = await service.create({ name: 'Test' });
    expect(result).toMatchObject({ id: expect.any(String) });
  });
});
```

### Hook Test Template

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useMyHook } from '../useMyHook';

describe('useMyHook', () => {
  it('should load data on mount', async () => {
    const { result } = renderHook(() => useMyHook('test-id'));

    await waitFor(() => {
      expect(result.current.data).toBeDefined();
    });
  });
});
```

---

## 7. Coverage Growth Strategy

### Phase 1: Foundation (Weeks 1-2)

**Target:** 72-75% lines

- ✅ Model layer tests (`chapters.ts`, `characters.ts`)
- ✅ Critical UI gaps (`BookBuilderModal`, `NewProjectDialog`)
- ✅ Storage services (`storageService.ts`, `exportHistory.ts`)
- ✅ Hook testing (`useProject`, `useChapters`, `useSync`)

**Expected Gain:** +8-10%

### Phase 2: Core Features (Weeks 3-4)

**Target:** 77-80% lines

- ✅ Service layer (`chaptersService`, `enhancedStorageService`)
- ✅ Context providers (`AppContext`, `ClaudeProvider`)
- ✅ Complex components (`CommandPalette`, `MainLayout`)

**Expected Gain:** +5-7%

### Phase 3: Integration (Weeks 5-6)

**Target:** 80%+ lines

- ✅ End-to-end user flows
- ✅ AI integration testing
- ✅ Export pipeline testing

**Expected Gain:** +2-3%

---

## Next Actions

1. ✅ **Review coverage plan** - See [COVERAGE_ATTACK_PLAN.md](COVERAGE_ATTACK_PLAN.md)
2. ✅ **Review file priorities** - See [coverage-breakdown.csv](coverage-breakdown.csv)
3. **Start Phase 1** - Begin with `src/model/chapters.ts` (highest impact)
4. **Track weekly** - Update this baseline after each sprint
5. **Fix skipped tests** - Address 24 skipped tests incrementally

---
