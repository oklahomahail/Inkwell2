# Tour Debugging Guide

## Quick Diagnostic Steps

### 1. Check if Tour Portal is Created

Open DevTools Console and run:

```javascript
document.getElementById('spotlight-root');
```

Should return a `<div>` element. If null, the portal isn't being created.

### 2. Check if Tour Event is Firing

Open DevTools Console and run:

```javascript
window.addEventListener('inkwell:start-tour', (e) => {
  console.log('Tour start event received:', e.detail);
});
```

Then click "Start Tour". You should see the event logged.

### 3. Check TourService State

Open DevTools Console and run:

```javascript
window.inkwellTour?.isAvailable('spotlight');
```

Should return `true`. If undefined, tours aren't registered.

### 4. Check for Click Blocking Elements

In DevTools Elements panel, select the "Start Tour" or "New Project" button, then in Console run:

```javascript
const btn = $0; // Uses current selected element
const rect = btn.getBoundingClientRect();
const topElement = document.elementFromPoint(
  rect.left + rect.width / 2,
  rect.top + rect.height / 2,
);
console.log('Top element at button center:', topElement);
console.log('Is it the button?', topElement === btn);
```

If `topElement` is not the button, something is blocking clicks.

### 5. Check Z-Index Stack

```javascript
const elements = ['#root', '.Topbar', '.MainPane', '#spotlight-root'];
elements.forEach((selector) => {
  const el = document.querySelector(selector);
  if (el) {
    const style = getComputedStyle(el);
    console.log(`${selector}:`, {
      zIndex: style.zIndex,
      position: style.position,
      pointerEvents: style.pointerEvents,
      overflow: style.overflow,
    });
  }
});
```

Expected values:

- `#spotlight-root`: z-index: 10000, position: fixed, pointerEvents: none
- `.Topbar`: z-index: 30, position: sticky
- `.MainPane`: z-index: 40, position: relative

### 6. Clear Crash Shield

If tour won't start, clear the crash shield state:

```javascript
sessionStorage.removeItem('inkwell:tour:crash-shield');
```

### 7. Force Tour Start

Bypass the normal flow and force start the tour:

```javascript
window.InkwellTour?.start('spotlight', { restart: true, source: 'debug' });
```

## Common Issues & Fixes

### Issue: Tour doesn't appear after clicking "Start Tour"

**Possible Causes:**

1. Crash shield is blocking it
2. Event listener not registered
3. Portal not created
4. Tour steps are empty

**Fix:**

```javascript
// Clear crash shield
sessionStorage.removeItem('inkwell:tour:crash-shield');

// Check registration
console.log('Tours registered:', window.InkwellTour);

// Force start
window.dispatchEvent(
  new CustomEvent('inkwell:start-tour', {
    detail: { tourId: 'spotlight', opts: { restart: true } },
  }),
);
```

### Issue: Tour appears but is hidden behind topbar

**Possible Causes:**

1. Z-index too low
2. Portal z-index not set correctly

**Fix:**
The CSS has been updated to ensure proper stacking. Check in DevTools:

```javascript
const portal = document.getElementById('spotlight-root');
console.log('Portal z-index:', getComputedStyle(portal).zIndex); // Should be 10000
```

### Issue: Buttons don't respond to clicks

**Possible Causes:**

1. An overlay is blocking clicks
2. Button is disabled
3. Event handler not attached

**Fix:**
Check for blocking elements (see step 4 above), then:

```javascript
// Check if button is disabled
const btn = document.querySelector('[data-test="new-project"]');
console.log('Button disabled:', btn?.disabled, btn?.getAttribute('aria-disabled'));

// Check for overlays
document.querySelectorAll('.backdrop, .overlay-gradient, .tour-backdrop').forEach((el) => {
  console.log(el.className, getComputedStyle(el).pointerEvents);
});
```

## Button Click Test Script

Paste this in the browser console to diagnose button click issues:

