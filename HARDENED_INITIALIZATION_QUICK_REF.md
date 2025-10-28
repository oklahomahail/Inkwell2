# Hardened Initialization - Quick Reference

**For developers working on Inkwell initialization, tours, and theme management.**

---

## When to Use What

### Root Mounting

**Always** use `waitForRoot()` when mounting React:

```typescript
import { waitForRoot } from '@/utils/dom/waitForRoot';
import { createRoot } from 'react-dom/client';

waitForRoot().then(root => {
  createRoot(root).render(<App />);
});
```

**Why?** Prevents race conditions with DOMContentLoaded.

---

### MutationObserver

**Always** use `safeObserve()` when creating observers:

```typescript
import { safeObserve, safeDisconnect } from '@/utils/dom/safeObserver';

// Instead of:
// const observer = new MutationObserver(callback);

// Do this:
const observer = safeObserve(
  targetElement,
  (mutations) => {
    // handle mutations
  },
  { childList: true, subtree: true },
);

// Cleanup:
useEffect(() => {
  return () => safeDisconnect(observer);
}, []);
```

**Why?** Prevents crashes from rapid DOM mutations.

---

### Theme Management

**Use** `theme.ts` utilities for all theme operations:

```typescript
import { initTheme, setTheme, toggleTheme, isDarkMode } from '@/utils/theme';

// Initialize on app start (already done in index.html)
initTheme();

// Set theme
setTheme('dark');

// Toggle theme
toggleTheme();

// Check current theme
if (isDarkMode()) {
  // dark mode active
}
```

**Rules:**

- ✅ Always default to light theme
- ✅ Only add `.dark` class, never `.light`
- ✅ Handle localStorage failures gracefully

---

### Tour Autostart

**Use** the hardened hook for tour autostart:

```typescript
import { useSpotlightAutostart } from '@/components/Onboarding/hooks/useSpotlightAutostartHardened';

export function MyTourIntegration() {
  useSpotlightAutostart(
    ['[data-tour="step1"]', '[data-tour="step2"]'], // Required anchors
    {
      tourId: 'my-tour',
      onStartTour: () => startMyTour(),
      shouldStart: () => !hasCompletedTour('my-tour'),
      excludedPaths: ['/settings'],
      dashboardPath: '/dashboard',
    },
  );

  return null;
}
```

**Why?** Waits for anchors before starting, handles retries, prevents double-start.

---

### Waiting for DOM Elements

**Use** `waitForAnchors()` when you need elements to exist:

```typescript
import { waitForAnchors, waitForAnchor } from '@/tour/anchors';

// Wait for multiple elements
const ready = await waitForAnchors(['[data-tour="step1"]', '[data-tour="step2"]'], {
  timeout: 3000,
});

if (ready) {
  // All elements exist, safe to proceed
}

// Wait for single element
const element = await waitForAnchor('[data-tour="step1"]', { timeout: 2000 });
if (element) {
  // Element exists
}
```

**Why?** Prevents null reference errors from missing elements.

---

## Common Patterns

### Pattern: Safe Initialization

```typescript
// ❌ BAD - Might race with DOM ready
document.addEventListener('DOMContentLoaded', () => {
  const root = document.getElementById('root');
  createRoot(root!).render(<App />);
});

// ✅ GOOD - Uses waitForRoot
waitForRoot().then(root => {
  createRoot(root).render(<App />);
});
```

### Pattern: Safe Observer

```typescript
// ❌ BAD - Can crash on rapid mutations
const observer = new MutationObserver(callback);
observer.observe(element, options);

// ✅ GOOD - Protected observer
const observer = safeObserve(element, callback, options);
useEffect(() => () => safeDisconnect(observer), []);
```

### Pattern: Theme Toggle Button

```typescript
import { toggleTheme, isDarkMode } from '@/utils/theme';

export function ThemeToggle() {
  const [dark, setDark] = useState(isDarkMode());

  const handleToggle = () => {
    toggleTheme();
    setDark(isDarkMode());
  };

  return (
    <button onClick={handleToggle}>
      {dark ? '🌙' : '☀️'}
    </button>
  );
}
```

### Pattern: Tour with Anchor Check

```typescript
import { waitForAnchors } from '@/tour/anchors';
import { startTour } from '@/tour';

async function launchTour() {
  const ready = await waitForAnchors(['[data-tour="step1"]', '[data-tour="step2"]']);

  if (!ready) {
    console.warn('Tour anchors not ready');
    return;
  }

  startTour('my-tour');
}
```

---

## Testing Checklist

Before deploying initialization changes:

- [ ] Unit tests pass for all utilities
- [ ] Component tests pass for hooks
- [ ] E2E tests pass (theme, tour, root)
- [ ] No theme flash in Chrome/Safari/Firefox
- [ ] Tour starts correctly on dashboard
- [ ] Private browsing works (no localStorage errors)
- [ ] React StrictMode doesn't cause double-starts
- [ ] Lighthouse score >= 90
- [ ] No console errors on fresh load

