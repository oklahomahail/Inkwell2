# Common Tour Implementation Pitfalls & Solutions

## Overview

This guide covers common issues when implementing tours and how to avoid them.

---

## 🚨 Critical Pitfalls

### 1. Anchors Hidden Behind Portals or Modals

**Problem:** Tour tries to highlight an element that's inside a React portal or closed modal.

**Symptom:** Tour step skips automatically or shows spotlight in wrong location.

**Example:**

```tsx
// ❌ BAD: Export template is inside a modal that's not open yet
{
  target: '[data-tour-id="export-template"]', // Inside closed modal
  title: 'Choose Template',
}
```

**Solutions:**

#### Option A: Auto-open the modal/panel

```tsx
// ✅ GOOD: Open modal before highlighting content inside it
{
  target: '[data-tour-id="export-open"]',
  title: 'Export Your Work',
  onNext: async () => {
    const exportButton = document.querySelector('[data-tour-id="export-open"]');
    exportButton?.click();
    await new Promise(resolve => setTimeout(resolve, 300)); // Wait for modal
  },
},
{
  target: '[data-tour-id="export-template"]', // Now modal is open
  title: 'Choose Template',
}
```

#### Option B: Point to the toggle first

```tsx
// ✅ GOOD: Highlight the button that opens the modal
{
  target: '[data-tour-id="assistant-toggle"]',
  title: 'AI Assistant Panel',
  content: 'Click here to open the AI assistant panel.',
  placement: 'left',
},
// Then in next step, assume user clicked it
{
  target: '[data-tour-id="assistant-content"]',
  title: 'AI Tools',
  beforeShow: async () => {
    // Ensure panel is open
    if (!document.querySelector('[data-tour-id="assistant-content"]')) {
      document.querySelector('[data-tour-id="assistant-toggle"]')?.click();
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  },
}
```

#### Option C: Use conditionally rendered fallback

```tsx
// ✅ GOOD: Multiple selectors with fallback
{
  target: () => {
    // Try to find the element inside modal first
    const inModal = document.querySelector('[data-tour-id="export-template"]');
    if (inModal) return inModal;

    // Fallback to the button that opens the modal
    return document.querySelector('[data-tour-id="export-open"]');
  },
  title: 'Export Options',
  content: 'Open the export menu to see template options.',
}
```

---

### 2. Z-Index Clashes

**Problem:** Tour overlay appears behind app header, modals, or sticky elements.

**Symptom:** Tour tooltip is partially hidden or completely invisible.

**Diagnosis:**

```javascript
// Check z-index of tour overlay
const overlay = document.querySelector('[role="dialog"][aria-label="Product tour"]');
console.log(window.getComputedStyle(overlay).zIndex); // Should be 9999

// Find elements with higher z-index
Array.from(document.querySelectorAll('*'))
  .map((el) => ({ el, z: window.getComputedStyle(el).zIndex }))
  .filter(({ z }) => parseInt(z) > 9999)
  .forEach(({ el, z }) => console.log(z, el));
```

**Solutions:**

#### Solution 1: Ensure tour portal is at end of body

```tsx
// ✅ In your app root (App.tsx or _app.tsx)
export default function App() {
  return (
    <>
      {/* Your app content */}
      <MainContent />

      {/* Tour portal should be LAST in body */}
      <div id="spotlight-root" style={{ position: 'relative', zIndex: 9999 }} />
    </>
  );
}
```

#### Solution 2: Use CSS variable for z-index management

```css
/* globals.css or tailwind.config.js */
:root {
  --z-header: 1000;
  --z-modal: 5000;
  --z-tooltip: 8000;
  --z-tour: 9999;
}

/* Tour overlay */
.tour-overlay {
  z-index: var(--z-tour);
}
```

#### Solution 3: Temporarily lower competing z-indexes

```tsx
// In TourService.start()
start(config: TourConfig) {
  // ...existing code...

  // Lower z-index of potentially competing elements
  const header = document.querySelector('header');
  if (header) {
    header.dataset.originalZIndex = window.getComputedStyle(header).zIndex;
    header.style.zIndex = '1000';
  }

  // Restore on tour end
  this.onCleanup.push(() => {
    if (header?.dataset.originalZIndex) {
      header.style.zIndex = header.dataset.originalZIndex;
      delete header.dataset.originalZIndex;
    }
  });
}
```

---

### 3. Focus Outlines Removed

