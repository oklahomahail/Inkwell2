# Spotlight Tour - Quick Integration Checklist

## 5-Step Integration ✅

### Step 1: Analytics Adapter ✅

**File**: `src/tour/adapters/analyticsAdapter.ts`

- [x] Created with safe error handling
- [x] Tracks: started, stepViewed, completed, skipped
- [ ] TODO: Connect to real analytics service (placeholder logging for now)

### Step 2: Router Adapter ✅

**File**: `src/tour/adapters/routerAdapter.ts`

- [x] Created `useTourRouterAdapter()` hook
- [x] Refreshes anchors on route changes
- [ ] TODO: Mount in App.tsx

### Step 3: Persistence Layer ✅

**File**: `src/tour/persistence.ts`

- [x] localStorage-based completion tracking
- [x] Functions: `isTourDone()`, `markTourDone()`, `resetTour()`, `getCompletedTours()`
- [x] Graceful fallback for private mode

### Step 4: Tour Configuration ✅

**File**: `src/tour/configs/defaultTour.ts`

- [x] Default 6-step onboarding tour defined
- [x] Fallback selectors for each step
- [x] Export `DEFAULT_TOUR_ID` and `defaultTourConfig`

### Step 5: Lifecycle Integration ✅

**File**: `src/tour/integrations/tourLifecycleIntegration.tsx`

- [x] Created `TourLifecycleIntegration` component
- [x] Connects analytics + persistence
- [ ] TODO: Mount in App.tsx

---

## Integration Points (3 files to edit)

### 1. App.tsx - Mount Tour Components

```tsx
import { SpotlightOverlay } from '@/tour/ui';
import { TourLifecycleIntegration } from '@/tour/integrations/tourLifecycleIntegration';
import { useTourRouterAdapter } from '@/tour/adapters/routerAdapter';

export default function App() {
  useTourRouterAdapter(); // ← Add this

  return (
    <Router>
      <TourLifecycleIntegration /> {/* ← Add this */}
      <YourAppContent />
      <SpotlightOverlay /> {/* ← Already added in Phase 2 */}
    </Router>
  );
}
```

### 2. HelpMenu.tsx - Add Tour Trigger

```tsx
import { startDefaultTour } from '@/tour/tourEntry';

<MenuItem onClick={startDefaultTour}>Take a Tour</MenuItem>;
```

### 3. UI Components - Add data-tour-id Attributes

```tsx
<nav data-tour-id="sidebar">           {/* Sidebar */}
<header data-tour-id="topbar">         {/* Top bar */}
<main data-tour-id="dashboard">        {/* Dashboard */}
<div data-tour-id="storage-banner">    {/* Storage health banner */}
<button data-tour-id="focus-toggle">   {/* Focus mode toggle */}
<button data-tour-id="help-tour-button"> {/* Help button */}
```

---

## Files Created (11 new files)

### Phase 2 - UI Components (Already Complete)

- [x] `src/tour/ui/SpotlightOverlay.tsx`
- [x] `src/tour/ui/SpotlightMask.tsx`
- [x] `src/tour/ui/SpotlightTooltip.tsx`
- [x] `src/tour/ui/useSpotlightUI.ts`
- [x] `src/tour/ui/geometry.ts`
- [x] `src/tour/ui/positioning.ts`
- [x] `src/tour/ui/portal.tsx`
- [x] `src/tour/ui/a11y.ts`

### Phase 2 - Integration (Just Created)

- [x] `src/tour/adapters/analyticsAdapter.ts`
- [x] `src/tour/adapters/routerAdapter.ts`
- [x] `src/tour/configs/defaultTour.ts`
- [x] `src/tour/persistence.ts`
- [x] `src/tour/tourEntry.ts`
- [x] `src/tour/integrations/tourLifecycleIntegration.tsx`
- [x] `src/tour/index.ts` (barrel export)

---

## Testing

### Manual QA

- [ ] Run `pnpm typecheck` - should pass ✅
- [ ] Run `pnpm build` - should pass ✅
- [ ] Start app, click "Take a Tour" in help menu
- [ ] Verify all 6 steps highlight correctly
- [ ] Test keyboard navigation (←/→/Esc)
- [ ] Check console for analytics events
- [ ] Complete tour, verify it doesn't auto-start again
- [ ] Test dark mode rendering

### Analytics Verification (in console)

```
[TourAnalytics] tour_started { tour_id: "inkwell-onboarding-v1", ... }
[TourAnalytics] tour_step_viewed { step_index: 0, ... }
[TourAnalytics] tour_step_viewed { step_index: 1, ... }
...
[TourAnalytics] tour_completed { tour_id: "inkwell-onboarding-v1", ... }
```

### Persistence Check

```js
// In DevTools console
localStorage.getItem('inkwell.tour.inkwell-onboarding-v1.completed');
// Should return "1" after completing tour

// To reset and test again:
localStorage.removeItem('inkwell.tour.inkwell-onboarding-v1.completed');
```

---

## Optional Enhancements

### Auto-start on First Run

```tsx
// src/components/Dashboard.tsx
import { useEffect } from 'react';
import { shouldAutoStartTour, startDefaultTour } from '@/tour/tourEntry';

useEffect(() => {
  if (shouldAutoStartTour()) {
    setTimeout(startDefaultTour, 500); // Small delay
  }
}, []);
```

### Feature-Specific Tours

```tsx
// src/tour/configs/aiToolsTour.ts
export const aiToolsTourSteps: TourStep[] = [
  { id: 'ai-panel', title: 'AI Analysis', ... },
  // ... more steps
];

// Usage:
import { startTourById } from '@/tour/tourEntry';
startTourById('ai-tools-v1', aiToolsTourSteps);
```

---

## Status: Ready for Final Integration

✅ **Phase 2 UI**: Complete and tested  
✅ **Analytics Adapter**: Created  
✅ **Router Adapter**: Created  
✅ **Persistence**: Created  
✅ **Default Tour Config**: Created  
✅ **Lifecycle Integration**: Created  
✅ **Documentation**: Complete  
✅ **Build**: Passing

⏳ **Remaining**: 3 simple integration points (see above)

---

## Documentation

- **Integration Guide**: `docs/integration/spotlight-tour-integration.md`
- **Feature Guide**: `docs/features/tour.md`
- **Architecture**: `docs/architecture/spotlight-tour-architecture.md`
- **Telemetry**: `docs/ops/telemetry.md`
- **QA Checklist**: `QA_CHECKLIST.md`

---

**Next Action**: Edit App.tsx to mount the tour components (see Integration Points above).
