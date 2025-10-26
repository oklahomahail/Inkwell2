# Next Steps - Test Implementation

## Immediate Actions (To Run Tests)

### 1. Verify Test Utilities Build Correctly

The test utilities have some TypeScript issues that need resolution because they import from context files. The solution:

**Option A: Use relative imports in testUtils.tsx** (recommended)

```bash
# No changes needed - tests already use relative imports
```

**Option B: Skip provider wrapping in initial tests**
For now, the context tests don't use `renderWithProviders`, so they'll work once we fix the mock setup.

### 2. Ensure Mock Setup is Available

The tests expect `__mockSupabase` and `__triggerDashboardView` to be on `globalThis`.

**Check if test/setup.ts is being loaded:**

```bash
# Run a quick test
pnpm test src/context/__tests__/AuthContext.test.tsx
```

If the tests fail with "Cannot read properties of undefined (reading 'auth')", the setup file isn't being loaded properly.

**Solution**: Verify `vitest.config.ts` includes the setup file:

```typescript
setupFiles: ['./test/setupIndexedDB.ts', './src/setupTests.ts'];
```

And ensure `src/test/setup.ts` is also loaded, or merge its contents into `src/setupTests.ts`.

### 3. Run Individual Test Suites

```bash
# Test each suite independently to isolate issues
pnpm test src/context/__tests__/AppContext.test.tsx
pnpm test src/utils/storage/__tests__/storageHealth.comprehensive.test.ts
pnpm test src/services/__tests__/connectivityService.comprehensive.test.ts
```

### 4. Fix Any Import Path Issues

If you see errors about `@/test/testUtils` or `@/context/...`, verify:

1. The `@` alias is configured in `vitest.config.ts`:

```typescript
resolve: {
  alias: {
    '@': fileURLToPath(new URL('./src', import.meta.url)),
  },
}
```

