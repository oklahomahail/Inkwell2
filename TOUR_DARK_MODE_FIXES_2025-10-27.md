# Tour Loading and Dark Mode Fixes - October 27, 2025

## Issues Identified

### 1. Boot Probe "Root Element Not Found" Error

**Problem**: The boot probe script in `index.html` was checking for `#root` element **before it existed in the DOM**. The script runs in the `<head>`, but `<div id="root">` is defined later in the `<body>`.

**Fix**: Modified the boot probe to defer the root element check until after the DOM is ready:

- If `document.readyState === 'loading'`, wait for `DOMContentLoaded` event
- Otherwise, check immediately
- This eliminates the false error that was confusing debugging

### 2. MutationObserver "parameter 1 is not of type 'Node'" Error

**Problem**: Multiple places in the code were creating MutationObservers and trying to observe nodes that might not exist yet, particularly:

- `document.body` might be `null` during early initialization
- Portal creation might happen before `document.body` is available

**Fixes Applied**:

#### a. Portal Safety (`src/tour/ui/portal.tsx`)

- Added guard to check `document.body` exists before creating portal
- Added try-catch around `ensurePortalRoot()` call
- Return `null` gracefully if portal cannot be created

#### b. Target Resolution (`src/tour/targets.ts`)

- Added null check for `node` before passing to `safeObserve()`
- If `document.body` is not available, use timeout fallback instead of crashing

#### c. Autostart Hook (`src/components/Onboarding/hooks/useSpotlightAutostart.ts`)

- Added guard to ensure `document.documentElement` exists before creating observer
- Though this should always exist, added defensive check for robustness

### 3. Dark Mode Default Issue

**Problem**: Conflict between `index.html` and `main.tsx` theme initialization:

- `index.html` was adding theme name as a class: `.light` or `.dark`
- `main.tsx` was only toggling `.dark` class
- Tailwind CSS expects only `.dark` class (light mode is default, no class needed)

**Fix**: Updated `index.html` theme script to match `main.tsx` behavior:

- Set `data-theme` attribute for CSS that uses it
- Only add `.dark` class when theme is dark
- Don't add `.light` class (not needed by Tailwind)
- Ensures consistency between pre-mount and post-mount theme state

## Root Causes

1. **Timing Issue**: Boot diagnostics running before DOM elements exist
2. **Defensive Programming Gap**: MutationObserver code not guarding against null/undefined nodes
3. **Theme State Mismatch**: Two different approaches to setting dark mode class

## Impact

These fixes should resolve:

- ✅ Tour not loading (MutationObserver crashes prevented tour initialization)
- ✅ Dark mode showing on deploy (theme class conflict resolved)
- ✅ Boot errors in console (false positive "root not found" fixed)

## Testing Checklist

- [ ] Tour loads successfully on first visit
- [ ] Light mode is default (no dark mode flash)
- [ ] Boot probe shows no false errors
- [ ] Tour elements appear correctly
- [ ] No MutationObserver errors in console
- [ ] Theme persists across page reloads
- [ ] Works in both production and development builds

## Files Modified

1. `/Users/davehail/Developer/inkwell/index.html`
   - Fixed boot probe timing
   - Fixed theme initialization to match Tailwind expectations

2. `/Users/davehail/Developer/inkwell/src/tour/ui/portal.tsx`
   - Added document.body existence check
   - Added error handling for portal creation

3. `/Users/davehail/Developer/inkwell/src/tour/targets.ts`
   - Added null check before MutationObserver usage

4. `/Users/davehail/Developer/inkwell/src/components/Onboarding/hooks/useSpotlightAutostart.ts`
   - Added documentElement existence check

## Deployment Notes

These are defensive code improvements that add safety guards. They should not break existing functionality, only prevent crashes in edge cases during initialization.

The changes are backward compatible and improve robustness during:

- Cold starts
- Slow network conditions
- Private browsing mode
- Browser dev tools with throttling
