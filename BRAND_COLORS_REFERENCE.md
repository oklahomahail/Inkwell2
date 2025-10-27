# Inkwell Brand Colors - Quick Reference

**Updated**: October 27, 2025  
**Status**: ✅ All files synchronized

---

## 🎨 Official Brand Colors

Use these values everywhere:

```typescript
Deep Navy:  #13294B  // Primary brand color (headers, buttons)
Warm Gold:  #D4AF37  // Accent color (highlights, CTAs)
Charcoal:   #2C3242  // Body text & neutrals
Soft White: #FAFAFA  // Background
Pure White: #FFFFFF  // Paper/cards
```

---

## 🚨 IMPORTANT: What Changed

### Before (INCORRECT)

```typescript
Deep Navy: #0C5C3D  ❌ Wrong
Warm Gold: #D4A537  ❌ Wrong
Charcoal:  #22E22E  ❌ This was GREEN!
```

### After (CORRECT)

```typescript
Deep Navy: #13294B  ✅ Correct
Warm Gold: #D4AF37  ✅ Correct
Charcoal:  #2C3242  ✅ Correct (gray, not green!)
```

---

## 📦 Usage in Code

### Tailwind Classes (Recommended)

```tsx
// Navy
className = 'bg-inkwell-navy text-white';
className = 'text-inkwell-navy';
className = 'border-inkwell-navy-200';

// Gold
className = 'bg-inkwell-gold';
className = 'text-inkwell-gold';

// Charcoal
className = 'text-inkwell-charcoal';
className = 'bg-inkwell-charcoal';
```

### TypeScript Constants

```tsx
import { BRAND_COLORS } from '@/constants/brand';

const navyColor = BRAND_COLORS.DEEP_NAVY; // '#13294B'
const goldColor = BRAND_COLORS.WARM_GOLD; // '#D4AF37'
const charcoalColor = BRAND_COLORS.CHARCOAL; // '#2C3242'
```

### Component Constants

```tsx
import { INKWELL_BRAND } from '@/components/Brand/constants';

const navy = INKWELL_BRAND.colors.navy; // '#13294B'
const gold = INKWELL_BRAND.colors.gold; // '#D4AF37'
const charcoal = INKWELL_BRAND.colors.charcoal; // '#2C3242'
```

---

## 🔍 Extended Color Scales

### Navy Scale

```typescript
'navy-50':  '#f1f5f9'  // Very light backgrounds
'navy-100': '#e2e8f0'  // Card backgrounds
'navy-200': '#cbd5e1'  // Borders
'navy-500': '#334155'  // Secondary text
'navy-600': '#13294B'  // PRIMARY ⭐
'navy-700': '#0e1e38'  // Hover states
'navy-800': '#0a1525'  // Dark backgrounds
'navy-900': '#050b12'  // Darkest
```

### Gold Scale

```typescript
'gold-50':  '#fef9e7'  // Light backgrounds
'gold-100': '#fcf0c3'  // Subtle accents
'gold-200': '#f8e59b'  // Medium highlights
'gold-400': '#e3be4b'  // Bright emphasis
'gold-500': '#D4AF37'  // PRIMARY ⭐
'gold-600': '#b38d22'  // Hover states
'gold-700': '#8c6b12'  // Deep gold
```

---

## ✅ Verification

To check if colors are correct:

1. **In DevTools**: Inspect element → Computed → Look for:
   - `background-color: rgb(19, 41, 75)` = Navy `#13294B` ✅
   - `background-color: rgb(212, 175, 55)` = Gold `#D4AF37` ✅
   - `color: rgb(44, 50, 66)` = Charcoal `#2C3242` ✅

2. **In Code**: All constants should match:
   - `tailwind.config.js`
   - `src/constants/brand.ts`
   - `src/components/Brand/constants.ts`
   - Documentation files

---

## 🚫 DO NOT Use These (Old Values)

These values are **incorrect** and have been removed:

```typescript
#0C5C3D  ❌ Old navy (too green)
#0A2F4E  ❌ Old navy (too dark)
#D4A537  ❌ Old gold (slightly off)
#22E22E  ❌ BRIGHT GREEN (was supposed to be charcoal!)
#2E2E2E  ❌ Old charcoal (slightly off)
```

---

## 📍 Single Source of Truth

**`tailwind.config.js`** is the canonical source.

All other files reference these values. If you need to change brand colors:

1. Update `tailwind.config.js`
2. Update `src/constants/brand.ts`
3. Update `src/components/Brand/constants.ts`
4. Update documentation files
5. Run `pnpm build` to verify

---

## 🎯 Common Patterns

### Primary Button

```tsx
<button className="bg-inkwell-navy text-white hover:bg-inkwell-navy-700">Click Me</button>
```

### Secondary Button

```tsx
<button className="text-inkwell-navy border border-inkwell-navy-200 hover:bg-inkwell-navy-50">
  Click Me
</button>
```

### Gold Accent Button

```tsx
<button className="bg-inkwell-gold text-inkwell-navy hover:bg-inkwell-gold-600">Click Me</button>
```

### Card with Navy Header

```tsx
<div className="bg-white rounded-lg border">
  <header className="bg-inkwell-navy text-white p-4">Header</header>
  <div className="p-4 text-inkwell-charcoal">Content</div>
</div>
```

---

## 🛡️ Theme Consistency

Light mode (default):

- Background: `bg-inkwell-white` or `bg-white`
- Text: `text-inkwell-charcoal`
- Headers: `text-inkwell-navy`
- Accents: `text-inkwell-gold`

Dark mode:

- Background: `dark:bg-gray-900`
- Text: `dark:text-gray-100`
- Headers: `dark:text-white`
- Accents: `dark:text-inkwell-gold`

---

**Last Updated**: October 27, 2025  
**Maintainer**: Dave Hail
