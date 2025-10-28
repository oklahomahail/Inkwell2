# Tour Overlay Diagnostic Script

Run this in the browser DevTools Console to diagnose tour overlay issues:

```javascript
// ============================================================================
// INKWELL TOUR OVERLAY DIAGNOSTIC SCRIPT
// Run this in DevTools Console when buttons aren't responding
// ============================================================================

console.log('🔍 Starting Inkwell Tour Overlay Diagnostic...\n');

// 1. Check for click-blocking elements
console.log('1️⃣ CHECKING FOR CLICK-BLOCKING ELEMENTS:');
const blockers = [...document.querySelectorAll('*')].filter((el) => {
  const s = getComputedStyle(el);
  return (
    s.position === 'fixed' &&
    +s.zIndex >= 1000 &&
    el.offsetWidth >= innerWidth * 0.8 &&
    el.offsetHeight >= innerHeight * 0.8
  );
});

if (blockers.length === 0) {
  console.log('✅ No full-screen fixed elements found');
} else {
  console.warn(`⚠️ Found ${blockers.length} potential blocker(s):`);
  blockers.forEach((el, i) => {
    const s = getComputedStyle(el);
    console.log(
      `   ${i + 1}. ${el.tagName}${el.id ? '#' + el.id : ''}${el.className ? '.' + el.className.split(' ').join('.') : ''}`,
    );
    console.log(`      - pointer-events: ${s.pointerEvents}`);
    console.log(`      - z-index: ${s.zIndex}`);
    console.log(`      - display: ${s.display}`);
    console.log(`      - visibility: ${s.visibility}`);
  });
}

// 2. Check spotlight portal
console.log('\n2️⃣ CHECKING SPOTLIGHT PORTAL:');
const portal = document.getElementById('spotlight-root');
if (portal) {
  console.log('✅ Portal exists');
  console.log(`   - pointer-events: ${portal.style.pointerEvents}`);
  console.log(`   - children count: ${portal.children.length}`);
  console.log(`   - innerHTML length: ${portal.innerHTML.length}`);
  if (portal.children.length > 0) {
    console.warn('⚠️ Portal has children (tour may be active or crashed)');
    console.log(
      '   Children:',
      [...portal.children].map((c) => c.tagName),
    );
  } else {
    console.log('✅ Portal is empty (tour not active)');
  }
} else {
  console.log('✅ Portal not yet created (normal)');
}

// 3. Check app root inert status
console.log('\n3️⃣ CHECKING APP ROOT:');
const root = document.getElementById('root');
if (root) {
  const isInert = root.hasAttribute('inert');
  const isHidden = root.getAttribute('aria-hidden') === 'true';

  if (isInert || isHidden) {
    console.error('❌ App root is blocked!');
    console.log(`   - inert: ${isInert}`);
    console.log(`   - aria-hidden: ${isHidden}`);
  } else {
    console.log('✅ App root is accessible');
  }
} else {
  console.warn('⚠️ Root element not found');
}

// 4. Check button click handlers
console.log('\n4️⃣ CHECKING BUTTON CLICK HANDLERS:');
const buttons = [
  { selector: '[data-testid="create-first-project"]', name: 'Create First Project' },
  { selector: '[data-tour-id="new-project-button"]', name: 'New Project (Dashboard)' },
  { selector: '[data-tour-id="sidebar-new-project"]', name: 'New Project (Sidebar)' },
];

buttons.forEach(({ selector, name }) => {
  const btn = document.querySelector(selector);
  if (btn) {
    const hasOnClick = !!btn.onclick;
    const listeners =
      typeof getEventListeners === 'function' ? getEventListeners(btn) : { click: [] };

    console.log(`✅ Found: ${name}`);
    console.log(`   - onclick: ${hasOnClick}`);
    console.log(`   - event listeners: ${listeners.click?.length || 0}`);

    // Check if button is covered
    const rect = btn.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const topElement = document.elementFromPoint(centerX, centerY);

    if (topElement === btn || btn.contains(topElement)) {
      console.log(`   - ✅ Button is clickable`);
    } else {
      console.error(`   - ❌ Button is covered by:`, topElement);
    }
  } else {
    console.log(`❌ Not found: ${name} (${selector})`);
  }
});

// 5. Check crash shield
console.log('\n5️⃣ CHECKING CRASH SHIELD:');
try {
  const shield = JSON.parse(sessionStorage.getItem('inkwell:tour:crash-shield') || 'null');
  if (shield) {
    console.warn('⚠️ Crash shield is active!');
    console.log('   Data:', shield);
    console.log('   💡 To clear: sessionStorage.removeItem("inkwell:tour:crash-shield")');
  } else {
    console.log('✅ No crash shield');
  }
} catch (e) {
  console.log('✅ No crash shield');
}

// 6. Quick fix commands
console.log('\n6️⃣ QUICK FIX COMMANDS:');
console.log('If you found issues, run these to unblock:');
console.log('');
console.log('// Remove any blocking overlays:');
console.log(
  'document.querySelectorAll("[data-inkwell-spotlight-root], #spotlight-root").forEach(el => el.remove());',
);
console.log('');
console.log('// Unblock app root:');
console.log('const root = document.getElementById("root");');
console.log('if (root) { root.removeAttribute("inert"); root.removeAttribute("aria-hidden"); }');
console.log('');
console.log('// Clear crash shield:');
console.log('sessionStorage.removeItem("inkwell:tour:crash-shield");');
console.log('');
console.log('// Force disable pointer events on portal:');
console.log('const portal = document.getElementById("spotlight-root");');
console.log('if (portal) { portal.style.pointerEvents = "none"; portal.style.display = "none"; }');

console.log('\n✅ Diagnostic complete!\n');
```

## How to Use

1. Open the Inkwell app
2. Open DevTools (F12 or Right-click → Inspect)
3. Go to the Console tab
4. Copy and paste the entire script above
5. Press Enter
6. Review the output for any ❌ or ⚠️ symbols
7. If issues found, use the Quick Fix commands provided

## What It Checks

- ✅ Full-screen fixed elements that might block clicks
- ✅ Spotlight portal state and children
- ✅ App root `inert` and `aria-hidden` attributes
- ✅ Button presence and click handler registration
- ✅ Whether buttons are covered by other elements
- ✅ Crash shield activation status

## Expected Output (Healthy State)

```
🔍 Starting Inkwell Tour Overlay Diagnostic...

1️⃣ CHECKING FOR CLICK-BLOCKING ELEMENTS:
✅ No full-screen fixed elements found

2️⃣ CHECKING SPOTLIGHT PORTAL:
✅ Portal is empty (tour not active)

3️⃣ CHECKING APP ROOT:
✅ App root is accessible

4️⃣ CHECKING BUTTON CLICK HANDLERS:
✅ Found: Create First Project
   - onclick: false
   - event listeners: 1
   - ✅ Button is clickable

5️⃣ CHECKING CRASH SHIELD:
✅ No crash shield

6️⃣ QUICK FIX COMMANDS:
[commands listed]

✅ Diagnostic complete!
```