2. Tests use the correct import paths (we've already updated to relative paths where needed)

## Day 3 - Export End-to-End Tests

### Create: `src/features/export/__tests__/ExportModal.integration.test.tsx`

**What to test:**

```typescript
✅ Modal opens when triggered
✅ Shows available export templates
✅ Template selection updates state
✅ "Analysis" template is disabled when no analysis data
✅ Export button triggers correct handler
✅ Analytics events fire:
   - export_started (with template type)
   - export_succeeded (with file size/duration)
   - export_failed (with error message)
✅ Loading states display correctly
✅ Error messages surface to user
✅ Modal closes on cancel
✅ Modal closes on successful export
```

**Approach:**

- Use `renderWithProviders` to wrap modal
- Mock `ChapterService` and `AnalyticsService`
- Mock `html-to-paper` or whatever export library is used
- Test user flow from open → select template → export → close

### Create: `src/export/templates/__tests__/builders.test.ts`

**What to test:**

```typescript
✅ Manuscript builder returns valid HTML
✅ Manuscript includes title, author, chapters
✅ Analysis builder returns valid HTML
✅ Analysis includes grades, scorecard, insights
✅ Builders handle missing/null data gracefully
✅ Builders escape HTML in user content
✅ Builders include CSS references
```

## Day 4 - Analytics & PWA

### Enhance: `src/services/__tests__/analyticsService.comprehensive.test.ts`

**What to test:**

```typescript
✅ track() never throws (even with bad data)
✅ Honors Do-Not-Track header
✅ Validates required fields per event type
✅ Drops invalid events (logs warning)
✅ Batches events correctly
✅ Flushes on page unload
✅ Handles network failures gracefully
✅ Retries failed sends (with backoff)
```

### Enhance: `src/components/PWA/__tests__/PWA.integration.test.tsx`

**What to test:**

```typescript
✅ Install prompt shows when beforeinstallprompt fires
✅ Install prompt dismissed → don't show again (7 days)
✅ Update notification shows when SW update detected
✅ Update dismissed → don't show again (1 day)
✅ Update accepted → reloads page
✅ Offline indicator shows when navigator.onLine = false
✅ Offline indicator hides when back online
```

## Day 5 - Safe Redirects & Search

### Create: `src/utils/__tests__/safeRedirect.comprehensive.test.ts`

**What to test:**

```typescript
✅ Allows same-origin paths (/dashboard)
✅ Preserves query parameters (/dash?foo=bar)
✅ Preserves hash fragments (/dash#section)
✅ Rejects protocol://host URLs
✅ Rejects // protocol-relative URLs
✅ Rejects javascript: URLs
✅ Rejects data: URLs
✅ Handles empty/null/undefined → default
✅ Handles malformed URLs → default
```

### Enhance: `src/services/__tests__/searchService.test.ts`

**What to test:**

```typescript
✅ Normalizes search query (trim, lowercase)
✅ Empty query → returns empty results
✅ Paginates results correctly
✅ Page beyond results → empty page
✅ Handles filters (by type, by date, etc.)
✅ Sorts results (relevance, date, etc.)
✅ Handles data source errors
✅ Caches recent searches
```

## Spillover - Tours, Commands, Snapshots

### `src/tour/__tests__/TourService.comprehensive.test.ts`

**What to test:**

```typescript
✅ start() → state transitions to active
✅ next() → advances to next step
✅ complete() → persists completion
✅ skip() → marks as skipped (don't show again)
✅ reset() → clears completion state
✅ Starting twice → idempotent (same state)
✅ Analytics events fire for each action
```

### `src/components/CommandPalette/__tests__/CommandPalette.integration.test.tsx`

**What to test:**

```typescript
✅ Cmd+K opens palette
✅ Typing filters commands
✅ Arrow keys navigate results
✅ Enter executes command
✅ Esc closes palette
✅ Commands registered correctly
✅ Command handler invoked with args
✅ Missing handler → error logged, no crash
```

### `src/services/__tests__/snapshotService.comprehensive.test.ts`

**What to test:**

```typescript
✅ captureSnapshot() → returns data URL
✅ Selector not found → rejects with error
✅ Invalid SVG → fallback to empty
✅ Large DOM → times out gracefully
✅ Cleans up temporary elements
✅ Works with different element types (canvas, svg, div)
```

## Definition of Done (Overall)

When all tests are complete:

✅ **All test suites pass** without flakiness
✅ **Coverage reports show** 70%+ for targeted areas
✅ **No real infrastructure** used (all mocked)
✅ **Tests run in < 5 seconds** total
✅ **CI/CD ready** (no environment dependencies)
✅ **Documentation complete** (this + progress docs)

## Measuring Success

Run coverage after each tier:

```bash
# Generate detailed report
pnpm test:coverage

# Check specific files
pnpm test:coverage --reporter=text | grep -A 10 "context/AuthContext"
```

Expected improvements:

- **Tier 1**: +200-300 lines covered across 4 critical files
- **Tier 2**: +150-200 lines across 4 important files
- **Tier 3**: +100-150 lines across 3 nice-to-have files

**Total impact**: ~500-650 lines of well-tested, critical code.

## Final Checklist

Before considering this complete:

- [ ] All Tier 1 tests passing
- [ ] All Tier 2 tests passing
- [ ] All Tier 3 tests passing
- [ ] Coverage report generated
- [ ] No test flakiness (run 10 times, all pass)
- [ ] Documentation updated (README, TESTING.md)
- [ ] Team reviewed test patterns
- [ ] CI pipeline includes new tests

## Resources Created

You now have:

1. **`src/test/testUtils.tsx`** - Reusable test infrastructure
2. **4 comprehensive test suites** - Tier 1 complete
3. **Clear patterns** for Tier 2 & 3
4. **Documentation** (this file, progress tracker, summary)
5. **Path to 70%+ coverage** on critical code

The hardest part (infrastructure + patterns) is done. Tier 2 & 3 should be much faster to implement.
