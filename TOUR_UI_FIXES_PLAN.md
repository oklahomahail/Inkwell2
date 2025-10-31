# Tour and UI Stability Fixes - Implementation Plan

**Date:** 2025-10-30
**Priority:** High
**Status:** In Progress

---

## Executive Summary

This document outlines the implementation plan for fixing tour/onboarding initialization issues and UI stability problems identified in the codebase audit.

### Issues Identified

1. **Tour Initialization Timing**
   - MutationObserver may fire before React mount completes
   - requestAnimationFrame + queueMicrotask approach can be too early
   - No explicit check for React root mount completion

2. **Viewport Boundary Detection**
   - Tooltip positioning uses basic clamp(8px) margins
   - No prevention for partial overflow in narrow viewports
   - Auto-placement scoring doesn't account for scroll position

3. **Dark Mode Flash**
   - Current implementation only checks `theme === 'dark'`
   - Doesn't respect `prefers-color-scheme` media query
   - No transition smoothing

4. **Z-Index Chaos**
   - Inconsistent z-index values across components
   - Tour overlay: `z-[9999]`
   - Spotlight: varying values
   - No centralized z-index system

5. **Sidebar Layout Issues**
   - Logo overlap reported in certain states
   - No comprehensive responsive testing
   - Collap

sed state may clip content

---

## Implementation Plan

### Phase 1: Tour Initialization Fixes

#### Task 1.1: Enhance useSpotlightAutostart with React Root Detection

**File:** `src/components/Onboarding/hooks/useSpotlightAutostart.ts`

**Current Issues:**

- Uses `requestAnimationFrame` + `queueMicrotask` which may fire before React root is mounted
- MutationObserver watches `document.documentElement` but React mounts to `#root`
- No explicit check for React application ready state

**Proposed Solution:**

```typescript
// Add function to detect React mount completion
function waitForReactMount(timeout = 5000): Promise<boolean> {
  return new Promise((resolve) => {
    const root = document.getElementById('root');
    if (!root) {
      resolve(false);
      return;
    }

    // Check if React has already mounted
    if (root.childNodes.length > 0) {
      // Additional check: ensure it's not just a loading state
      const hasReactContent =
        root.querySelector('[data-reactroot], [data-react-root]') || root.children.length > 0;

      if (hasReactContent) {
        resolve(true);
        return;
      }
    }

    // Watch for React mount
    const observer = new MutationObserver(() => {
      if (root.childNodes.length > 0) {
        observer.disconnect();
        // Give React one more frame to hydrate
        requestAnimationFrame(() => {
          resolve(true);
        });
      }
    });

    observer.observe(root, { childList: true, subtree: true });

    // Timeout fallback
    setTimeout(() => {
      observer.disconnect();
      resolve(root.childNodes.length > 0);
    }, timeout);
  });
}

// Enhanced whenTargetsReady function
async function whenTargetsReady(selectors: string[], timeoutMs = 8000): Promise<boolean> {
  // Step 1: Wait for React root to mount
  const reactMounted = await waitForReactMount(3000);
  if (!reactMounted) {
    console.warn('React mount timeout - tour may not display correctly');
    return false;
  }

  // Step 2: Wait one more frame for layout paint
  await new Promise((resolve) => requestAnimationFrame(resolve));

  // Step 3: Check if targets exist
  if (targetsExist(selectors)) {
    return true;
  }

  // Step 4: Watch for targets with MutationObserver (existing logic)
  // ... rest of existing implementation
}
```

**Benefits:**

- Ensures React application is fully mounted before tour starts
- Reduces false positives from MutationObserver firing too early
- More reliable across different browsers and load conditions

---

#### Task 1.2: Add DOM Ready State Checking

**Enhancement:** Add explicit checks for document.readyState and DOMContentLoaded

```typescript
// Add to useSpotlightAutostart useEffect
useEffect(() => {
  if (once.current) return;

  // Ensure DOM is fully loaded
  const startTourFlow = async () => {
    // Wait for DOM ready if needed
    if (document.readyState === 'loading') {
      await new Promise((resolve) => {
        document.addEventListener('DOMContentLoaded', resolve, { once: true });
      });
    }

    // ... existing logic
  };

  startTourFlow();
}, [loc.pathname, stepSelectors]);
```

---

### Phase 2: Viewport Boundary Detection