```javascript
// Button Click Diagnostic Script
console.log('=== INKWELL BUTTON DIAGNOSTIC ===\n');

// 1. Find the buttons
const createFirstBtn = document.querySelector('[data-test="create-first-project"]');
const newProjectBtn = document.querySelector('[data-test="new-project"]');

console.log('1. Button Elements:');
console.log('  Create First Project:', createFirstBtn);
console.log('  New Project:', newProjectBtn);

// 2. Test which one is visible
const testBtn = createFirstBtn || newProjectBtn;
if (!testBtn) {
  console.error('❌ NO BUTTONS FOUND!');
} else {
  console.log('\n2. Button Properties:');
  console.log('  Disabled:', testBtn.disabled);
  console.log('  Aria-disabled:', testBtn.getAttribute('aria-disabled'));
  console.log('  Has onClick:', testBtn.onclick !== null);

  // 3. Get position and check what's on top
  const rect = testBtn.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const topElement = document.elementFromPoint(centerX, centerY);

  console.log('\n3. Click Detection:');
  console.log('  Button rect:', {
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
  });
  console.log('  Center point:', { x: centerX, y: centerY });
  console.log('  Top element at center:', topElement);
  console.log('  Is it the button?', topElement === testBtn);

  if (topElement !== testBtn) {
    console.warn('⚠️  CLICK BLOCKER DETECTED!');
    console.log('  Blocking element:', {
      tagName: topElement.tagName,
      className: topElement.className,
      id: topElement.id,
      zIndex: getComputedStyle(topElement).zIndex,
      pointerEvents: getComputedStyle(topElement).pointerEvents,
    });
  }

  // 4. Check z-index stack
  console.log('\n4. Z-Index Stack:');
  const elements = {
    '#root': document.querySelector('#root'),
    '.Topbar': document.querySelector('.Topbar'),
    '.main-content': document.querySelector('.main-content'),
    '#spotlight-root': document.getElementById('spotlight-root'),
    button: testBtn,
  };

  Object.entries(elements).forEach(([name, el]) => {
    if (el) {
      const style = getComputedStyle(el);
      console.log(`  ${name}:`, {
        zIndex: style.zIndex,
        position: style.position,
        pointerEvents: style.pointerEvents,
        overflow: style.overflow,
      });
    } else {
      console.log(`  ${name}: NOT FOUND`);
    }
  });

  // 5. Test click
  console.log('\n5. Attempting programmatic click...');
  try {
    testBtn.click();
    console.log('✅ Click executed (check if modal opened)');
  } catch (error) {
    console.error('❌ Click failed:', error);
  }
}

console.log('\n=== END DIAGNOSTIC ===');
```

### Expected Good Output:

```
=== INKWELL BUTTON DIAGNOSTIC ===

1. Button Elements:
  Create First Project: <button...>  (or null if projects exist)
  New Project: <button...>

2. Button Properties:
  Disabled: false
  Aria-disabled: null
  Has onClick: true

3. Click Detection:
  Button rect: { top: ..., left: ..., width: ..., height: ... }
  Center point: { x: ..., y: ... }
  Top element at center: <button...>
  Is it the button? true  ✅

4. Z-Index Stack:
  #root: { zIndex: "auto", position: "static", pointerEvents: "auto", overflow: "visible" }
  .Topbar: { zIndex: "30", position: "sticky", pointerEvents: "auto", overflow: "visible" }
  .main-content: { zIndex: "40", position: "relative", pointerEvents: "auto", overflow: "visible" }
  #spotlight-root: { zIndex: "10000", position: "fixed", pointerEvents: "none", overflow: "visible" }
  button: { zIndex: "auto", position: "static", pointerEvents: "auto", overflow: "visible" }

5. Attempting programmatic click...
✅ Click executed (check if modal opened)

=== END DIAGNOSTIC ===
```

### Bad Output Examples:

If you see:

```
⚠️  CLICK BLOCKER DETECTED!
  Blocking element: { tagName: "DIV", className: "backdrop", ... }
```

Then something is intercepting clicks.

## Manual Test Checklist

- [ ] Click "Start Tour" in welcome modal
- [ ] Tour overlay appears with dark backdrop
- [ ] Tooltip is visible and positioned correctly
- [ ] Tooltip is above the topbar (not clipped)
- [ ] Can click "Next" button in tooltip
- [ ] Can click "Skip" button
- [ ] Can press ESC to close tour
- [ ] Can press Arrow keys to navigate
- [ ] After skipping/completing, tour doesn't reappear
- [ ] Can restart tour from Help menu

## Developer Mode Settings

In development, the crash shield is disabled. To enable it for testing:

```typescript
// In crashShield.ts, temporarily change:
const CRASH_SHIELD_ENABLED = true; // Instead of import.meta.env.PROD
```

## Logging

All tour-related components log to console with prefixes:

- `[OnboardingUI]` - Welcome modal and tour trigger
- `[useSpotlightUI]` - Tour state management
- `[TourService]` - Tour lifecycle
- `[SpotlightPortal]` - Portal creation
- `[TourLauncher]` - Tour registration and launch

Enable verbose logging:

```javascript
localStorage.setItem('debug', 'inkwell:*');
```

## Reset Everything

To completely reset the tour state:

```javascript
// Clear all tour-related storage
sessionStorage.removeItem('inkwell:tour:crash-shield');
localStorage.removeItem('inkwell-tour-progress-preferences');
localStorage.removeItem('inkwell:firstRunShown');
localStorage.removeItem('hideWelcome');

// Reload
location.reload();
```
