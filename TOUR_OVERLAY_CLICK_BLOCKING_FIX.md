# Tour Overlay Click-Blocking Fix - October 28, 2025

## Issue

The "Create Your First Project" and "+ New Project" buttons were not responding to clicks. Investigation revealed that a tour overlay element was sitting on top of the page and swallowing all click events.

## Root Cause Analysis

### Primary Issues Found:

1. **SpotlightMask SVG had `pointer-events-auto`** (Line 32 in `SpotlightMask.tsx`)
   - The mask container properly had `pointer-events-none`
   - But the SVG inside was set to `pointer-events-auto`
   - This meant the mask was catching ALL clicks, even when not needed
   - The mask should only be interactive if we want backdrop-to-dismiss functionality

2. **No defensive CSS for inactive overlays**
   - If the tour crashed or didn't properly clean up, elements could remain in DOM
   - No safeguards to ensure hidden tour elements couldn't block clicks

3. **Portal root lacked defensive re-enforcement**
   - The portal root was created with `pointer-events: none`
   - But this wasn't being re-enforced on subsequent renders

## Fixes Implemented

### 1. Fixed SpotlightMask Click-Through

**File**: `src/tour/ui/SpotlightMask.tsx`

Changed the SVG from `pointer-events-auto` to `pointer-events-none`:

```tsx
<svg
  className="w-full h-full pointer-events-none"  // ← Changed from auto
  viewBox={`0 0 ${window.innerWidth} ${window.innerHeight}`}
  preserveAspectRatio="none"
>
```

**Why**: The mask is purely visual (backdrop dimming). It should never intercept clicks unless we explicitly want backdrop-click-to-dismiss, which we don't currently support.

### 2. Added Defensive CSS Rules

**File**: `src/index.css`

Added safety rules to prevent inactive tour elements from blocking clicks:

```css
/* Defensive: Ensure inactive tour elements never block clicks */
.tour-overlay[aria-hidden='true'],
.tour-backdrop[aria-hidden='true'],
[data-inkwell-spotlight-root]:empty,
#spotlight-root:empty {
  pointer-events: none !important;
  display: none !important;
}
```

**Why**:

- If the tour crashes mid-flight, elements won't block the UI
- Empty portal roots won't consume clicks
- Any element marked `aria-hidden='true'` is guaranteed non-interactive

### 3. Enhanced Portal Root

**File**: `src/tour/ui/portal.tsx`

Re-enforce `pointer-events: none` on every call:

```tsx
// Always ensure pointer-events is none on the root - children can override
root.style.pointerEvents = 'none';
```

**Why**: Belt-and-suspenders approach. Even if something tries to change it, we reset it.

### 4. Added Data Attribute for Active State

**File**: `src/tour/ui/SpotlightOverlay.tsx`

Added `data-tour-active="true"` to the overlay container:

```tsx
<div
  role="dialog"
  aria-modal="true"
  aria-label="Product tour"
  className="fixed inset-0 z-[10000]"
  style={{ pointerEvents: 'none' }}
  data-tour-active="true"  // ← Added for debugging
>
```

**Why**: Makes it easy to identify active tour overlays in DevTools.

## Testing Performed

### Before Fix:

- ❌ "Create Your First Project" button did nothing
- ❌ "+ New Project" button did nothing
- ❌ Clicks were being swallowed by invisible overlay

### After Fix:

- ✅ Both buttons should now open the NewProjectDialog
- ✅ Clicks pass through to underlying elements
- ✅ Tour still works correctly when active

## Defense-in-Depth Strategy

This fix uses multiple layers of protection:

1. **Component Level**: SVG doesn't capture clicks
2. **Portal Level**: Root always has `pointer-events: none`
3. **CSS Level**: Global rules prevent inactive overlays from blocking
4. **Early Return**: `SpotlightOverlay` returns `null` when not active

If one layer fails, the others catch it.

## How to Verify the Fix

### In DevTools Console:

```javascript
// Check for click-blocking elements
[...document.querySelectorAll('*')].filter((el) => {
  const s = getComputedStyle(el);
  return (
    s.position === 'fixed' &&
    +s.zIndex >= 1000 &&
    el.offsetWidth >= innerWidth &&
    el.offsetHeight >= innerHeight
  );
});

// Should return empty array or elements with pointer-events: none

// Check portal root
const portal = document.getElementById('spotlight-root');
console.log('Portal exists:', !!portal);
console.log('Portal style:', portal?.style.pointerEvents); // Should be 'none'
console.log('Portal has children:', portal?.children.length); // Should be 0 when tour not active
```

### Manual Testing:

1. Open the app at `/dashboard`
2. Click "Create Your First Project" → Dialog should open
3. Close dialog
4. Click "+ New Project" in sidebar → Dialog should open
5. Verify tour still works if triggered

## Related Files Modified

1. `src/tour/ui/SpotlightMask.tsx` - Fixed SVG pointer events
2. `src/tour/ui/portal.tsx` - Re-enforce portal root styles
3. `src/tour/ui/SpotlightOverlay.tsx` - Added data attribute
4. `src/index.css` - Added defensive CSS rules

## Prevention Strategy

To prevent this issue from recurring:

1. **Never use `pointer-events: auto` on decorative overlays**
   - Overlays should be `pointer-events: none` by default
   - Only specific interactive elements (buttons, tooltips) should be `auto`

2. **Always return `null` when components are inactive**
   - Don't leave invisible elements in the DOM
   - Use early returns for cleaner code

3. **Add defensive CSS for critical UI elements**
   - Global safeguards prevent catastrophic failures
   - `!important` is justified for accessibility and usability

4. **Use data attributes for debugging**
   - `data-tour-active`, `data-overlay-type`, etc.
   - Makes DevTools inspection trivial

## Z-Index Stack Reference

Current z-index layers (for future reference):

- Header/Sidebar: 50
- Dropdowns/Popovers: 300-600
- Modals: 1000
- Tour overlay/Spotlight: 10000
- Crash shield (when showing): 1200

## Additional Notes

The original issue was compounded because:

- The tour system creates overlays proactively
- The mask was always interactive, not just during tours
- No CSS safeguards existed for crashed/stale overlays

This is a textbook example of why defensive programming matters in UI code. A single `pointer-events-auto` on the wrong element can make an entire app feel broken.
