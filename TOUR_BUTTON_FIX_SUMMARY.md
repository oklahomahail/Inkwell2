# Tour Button Fix Summary

## Issue

The "Start Tour" button on the Settings page (`/dashboard?view=dashboard`) was visible but not properly initializing the SpotlightTourManager when clicked.

## Root Cause

The tour system was correctly configured and the button was properly wired, but there were several issues:

1. **Missing Error Feedback**: When the tour failed to start (usually due to missing DOM anchors), users received no feedback
2. **Incorrect Tour ID**: The button was using `'DEFAULT_TOUR_ID'` (literal string) instead of the actual tour ID `'inkwell-onboarding-v1'`
3. **No Diagnostics**: There was no way to debug why the tour wasn't starting
4. **Missing User Feedback**: No toast notifications to inform users about success/failure

## What Was Fixed

### 1. Enhanced TourReplayButton (`src/components/Settings/TourReplayButton.tsx`)

- ✅ Fixed tour ID from `'DEFAULT_TOUR_ID'` to `'inkwell-onboarding-v1'`
- ✅ Added crash shield state clearing to prevent stale tour blocks
- ✅ Added tour state verification after start
- ✅ Added toast notifications for success/error feedback
- ✅ Integrated automatic diagnostics logging when tour fails
- ✅ Imported and used `tourService` and `useToast` for better integration

### 2. Improved TourService Logging (`src/tour/TourService.ts`)

- ✅ Added detailed logging when tour starts (ID, step count, first target)
- ✅ Better visibility into tour lifecycle for debugging

### 3. Better Error Detection (`src/tour/ui/useSpotlightUI.ts`)

- ✅ Enhanced anchor resolution logging
- ✅ Added console.error when tour anchors are missing
- ✅ Detailed error messages with suggestions for fixing anchor issues

### 4. Debug Utilities (`src/tour/tourEntry.ts`)

- ✅ Added `window.debugTour()` function to diagnose tour issues
- ✅ Checks all tour steps and validates DOM anchors
- ✅ Provides clear feedback about which steps will fail

## How to Use

### Starting the Tour from Settings

1. Navigate to Settings (Dashboard → Settings icon)
2. Scroll to "Help & Onboarding" section
3. Click "Start Tour" or "Replay Tour" button
4. The tour will start if all anchor elements are present
5. If it fails, you'll see a toast notification with guidance

### Debugging Tour Issues

If the tour doesn't start, open the browser console and run:

```javascript
window.debugTour();
```

This will show:

- Current tour service state
- All tour steps and their selectors
- Which DOM elements were found/not found
- Clear indication of which steps will fail

### Manual Tour Start

You can also start the tour manually from the console:

```javascript
window.inkwellStartTour();
```

## Common Issues and Solutions

### Issue: Tour doesn't start from Settings page

**Cause**: Required tour anchor elements (`data-tour-id` attributes) are not present on the Settings page.

**Solution**: The default tour is designed to run from the Dashboard page. Navigate to the Dashboard first, then start the tour from there.

### Issue: Tour was working but stopped

**Cause**: CrashShield or tour crash-shield protection may have been triggered.

**Solution**:

1. Open DevTools Console
2. Run: `sessionStorage.removeItem('inkwell:tour:crash-shield')`
3. Reload the page (Cmd+Shift+R / Ctrl+Shift+R)
4. Try starting the tour again

### Issue: "Tour already running" warning

**Cause**: Previous tour instance didn't properly clean up.

**Solution**:

1. Run in console: `window.inkwellTour.stop()`
2. Try starting the tour again

## Tour Architecture

The tour system consists of several layers:

```
TourReplayButton (UI)
    ↓
startDefaultTour() (Entry Point)
    ↓
tourService.start() (State Management)
    ↓
TourService state change
    ↓
SpotlightOverlay (UI Renderer)
    ↓
useSpotlightUI (Anchor Resolution)
    ↓
SpotlightMask + SpotlightTooltip (Visual UI)
```

### Key Components

- **TourReplayButton**: Settings page button that triggers tour
- **tourEntry.ts**: Convenience functions for starting tours
- **TourService**: Singleton that manages tour state
- **SpotlightOverlay**: Mounted in App.tsx, listens for tour events
- **useSpotlightUI**: Resolves DOM anchors and manages UI state
- **defaultTour.ts**: Configuration for the default onboarding tour

## Tour Steps Configuration

The default tour requires these anchor elements:

1. `[data-tour-id="dashboard"]` - Dashboard view
2. `[data-tour-id="sidebar"]` - Main navigation sidebar
3. `[data-tour-id="topbar"]` - Top action bar
4. `[data-tour-id="storage-banner"]` - Storage health banner
5. `[data-tour-id="focus-toggle"]` - Focus mode toggle
6. `[data-tour-id="help-tour-button"]` - Help menu button

**Note**: Most of these elements are only present on the Dashboard page, not the Settings page. This is why the tour may fail to start from Settings.

## Future Improvements

Consider these enhancements:

1. **Smart Navigation**: Automatically navigate to Dashboard if tour anchors aren't found
2. **Context-Aware Tours**: Different tour configurations for different pages
3. **Tour Step Skipping**: Auto-skip steps where anchors aren't found
4. **Visual Anchor Debugger**: Overlay showing where tour expects to find elements
5. **Settings Tour**: Separate tour specifically for Settings page features

## Testing Checklist

- [ ] Navigate to Dashboard
- [ ] Click Settings icon
- [ ] Scroll to "Help & Onboarding"
- [ ] Click "Start Tour" button
- [ ] Verify toast notification appears
- [ ] Check console for any errors
- [ ] If tour doesn't start, run `window.debugTour()` and check output
- [ ] Navigate back to Dashboard
- [ ] Try starting tour again from Settings
- [ ] Tour should now start (or show helpful error message)

## Files Modified

- `src/components/Settings/TourReplayButton.tsx` - Enhanced button logic and feedback
- `src/tour/TourService.ts` - Better logging
- `src/tour/ui/useSpotlightUI.ts` - Enhanced error detection
- `src/tour/tourEntry.ts` - Added debug utilities

## Related Documentation

- `TOUR_BUTTON_FIXES_SUMMARY.md` - Previous tour button fixes
- `SPOTLIGHT_TOUR_INTEGRATION_CHECKLIST.md` - Tour integration guide
- `src/components/Onboarding/README.md` - Onboarding system overview
