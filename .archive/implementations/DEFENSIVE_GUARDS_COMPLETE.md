---
title: Defensive Guards Implementation - Complete
date: 2025-11-03
status: ✅ READY FOR PRODUCTION
---

# Defensive Guards Implementation Summary

## 🎯 Overview

Defensive guards have been fully implemented to make the tour resilient to late-loading fonts/images and layout shifts. These guards ensure that tour tooltip measurements happen only after the layout is stable and settled.

## ✅ Completed Implementation

### 1. Layout Settlement Utilities (`src/tour/utils/layoutGuards.ts`)

#### `waitForLayoutSettled()`

Waits for all prerequisites before measuring:

- **Fonts**: Waits for `document.fonts.ready` API (if available)
- **Images**: Waits for all `<img>` elements to complete loading or error
- **Layout**: Requests one RAF to flush pending layout calculations

```typescript
await waitForLayoutSettled();
// Layout is now stable, safe to measure
```

**Benefits:**

- Prevents measuring elements before CSS/fonts load
- Catches late-loading images that would shift layout
- Uses RAF to ensure browser layout calculations are flushed

#### `observeAnchor(anchor, onChange)`

Continuously monitors the anchor element for changes:

- **ResizeObserver**: Detects size changes (CSS transitions, parent resize)
- **IntersectionObserver**: Detects position/visibility changes (scroll, DOM reflow)
- Returns cleanup function to disconnect observers

```typescript
const unobs = observeAnchor(targetEl, () => {
  requestAnimationFrame(placeTooltip);
});
// ...later...
unobs(); // cleanup
```

**Benefits:**

- Catches CSS transitions that shift the element
- Detects when element enters/exits viewport
- Re-measures automatically on layout changes

#### `createDebouncedMeasure(measureFn, delayMs)`

Prevents measurement thrashing:

- Debounces rapid onChange callbacks to a single measurement pass
- Configurable delay (default 16ms = one frame)

```typescript
const debouncedRemeasure = createDebouncedMeasure(placeTooltip, 16);
debouncedRemeasure.trigger(); // fires at most once per 16ms
```

#### Telemetry Helpers

**`recordMeasurement(stepId, element)`** - Logs initial positioning:

```typescript
interface TourStepMeasurement {
  stepId: string;
  x: number; // left position
  y: number; // top position
  w: number; // width
  h: number; // height
  viewportW: number; // viewport width
  viewportH: number; // viewport height
  isInViewport: boolean;
}
```

**`recordAdjustment(stepId, beforeRect, afterRect, reason)`** - Logs when tooltip is re-measured:

```typescript
interface TourStepAdjustment {
  stepId: string;
  beforeRect: DOMRect;
  afterRect: DOMRect;
  reason: 'resize' | 'imageLoad' | 'fontLoad' | 'scroll' | 'intersection';
  deltaX: number; // change in X position
  deltaY: number; // change in Y position
  deltaW: number; // change in width
  deltaH: number; // change in height
}
```

### 2. Tour Orchestrator Integration (`src/tour/components/TourOrchestrator.tsx`)

The TourOrchestrator now uses all three defensive guards:

```tsx
// Wait for layout to settle
await waitForLayoutSettled();

// Take initial measurement
const initialMeasurement = recordMeasurement(step.id, targetElement);
analytics?.trackEvent('tour_step_measured', { tourId, stepId: step.id, ...initialMeasurement });

// Set up continuous monitoring
const debouncedRemeasure = createDebouncedMeasure(() => {
  const newMeasurement = recordMeasurement(step.id, targetElement);
  if (hasSignificantChange(newMeasurement, initialMeasurement)) {
    const adjustment = recordAdjustment(step.id, oldRect, newRect, 'intersection');
    analytics?.trackEvent('tour_step_adjusted', { tourId, stepId: step.id, ...adjustment });
  }
}, 16);

// Observe anchor for changes
const unobs = observeAnchor(targetElement, (reason) => {
  debouncedRemeasure.trigger();
});

// Cleanup on unmount
return () => {
  debouncedRemeasure.cancel();
  unobs();
};
```

### 3. Service Worker Cache Cleanup (`src/main.tsx`)

SKIP_WAITING promotion logic ensures fresh assets are used:

```typescript
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistration().then((reg) => {
    if (reg?.waiting) {
      // Promote waiting SW and skip old one
      reg.waiting.postMessage({ type: 'SKIP_WAITING' });
      devLog.debug('📡 Requested service worker update');
    }
  });
}
```

**Timeline:** Keep this for 2 more releases, then remove it.

### 4. CI & Pre-Commit Checks

#### GitHub Actions Workflow (`.github/workflows/check-asset-paths.yml`)

- Runs on PRs and pushes to `main`/`develop`
- Scans for forbidden `/assets/brand/` paths
- Prevents regressions from being merged

```bash
git grep -n '/assets/brand/' -- ':!public' ':!**/*.md' ':!dist'
```

#### Pre-Commit Hook (`.git/hooks/pre-commit`)

- Installed locally to catch issues before commit
- Scans staged files for `/assets/brand/` paths
- Blocks commit if issues found

