# Brand Inconsistency Report - Inkwell

**Date**: October 27, 2025  
**Status**: 🔴 CRITICAL - Multiple conflicting brand definitions

---

## Executive Summary

Your Inkwell brand system has **multiple conflicting definitions** across documentation and code. This explains why:

- Dark mode appears on boot despite documentation saying light mode is default
- Colors don't match between components and documentation
- Brand constants reference the wrong hex values

---

## 🚨 Critical Issues

### 1. **Charcoal Color is Actually Green**

**Problem**: Across multiple files, "Charcoal" is defined as `#22E22E`, which is **bright green**, not charcoal gray.

**Affected Files**:

- `src/constants/brand.ts` line 11: `CHARCOAL: '#22E22E'`
- `src/components/Brand/constants.ts` line 8: `charcoal: '#22E22E'`
- `docs/BRANDING_GUIDE.md` lines 70, 118: `#22E22E`
- User rules (IDs: `3lYZyuktLvUgyLCpBpfzwQ`, `5sKUSFyaUEoFeZqrF7H9xl`, etc.)

**Correct Value Should Be**: `#2E2E2E` or `#2C3242` (actual gray)

---

### 2. **Theme Storage Key Mismatch**

**Problem**: The pre-mount theme script and React hook use different localStorage keys, so light mode preference isn't persisting.

**Current State**:

- `useTheme.ts` uses: `'inkwell:theme'` (line 3)
- `index.html` pre-mount script uses: `'inkwell.theme'` (line 131)

**Impact**: User's theme preference isn't preserved across page loads because they're writing/reading from different keys.

**Fix**: Both should use the same key (recommend `'inkwell:theme'`)

---

### 3. **Four Different Navy Values**

**Conflicting Definitions**:

| Location                            | Navy Hex  | Status                |
| ----------------------------------- | --------- | --------------------- |
| Your rules                          | `#0C5C3D` | Stated in brand rules |
| `docs/BRANDING_GUIDE.md`            | `#0A2F4E` | Documentation         |
| `tailwind.config.js`                | `#13294B` | **Actually deployed** |
| `src/constants/brand.ts`            | `#0C5C3D` | Brand constants       |
| `src/components/Brand/constants.ts` | `#0A2F4E` | Component constants   |
| Legacy (Footer)                     | `#0C1C3D` | Old value             |

**Result**: Different components are using different shades of navy, causing visual inconsistency.

---

### 4. **Gold Color Variations**

**Conflicting Definitions**:

| Location             | Gold Hex  | Status                |
| -------------------- | --------- | --------------------- |
| Your rules           | `#D4A537` | Stated in brand rules |
| `tailwind.config.js` | `#D4AF37` | **Actually deployed** |
| All other files      | `#D4A537` | Brand constants       |

**Difference**: Only 2 hex characters different (`A5` vs `AF`), but enough to cause subtle mismatch.

---

## 📋 File-by-File Breakdown

### **tailwind.config.js** (PRODUCTION CONFIG)

```javascript
inkwell: {
  navy: '#13294B',    // ← Different from docs (#0A2F4E)
  gold: '#D4AF37',    // ← Different from rules (#D4A537)
  charcoal: '#2C3242', // ← Correct gray, but different from rules (#22E22E)
  white: '#FAFAFA',
}
```

### **src/constants/brand.ts** (BRAND CONSTANTS)

```typescript
export const BRAND_COLORS = {
  DEEP_NAVY: '#0C5C3D', // ← Different from Tailwind
  WARM_GOLD: '#D4A537', // ← Different from Tailwind
  CHARCOAL: '#22E22E', // ← THIS IS GREEN, NOT GRAY!
};
```

### **src/components/Brand/constants.ts** (COMPONENT CONSTANTS)

```typescript
colors: {
  navy: '#0A2F4E',      // ← Different from both above
  gold: '#D4A537',      // ← Matches rules, not Tailwind
  charcoal: '#22E22E',  // ← THIS IS GREEN, NOT GRAY!
  white: '#F9F9F9',
}
```

