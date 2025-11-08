---
title: How to Use Defensive Guards in Your Tour
date: 2025-11-03
type: Guide
---

# Defensive Guards - Drop-In Usage Guide

## 🎯 Quick Start

Copy-paste this pattern into any tour component:

### 1. Initial Setup - Wait for Layout

```typescript
import {
  waitForLayoutSettled,
  observeAnchor,
  createDebouncedMeasure,
  recordMeasurement,
} from '../utils/layoutGuards';

// Inside your useEffect or component mount:
await waitForLayoutSettled();
// ✅ All fonts, images, and layout calculations are now complete
```

### 2. Measure & Place Tooltip

```typescript
const measurement = recordMeasurement(step.id, targetElement);
placeTooltip(targetElement, measurement);
// Log for telemetry
analytics?.trackEvent('tour_step_measured', {
  tourId,
  stepId: step.id,
  ...measurement,
});
```

### 3. Set Up Continuous Observation

```typescript
const debouncedRemeasure = createDebouncedMeasure(() => {
  const newMeasurement = recordMeasurement(step.id, targetElement);
  placeTooltip(targetElement, newMeasurement);
}, 16); // Re-measure at most once per 16ms

const unobs = observeAnchor(targetElement, (reason) => {
  debouncedRemeasure.trigger();
});
```

### 4. Cleanup on Unmount

```typescript
return () => {
  debouncedRemeasure.cancel();
  unobs();
};
```

## 📋 Complete Example

```tsx
import React, { useEffect, useRef } from 'react';
import {
  waitForLayoutSettled,
  observeAnchor,
  createDebouncedMeasure,
  recordMeasurement,
  recordAdjustment,
} from '../utils/layoutGuards';

function MyTourStep({ stepId, targetSelector, onTooltipPlaced }) {
  const unobserveRef = useRef<(() => void) | null>(null);
  const initialRectRef = useRef<DOMRect | null>(null);

  useEffect(() => {
    const target = document.querySelector<HTMLElement>(targetSelector);
    if (!target) return;

    let isMounted = true;

    (async () => {
      try {
        // 1) Wait for everything to settle
        await waitForLayoutSettled();
        if (!isMounted) return;

        // 2) Take initial measurement
        const measurement = recordMeasurement(stepId, target);
        initialRectRef.current = target.getBoundingClientRect();

        console.log('[Tour] Measured:', measurement);
        onTooltipPlaced(measurement);

        // 3) Set up debounced re-measure
        const debouncedRemeasure = createDebouncedMeasure(() => {
          if (!isMounted || !target) return;

          const newRect = target.getBoundingClientRect();
          const oldRect = initialRectRef.current!;

          // Check if significantly changed
          if (
            Math.abs(newRect.left - oldRect.left) > 2 ||
            Math.abs(newRect.top - oldRect.top) > 2
          ) {
            const adjustment = recordAdjustment(stepId, oldRect, newRect, 'intersection');
            console.log('[Tour] Adjusted:', adjustment);
            onTooltipPlaced(recordMeasurement(stepId, target));
          }
        }, 16);

        // 4) Observe anchor for changes
        unobserveRef.current = observeAnchor(target, (reason) => {
          console.log(`[Tour] ${target.tagName} changed (${reason})`);
          debouncedRemeasure.trigger();
        });

        return () => {
          debouncedRemeasure.cancel();
        };
      } catch (error) {
        console.error('[Tour] Layout settlement failed:', error);
      }
    })();

    return () => {
      isMounted = false;
      if (unobserveRef.current) {
        unobserveRef.current();
      }
    };
  }, [stepId, targetSelector, onTooltipPlaced]);

  return <div>Tour step content</div>;
}

export default MyTourStep;
```

## 🔍 What Each Guard Does

### `waitForLayoutSettled()`

**Purpose:** Ensure layout is stable before measurement
**Time:** ~100-500ms (depends on fonts/images)
**When to use:** Once per step, at the start

```typescript
await waitForLayoutSettled();
// Safe to measure now
```

### `observeAnchor(element, onChange)`

**Purpose:** Re-measure when element changes
**Triggers:** Size change, position change, visibility change
**When to use:** After initial measurement, before component unmount

```typescript
const cleanup = observeAnchor(target, (reason) => {
  console.log(`Element changed: ${reason}`);
  remeasure(); // Re-measure immediately
});

// Later...
cleanup(); // Stop observing
```

