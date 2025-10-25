# Performance Optimization - React 19 Migration (v1.4.0)

## Overview

This document tracks performance improvements implemented during the React 19 migration and optimization phase.

## Baseline Configuration (v1.3.0-rc)

- React: 19.1.0 (already on React 19)
- Router: react-router-dom@7.9.4
- Editor: @tiptap/react@3.2.2
- Charts: recharts@3.3.0

## Optimizations Implemented

### 1. Component Memoization

**Target**: Plot Analysis heavy components

- **PacingChart**: Wrapped with React.memo, memoized data computation
- **ArcHeatmap**: Wrapped with React.memo, memoized heatmap data transformation
- **InsightList**: Wrapped with React.memo, memoized filtered insights and handlers

**Impact**: Prevents unnecessary re-renders when parent components update but props haven't changed.

### 2. Expensive Computation Caching

- Chart data transformations wrapped in `useMemo` with correct dependencies
- Filtered insight lists memoized to avoid recomputing on every render
- Rolling average calculations memoized in PacingChart

### 3. Handler Stabilization

- Chapter click handlers wrapped in `useCallback` to prevent inline lambda recreation
- Stable references allow React.memo to skip re-renders when callbacks haven't changed

### 4. Code Splitting & Preloading

- Added hover preloading for PlotAnalysisPanel on sidebar navigation
- Reduces perceived navigation latency by fetching chunks before user clicks
- Uses `preload()` utility with error handling

## Performance Utilities

### `src/utils/perf.ts`

Lightweight performance measurement for development and CI:

```typescript
mark('plot:open'); // Mark start
measure('tti:plot', 'plot:open'); // Measure duration
getMeasures('plot'); // Retrieve all plot-related measures
```

### `src/utils/preload.ts`

Module preloading utilities:

```typescript
preload(() => import('./HeavyComponent')); // Immediate
preloadOnIdle(() => import('./HeavyComponent')); // During idle
```

## Measurement Points

### Recommended Metrics to Track

1. **Dashboard TTI**: Time from app boot to dashboard interactive
2. **Writing Keystroke Latency**: p95 time from keystroke to editor paint
3. **Plot Analysis Mount**: Time from navigation click to charts rendered

### How to Measure

```typescript
import { mark, measure } from '@/utils/perf';

// In component mount
useEffect(() => {
  mark('plot:mount');
  // After charts render
  measure('tti:plot', 'plot:mount');
}, []);
```

## Expected Performance Gains

- **Plot Analysis Panel**: 15-25% faster initial render (memoization prevents redundant chart computations)
- **Navigation Feel**: ~200ms faster perceived navigation (hover preloading)
- **Re-render Frequency**: 30-50% reduction in unnecessary Plot Analysis re-renders

## Testing Status

- ✅ All 451 tests passing
- ✅ 0 TypeScript errors
- ✅ 81 linter warnings (baseline unchanged)
- ✅ No new console warnings with React 19

## Future Optimizations

1. Add performance marks to Dashboard and Writing panels
2. Implement Playwright-based performance regression tests
3. Add preloading for Export modal on hover
4. Consider virtual scrolling for large chapter lists
5. Profile and optimize TipTap editor render path

## Rollback Plan

**Tag**: v1.3.0-rc (pre-React 19 optimization baseline)

To rollback:

```bash
git revert <commit-sha>  # Revert performance optimizations
git checkout v1.3.0-rc   # Or full rollback to baseline
```

React 19 is already installed, so no dependency rollback needed.

## References

- [React 19 Release Notes](https://react.dev/blog/2024/04/25/react-19)
- [React.memo Documentation](https://react.dev/reference/react/memo)
- [Performance API](https://developer.mozilla.org/en-US/docs/Web/API/Performance)
