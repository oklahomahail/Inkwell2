# 🧪 Tour Button Testing Guide

## Quick Test (2 minutes)

### Test 1: Start Tour from Settings

1. Open Inkwell
2. Navigate to Settings (click settings icon or `/dashboard?view=dashboard`)
3. Scroll to "Help & Onboarding" section
4. Click **"Start Tour"** button

**Expected Result:**

- ✅ Toast notification: "Navigating to Dashboard to start tour..."
- ✅ Automatically navigates to `/dashboard`
- ✅ Toast notification: "Tour started! Follow the highlighted areas."
- ✅ Tour overlay appears with spotlight effect
- ✅ First step highlights Dashboard area

### Test 2: Start Tour from Dashboard

1. Navigate to Dashboard (`/dashboard`)
2. Open Settings
3. Click **"Start Tour"** button

**Expected Result:**

- ✅ Toast notification: "Tour started!"
- ✅ Tour begins immediately (no navigation needed)
- ✅ Spotlight overlay appears

### Test 3: Console Diagnostics

1. Open DevTools Console (F12)
2. Run: `window.debugTour()`

**Expected Result:**

```
=== Inkwell Tour Diagnostics ===
Tour Service State: { isRunning: false, ... }
Tour Config: { id: 'inkwell-onboarding-v1', ... }

Checking tour anchors in DOM:

Step 1: Welcome to Inkwell
  Selectors: [data-tour-id="dashboard"], main
  ✓ Found: [data-tour-id="dashboard"]

Step 2: Navigation
  Selectors: [data-tour-id="sidebar"], nav[aria-label="Main"]
  ✓ Found: [data-tour-id="sidebar"]

... (continues for all steps)
```

### Test 4: Manual Start from Console

1. Open DevTools Console
2. Run: `window.inkwellStartTour()`

**Expected Result:**

- ✅ Tour starts immediately
- ✅ Console logs: `[TourService] Starting tour: { id: 'inkwell-onboarding-v1', ... }`

## Error Scenarios

### Scenario 1: Missing Tour Anchors

**Setup:** Remove `data-tour-id` attributes from DOM

**Test:**

1. Click "Start Tour"

**Expected Result:**

- ✅ Toast: "Unable to start tour. Some required elements may not be visible."
- ✅ Console error: `[SpotlightTour] Missing tour anchor!` with details
- ✅ Auto-runs diagnostics showing which steps failed

### Scenario 2: Tour Already Running

**Setup:** Start tour, then click "Start Tour" again

**Test:**

1. Start tour
2. Click "Start Tour" button again

**Expected Result:**

- ✅ Current tour stops
- ✅ New tour starts
- ✅ No errors or crashes

### Scenario 3: Crash Shield Active

**Setup:**

```javascript
sessionStorage.setItem('inkwell:tour:crash-shield', 'true');
```

**Test:**

1. Click "Start Tour"

**Expected Result:**

- ✅ Crash shield cleared automatically
- ✅ Tour starts normally
- ✅ Console log: `[TourReplay] Could not clear crash shield` (if error) or succeeds silently

## Visual Verification

### UI Elements to Check

**Settings Page - Help & Onboarding Section:**

```
┌─────────────────────────────────────────────────┐
│ Inkwell Spotlight Tour                          │
│ Replay the cinematic walkthrough of Inkwell's  │
│ core features.                                  │
│                                                 │
│ ℹ️ 11 steps • ~5 minutes          [Start Tour] │
│                                                 │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ ℹ️ The tour will navigate you to the          │
│    Dashboard to showcase all core features.    │
└─────────────────────────────────────────────────┘
```

**While Tour is Running:**

```
┌────────────────────────────────┐
│  Starting...  ⟳               │ ← Button shows spinner
└────────────────────────────────┘
```

**Toast Notifications:**

- Info: Blue background - "Navigating to Dashboard..."
- Success: Green background - "Tour started!"
- Error: Red background - "Unable to start tour..."

## Console Logs to Verify

### Successful Tour Start:

```
[TourReplay] Starting default tour...
[TourService] Starting tour: { id: 'inkwell-onboarding-v1', steps: 6, firstTarget: '[data-tour-id="dashboard"]' }
[TourReplay] Tour state after start: { isRunning: true, currentStep: 0, totalSteps: 6, tourId: 'inkwell-onboarding-v1' }
[SpotlightTour] Found target for selector: [data-tour-id="dashboard"]
```

### Failed Tour Start:

```
[TourReplay] Starting default tour...
[TourService] Starting tour: { id: 'inkwell-onboarding-v1', steps: 6, firstTarget: '[data-tour-id="dashboard"]' }
[TourReplay] Tour state after start: { isRunning: false, currentStep: 0, totalSteps: 0, tourId: null }
[TourReplay] Tour did not start! Check for missing tour anchors in the DOM.
[TourReplay] Running diagnostics...
=== Inkwell Tour Diagnostics ===
...
```

## Automated Test Commands

Run these in console for quick verification:

### 1. Check Tour System Health

```javascript
console.log('Tour Service:', window.inkwellTour?.getState());
console.log('Start Tour Available:', typeof window.inkwellStartTour === 'function');
console.log('Debug Available:', typeof window.debugTour === 'function');
```

### 2. Verify All Anchors Present

```javascript
window.debugTour();
```

### 3. Force Start Tour

```javascript
sessionStorage.clear();
localStorage.removeItem('inkwell:tour:completed');
window.inkwellStartTour();
```

### 4. Reset Everything

```javascript
sessionStorage.removeItem('inkwell:tour:crash-shield');
localStorage.removeItem('inkwell:tour:completed');
localStorage.removeItem('inkwell:firstRunShown');
window.inkwellTour?.stop();
location.reload();
```

## Performance Checks

### Load Time

- Button should be visible within 1 second of Settings page load
- No layout shift when button renders

### Response Time

- Click to navigation: < 500ms
- Navigation to tour start: < 300ms
- Total (click to tour visible): < 1 second

### Memory

- Tour should not leak memory after completion
- Check DevTools Memory tab before/after tour

## Accessibility Checks

### Keyboard Navigation

- [ ] Tab to "Start Tour" button
- [ ] Press Enter to start tour
- [ ] Tour overlay traps focus
- [ ] Escape key stops tour
- [ ] Arrow keys navigate tour steps

### Screen Reader

- [ ] Button is announced correctly
- [ ] Tour steps are announced
- [ ] Live region updates on step change

## Browser Compatibility

Test in:

- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

## Success Criteria

✅ All tests pass
✅ No console errors
✅ Toast notifications appear correctly
✅ Tour starts successfully
✅ Navigation works as expected
✅ Diagnostics available and working
✅ User receives clear feedback at all times

## Failure Investigation

If any test fails:

1. **Check Console** - Look for errors or warnings
2. **Run Diagnostics** - `window.debugTour()`
3. **Verify DOM** - Check if `data-tour-id` attributes exist
4. **Check State** - `window.inkwellTour?.getState()`
5. **Clear Cache** - Hard reload (Cmd+Shift+R)
6. **Reset Storage** - Clear localStorage and sessionStorage

---

**Test Status Template:**

```
Date: ___________
Tester: _________

[ ] Test 1: Start from Settings
[ ] Test 2: Start from Dashboard
[ ] Test 3: Console Diagnostics
[ ] Test 4: Manual Console Start
[ ] Scenario 1: Missing Anchors
[ ] Scenario 2: Already Running
[ ] Scenario 3: Crash Shield

Issues Found: ___________________
_________________________________
_________________________________

Status: ⬜ PASS  ⬜ FAIL  ⬜ NEEDS REVIEW
```