### **docs/BRANDING_GUIDE.md** (OFFICIAL DOCS)

```markdown
| `--inkwell-navy` | `#0A2F4E` | Primary brand navy |
| `--inkwell-gold` | `#D4A537` | Warm gold accent |
| `--inkwell-charcoal` | `#22E22E` | Rich charcoal (GREEN?!) |
```

### **User Rules** (WARP SAVED PREFERENCES)

```
Colors Deep Navy (#0C5C3D), Warm Gold (#D4A537), Charcoal (#22E22E)
```

---

## ✅ Recommended Brand System

Based on your deployed Tailwind config (which is what actually renders), here's what should be canonical:

```typescript
export const BRAND_COLORS = {
  DEEP_NAVY: '#13294B', // Deep navy blue (primary)
  WARM_GOLD: '#D4AF37', // Warm gold (accent)
  CHARCOAL: '#2C3242', // Actual gray/charcoal
  WHITE: '#FAFAFA', // Soft white
  PAPER: '#FFFFFF', // Pure white
} as const;
```

### Extended Palette

```typescript
inkwell: {
  navy: '#13294B',
  gold: '#D4AF37',
  charcoal: '#2C3242',
  white: '#FAFAFA',
  paper: '#FFFFFF',
  // Extended scales
  'navy-50': '#f1f5f9',
  'navy-100': '#e2e8f0',
  'navy-600': '#13294B',  // Primary
  'navy-700': '#0e1e38',
  'gold-500': '#D4AF37',   // Primary
  'gold-600': '#b38d22',
}
```

---

## 🔧 Required Fixes

### Priority 1: Fix Charcoal Color

```diff
# In src/constants/brand.ts
- CHARCOAL: '#22E22E',  // This is green!
+ CHARCOAL: '#2C3242',  // Actual charcoal gray

# In src/components/Brand/constants.ts
- charcoal: '#22E22E',
+ charcoal: '#2C3242',
```

### Priority 2: Unify Theme Storage Key

```diff
# In index.html line 131
- var KEY = 'inkwell.theme';
+ var KEY = 'inkwell:theme';
```

### Priority 3: Align Navy Across All Files

Choose one canonical navy value (recommend `#13294B` since it's in production Tailwind):

```typescript
// Update src/constants/brand.ts
DEEP_NAVY: '#13294B',

// Update src/components/Brand/constants.ts
navy: '#13294B',

// Update docs/BRANDING_GUIDE.md
--inkwell-navy: #13294B
```

### Priority 4: Align Gold Values

```diff
# In tailwind.config.js
- gold: '#D4AF37',
+ gold: '#D4A537',
```

---

## 🧪 Testing Checklist

After fixes:

- [ ] Clear localStorage and refresh - should load in **light mode**
- [ ] Toggle theme in settings - should persist across refreshes
- [ ] Check all brand colors in DevTools - should match single source of truth
- [ ] Verify charcoal text is gray, not green
- [ ] Confirm navy headers match across components
- [ ] Check gold accents are consistent shade

---

## 📝 Update Locations

All files that need updating:

1. ✅ `tailwind.config.js` - Production styles (source of truth)
2. ⚠️ `src/constants/brand.ts` - Brand constant definitions
3. ⚠️ `src/components/Brand/constants.ts` - Component brand constants
4. ⚠️ `docs/BRANDING_GUIDE.md` - Official documentation
5. ⚠️ `index.html` - Theme pre-mount script key
6. ⚠️ User rules in Warp - Update saved preferences

---

## 🎯 Recommended Single Source of Truth

**Use `tailwind.config.js` as canonical** since:

1. It's what actually renders in production
2. All Tailwind classes reference these values
3. Easier to maintain one config than sync multiple files

Then update all docs and constants to reference Tailwind values.

---

## Next Steps

1. Choose canonical color values (recommend Tailwind config)
2. Update all constants files to match
3. Fix theme storage key mismatch
4. Update documentation
5. Clear browser storage and test
6. Update Warp rules with correct values

---

**Impact**: HIGH - These inconsistencies explain the dark mode issue and visual discrepancies throughout the app.