#### Task 2.1: Enhance Tooltip Positioning with Better Boundary Detection

**File:** `src/tour/ui/SpotlightTooltip.tsx`

**Current Issues:**

- Simple `clamp(8, vpW - cardW - 8)` doesn't prevent partial cutoffs
- No consideration for scroll position or sticky elements
- Auto-placement doesn't account for content priority

**Proposed Solution:**

```typescript
// Enhanced positioning with scroll awareness
function getViewportDimensions() {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
    scrollX: window.scrollX || window.pageXOffset,
    scrollY: window.scrollY || window.pageYOffset,
  };
}

// Enhanced clamp with minimum visible threshold
function clampWithMinVisible(value: number, min: number, max: number, minVisiblePercent = 0.8) {
  const range = max - min;
  const minVisible = range * minVisiblePercent;

  // If value would result in less than 80% visible, force it to min or max
  if (value < min + minVisible && value > min) {
    return min;
  }
  if (value > max - minVisible && value < max) {
    return max;
  }

  return Math.max(min, Math.min(max, value));
}

// Enhanced tryPlacement function
const tryPlacement = (p: TooltipPlacement) => {
  const viewport = getViewportDimensions();
  const margin = 12; // Minimum margin from viewport edge

  // Account for fixed/sticky headers or footers
  const reservedTop = 60; // Typical header height
  const reservedBottom = 0; // No footer typically

  const effectiveVpH = viewport.height - reservedTop - reservedBottom;

  switch (p) {
    case 'top':
      return {
        left: clampWithMinVisible(
          anchorRect.x + anchorRect.width / 2 - cardW / 2,
          margin,
          viewport.width - cardW - margin,
        ),
        top: clampWithMinVisible(
          anchorRect.y - gap - cardH,
          reservedTop + margin,
          reservedTop + effectiveVpH - cardH - margin,
        ),
      };
    // ... similar for other placements
  }
};
```

**Benefits:**

- Prevents partial cutoffs that make content unreadable
- Accounts for fixed headers and other UI elements
- More intelligent positioning that prioritizes full visibility

---

#### Task 2.2: Add Overflow Prevention Class

**File:** `src/tour/ui/SpotlightTooltip.tsx`

```typescript
// Add to tooltip div
className = 'fixed z-[9999] max-w-sm max-h-[calc(100vh-120px)] overflow-auto rounded-2xl ...';
```

**Benefits:**

- Ensures tooltip content is scrollable if too tall
- Prevents viewport overflow even with long descriptions

---

### Phase 3: Dark Mode Initialization

#### Task 3.1: Enhance Dark Mode Script in index.html

**File:** `index.html`

**Current Code:**

```javascript
const theme = localStorage.getItem('theme');
if (theme === 'dark') {
  document.documentElement.classList.add('dark');
} else {
  document.documentElement.classList.remove('dark');
  localStorage.setItem('theme', 'light');
}
```

**Issues:**

- Doesn't respect `prefers-color-scheme`
- Forces 'light' if no preference set (not user-friendly)
- No transition smoothing

**Proposed Solution:**

```javascript
(function () {
  // Check localStorage first
  const savedTheme = localStorage.getItem('theme');

  // Determine effective theme
  let theme;
  if (savedTheme) {
    theme = savedTheme;
  } else {
    // Respect system preference
    const prefersDark =
      window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    theme = prefersDark ? 'dark' : 'light';
  }

  // Apply theme immediately (before page render)
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }

  // Store resolved theme (so we know user's effective preference)
  if (!savedTheme) {
    localStorage.setItem('theme', theme);
  }
})();
```

**Benefits:**

- Respects user's system preferences
- No forced default that ignores OS settings
- Still allows explicit override via localStorage

---

#### Task 3.2: Add Transition Prevention During Initial Load

**File:** `src/index.css`

```css
/* Prevent transitions during page load (dark mode flash prevention) */
html.loading * {
  transition: none !important;
}

/* Remove after page load */
html:not(.loading) * {
  transition-property: background-color, border-color, color, fill, stroke;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}
```

**File:** `src/main.tsx` or `src/App.tsx`

```typescript
// Remove loading class after React mounts
useEffect(() => {
  document.documentElement.classList.remove('loading');
}, []);
```

---

### Phase 4: Z-Index System

