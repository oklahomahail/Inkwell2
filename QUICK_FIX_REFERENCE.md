# Quick Reference: Button & Tour Issues

## 🔍 Is a button not working?

**Paste in console:**

```javascript
const b = document.querySelector('[data-test="new-project"]'); // or "create-first-project"
const r = b?.getBoundingClientRect();
const top = r && document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
console.log(top === b ? '✅ Button clickable' : '❌ Blocked by:', top);
```

**If blocked, check:**

1. `getComputedStyle(top).pointerEvents` should be "none" for overlays
2. `getComputedStyle(top).zIndex` - make sure it's not blocking

**Quick fix:** Add to index.css:

```css
.blocking-element {
  pointer-events: none !important;
}
```

## 🎯 Is the tour not showing?

**Paste in console:**

```javascript
console.log({
  'Portal exists': !!document.getElementById('spotlight-root'),
  'Tours registered': !!window.InkwellTour,
  'Crash shield active': sessionStorage.getItem('inkwell:tour:crash-shield'),
});
```

**Expected:**

```javascript
{
  'Portal exists': true,
  'Tours registered': true,
  'Crash shield active': null
}
```

**If portal missing:** Check console for SpotlightPortal errors

**If crash shield active:**

```javascript
sessionStorage.removeItem('inkwell:tour:crash-shield');
location.reload();
```

## 🚫 Is the tour clipped by the header?

**Check z-indexes:**

```javascript
['#spotlight-root', '.Topbar', '.main-content'].forEach((s) => {
  const el = document.querySelector(s);
  console.log(s, getComputedStyle(el)?.zIndex);
});
```

**Expected:**

```
#spotlight-root 10000
.Topbar 30
.main-content 40
```

**If wrong:** Values should be Tour > Content > Topbar

## 🔄 Reset everything

```javascript
// Clear all tour state
sessionStorage.clear();
localStorage.removeItem('inkwell-tour-progress-preferences');
localStorage.removeItem('hideWelcome');
location.reload();
```

## 📋 Z-Index Hierarchy

```
10000 - Tour overlay (always on top)
50    - Modals (dialogs, popups)
40    - Main content (buttons live here)
30    - Topbar (header)
20    - Sidebar
auto  - Base content
```

## ⚡ Force start tour

```javascript
window.InkwellTour?.start('spotlight', { restart: true, source: 'console' });
```

## 🐛 Common Issues

| Symptom                  | Likely Cause     | Fix                                   |
| ------------------------ | ---------------- | ------------------------------------- |
| Button doesn't click     | Overlay blocking | Add `pointer-events: none` to overlay |
| Tour appears but clipped | Z-index too low  | Check tour has z-index: 10000         |
| Tour doesn't start       | Event not wired  | Check console for event logs          |
| Crash shield blocks      | Previous failure | Clear sessionStorage                  |

## 📞 Full Diagnostic

Run the full diagnostic script from `TOUR_DEBUGGING_GUIDE.md`

See `TOUR_BUTTON_FIXES_SUMMARY.md` for complete details on all fixes applied.