**Problem:** `outline: none` or `focus:outline-none` without replacement ring.

**Symptom:** Keyboard users can't see which button is focused.

**Example:**

```css
/* ❌ BAD: Removes outline without replacement */
button:focus {
  outline: none;
}
```

**Solutions:**

#### Solution 1: Use visible focus ring

```tsx
// ✅ GOOD: Explicit focus ring
<button className="focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2">
  Next
</button>
```

#### Solution 2: Use focus-visible for mouse vs keyboard

```css
/* ✅ GOOD: Only show focus ring for keyboard users */
button:focus-visible {
  outline: 2px solid var(--color-blue-500);
  outline-offset: 2px;
}

button:focus:not(:focus-visible) {
  outline: none;
}
```

#### Solution 3: Check contrast ratios

```typescript
// Ensure 3:1 contrast minimum for focus indicators (WCAG 2.1 AA)
// Test with browser DevTools or:
const button = document.querySelector('button');
const bgColor = window.getComputedStyle(button).backgroundColor;
const ringColor = 'rgb(59, 130, 246)'; // blue-500

// Use contrast checker: https://webaim.org/resources/contrastchecker/
```

---

### 4. Conditionally Rendered Elements

**Problem:** Element exists sometimes but not always (route-based, feature-flagged, etc.)

**Symptom:** Tour works in dev but fails in production or for some users.

**Example:**

```tsx
// ❌ BAD: Element only renders on specific route
{
  isWritingRoute && <div data-tour-id="writing-panel">...</div>;
}

// Tour tries to highlight it on dashboard route → fails
```

**Solutions:**

#### Solution 1: Route-aware tour steps

```tsx
// ✅ GOOD: Check route before showing step
{
  target: '[data-tour-id="writing-panel"]',
  title: 'Writing Panel',
  beforeShow: async () => {
    const currentPath = window.location.pathname;
    if (!currentPath.includes('/writing')) {
      // Navigate to correct route
      await router.push('/writing');
      // Wait for render
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  },
}
```

#### Solution 2: Skip missing elements

```tsx
// Configure tour to skip missing anchors
tourService.configure({
  skipMissingAnchors: true  // Already implemented in TourService
});

// Or check before advancing
{
  target: '[data-tour-id="optional-feature"]',
  title: 'Optional Feature',
  beforeShow: () => {
    const exists = document.querySelector('[data-tour-id="optional-feature"]');
    if (!exists) {
      // Skip this step
      tourService.next();
      return Promise.reject('Element not available');
    }
  },
}
```

#### Solution 3: Feature flag aware

```tsx
// ✅ GOOD: Only include step if feature is enabled
const aiSteps = featureFlags.aiAssistant
  ? [
      {
        target: '[data-tour-id="ai-panel"]',
        title: 'AI Assistant',
      },
    ]
  : [];

export const tourConfig: TourConfig = {
  id: 'my-tour',
  steps: [
    ...coreSteps,
    ...aiSteps, // Conditionally included
  ],
};
```

---

## ⚠️ Common Issues

### 5. Dynamic IDs or Selectors

**Problem:** Tour targets change between renders.

**Example:**

```tsx
// ❌ BAD: ID changes every render
<div data-tour-id={`step-${uuid()}`}>...</div>

// ❌ BAD: Element position changes
<div data-tour-id="first-project">...</div> // Might be 2nd or 3rd after sort
```

**Solutions:**

```tsx
// ✅ GOOD: Stable, semantic IDs
<div data-tour-id="project-list">...</div>
<div data-tour-id="create-project-button">...</div>

// ✅ GOOD: Function-based selector for dynamic content
{
  target: () => {
    // Always find the first visible project
    const projects = document.querySelectorAll('[data-project-card]');
    return projects[0] || null;
  },
  title: 'Your First Project',
}
```

---

### 6. Race Conditions with Async Rendering

**Problem:** Element exists when tour starts but disappears during step transition.

**Symptom:** Spotlight jumps or flickers, step skips unexpectedly.

**Example:**

```tsx
// ❌ BAD: Component unmounts during transition
useEffect(() => {
  if (isLoading) return null; // Unmounts all children
  return <div data-tour-id="content">...</div>;
}, [isLoading]);
```

**Solutions:**

#### Solution 1: Wait for stability

