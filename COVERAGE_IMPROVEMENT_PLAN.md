# Coverage Improvement Plan

## Current Status (October 26, 2025)

**Overall Coverage:**

- Statements: 71.58%
- Branches: 78.34%
- Functions: 64.59%
- Lines: 71.58%

**Target:** 80% threshold (not yet met)

## Test Suite Status

✅ **All 604 tests passing** across 54 test files
✅ **No skipped tests** (fixed 2 previously skipped tests in AuthContext)

## Files Requiring Attention

### High Priority (Very Low Coverage)

#### 1. **components/ui/Input.tsx** - 14% coverage

- **Lines uncovered:** 12-56
- **Impact:** Critical UI component
- **Recommended action:** Add comprehensive input component tests covering:
  - Props variations (disabled, error, placeholder)
  - Keyboard interactions
  - Accessibility attributes
  - onChange event handling

#### 2. **services/temporalStorage.ts** - 14.11% coverage

- **Lines uncovered:** 71-87, 89-189, 192-194
- **Functions:** 5.55%
- **Impact:** Storage versioning and migration system
- **Recommended action:** Add tests for:
  - Version migration logic
  - Temporal storage operations
  - Error handling for storage failures
  - Data integrity checks

#### 3. **features/preview/analytics.ts** - 12% coverage

- **Lines uncovered:** 47-55, 61-68, 74-80
- **Functions:** 0%
- **Impact:** Analytics tracking
- **Recommended action:** Add tests for:
  - Event tracking functions
  - Analytics data collection
  - Error handling in tracking

### Medium Priority (Low Coverage 20-40%)

#### 4. **components/Projects/ProjectDialog.tsx** - 21.27% coverage

- **Lines uncovered:** 37, 60-63, 67-119
- **Functions:** 11.11%
- **Impact:** Project creation/editing UI
- **Recommended action:** Add integration tests for:
  - Dialog open/close states
  - Form submission
  - Validation logic
  - Error states

#### 5. **data/dbFactory.ts** - 25% coverage

- **Lines uncovered:** 12-13, 17-23
- **Functions:** 0%
- **Impact:** Database initialization
- **Recommended action:** Add tests for:
  - DB instance creation
  - Factory pattern usage
  - Error handling

#### 6. **export/utils/svgCapture.ts** - 30.3% coverage

- **Lines uncovered:** 23-36, 44-45, 54-55, 69-75, 89-90, 102-112, 119-125
- **Functions:** 28.57%
- **Impact:** SVG export functionality
- **Recommended action:** Add tests for:
  - SVG capture logic
  - DOM manipulation
  - Error cases

#### 7. **context/FeatureFlagProvider.tsx** - 35.13% coverage

- **Lines uncovered:** 89-99, 102-207, 211-219
- **Functions:** 66.66%
- **Impact:** Feature flag management
- **Recommended action:** Add tests for:
  - Flag evaluation logic
  - Context provider
  - Flag updates

#### 8. **services/serialStorage.ts** - 37.5% coverage

- **Lines uncovered:** 44-165, 233-240
- **Functions:** 77.77%
- **Impact:** Alternative storage mechanism
- **Recommended action:** Add tests for:
  - Serial storage operations
  - Data persistence
  - Error recovery

### Lower Priority (40-60% Coverage)

- **features/export/ExportModal.tsx** - 42.18%
- **services/enhancedStorageService.ts** - 49.89%
- **domain/schemaVersion.ts** - 50%
- **utils/projectBundle.ts** - 53.7%
- **components/CommandPalette/CommandPaletteProvider.tsx** - 53.98%

## Well-Tested Areas (>90% Coverage)

✅ **components/PWA/** - 93.09%
✅ **utils/storage/** - 92.06%
✅ **utils/**tests**/FeatureFlagManager.ts** - 90.75%
✅ **services/snapshotService.ts** - 88.83%
✅ **context (AuthContext.tsx)** - 89.18% (improved from skipped tests)
✅ **components/Storage/** - 100%
✅ **components/Brand/** - 100%
✅ **constants/** - 100%
✅ **Many utils/** - 100%

## Recommendations

### Phase 1: Quick Wins (Target: +5-7% coverage)

1. Add basic tests for `Input.tsx` component
2. Add smoke tests for `analytics.ts`
3. Add tests for `dbFactory.ts`
4. Add error handling tests for `temporalStorage.ts`

### Phase 2: Component Testing (Target: +5-8% coverage)

1. Comprehensive `ProjectDialog.tsx` tests
2. Export modal testing
3. Command palette provider tests

### Phase 3: Service Layer (Target: +5-10% coverage)

1. Complete `temporalStorage.ts` coverage
2. Complete `serialStorage.ts` coverage
3. Improve `enhancedStorageService.ts` coverage
4. Add SVG capture tests

### Phase 4: Integration Tests

1. End-to-end feature flag tests
2. Storage migration tests
3. Project lifecycle tests

## Coverage Improvement Strategies

1. **Identify Critical Paths:** Focus on user-facing features and data integrity
2. **Test Error Boundaries:** Many uncovered lines are error handlers
3. **Mock External Dependencies:** Properly mock browser APIs, storage, and network
4. **Integration Tests:** Some files need integration tests rather than unit tests
5. **Snapshot Tests:** Consider snapshot tests for complex UI components

## Next Steps

1. ✅ Fixed all test failures
2. ✅ Enabled 2 skipped tests (AuthContext)
3. ⏳ Implement Phase 1 quick wins
4. ⏳ Target 75% coverage milestone
5. ⏳ Target 80% coverage threshold

## Notes

- Current coverage calculation includes test files themselves
- Some files with low coverage may be acceptable if they're simple wrappers
- Focus should be on business logic and critical paths
- Consider excluding certain files from coverage requirements (e.g., config files)
