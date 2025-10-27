# Tour Verification Checklist

## Quick Verification (2 minutes)

### 1. Light Mode Persistence

- [ ] Reload page while in light mode
- [ ] Verify: stays in light mode, no flash
- [ ] No theme toggle during reload

### 2. Modal Tour Start

- [ ] Open Welcome Modal
- [ ] Click "Start Tour" button
- [ ] Verify: overlay appears within ~400ms
- [ ] First step is visible and positioned correctly

### 3. Console Tour Start

- [ ] Open browser console
- [ ] Run: `inkwellStartTour()`
- [ ] Verify: tour starts immediately
- [ ] Overlay visible within 500ms

### 4. Missing Anchor Handling

- [ ] Open DevTools Elements panel
- [ ] Temporarily delete `[data-tour-id="storage-banner"]` element
- [ ] Start tour
- [ ] Verify: step is skipped, tour continues to next step
- [ ] Tour completes without errors

---

## Edge Cases Sanity Check

### Feature Flag

- [ ] Open: `src/services/featureFlagService.ts`
- [ ] Verify: `tour_simpleTour` flag exists and is enabled
- [ ] Check environment configuration matches

```typescript
{
  key: 'tour_simpleTour',
  name: 'Spotlight Tour',
  description: 'Modern cinematic onboarding tour experience',
  enabled: true,
  category: 'ui',
}
```

### Registry Alignment

- [ ] Open: `src/tour/configs/defaultTour.ts`
- [ ] Verify: `CORE_TOUR_STEPS` or `defaultTourSteps` is defined
- [ ] Check fallback in WelcomeModal uses correct import
- [ ] Confirm tourRegistry exports match expected format

**Files to verify:**

- `src/components/Onboarding/tourRegistry.ts`
- `src/tour/configs/defaultTour.ts`
- `src/components/Onboarding/WelcomeModal.tsx` (uses CORE_TOUR_STEPS)

### First Step Anchor

- [ ] Verify first tour step targets a guaranteed element
- [ ] Recommended: `[data-tour-id="topbar"]` or `[data-tour-id="dashboard"]`
- [ ] Element must be mounted on Dashboard view
- [ ] Check placement doesn't clip off-screen

**Current first step:**

```typescript
{
  id: 'welcome',
  selectors: ['[data-tour-id="dashboard"]', 'main'],
  placement: 'bottom',
}
```

### Persistence

- [ ] Complete tour
- [ ] Check localStorage: `tour:inkwell-onboarding-v1:done` = `true`
- [ ] Re-run via Help menu
- [ ] Verify: `resetTour` is called before restart
- [ ] Tour starts fresh from step 1

### Z-Index Stacking

- [ ] Tour overlay visible
- [ ] Check z-index > modals/popovers
- [ ] Check z-index < toast notifications
- [ ] No overlay conflicts with existing UI

**Expected z-index hierarchy:**

```
Toast notifications: z-[9999]
Tour overlay: z-[1000]
Modals: z-[50]
Popovers: z-[40]
```

### Scroll & Positioning

- [ ] Start tour with page scrolled down
- [ ] Verify: steps auto-scroll into view
- [ ] Check: no body scroll-lock conflicts
- [ ] Spotlight doesn't jump/flicker

### Mobile Viewport

- [ ] Resize viewport to < 400px wide
- [ ] Start tour
- [ ] Verify: spotlight doesn't clip
- [ ] Placement falls back gracefully (center if needed)
- [ ] Touch controls work (Next/Skip buttons)

### Route Changes

- [ ] Start tour on Dashboard
- [ ] If step triggers navigation to Writing view
- [ ] Verify: adapter runs and finds new anchors
- [ ] Step highlights correct element in new view

---

## Test Coverage

### Unit Tests

#### tourSafety.test.ts

- [ ] `startTourSafely` returns `true` with valid list
- [ ] `startTourSafely` returns `false` with `[]` (or handles gracefully)
- [ ] `TourService.configure({ skipMissingAnchors: true })` persists

**Run:**