```tsx
// ✅ GOOD: Wait for loading to complete
{
  target: '[data-tour-id="content"]',
  title: 'Content Panel',
  beforeShow: async () => {
    // Wait for loading state to resolve
    while (document.querySelector('[data-loading]')) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    // Extra buffer for render
    await new Promise(resolve => setTimeout(resolve, 200));
  },
}
```

#### Solution 2: Keep elements mounted

```tsx
// ✅ GOOD: Hide instead of unmount
<div data-tour-id="content" className={isLoading ? 'opacity-0' : 'opacity-100'}>
  {/* Content always in DOM */}
</div>
```

---

### 7. Mobile Viewport Issues

**Problem:** Tooltip doesn't fit on small screens, or anchor is off-screen.

**Symptom:** Tooltip cut off, spotlight incorrect, or step unusable on mobile.

**Solutions:**

#### Solution 1: Responsive placement

```tsx
// ✅ GOOD: Auto placement adjusts to viewport
{
  target: '[data-tour-id="sidebar"]',
  title: 'Navigation',
  placement: 'auto', // Will choose best position
}
```

#### Solution 2: Mobile-specific tours

```tsx
// ✅ GOOD: Different tours for mobile
const isMobile = window.innerWidth < 768;
const tourConfig = isMobile ? mobileTourConfig : desktopTourConfig;

tourService.start(tourConfig);
```

#### Solution 3: Scroll anchor into view

```tsx
// ✅ GOOD: Ensure anchor is visible
{
  target: '[data-tour-id="footer-links"]',
  title: 'Footer Navigation',
  beforeShow: async () => {
    const element = document.querySelector('[data-tour-id="footer-links"]');
    element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    await new Promise(resolve => setTimeout(resolve, 500));
  },
}
```

---

### 8. LocalStorage Quota Exceeded

**Problem:** Analytics events fill localStorage, causing errors.

**Symptom:** `QuotaExceededError` in console, analytics stop working.

**Diagnosis:**

```javascript
// Check localStorage usage
const used = JSON.stringify(localStorage).length;
const limit = 5 * 1024 * 1024; // ~5MB typical limit
console.log(`Used: ${(used / 1024).toFixed(2)} KB / ${(limit / 1024).toFixed(0)} KB`);
```

**Solutions:**

#### Solution 1: Already implemented - event limit

```typescript
// ✅ In analyticsAdapter.ts - keeps last 5000 events
function persistEvent(event: TourEvent): void {
  try {
    const key = 'analytics.tour.events';
    const prev = JSON.parse(localStorage.getItem(key) || '[]');
    prev.push(event);
    localStorage.setItem(key, JSON.stringify(prev.slice(-5000))); // ✅ FIFO
  } catch (error) {
    console.warn('[TourAnalytics] Failed to persist event:', error);
  }
}
```

#### Solution 2: Compression

```typescript
// ✅ GOOD: Compress events before storing
import { compress, decompress } from 'lz-string';

function persistEvent(event: TourEvent): void {
  const prev = JSON.parse(decompress(localStorage.getItem(key) || '') || '[]');
  prev.push(event);
  const compressed = compress(JSON.stringify(prev.slice(-5000)));
  localStorage.setItem(key, compressed);
}
```

#### Solution 3: Periodic cleanup

```typescript
// ✅ GOOD: Auto-cleanup old events
function cleanupOldEvents() {
  const events = JSON.parse(localStorage.getItem('analytics.tour.events') || '[]');
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recent = events.filter((e) => e.ts > oneWeekAgo);
  localStorage.setItem('analytics.tour.events', JSON.stringify(recent));
}

// Run on app start
cleanupOldEvents();
```

---

## 🎯 Best Practices

### Testing Checklist

Before deploying tours, test these scenarios:

```typescript
// Test script you can run in browser console
const tourTests = {
  // 1. All anchors exist
  checkAnchors() {
    const tourIds = ['export-open', 'export-template', 'export-run'];
    tourIds.forEach((id) => {
      const el = document.querySelector(`[data-tour-id="${id}"]`);
      console.log(`${id}: ${el ? '✅' : '❌ MISSING'}`);
    });
  },

  // 2. Z-index hierarchy
  checkZIndex() {
    const tour = document.querySelector('[role="dialog"][aria-label="Product tour"]');
    const tourZ = parseInt(window.getComputedStyle(tour).zIndex);
    const elements = ['header', '.modal', '.dropdown'];
    elements.forEach((sel) => {
      const el = document.querySelector(sel);
      if (el) {
        const z = parseInt(window.getComputedStyle(el).zIndex);
        console.log(`${sel}: ${z} ${z < tourZ ? '✅' : '❌ TOO HIGH'}`);
      }
    });
  },

  // 3. Focus trap works
  checkFocusTrap() {
    const buttons = document.querySelectorAll('[role="dialog"] button');
    console.log(`Focusable buttons: ${buttons.length}`);
    buttons[0]?.focus();
    console.log("Tab through and verify focus doesn't escape");
  },

  // 4. Analytics events
  checkAnalytics() {
    const events = JSON.parse(localStorage.getItem('analytics.tour.events') || '[]');
    console.log(`Total events: ${events.length}`);
    console.log(
      `Types:`,
      events.reduce((acc, e) => {
        acc[e.type] = (acc[e.type] || 0) + 1;
        return acc;
      }, {}),
    );
  },
};

// Run all tests
Object.values(tourTests).forEach((test) => test());
```

### Development Utilities

```typescript
// Add to window for debugging (dev only)
if (import.meta.env.DEV) {
  window.tourDebug = {
    highlightAnchors() {
      document.querySelectorAll('[data-tour-id]').forEach((el) => {
        el.style.outline = '3px solid red';
        el.style.outlineOffset = '2px';
      });
    },

    clearHighlights() {
      document.querySelectorAll('[data-tour-id]').forEach((el) => {
        el.style.outline = '';
      });
    },

    listAnchors() {
      const anchors = Array.from(document.querySelectorAll('[data-tour-id]'));
      return anchors.map((el) => ({
        id: el.getAttribute('data-tour-id'),
        visible: el.offsetParent !== null,
        tag: el.tagName,
        text: el.textContent?.slice(0, 50),
      }));
    },

    testTour(tourKey: string) {
      const cfg = getTourConfig(tourKey);
      resetTour(cfg.id);
      tourService.start(cfg, { forceRestart: true });
    },
  };
}
```

---

## 📋 Pre-Deployment Checklist

- [ ] All tour anchors have stable `data-tour-id` attributes
- [ ] Anchors exist when tour step shows (not in closed modals/portals)
- [ ] Tour overlay z-index (9999) is higher than all app elements
- [ ] Focus outlines visible on all tour buttons
- [ ] Tab trap works (focus cycles within tooltip)
- [ ] ESC key closes tour
- [ ] Screen reader announces step changes
- [ ] Mobile viewport tested (tooltip fits, anchors visible)
- [ ] localStorage quota checked (events cleanup working)
- [ ] Tested with React DevTools (no unmount during transitions)
- [ ] Analytics events persisting correctly
- [ ] Tour can be restarted multiple times
- [ ] Tested in Chrome, Firefox, Safari
- [ ] Tested with keyboard only (no mouse)
- [ ] Tested with screen reader (VoiceOver/NVDA)

---

## 🆘 Quick Fixes

### Tour won't start

```javascript
// Check if tour service is initialized
console.log(window.inkwellTour); // Should be TourService instance

// Check if config is valid
const config = getTourConfig('ai-tools');
console.log(config.steps.length); // Should be > 0

// Force restart
tourService.start(config, { forceRestart: true });
```

### Step skips immediately

```javascript
// Check if anchor exists
const step = config.steps[0];
const anchor = document.querySelector(step.target);
console.log('Anchor:', anchor); // Should not be null

// Check if anchor is visible
console.log('Visible:', anchor?.offsetParent !== null);
```

### Tooltip appears in wrong position

```javascript
// Check spotlight overlay positioning
const mask = document.querySelector('[data-spotlight-mask]');
const tooltip = document.querySelector('[role="dialog"]');
console.log('Mask:', mask?.getBoundingClientRect());
console.log('Tooltip:', tooltip?.getBoundingClientRect());
```

### Analytics not saving

```javascript
// Check localStorage available
try {
  localStorage.setItem('test', 'test');
  localStorage.removeItem('test');
  console.log('✅ localStorage available');
} catch (e) {
  console.log('❌ localStorage blocked:', e);
}

// Check quota
navigator.storage?.estimate().then(({ usage, quota }) => {
  console.log(
    `Using ${(usage / 1024 / 1024).toFixed(2)} MB of ${(quota / 1024 / 1024).toFixed(2)} MB`,
  );
});
```

---

**Last Updated:** October 27, 2025  
**See also:** TOUR_A11Y_ANALYTICS_VARIANTS.md, TOUR_DATA_ATTRIBUTES.md
