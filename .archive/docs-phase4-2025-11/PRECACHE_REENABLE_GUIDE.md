# Precache Layer Re-enablement Guide

**Date:** November 3, 2025
**Status:** SAFE TO ENABLE - Precache layer is stable and tested

## Overview

Now that the precache layer is stable with comprehensive test coverage (778 tests passing, 68 test files), we can safely re-enable and test the three critical flows that depend on reliable caching:

1. **Theme Initialization** - Confirm no FOUC (Flash of Unstyled Content) or stale cache
2. **Onboarding Tour** - Guaranteed to load from current build
3. **PWA Install Prompt & Offline Reload Flow** - Works with precached assets

## Pre-enablement Checklist

- [x] Precache tests passing (778 tests, 68 files)
- [x] Storage tests passing (no corruption, quota handling verified)
- [x] Service Worker lifecycle verified
- [x] Connectivity service comprehensive (24 tests)
- [x] Offline queue management tested (19 tests)

## Part 1: Theme Initialization Test

### Objectives

- Verify theme loads instantly without FOUC
- Confirm localStorage respects user preference
- Check system preference fallback works
- Validate theme persistence through hard refresh

### Test Steps

```bash
# Open DevTools (Cmd+Option+I on Mac)
```

1. **Fresh Start - Light Mode**
   - Clear site data: DevTools > Application > Storage > Clear site data
   - Hard refresh: Cmd+Shift+R
   - ✓ Verify: Page should render in light mode instantly (no flash)
   - ✓ Verify: localStorage shows `theme: "light"`

2. **Fresh Start - System Preference: Dark**
   - Clear site data again
   - In DevTools, go to Rendering tab
   - Change "Emulate CSS media feature prefers-color-scheme" to "dark"
   - Hard refresh: Cmd+Shift+R
   - ✓ Verify: Page renders in dark mode instantly
   - ✓ Verify: localStorage shows `theme: "dark"`

3. **Toggle Theme in App**
   - Click theme toggle (usually in settings or header)
   - ✓ Verify: Theme changes instantly without flash
   - ✓ Verify: localStorage updates
   - Hard refresh: Cmd+Shift+R
   - ✓ Verify: Remembered theme loads instantly

4. **Stale Cache Detection**
   - Open DevTools Network tab
   - Look for Service Worker cache hits (marked as "service worker" source)
   - ✓ Verify: CSS and JS load from cache
   - ✓ Verify: HTML is NOT cached (cache-control: no-store)

### Expected Results

- **No FOUC** (Flash of Unstyled Content)
- **Instant theme application** before first paint
- **Correct fallback** to system preference
- **Persistent user choice** across sessions
- **Cache validation** via Service Worker headers

### Debug Commands (Console)

```javascript
// Check theme in localStorage
localStorage.getItem('theme');

// Check CSS class on root
document.documentElement.classList.contains('dark');

// Check theme detection logic
window.matchMedia('(prefers-color-scheme: dark)').matches;

// Verify theme utility
import { getTheme, setTheme } from '@/utils/theme';
getTheme();
setTheme('dark');

// Check Service Worker cache
caches.keys().then((names) => console.log('Cache names:', names));
caches
  .open('inkwell-v1')
  .then((cache) => cache.keys().then((urls) => console.log('Cached URLs:', urls)));
```

---

## Part 2: Onboarding Tour Test

### Objectives

- Verify tour loads from current build
- Confirm tour doesn't restart on hard refresh
- Check tour completion persistence
- Validate tour elements render with correct precached assets

### Test Steps

1. **Enable Tour Feature Flag**

   ```javascript
   // In browser console
   localStorage.setItem('feature:spotlightTour', 'true');
   location.reload();
   ```

2. **First-Time User Experience**
   - Sign in as new user (or clear `tour:session_started` from localStorage)
   - Navigate to `/profiles?view=dashboard`
   - ✓ Verify: Welcome modal appears
   - ✓ Verify: Tour highlights match DOM elements
   - ✓ Verify: No console errors about missing anchors

3. **Tour During Session**
   - Follow tour steps
   - ✓ Verify: Each step highlights correct element
   - ✓ Verify: Spotlight overlay appears smooth
   - ✓ Verify: Progress bar shows correct step count

4. **Tour Completion**
   - Complete all tour steps
   - ✓ Verify: Completion event fires (`inkwell:tour:completed`)
   - ✓ Verify: `tour:session_started` flag set in sessionStorage
   - Hard refresh: Cmd+Shift+R
   - ✓ Verify: Tour does NOT restart (gate prevents repeat)