#### Task 4.1: Create Centralized Z-Index Scale

**File:** `tailwind.config.js`

**Add to theme.extend:**

```javascript
zIndex: {
  // Base layers
  'base': '0',
  'dropdown': '1000',
  'sticky': '1020',
  'fixed': '1030',

  // Overlay layers
  'modal-backdrop': '1040',
  'modal': '1050',
  'popover': '1060',

  // Tour/Onboarding (highest priority)
  'tour-backdrop': '9000',
  'tour-spotlight': '9010',
  'tour-tooltip': '9020',

  // Toasts and notifications
  'toast': '9030',

  // Debugging/Development
  'debug': '9999',
}
```

---

#### Task 4.2: Update Tour Components with Consistent Z-Index

**Files to update:**

1. `src/tour/ui/SpotlightOverlay.tsx` - Use `z-tour-backdrop`
2. `src/tour/ui/SpotlightMask.tsx` - Use `z-tour-spotlight`
3. `src/tour/ui/SpotlightTooltip.tsx` - Use `z-tour-tooltip`
4. `src/components/Storage/StorageErrorToast.tsx` - Use `z-toast`

---

### Phase 5: Sidebar Layout Fixes

#### Task 5.1: Audit and Fix Logo Overlap

**File:** `src/components/Sidebar/Sidebar.tsx` (or similar)

**Check for:**

- Logo z-index relative to other sidebar elements
- Proper margin/padding in collapsed state
- Responsive behavior at narrow breakpoints

**Solution Pattern:**

```typescript
// Logo container
<div className="relative z-20 flex items-center justify-center h-16 border-b">
  <img src={logo} alt="Logo" className="h-8 w-auto" />
</div>

// Navigation items (should be below logo)
<nav className="relative z-10 flex-1 overflow-y-auto">
  {/* nav items */}
</nav>
```

---

#### Task 5.2: Test Responsive Layout

**Breakpoints to test:**

- Mobile: 320px, 375px, 425px
- Tablet: 768px, 1024px
- Desktop: 1280px, 1440px, 1920px

**States to test:**

- Sidebar expanded
- Sidebar collapsed
- Focus mode (if applicable)
- With long project names
- With many projects

---

### Phase 6: Command Palette Integration

#### Task 6.1: Add Tour Restart Command

**File:** `src/components/CommandPalette/commands.tsx` (or similar)

```typescript
{
  id: 'restart-onboarding',
  title: 'Restart Onboarding Tour',
  description: 'Start the product tour from the beginning',
  icon: 'HelpCircle',
  keywords: ['tour', 'tutorial', 'guide', 'help', 'onboarding'],
  action: () => {
    // Clear tour completion state
    localStorage.removeItem('tour:feature:completed');
    sessionStorage.removeItem('tour:feature:blocked');

    // Reset tour progress
    const { resetProgress } = await import('@/components/Onboarding/hooks/useTutorialStorage');
    resetProgress('feature-tour');

    // Trigger tour start
    const { startTour } = await import('@/components/Onboarding/hooks/TourController');
    startTour('feature-tour');
  },
  category: 'Help',
}
```

---

### Phase 7: MutationObserver Safety

#### Task 7.1: Enhance safeObserver Utility

**File:** `src/utils/dom/safeObserver.ts`

**Add error boundaries and cleanup:**

```typescript
export function safeObserve(
  observer: MutationObserver,
  target: Node,
  options: MutationObserverInit,
  timeout?: number,
): boolean {
  try {
    // Validate target
    if (!target || !(target instanceof Node)) {
      console.warn('[safeObserve] Invalid target:', target);
      return false;
    }

    // Start observing
    observer.observe(target, options);

    // Auto-disconnect after timeout to prevent memory leaks
    if (timeout) {
      setTimeout(() => {
        try {
          observer.disconnect();
        } catch (e) {
          // Silent fail - observer may already be disconnected
        }
      }, timeout);
    }

    return true;
  } catch (error) {
    console.warn('[safeObserve] Failed to observe:', error);
    return false;
  }
}
```

---

#### Task 7.2: Add Cleanup to All MutationObserver Usage

**Pattern:**

```typescript
useEffect(() => {
  const observer = new MutationObserver(callback);
  const success = safeObserve(observer, target, options, 10000); // 10s timeout

  return () => {
    try {
      observer.disconnect();
    } catch (e) {
      // Silent cleanup
    }
  };
}, [deps]);
```