---

## Debugging

### Theme Issues

```typescript
// Check current theme state
console.log('Dark mode:', isDarkMode());
console.log('localStorage theme:', localStorage.getItem('theme'));
console.log('Has .dark class:', document.documentElement.classList.contains('dark'));

// Verify theme script ran
console.log('Theme script exists:', !!document.getElementById('THEME_INIT'));
```

### Tour Issues

```typescript
// Enable tour debug logs (set in .env.development)
import.meta.env.DEV = true;

// Check if anchors are ready
import { anchorsReady } from '@/tour/anchors';
console.log('Anchors ready:', anchorsReady(['[data-tour="step1"]', '[data-tour="step2"]']));

// Check tour completion status
console.log('Tour completed:', localStorage.getItem('tour:my-tour:completed'));
```

### Observer Issues

```typescript
// Check active observers (dev only)
console.log('Active observers:', window.__activeObservers?.size || 0);

// Manually trigger observer cleanup
import { safeDisconnect } from '@/utils/dom/safeObserver';
safeDisconnect(observer); // Safe to call multiple times
```

---

## Migration Guide

### Migrating Existing Observers

```typescript
// OLD CODE:
const observer = new MutationObserver((mutations) => {
  handleMutations(mutations);
});
observer.observe(element, { childList: true });

// Cleanup
useEffect(() => {
  return () => observer.disconnect();
}, []);

// NEW CODE:
import { safeObserve, safeDisconnect } from '@/utils/dom/safeObserver';

const observer = safeObserve(element, (mutations) => handleMutations(mutations), {
  childList: true,
});

useEffect(() => {
  return () => safeDisconnect(observer);
}, []);
```

### Migrating Tour Autostart

```typescript
// OLD CODE:
useEffect(() => {
  if (hasStarted) return;

  setTimeout(() => {
    startTour('my-tour');
    setHasStarted(true);
  }, 1000);
}, []);

// NEW CODE:
import { useSpotlightAutostart } from '@/components/Onboarding/hooks/useSpotlightAutostartHardened';

useSpotlightAutostart(['[data-tour="anchor"]'], {
  tourId: 'my-tour',
  onStartTour: () => startTour('my-tour'),
});
```

---

## Performance Tips

1. **Use RAF for visual updates:**

   ```typescript
   requestAnimationFrame(() => {
     updateUI();
   });
   ```

2. **Use microtasks for state updates:**

   ```typescript
   queueMicrotask(() => {
     setState(newValue);
   });
   ```

3. **Debounce rapid events:**

   ```typescript
   import { debounce } from 'lodash-es';
   const handleResize = debounce(() => {
     // handle resize
   }, 100);
   ```

4. **Use timeout for anchor waiting:**
   ```typescript
   const ready = await waitForAnchors(selectors, {
     timeout: 2000, // Don't wait forever
     pollInterval: 50, // Check frequently
   });
   ```

---

## Common Mistakes

### ❌ Don't: Access DOM during module evaluation

```typescript
// BAD - Runs at import time
const root = document.getElementById('root');
export default root;

// GOOD - Runs when called
export function getRoot() {
  return document.getElementById('root');
}
```

### ❌ Don't: Assume elements exist

```typescript
// BAD
const button = document.querySelector('[data-tour="button"]');
button.addEventListener('click', handler); // null reference!

// GOOD
const button = document.querySelector('[data-tour="button"]');
if (button) {
  button.addEventListener('click', handler);
}
```

### ❌ Don't: Forget to cleanup observers

```typescript
// BAD - Memory leak
useEffect(() => {
  const observer = safeObserve(element, callback, options);
  // No cleanup!
}, []);

// GOOD
useEffect(() => {
  const observer = safeObserve(element, callback, options);
  return () => safeDisconnect(observer);
}, []);
```

### ❌ Don't: Add .light class

```typescript
// BAD
if (theme === 'light') {
  document.documentElement.classList.add('light');
}

// GOOD
if (theme === 'dark') {
  document.documentElement.classList.add('dark');
} else {
  document.documentElement.classList.remove('dark');
}
```

---

## Resources

- **Implementation Summary:** `/HARDENED_INITIALIZATION_SUMMARY.md`
- **Test Files:**
  - `/src/utils/dom/__tests__/`
  - `/src/tour/__tests__/`
  - `/tests/e2e/`
- **Source Files:**
  - `/src/utils/dom/waitForRoot.ts`
  - `/src/utils/dom/safeObserver.ts`
  - `/src/utils/theme.ts`
  - `/src/tour/anchors.ts`
  - `/src/components/Onboarding/hooks/useSpotlightAutostartHardened.ts`

---

**Questions?** Check the implementation summary or ask in #engineering.