5. **Manual Tour Restart**
   - Click "Tour" in help menu (if available)
   - ✓ Verify: Tour restarts cleanly
   - ✓ Verify: Anchors load from current build

### Debug Commands (Console)

```javascript
// Enable tour flag
localStorage.setItem('feature:spotlightTour', 'true');

// Check session guard
sessionStorage.getItem('tour:session_started');

// Check completion persistence
localStorage.getItem('tour:never_show');

// Check tour state
window.__tourService?.getState?.();

// Manually trigger tour
import { startTour } from '@/tour/tourLauncher';
startTour('spotlight');

// Check for missing anchors
document.querySelectorAll('[data-tour-anchor]').forEach((el) => {
  console.log('Found anchor:', el.dataset.tourAnchor, el.id || el.className);
});
```

### Expected Results

- **Tour loads cleanly** on first user session
- **No duplicate runs** on hard refresh
- **Correct element highlighting** with no missing selectors
- **Smooth animations** with precached assets
- **Completion persists** through sessions

---

## Part 3: PWA Install Prompt & Offline Reload Flow

### Objectives

- Verify PWA install prompt appears
- Test offline mode transitions smoothly
- Confirm offline page loads from precache
- Validate offline indicator functionality
- Test update notification workflow

### Test Steps

### 3A: PWA Install Prompt

1. **Check Install Readiness**
   - DevTools > Application > Manifest
   - ✓ Verify: manifest.json loads correctly
   - ✓ Verify: `"display": "standalone"` is set
   - ✓ Verify: All required icons are present

2. **Trigger Install Prompt**
   - Look for install banner/button (may vary by browser)
   - Click install
   - ✓ Verify: App installs to home screen
   - ✓ Verify: App launches in standalone mode
   - ✓ Verify: No address bar in app mode

3. **Verify Offline Assets**
   - DevTools > Application > Cache Storage
   - Look for `inkwell-v1` cache
   - ✓ Verify: CSS, JS, critical HTML cached
   - ✓ Verify: Brand assets cached
   - ✓ Verify: SVG icons cached

### 3B: Offline Mode Simulation

1. **Go Offline Gracefully**
   - Start in online mode (DevTools > Network: online)
   - ✓ Verify: Status shows "Online"
   - ✓ Verify: All features work normally
   - DevTools > Network: change to "Offline"
   - ✓ Verify: Offline indicator appears (usually top bar)
   - ✓ Verify: Indicator shows "Saving locally"

2. **Test Offline Features**
   - Make edits in editor
   - ✓ Verify: Changes save to localStorage (no error)
   - ✓ Verify: "Saving locally" indicator appears
   - ✓ Verify: No network errors in console
   - Open Developer Console, check for queue operations:

   ```javascript
   localStorage.getItem('inkwell_offline_queue');
   ```

3. **Come Back Online**
   - DevTools > Network: change to "Online"
   - ✓ Verify: Offline indicator disappears
   - ✓ Verify: Changes sync to server
   - ✓ Verify: Queue processes successfully
   - Check completion:
   ```javascript
   localStorage.getItem('inkwell_offline_queue'); // Should be empty
   ```

### 3C: Service Worker Update Flow

1. **Trigger Update Check**
   - In console:

   ```javascript
   navigator.serviceWorker.getRegistration().then((reg) => {
     reg.update();
   });
   ```

   - ✓ Verify: Service Worker checks for updates
   - ✓ Verify: No console errors

2. **Simulate New Version Available**
   - For testing, modify `/public/site.webmanifest` slightly
   - Hard refresh app
   - ✓ Verify: Update notification appears if available

3. **Apply Update**
   - Click "Update" in notification
   - ✓ Verify: App reloads with new assets
   - ✓ Verify: Old cache cleared (check Cache Storage)

### 3D: Offline Reload Flow

1. **Go Offline and Reload**
   - Navigate to online app
   - DevTools > Network: Offline
   - Hard refresh: Cmd+Shift+R
   - ✓ Verify: App still loads (from precache)
   - ✓ Verify: Offline indicator shows
   - ✓ Verify: Read-only mode or graceful degradation

2. **Network Interruption Resilience**
   - Online mode, navigate to different section
   - DevTools > Network: Offline (mid-navigation)
   - ✓ Verify: Graceful handling (no crash)
   - ✓ Verify: Error message if needed, but app stable

### Debug Commands (Console)

