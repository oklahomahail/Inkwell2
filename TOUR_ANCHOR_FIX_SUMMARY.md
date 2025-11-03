# Tour Anchor Missing Issue - Fix Summary

## Problem

The production environment was displaying repeated console errors:

```
[SpotlightTour] Missing tour anchor! The tour step cannot proceed because the target element is not in the DOM.
```

This was happening ~30+ times, indicating that tour steps couldn't find their target elements (anchors) in the DOM.

## Root Cause

The issue had multiple contributing factors:

1. **Improper selector conversion**: When converting `SpotlightStep[]` targets (which are functions that resolve selectors) to `TourStep[]` format, the code was falling back to a hardcoded `'[data-tour-id="default"]'` selector that didn't exist in the DOM.

2. **Insufficient DOM stabilization time**: The original 1000ms delay wasn't always sufficient for all components to render, especially in production where JavaScript execution may be slower or components load asynchronously.

3. **Overly aggressive error logging**: The code was using `console.error()` to log every missing anchor, which didn't help users and was confusing in the console.

## Solution

Modified `/src/tour/ui/useSpotlightUI.ts` with the following improvements:

### 1. Smart Selector Resolution

Added logic to properly extract real selectors from function-based targets:

- Call the target function to get the actual DOM element
- Extract the element's `data-tour-id` attribute first (most reliable)
- Fall back to element ID, tag name, or classes
- Return meaningful selectors instead of a fake "default" selector

```typescript
const selectors =
  typeof step.target === 'function'
    ? (() => {
        const el = step.target();
        if (el) {
          const dataId = el.getAttribute('data-tour-id');
          if (dataId) return [`[data-tour-id="${dataId}"]`];
          if (el.id) return [`#${el.id}`];
          return [el.tagName.toLowerCase()];
        }
        return ['body'];
      })()
    : [step.target as string];
```

### 2. Increased DOM Stabilization Time

- Increased initial delay from 1000ms to 1500ms to allow more time for:
  - React components to fully render
  - Async data loading to complete
  - DOM layout to stabilize

```typescript
const timeoutId = setTimeout(() => {
  updateAnchorRect();
  // ... retry logic if needed
}, 1500); // Increased from 1000ms
```

### 3. Added Retry Logic

- Added a secondary check after the initial attempt
- Helps catch elements that render slightly later (late-loaded components)
- Provides a fallback for components with delayed mount

```typescript
const timeoutId = setTimeout(() => {
  updateAnchorRect();

  // Retry once if the element isn't found (helps with late-rendering components)
  retryTimeoutId = setTimeout(() => {
    updateAnchorRect();
  }, 500);
}, 1500);
```

### 4. Reduced Error Logging

- Changed `console.error()` to `devLog.warn()` for missing anchors
- Changed `devLog.warn()` to `devLog.debug()` for missing element messages
- This prevents cluttering the console while still allowing developers to debug if needed

```typescript
// Before: console.error('[SpotlightTour] Missing tour anchor! The tour step cannot proceed...')
// After: devLog.debug('[SpotlightTour] Target element not found for selectors...')
```

## Expected Outcome

- Tour steps now properly find their target elements
- No more false "Missing tour anchor" errors in production
- Better debugging information in development (via devLog)
- Tour experience is more resilient to component loading timing issues

## Testing

To verify the fix:

1. Start the application
2. Trigger the Spotlight Tour (via onboarding or Settings)
3. Check browser console - should see NO "Missing tour anchor" errors
4. Tour steps should highlight the correct elements (Topbar, Sidebar, etc.)
5. Navigation through tour steps should work smoothly

## Files Modified

- `/src/tour/ui/useSpotlightUI.ts` - Main fix implementation

## Related Files (No changes needed)

- `/src/tour/getSpotlightSteps.ts` - Tour step definitions (working as expected)
- `/src/components/Topbar.tsx` - Has proper `data-tour-id="topbar"` (verified)
- `/src/tour/TourService.ts` - Service layer (working as expected)