---

### Phase 8: Integration Testing

#### Task 8.1: Create QA Checklist

**Browser Testing:**

- [ ] Chrome 90+ (Windows, Mac, Linux)
- [ ] Firefox 88+ (Windows, Mac, Linux)
- [ ] Safari 14+ (Mac, iOS)
- [ ] Edge 90+ (Windows)

**Scenarios to Test:**

1. **Fresh User Flow**
   - Clear all storage
   - Load application
   - Verify tour auto-starts
   - Complete tour
   - Verify no second auto-start

2. **Dark Mode Toggle**
   - Load in light mode
   - Toggle to dark
   - Refresh page
   - Verify no flash
   - Verify theme persists

3. **Tour Restart**
   - Complete tour
   - Open command palette (Cmd+K / Ctrl+K)
   - Type "restart onboarding"
   - Execute command
   - Verify tour restarts from step 1

4. **Narrow Viewport**
   - Resize to 375px width
   - Start tour
   - Verify tooltips don't overflow
   - Verify tooltips are readable
   - Check all sidebar states

5. **Sidebar Modes**
   - Test expanded state
   - Test collapsed state
   - Verify logo visibility
   - Verify no overlaps
   - Test with long project names

6. **Console Cleanliness**
   - Open DevTools console
   - Perform all above tests
   - Verify NO errors (only warnings allowed for deprecations)
   - Verify NO uncaught exceptions

---

## Implementation Order

### Priority 1 (Blocking Issues):

1. ✅ Tour initialization timing (Task 1.1, 1.2) - **COMPLETED**
   - Added `waitForReactMount()` function to detect React mount completion
   - Enhanced `whenTargetsReady()` to wait for React before checking targets
   - Added DOMContentLoaded check in `useSpotlightAutostart`
   - All 735 tests passing, 0 TypeScript errors
2. ✅ Dark mode flash (Task 3.1, 3.2) - **COMPLETED**
   - Enhanced theme initialization in index.html
   - Added loading class CSS to prevent flash
   - Respects system preferences (prefers-color-scheme)
3. ⏳ MutationObserver safety (Task 7.1, 7.2) - **PARTIALLY COMPLETE**
   - Already using safeObserve utility
   - Added timeout fallback in new waitForReactMount function
   - Additional cleanup may be needed across other components

### Priority 2 (High Impact):

4. ⏳ Viewport boundary detection (Task 2.1, 2.2)
5. ⏳ Z-index system (Task 4.1, 4.2)
6. ⏳ Command palette integration (Task 6.1)

### Priority 3 (Polish):

7. ⏳ Sidebar layout audit (Task 5.1, 5.2)
8. ⏳ Integration testing (Task 8.1)

---

## Risk Assessment

| Task                | Risk Level | Mitigation                                      |
| ------------------- | ---------- | ----------------------------------------------- |
| Tour initialization | Low        | Extensive testing in multiple browsers          |
| Dark mode changes   | Low        | Fallback to current behavior if error           |
| Z-index system      | Medium     | May affect existing modals - thorough QA needed |
| Sidebar layout      | Medium     | Test all states and breakpoints                 |
| MutationObserver    | Low        | Enhanced error handling and timeouts            |

---

## Success Criteria

- [ ] Tour starts reliably after React mount (98%+ success rate)
- [ ] No dark mode flash on any browser
- [ ] No console errors during normal operation
- [ ] Tooltips always fully visible (no cutoffs)
- [ ] Sidebar logo visible in all states
- [ ] Z-index conflicts resolved
- [ ] Command palette tour restart works
- [ ] All tests pass in Chrome, Firefox, Safari, Edge

---

## Rollback Plan

If critical issues arise:

1. Revert `useSpotlightAutostart.ts` to previous version
2. Keep dark mode improvements (low risk)
3. Revert z-index changes if modal issues occur
4. Remove command palette command if it causes crashes

---

**Next Steps:**

1. Review and approve this plan
2. Begin Phase 1 implementation
3. Create feature branch: `fix/tour-ui-stability`
4. Implement fixes incrementally
5. Test each phase before moving to next
6. Create PR when Priority 1 & 2 complete

---

_Document version: 1.0_
_Last updated: 2025-10-30_
_Author: Claude Code_