```javascript
// Check Service Worker
navigator.serviceWorker.controller;

// Get registration
navigator.serviceWorker.getRegistration().then((reg) => {
  console.log('Active SW:', reg.active?.state);
  console.log('Waiting SW:', reg.waiting?.state);
});

// Force update check
navigator.serviceWorker.getRegistration().then((reg) => reg.update());

// Check connectivity status
import { connectivityService } from '@/services/connectivityService';
connectivityService.getStatus();

// Check offline queue
localStorage.getItem('inkwell_offline_queue');

// Check PWA status
if (window.__pwaService) {
  console.log('PWA Service available');
  window.__pwaService.getStatus?.();
}
```

### Expected Results

- **Install prompt** appears and works
- **Offline indicator** shows during connectivity loss
- **Local saves** queue successfully
- **Sync completes** when online returns
- **Update flow** works smoothly with cache refresh
- **App stable** through entire cycle

---

## Validation Checklist

After completing all three parts:

### Theme

- [ ] No FOUC on any page
- [ ] User preference persists across sessions
- [ ] System preference respected as fallback
- [ ] Theme toggle works instantly
- [ ] Hard refresh maintains theme without flash

### Onboarding

- [ ] Feature flag enables tour display
- [ ] Welcome modal shows for new users
- [ ] All tour steps load and highlight correctly
- [ ] Anchors resolve from current build
- [ ] Completion prevents restart (session guard)
- [ ] Manual restart works cleanly

### PWA

- [ ] Install prompt/banner appears (platform-dependent)
- [ ] Offline indicator shows on connectivity loss
- [ ] Local saves queue without errors
- [ ] Sync completes when online returns
- [ ] Update notification works when available
- [ ] App stable during all transitions

---

## Monitoring & Fallback

### What to Watch For

1. **FOUC (Flash of Unstyled Content)**
   - If you see white/unstyled page before CSS loads: **cache validation issue**
   - Check: Service Worker cache headers, precache manifest

2. **Tour Anchors Not Finding Elements**
   - If tour fails to highlight: **precache not delivering current build**
   - Check: Cache-Control headers, Service Worker version

3. **Offline Queue Stuck**
   - If changes don't sync: **connectivity service issue**
   - Check: Browser console for connectivity service errors
   - Solution: Manual sync via settings, or hard refresh

4. **Old Version in Cache**
   - If you see old UI after update: **cache not cleared**
   - Fix: `caches.delete('inkwell-v1')` in console
   - Hard refresh: Cmd+Shift+R

### Emergency Fallback

If any feature breaks:

1. **Clear Everything**

   ```javascript
   // Clear cache
   caches.keys().then((names) => Promise.all(names.map((name) => caches.delete(name))));

   // Clear storage
   localStorage.clear();
   sessionStorage.clear();

   // Unregister Service Worker
   navigator.serviceWorker
     .getRegistrations()
     .then((regs) => regs.forEach((reg) => reg.unregister()));
   ```

2. **Hard refresh**
   - Cmd+Shift+R (or Cmd+Option+R on Mac)

3. **Full app reset**
   - DevTools > Application > Storage > "Clear site data"

---

## Success Metrics

| Component   | Metric                   | Target |
| ----------- | ------------------------ | ------ |
| **Theme**   | FOUC incidents           | 0      |
| **Theme**   | Theme load time          | <50ms  |
| **Tour**    | Anchor miss rate         | 0%     |
| **Tour**    | Tour completion rate     | >80%   |
| **PWA**     | Offline fallback success | 100%   |
| **PWA**     | Sync queue success rate  | >99%   |
| **Overall** | Precache hit rate        | >90%   |
| **Overall** | Hard refresh time        | <2s    |

---

## Next Steps

After successful validation:

1. ✅ **Enable in production** if not already enabled
2. ✅ **Monitor error logs** for 24 hours
3. ✅ **Document any issues** found and follow up
4. ✅ **Update feature flags** as needed for rollout phases
5. ✅ **Create user announcement** for PWA features

---

## Related Files

- **Theme Logic**: `src/utils/theme.ts`
- **Theme Initialization**: `index.html` (inline script)
- **Onboarding**: `src/onboarding/OnboardingOrchestrator.tsx`
- **Tour Launcher**: `src/tour/tourLauncher.ts`
- **PWA Service**: `src/services/pwaService.ts`
- **Connectivity**: `src/services/connectivityService.ts`
- **Precache Config**: `vite.config.ts` (PWA plugin)
- **Service Worker**: `src/sw.ts` (if custom)

## Questions?

See deployment logs and test summaries:

- `COMPLETE_TEST_SUMMARY.md`
- `FINAL_OPERATIONAL_CHECKLIST.md`