### `createDebouncedMeasure(fn, delayMs)`

**Purpose:** Prevent measurement thrashing
**Benefit:** Avoid 100+ measurements when 1 is needed
**When to use:** Wrap your remeasure function

```typescript
const debounced = createDebouncedMeasure(remeasure, 16);
debounced.trigger(); // Called often, executed at most once per 16ms
```

## 📊 Telemetry Integration

### Event 1: Initial Measurement

```typescript
analytics?.trackEvent('tour_step_measured', {
  tourId: 'my-tour',
  stepId: 'step_1',
  x: 100,
  y: 200,
  w: 300,
  h: 150,
  viewportW: 1920,
  viewportH: 1080,
  isInViewport: true,
});
```

### Event 2: Adjustment Detected

```typescript
analytics?.trackEvent('tour_step_adjusted', {
  tourId: 'my-tour',
  stepId: 'step_1',
  reason: 'resize',
  deltaX: 5,
  deltaY: -10,
  deltaW: 0,
  deltaH: 20,
});
```

### Event 3: Out of View

```typescript
analytics?.trackEvent('tour_step_out_of_view', {
  tourId: 'my-tour',
  stepId: 'step_1',
});
```

## 🎨 Advanced Customization

### Change debounce timing (slower = less thrashing, higher latency)

```typescript
// Measure at most once per 50ms (conservative)
const debouncedRemeasure = createDebouncedMeasure(remeasure, 50);

// Measure at most once per 8ms (aggressive)
const debouncedRemeasure = createDebouncedMeasure(remeasure, 8);
```

### Adjust intersection thresholds (more = more sensitive)

```typescript
// Current: 7 thresholds = high sensitivity
threshold: [0, 0.01, 0.25, 0.5, 0.75, 0.99, 1];

// Fewer thresholds = less frequent updates
threshold: [0, 0.5, 1];
```

### Wait only for fonts (skip images)

```typescript
try {
  await (document as any).fonts?.ready;
} catch {}
// Images are skipped, faster but may not catch lazy-load shifts
```

## ❌ Common Mistakes

### ❌ Don't forget to cleanup observers

```typescript
// BAD: Observer stays active, memory leak
const cleanup = observeAnchor(target, onChange);
// No cleanup call

// GOOD: Cleanup on unmount
return () => {
  cleanup(); // Disconnect observers
};
```

### ❌ Don't measure without settling first

```typescript
// BAD: Images/fonts not yet loaded
const rect = target.getBoundingClientRect();
placeTooltip(rect);

// GOOD: Wait first
await waitForLayoutSettled();
const rect = target.getBoundingClientRect();
placeTooltip(rect);
```

### ❌ Don't skip debouncing

```typescript
// BAD: Can thrash with 100+ measurements per second
observeAnchor(target, remeasure); // Raw function

// GOOD: Debounce to 1 measurement per 16ms
const debounced = createDebouncedMeasure(remeasure, 16);
observeAnchor(target, () => debounced.trigger());
```

## 🧪 Testing

### 1. Visual Test: Does tooltip stay centered?

- Resize browser window → tooltip should follow
- Reload page → tooltip should appear centered
- Scroll element → tooltip should stay with element

### 2. Performance Test: Open DevTools

```javascript
// Count adjustments
let adjustCount = 0;
window.addEventListener('message', (e) => {
  if (e.data?.type === 'tour_step_adjusted') {
    adjustCount++;
    console.log(`Adjustments: ${adjustCount}`);
  }
});
```

### 3. Console Test: Look for debug logs

```
[Tour] Fonts settled
[Tour] 3 images settled
[Tour] Layout settled
[Tour] Initial measurement: { x: 100, y: 200, w: 300, h: 150 }
[Tour] Anchor resized, re-measuring
[Tour] Measurement adjusted: { deltaX: 5, deltaY: -10 }
```

## 📞 Need Help?

Check these files:

- Implementation: `/src/tour/utils/layoutGuards.ts`
- Integration: `/src/tour/components/TourOrchestrator.tsx`
- Analytics: `/src/tour/hooks/useAnalytics.ts`

Run verification:

```bash
./scripts/check-asset-paths.sh  # Verify no /assets/brand/ regressions
npm run build                    # Verify build passes
```
