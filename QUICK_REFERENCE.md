---
title: Quick Reference - Defensive Guards
date: 2025-11-03
type: Cheat Sheet
---

# 🛡️ Defensive Guards - Quick Reference

## The 4 Guards (Copy-Paste Ready)

### 1. Wait for Layout to Settle

```typescript
await waitForLayoutSettled();
```

**Waits for:** Fonts → Images → RAF
**Use:** Once per step, at mount

### 2. Set Up Observation

```typescript
const cleanup = observeAnchor(element, () => {
  remeasure();
});
// Later: cleanup();
```

**Watches:** Size changes, position changes, visibility
**Use:** During step display

### 3. Prevent Thrashing

```typescript
const debounced = createDebouncedMeasure(remeasure, 16);
observeAnchor(element, () => debounced.trigger());
```

**Throttles:** Max 1 measurement per 16ms
**Use:** When using observeAnchor

### 4. Track Measurements

```typescript
const measurement = recordMeasurement(stepId, element);
// { x, y, w, h, viewportW, viewportH, isInViewport }
```

**Logs:** Position, size, viewport
**Use:** Before/after placement

---

## Complete Pattern (Copy This!)

```tsx
import {
  waitForLayoutSettled,
  observeAnchor,
  createDebouncedMeasure,
  recordMeasurement,
  recordAdjustment,
} from '../utils/layoutGuards';

// On mount:
await waitForLayoutSettled();
const initial = recordMeasurement(stepId, element);
placeTooltip(initial);

// Set up observation:
const debounced = createDebouncedMeasure(() => {
  const now = recordMeasurement(stepId, element);
  if (positionChanged(initial, now)) {
    const adj = recordAdjustment(stepId, oldRect, newRect, 'resize');
    placeTooltip(now);
  }
}, 16);

const unobs = observeAnchor(element, () => debounced.trigger());

// On unmount:
unobs();
debounced.cancel();
```

---

## Telemetry Events

### Event 1: tour_step_measured

```javascript
analytics?.trackEvent('tour_step_measured', {
  tourId,
  stepId,
  x,
  y,
  w,
  h,
  viewportW,
  viewportH,
  isInViewport,
});
```

### Event 2: tour_step_adjusted

```javascript
analytics?.trackEvent('tour_step_adjusted', {
  tourId,
  stepId,
  reason: 'resize',
  deltaX,
  deltaY,
  deltaW,
  deltaH,
});
```

### Event 3: tour_step_out_of_view

```javascript
analytics?.trackEvent('tour_step_out_of_view', {
  tourId,
  stepId,
});
```

---

## Common Configurations

| Goal                | Setting                          |
| ------------------- | -------------------------------- |
| Aggressive (smooth) | `createDebouncedMeasure(fn, 8)`  |
| Balanced            | `createDebouncedMeasure(fn, 16)` |
| Conservative        | `createDebouncedMeasure(fn, 50)` |

---

## Troubleshooting

| Problem               | Solution                     |
| --------------------- | ---------------------------- |
| Tooltip misaligned    | Add `waitForLayoutSettled()` |
| Jumps on resize       | Add debounced re-measure     |
| Too many measurements | Increase debounce delay      |
| Out of date position  | Add `observeAnchor()`        |
| Memory leak           | Call cleanup function        |

---

## Check Lists

### Before Deploying

```bash
./verify-defensive-guards.sh
./scripts/check-asset-paths.sh
npm run build
```

### After Deploying

- Monitor `tour_step_adjusted` events
- Goal: < 1 adjustment per session (mean)
- Alert if: > 5 adjustments per session

---

## Related Files

| File                                       | Purpose               |
| ------------------------------------------ | --------------------- |
| `src/tour/utils/layoutGuards.ts`           | Guard implementations |
| `src/tour/components/TourOrchestrator.tsx` | Integration example   |
| `DEFENSIVE_GUARDS_COMPLETE.md`             | Full documentation    |
| `DEFENSIVE_GUARDS_USAGE_GUIDE.md`          | Detailed examples     |

---

## Key Metrics

**Adjustment Count (per session)**

- Before fix: 5-20+
- After fix goal: 0-1
- Alert threshold: > 5

**Measurement Variance**

- Before fix: 10-50px swings
- After fix goal: < 5px
- Alert threshold: > 10px mean

---

## Deployment Timeline

| Time         | Action                         |
| ------------ | ------------------------------ |
| T-0          | Deploy code                    |
| T+1h         | Monitor errors                 |
| T+24h        | Review telemetry               |
| T+1w         | Trend analysis                 |
| T+2 releases | Consider removing SKIP_WAITING |

---

## Emergency Rollback

```bash
git revert <commit>
npm run build
# Deploy previous version
```

All changes are reversible. No data loss. Clean rollback.

---

**Last Updated:** 2025-11-03
**Status:** ✅ Production Ready
**Verified:** All 11 checks pass
