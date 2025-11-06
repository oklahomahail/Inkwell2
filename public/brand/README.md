# Inkwell Brand Assets

This directory contains the canonical brand assets for Inkwell.

## SVG Assets (Semantic Names)

- `inkwell-icon.svg` - Feather-only icon, square format (641B)
- `inkwell-lockup-dark.svg` - White text on dark background (535B)
- `inkwell-lockup-light.svg` - Navy text on light background (537B)

## PNG Icons (Generated from SVG)

Used by manifest and meta tags:
- `inkwell-icon-32.png` - Favicon (32×32, 1.7KB)
- `inkwell-icon-180.png` - Apple touch icon (180×180, 21KB)
- `inkwell-icon-192.png` - PWA icon (192×192, 24KB)
- `inkwell-icon-512.png` - PWA icon (512×512, 173KB)
- `inkwell-og-1200x630.png` - Open Graph social sharing image (1200×630, 533KB)

**Regenerate PNGs:** Run `pnpm build:icons` to regenerate all PNG assets from the SVG sources.

## Brand Colors

- **Inkwell Blue (Navy)**: `#13294B` (Primary brand color)
- **Inkwell Gold**: `#D4AF37` (Accent color for highlights and interactive elements)

## Usage

These assets are referenced in:
- `/index.html` - Favicons and OG images
- `/public/site.webmanifest` - PWA icons
- `/src/components/Logo.tsx` - Application logo component
- `/src/components/Auth/AuthHeader.tsx` - Authentication pages
- Various auth pages (`/src/pages/AuthPage.tsx`, etc.)

## Import Aliases

Use semantic import aliases in your code (configured in `vite.config.ts`):

```typescript
import icon from '@brand/icon';           // inkwell-icon.svg
import logoDark from '@brand/logo-dark';  // inkwell-lockup-dark.svg
import logoLight from '@brand/logo-light'; // inkwell-lockup-light.svg
```

## Validation

Run `node scripts/check-brand-assets.mjs` to validate all required brand assets are present before building.

## Notes

- All SVG files include proper `viewBox` attributes for responsive scaling
- PNG files are regenerated from SVG sources to maintain quality
- Paths use `currentColor` or explicit brand colors as appropriate
- All assets are precached by the service worker for offline support
