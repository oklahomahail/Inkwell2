# Test Implementation Progress

## Overview

This document tracks the implementation of the comprehensive, value-first test plan targeting real risk and core workflows.

## Completed Tests

### Tier 1 — Stability & Core Workflow ✅

#### 1. Auth Flow & Session State Boundaries ✅

**File**: `src/context/__tests__/AuthContext.test.tsx`
**Coverage Areas**:

- Magic link happy path
- Email/password sign in/up
- Error surfacing and loading states
- Token refresh handling
- Logout clearing all state
- Password recovery routes
- Protected route redirects
- Preview signup tracking
- Subscription cleanup

**Test Count**: 15 tests
**Risk Mitigated**: Critical - blocks all users if broken

#### 2. AppContext & Global UI State Contracts ✅

**File**: `src/context/__tests__/AppContext.test.tsx`
**Coverage Areas**:

- Theme init, persistence, toggling
- localStorage integration
- UI reducer actions (projects, views, loading, errors)
- Auto-save state transitions
- Feature flag compatibility

**Test Count**: 20+ tests
**Expected Coverage Improvement**: context/\* from 35-57% → 70%+

#### 3. Storage Health, Persistence & Private Mode ✅

**File**: `src/utils/storage/__tests__/storageHealth.comprehensive.test.ts`
**Coverage Areas**:

- Quota thresholds (70%, 90%)
- Private mode detection
- IndexedDB availability
- Database existence checks
- Persistence status
- Subscription callbacks (watchStorageHealth)
- Simple status helpers
- Error handling (quota exceeded, estimate failures)
- Edge cases (division by zero, missing APIs)

**Test Count**: 25+ tests
**Expected Coverage Improvement**: utils/storage/\* from current → 85%+

### Tier 1 — In Progress 🚧

#### 4. Connectivity: Online/Offline & Retry Logic

**File**: `src/services/__tests__/connectivityService.comprehensive.test.ts` (to be created)
**What to Test**:

- Event listeners for online/offline
- Debounce/reconnect behavior
- Single notification per transition
- No spam on rapid toggles
- Cleanup on service destroy

**Expected Coverage**: ~53% → 80%+

#### 5. Export End-to-End

**File**: `src/features/export/__tests__/ExportModal.integration.test.tsx` (to be created)
**What to Test**:

- Modal opens/closes
- Template selection
- Disable analysis when no data
- Event firing (export_started/succeeded/failed)
- Builders return valid HTML with expected content

**Current Test**: Basic smoke test exists, needs expansion

### Tier 2 — User Workflows & Telemetry (Planned)

#### 6. Analytics Adapter & Event Schema

- `services/__tests__/analyticsService.comprehensive.test.ts`
- Guard rails: no-throw, DNT, required fields

#### 7. PWA Install/Update Prompts

- Enhanced tests for `components/PWA/__tests__/*`
- Gate logic, dismissal persistence

#### 8. Safe Navigation & Redirects

- `utils/__tests__/safeRedirect.comprehensive.test.ts`
- External origin rejection, query preservation

#### 9. Search Service Contract

- `services/__tests__/searchService.test.ts`
- Param normalization, paging, error paths

### Tier 3 — Onboarding, Tours, Nice-to-Haves (Planned)

#### 10. Tour Service Lifecycle

#### 11. Command Palette Core Actions

#### 12. Snapshot/Image Utilities Edge Cases

## Test Utilities Created ✅

**File**: `src/test/testUtils.tsx`

**Exports**:

- `createMockUser()` - Mock Supabase user factory
- `createMockSession()` - Mock session factory
- `mockStorage()` - Mock navigator.storage, indexedDB, localStorage
- `resetStorageMocks()` - Clean up storage mocks
- `createMockAnalytics()` - Mock analytics service
- `createMockEventBus()` - Mock event emitter
- `mockOnlineStatus()` / `simulateNetworkEvent()` - Network mocking
- `renderWithProviders()` - RTL wrapper with all providers
- `setupFakeTimers()` - Vitest timer helpers
- `flushPromises()` - Async test helper

## Coverage Goals

| Area                         | Before | Target | Status      |
| ---------------------------- | ------ | ------ | ----------- |
| context/AuthContext          | ~40%   | 75%+   | ✅ On track |
| context/AppContext           | 35-57% | 70%+   | ✅ On track |
| utils/storage/\*             | ~50%   | 85%+   | ✅ On track |
| services/connectivityService | 53%    | 80%+   | 🚧 Next     |
| features/export              | ~30%   | 70%+   | 🚧 Next     |
| services/analyticsService    | 24%    | 70-80% | 📋 Planned  |
| tour/\*                      | teens  | 60-70% | 📋 Planned  |

## Definition of Done (Per Area)

✅ All happy paths covered
✅ Key error paths tested
✅ At least one edge case per public function
✅ No reliance on real network/SW/timers
✅ Deterministic and fast (< 1s per suite)
✅ Follows established patterns from testUtils

## Next Steps

1. ✅ **Day 1-2 Complete**: Auth, AppContext, Storage
2. **Day 3 (Next)**:
   - Connectivity service tests
   - Export end-to-end tests
3. **Day 4**: Analytics, PWA
4. **Day 5**: Safe redirects, Search, begin Tour
5. **Spillover**: Command Palette, Snapshot utilities

## Running Tests

```bash
# Run all new tests
pnpm test src/context/__tests__/AuthContext.test.tsx
pnpm test src/context/__tests__/AppContext.test.tsx
pnpm test src/utils/storage/__tests__/storageHealth.comprehensive.test.ts

# Run with coverage
pnpm test:coverage

# Watch mode during development
pnpm test --watch
```

## Notes

- All tests use shared utilities from `src/test/testUtils.tsx`
- Mocks are properly cleaned up in `afterEach`
- Tests are deterministic (no real timers, network, or storage)
- Provider harness allows easy integration testing
- Tests document actual behavior, not idealized behavior