```bash
pnpm test src/components/Onboarding/__tests__/tourSafety.test.ts
```

#### TourService.test.ts

- [ ] `configure()` sets options correctly
- [ ] `getOptions()` returns persisted configuration
- [ ] State management works as expected

**Run:**

```bash
pnpm test src/tour/__tests__/TourService.test.ts
```

### E2E Tests

#### tour-happy-path.spec.ts

- [ ] Open modal → click Start → first step visible
- [ ] Click Next through final step
- [ ] "completed" key set in localStorage
- [ ] Remove `[data-tour-id="storage-banner"]` → tour still completes
- [ ] Console: `inkwellStartTour()` starts immediately

**Run:**

```bash
pnpm test:e2e e2e/tour-happy-path.spec.ts
```

---

## Polish Enhancements (Optional)

### Restart Tour

- [ ] Add "Restart Tour" item in Help menu
- [ ] Wire to `startDefaultTour` function
- [ ] Confirm calls `resetTour` before starting

**Implementation:**

```typescript
import { startDefaultTour } from '@/tour/tourEntry';

<MenuItem onClick={startDefaultTour}>
  <RotateCw className="w-4 h-4" />
  Restart Tour
</MenuItem>
```

### Analytics

- [ ] Emit `tour_started` event
- [ ] Emit `tour_step_viewed` for each step
- [ ] Emit `tour_completed` on completion
- [ ] Emit `tour_skipped` if user exits early

**Track completion rate:**

```typescript
// In TourService
tourAnalytics.started(config.id, { totalSteps: config.steps.length });
tourAnalytics.stepViewed(config.id, currentStep);
tourAnalytics.completed(config.id);
tourAnalytics.skipped(config.id, currentStep);
```

### Accessibility

- [ ] Focus moves to spotlighted element or tooltip
- [ ] Esc key closes tour
- [ ] Tab cycles within tooltip controls
- [ ] Screen reader announces step content
- [ ] ARIA labels on controls

**Keyboard shortcuts:**

- `Esc` → Close tour
- `Tab` → Cycle focus within step
- `Enter` → Activate Next/Complete
- `Arrow keys` → Navigate steps (optional)

---

## Quick Test Commands

```bash
# Run all tour-related unit tests
pnpm test --run src/components/Onboarding/__tests__/
pnpm test --run src/tour/__tests__/

# Run E2E tour tests
pnpm test:e2e e2e/tour-happy-path.spec.ts

# Dev server for manual testing
pnpm dev
```

## Manual Testing Script

1. **Fresh Start**

   ```javascript
   // Clear tour completion
   localStorage.removeItem('tour:inkwell-onboarding-v1:done');
   location.reload();
   ```

2. **Trigger Tour**

   ```javascript
   // Console command
   inkwellStartTour();
   ```

3. **Check State**

   ```javascript
   // Tour running?
   console.log('Tour running:', document.querySelector('[data-tour-overlay]') !== null);

   // Current step
   console.log('Current step:', document.querySelector('[data-tour-step]')?.textContent);
   ```

4. **Complete Tour**
   ```javascript
   // Check completion
   console.log('Completed:', localStorage.getItem('tour:inkwell-onboarding-v1:done'));
   ```

---

## Success Criteria

All items checked = Ready for production ✅

- [ ] All quick verifications pass
- [ ] All edge cases verified
- [ ] Unit tests pass (100% coverage for new code)
- [ ] E2E tests pass (happy path + missing anchor)
- [ ] No console errors during tour
- [ ] Tour completes successfully
- [ ] Persistence works correctly
- [ ] Mobile viewport works
- [ ] Accessibility basics covered

---

## Notes

**Performance targets:**

- Modal → Tour start: < 400ms
- Console command → Overlay: < 500ms
- Step transition: < 200ms

**Browser compatibility:**

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile Safari (iOS 14+)

**Known limitations:**

- Tour requires JavaScript enabled
- Some steps may not work in extremely narrow viewports (< 320px)
- Dynamic content changes during tour may cause anchor loss