#### Asset Path Check Script (`scripts/check-asset-paths.sh`)

- Manual check for developers
- Run: `./scripts/check-asset-paths.sh`
- Scans source files (excludes docs, node_modules, dist)

## 📊 Telemetry Events

Three key events are tracked per tour step:

### 1. `tour_step_measured`

**When:** After layout settles, before tooltip placement
**Properties:**

```json
{
  "tourId": "onboarding",
  "stepId": "step_1",
  "x": 100,
  "y": 200,
  "w": 300,
  "h": 150,
  "viewportW": 1920,
  "viewportH": 1080,
  "isInViewport": true
}
```

### 2. `tour_step_adjusted`

**When:** Element position changes after initial measurement
**Properties:**

```json
{
  "tourId": "onboarding",
  "stepId": "step_1",
  "reason": "resize|imageLoad|fontLoad|scroll|intersection",
  "deltaX": 5,
  "deltaY": -10,
  "deltaW": 0,
  "deltaH": 20
}
```

### 3. `tour_step_out_of_view`

**When:** Element scrolls out of viewport
**Properties:**

```json
{
  "tourId": "onboarding",
  "stepId": "step_1"
}
```

## 📈 Analytics Dashboard Recommendations

Create a dashboard to monitor:

1. **Adjustments per Session**
   - Metric: Count of `tour_step_adjusted` events per session
   - Goal: Trend toward ~0 after fix is deployed
   - Alert: Spike indicates regression

2. **Out-of-View Events**
   - Metric: Count of `tour_step_out_of_view` events
   - Goal: Minimal per session
   - Alert: High count indicates UX issue

3. **Measurement Variance**
   - Metric: Abs(deltaX) + Abs(deltaY) per adjustment
   - Goal: Mean < 5px
   - Alert: Large deltas indicate unstable layout

## 🧪 Verification Checklist

- ✅ `src/tour/utils/layoutGuards.ts` - All 4 utility functions implemented
- ✅ `src/tour/components/TourOrchestrator.tsx` - Integrated with layout guards
- ✅ `src/main.tsx` - SKIP_WAITING logic in place
- ✅ `.github/workflows/check-asset-paths.yml` - GitHub Actions workflow configured
- ✅ `scripts/check-asset-paths.sh` - Pre-commit check script
- ✅ `.git/hooks/pre-commit` - Local pre-commit hook installed
- ✅ Build passes - `npm run build` completes successfully
- ✅ Brand assets - `dist/brand/` contains all expected files
- ✅ Asset path check - No `/assets/brand/` paths in source code

## 🚀 Deployment Ready

### Before Deploying

1. Ensure analytics infrastructure is ready to receive telemetry events
2. Create dashboard to monitor adjustment trends
3. Brief team on expected behavior (adjustments should trend to ~0)

### After Deploying

1. Monitor `tour_step_adjusted` events for first 24-48 hours
2. Compare adjustment counts before/after fix
3. Document any regressions and file issues

### Housekeeping (After 2 More Releases)

1. Remove SKIP_WAITING logic from `src/main.tsx`
2. Remove SW controller change listener
3. Update changelog to document removal

## 📝 Testing Guide

### Manual Testing

1. Open app and start a tour
2. Refresh page - layout should settle before tooltip appears
3. Resize window - tooltip should re-position smoothly
4. Load a page with images - wait for settlement, then measure
5. Check console logs for `[Tour]` debug messages

### Automated Testing

```bash
# Check asset paths locally
./scripts/check-asset-paths.sh

# Run full build
npm run build

# Verify brand assets in dist
ls -la dist/brand/
```

## 🔧 Configuration Options

All defaults are sensible, but can be tuned:

```typescript
// Debounce delay (default 16ms = 60 FPS)
const debouncedRemeasure = createDebouncedMeasure(measureFn, 16);

// ResizeObserver thresholds (default covers full range)
new IntersectionObserver(onChange, {
  threshold: [0, 0.01, 0.25, 0.5, 0.75, 0.99, 1],
});
```

## 🎓 Key Concepts

### Why These Guards Matter

1. **Fonts**: CSS @font-face loads asynchronously; text measurement changes
2. **Images**: Missing images shift layout; lazy loading causes reflow
3. **RAF**: CSS transitions and browser batching require layout flushing
4. **ResizeObserver**: Catches CSS transitions that move elements
5. **IntersectionObserver**: Detects when element becomes in/out of view

### When Each Guard Triggers

- **waitForLayoutSettled()**: Once per step, before first measurement
- **observeAnchor()**: Continuously during step display
- **createDebouncedMeasure()**: Throttles rapid onChange callbacks
- **recordMeasurement()**: Each time measurement is taken
- **recordAdjustment()**: Only when significant position change detected

## ✨ Summary

The tour is now resilient to:

- ✅ Late-loading fonts and images
- ✅ CSS transitions and animations
- ✅ Dynamic layout changes
- ✅ Viewport resize and scroll
- ✅ Out-of-view detection

All with telemetry to catch regressions immediately!
