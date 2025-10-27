# Quick Ship Checklist - Tour A11y, Analytics & Variants

## ✅ Implementation Complete

All three features are now implemented and ready fo### Test 4: Screen Reader

```
1.### Test 6: Analytics Dashboard
```

1. Add TourCompletionCard to analytics page
2. Complete 2-3 tours
3. Skip 1 tour
4. Refresh analytics page
   ✅ Completion rate shows correct %
   ✅ Average time displays (e.g., "15s")
   ✅ Started/Completed counts are accurate

```

### Test 7: Tour VariantseOver (Mac) or NVDA (Windows)
2. Start any tour
   ✅ Announces "Step 1 of X: [title]"
   ✅ Announces on Next button click
   ✅ Announces on step change
```

### Test 5: Analytics Events

1. ✅ **A11y**: ESC to close, ARIA live announcements, tab trap, **focus rings**
2. ✅ **Analytics**: Tour completion metrics logged to dashboard
3. ✅ **Variants**: AI Tools and Export tours registered in Help menu
4. ✅ **Polish**: Export modal auto-opens, visible focus indicators

---

## 🚀 Quick Verification Steps

### 1. ESC Key & ARIA (30 seconds)

```bash
# 1. Start any tour from Help menu
# 2. Press ESC key → Tour should close
# 3. Restart tour
# 4. Press Tab repeatedly → Focus cycles within tooltip
# 5. VERIFY: Blue focus ring visible on each button
# 6. Open screen reader → Should announce "Step X of Y: [title]"
```

### 2. Focus Rings (NEW - 15 seconds)

```bash
# 1. Start any tour
# 2. Click in browser address bar (to reset focus)
# 3. Press Tab key
# 4. VERIFY: Blue ring appears around first button
# 5. Press Tab again
# 6. VERIFY: Focus ring moves to next button
# 7. Check both light and dark modes
```

### 3. Export Tour Auto-Open (NEW - 30 seconds)

```bash
# 1. Start Export Tour from Help menu
# 2. Tour highlights "Export" button in topbar
# 3. Click "Next" button in tour tooltip
# 4. VERIFY: Export modal opens automatically
# 5. VERIFY: Tour advances to template step inside modal
# 6. Complete tour normally
```

### 2. Analytics Dashboard (1 minute)

```bash
# In browser DevTools Console:
localStorage.getItem('analytics.tour.events')

# Expected: JSON array of tour events
# Should contain: tour_started, tour_step_viewed, tour_completed

# In your analytics dashboard, add:
import TourCompletionCard from '@/features/analytics/components/TourCompletionCard';

<TourCompletionCard />
# Shows: completion rate, avg time, started/completed counts
```

### 3. Tour Variants (1 minute)

```bash
# Open app → Click Help menu (top right)
# Verify menu shows:
# - Restart Core Tour
# - Feature Tour
# - AI Tools Tour ← NEW
# - Export Tour ← NEW

# Click "AI Tools Tour" → Should start tour
# Click "Export Tour" → Should start tour
```

---

## 📋 Before Deploying

### Required: Add Data Attributes

Add these to your UI components for tours to work:

```tsx
// AI Tools Tour targets
<div data-tour-id="model-selector">...</div>
<button data-tour-id="assistant-panel">...</button>
<div data-tour-id="privacy-hint">...</div>

// Export Tour targets
<button data-tour-id="export-open">Export</button>
<div data-tour-id="export-template">...</div>
<button data-tour-id="export-run">Generate</button>
```

**See:** `TOUR_DATA_ATTRIBUTES.md` for complete reference

---

## 🧪 Manual Test Script

### Test 1: ESC Key Handler

```
1. Open Help menu
2. Click "Restart Core Tour"
3. Wait for tour to start
4. Press ESC key
   ✅ Tour should close immediately
   ✅ No errors in console
   ✅ Page remains functional
```

### Test 2: Tab Navigation

```
1. Start any tour
2. Press Tab key repeatedly
   ✅ Focus cycles: Next → Skip → Close → Back → Next
   ✅ Shift+Tab reverses direction
   ✅ Focus doesn't escape tooltip
   ✅ BLUE FOCUS RING visible on each button
   ✅ Focus ring has good contrast in light/dark mode
```

### Test 3: Focus Ring Visibility (NEW)

```
1. Start any tour
2. Use only keyboard (no mouse)
3. Tab to each button
   ✅ Focus ring appears with 2px blue border
   ✅ Ring has slight offset from button
   ✅ Ring visible in light mode (blue-400)
   ✅ Ring visible in dark mode (blue-500)
   ✅ Primary button has larger offset (2px vs 1px)
```

### Test 4: Screen Reader

```
1. Enable VoiceOver (Mac) or NVDA (Windows)
2. Start any tour
   ✅ Announces "Step 1 of X: [title]"
   ✅ Announces on Next button click
   ✅ Announces on step change
```

### Test 5: Analytics Events

```
1. Clear localStorage: localStorage.clear()
2. Start Core Tour
3. Complete entire tour
4. Check events:
   JSON.parse(localStorage.getItem('analytics.tour.events'))

   ✅ Should contain:
      - 1 tour_started event
      - 6 tour_step_viewed events (one per step)
      - 1 tour_completed event with duration_ms
```

### Test 6: Analytics Dashboard

```
1. Add TourCompletionCard to analytics page
2. Complete 2-3 tours
3. Skip 1 tour
4. Refresh analytics page
   ✅ Completion rate shows correct %
   ✅ Average time displays (e.g., "15s")
   ✅ Started/Completed counts are accurate
```

### Test 7: Tour Variants

