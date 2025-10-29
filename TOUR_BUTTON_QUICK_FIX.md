# Quick Fix: Start Tour Button Not Working

## The Problem

Clicking "Start Tour" in Settings doesn't launch the tour.

## Quick Solution

### Option 1: Start from Dashboard (Recommended)

1. Navigate to **Dashboard** (not Settings)
2. The tour will auto-start on first visit, OR
3. Go to Settings → Help & Onboarding → Click "Start Tour"

### Option 2: Console Command

Open browser DevTools console and run:

```javascript
window.inkwellStartTour();
```

### Option 3: Clear Tour State

If tour was previously crashed:

```javascript
sessionStorage.removeItem('inkwell:tour:crash-shield');
localStorage.removeItem('inkwell:tour:completed');
location.reload();
```

## Why It Happens

The tour needs specific elements present on the page. The Settings page doesn't have all the required tour anchor points (like sidebar, project cards, etc.).

The tour is designed to run from the **Dashboard page**.

## Debug the Issue

Run this in console to see what's wrong:

```javascript
window.debugTour();
```

This will show:

- ✓ Which tour steps have their elements present
- ✗ Which steps are missing required elements
- Suggestions for fixing the issue

## Expected Behavior

### From Settings Page

When you click "Start Tour" from Settings:

- ✅ You'll see a toast notification
- ✅ If tour can't start, you'll get an error message explaining why
- ✅ Console will show detailed diagnostics

### From Dashboard Page

When you click "Start Tour" from Dashboard:

- ✅ Tour starts immediately
- ✅ Spotlight highlights each feature
- ✅ Navigate through 6 onboarding steps

## Verify the Fix

After the fix has been applied, you should see:

1. **Toast Notifications**: Success or error messages when clicking "Start Tour"
2. **Console Logging**: Detailed logs about tour state
3. **Helpful Errors**: If tour can't start, you'll know exactly why
4. **Auto-Diagnostics**: Console will run diagnostics automatically on failure

## Still Not Working?

1. Check browser console for errors
2. Run `window.debugTour()` to see diagnostics
3. Verify you're on the Dashboard page
4. Check that no modals or overlays are blocking the UI
5. Try refreshing the page (Cmd+Shift+R)

## Technical Details

The tour system uses these components:

- **TourService**: Manages tour state (singleton)
- **SpotlightOverlay**: Renders the tour UI (mounted in App.tsx)
- **TourReplayButton**: The button in Settings
- **defaultTour.ts**: Tour step configuration

Tour steps require DOM elements with `data-tour-id` attributes:

- `data-tour-id="dashboard"`
- `data-tour-id="sidebar"`
- `data-tour-id="topbar"`
- etc.

If these elements aren't present, the tour can't proceed.

---

**See also**: `TOUR_BUTTON_FIX_SUMMARY.md` for complete technical details.