```
1. Open Help menu
2. Click "AI Tools Tour"
   ✅ Tour starts
   ✅ Shows 3 steps about AI features
   ✅ Can complete tour

3. Click "Export Tour"
   ✅ Tour starts
   ✅ Shows 3 steps about export
   ✅ Can complete tour

4. Click same tour again
   ✅ Tour restarts (completion state reset)
```

### Test 8: Export Tour Auto-Open (NEW)

```
1. Start Export Tour from Help menu
2. First step highlights "Export" button
3. Click "Next" in tour tooltip
   ✅ Export modal opens automatically
   ✅ Tour waits 300ms for modal to render
   ✅ Second step highlights template selector inside modal
   ✅ No error if modal already open

4. Complete tour
   ✅ Third step highlights "Generate" button
   ✅ Tour completes successfully
```

---

## 🐛 Troubleshooting

### ESC key doesn't work

```bash
# Check if listener is registered
window.addEventListener('keydown', (e) => console.log('Key:', e.key))
# Press ESC, should log "Key: Escape"

# If ESC works but tour doesn't close:
# → Check console for errors in TourService.skip()
```

### Analytics not saving

```bash
# Check localStorage quota
navigator.storage?.estimate().then(console.log)
# Should have >1MB available

# Check for errors
localStorage.setItem('test', 'value')
localStorage.getItem('test')
# Should return 'value'
```

### Tour variant not starting

```bash
# In console:
import { getTourConfig } from '@/components/Onboarding/tourRegistry'
getTourConfig('ai-tools')
# Should return tour config object

# If undefined:
# → Check import paths in tourRegistry.ts
# → Verify aiToolsTour.ts exports correctly
```

### Tab trap not working

```bash
# Check if dialog has onKeyDown handler
document.querySelector('[role="dialog"]')
# Should have onKeyDown listener

# Verify focusable elements exist
document.querySelectorAll('[role="dialog"] button')
# Should return multiple buttons
```

---

## 📊 Success Metrics

After deployment, monitor:

- **Completion Rate**: Target >70% for core tour
- **Avg Completion Time**: Target <30s for core tour
- **ESC Usage**: Track skip events with step_index to see where users bail
- **Variant Adoption**: Track starts of AI Tools and Export tours

Query analytics events:

```javascript
// Get all events
const events = JSON.parse(localStorage.getItem('analytics.tour.events') || '[]');

// Completion rate
const started = events.filter((e) => e.type === 'tour_started').length;
const completed = events.filter((e) => e.type === 'tour_completed').length;
const rate = ((completed / started) * 100).toFixed(1);
console.log(`Completion rate: ${rate}%`);

// Average time
const times = events.filter((e) => e.type === 'tour_completed').map((e) => e.duration_ms);
const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
console.log(`Avg time: ${(avgTime / 1000).toFixed(1)}s`);

// Most skipped step
const skipped = events
  .filter((e) => e.type === 'tour_skipped')
  .reduce((acc, e) => {
    acc[e.index] = (acc[e.index] || 0) + 1;
    return acc;
  }, {});
console.log('Skip frequency by step:', skipped);
```

---

## 🎯 Optional: Feature Flags

Gate tours behind flags for gradual rollout:

```typescript
// In featureFlags.ts
export const FEATURE_FLAGS = {
  tour_aiTools: true,    // Enable AI Tools Tour
  tour_export: true,     // Enable Export Tour
  tour_analytics: true,  // Enable analytics dashboard card
};

// In HelpMenu.tsx
{featureFlagService.isEnabled('tour_aiTools') && (
  <Button onClick={() => startTourByKey('ai-tools')}>
    AI Tools Tour
  </Button>
)}
```

---

## 📝 Files to Review

### New Files (3)

- `src/tour/variants/aiToolsTour.ts`
- `src/tour/variants/exportTour.ts`
- `src/features/analytics/components/TourCompletionCard.tsx`

### Modified Files (5)

- `src/tour/TourService.ts`
- `src/tour/adapters/analyticsAdapter.ts`
- `src/tour/ui/SpotlightTooltip.tsx`
- `src/components/Onboarding/tourRegistry.ts`
- `src/components/Navigation/HelpMenu.tsx`

### Documentation (2)

- `TOUR_A11Y_ANALYTICS_VARIANTS.md` - Complete implementation guide
- `TOUR_DATA_ATTRIBUTES.md` - Data attribute reference

---

## 🚢 Ready to Ship?

- [ ] All data-tour-id attributes added to UI
- [ ] **NEW:** Tour targets not hidden in closed modals/portals (see TOUR_PITFALLS_GUIDE.md)
- [ ] **NEW:** Z-index verified - tour overlay (9999) higher than all elements
- [ ] **NEW:** Focus rings visible on all tour buttons
- [ ] Manual tests passed (ESC, Tab, ARIA)
- [ ] **NEW:** Export tour auto-opens modal correctly
- [ ] Analytics card added to dashboard
- [ ] Help menu shows new tour options
- [ ] Tested on Chrome, Firefox, Safari
- [ ] Tested with VoiceOver/NVDA
- [ ] localStorage quota checked
- [ ] Feature flags configured (if using)
- [ ] Team notified of new tours
- [ ] Docs reviewed by stakeholders

---

**Ship Date:** October 27, 2025  
**Status:** ✅ Ready for QA & Production

**Documentation:**

- `TOUR_A11Y_ANALYTICS_VARIANTS.md` - Complete implementation guide
- `TOUR_DATA_ATTRIBUTES.md` - Data attribute reference
- `TOUR_PITFALLS_GUIDE.md` - Common issues and solutions (NEW)
