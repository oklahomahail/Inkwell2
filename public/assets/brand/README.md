# Inkwell Brand Assets

This directory contains brand assets for Inkwell. The following files are required for the application to function properly:

## Required Assets

### Icons & Favicons
- `inkwell-favicon.ico` - Browser favicon (16x16, 32x32)
- `inkwell-favicon-32.png` - 32x32 favicon
- `inkwell-logo-icon-180.png` - Apple touch icon (180x180)
- `inkwell-logo-icon-192.png` - PWA icon (192x192)
- `inkwell-logo-icon-512.png` - PWA icon (512x512)

### Logo Variants
- `inkwell-logo-horizontal.png` - Horizontal logo with text
- `inkwell-logo-full.png` - Full logo
- `inkwell-logo-icon-variant-a.png` - Icon variant A
- `inkwell-logo-icon-variant-b.png` - Icon variant B
- `inkwell-logo-icon-variant-c.png` - Icon variant C
- `inkwell-logo-icon-variant-d.png` - Icon variant D

### SVG Lockups
- `inkwell-lockup-dark.svg` - Dark background lockup logo
- `inkwell-wordmark.svg` - Wordmark only

### Social Media
- `inkwell-og-1200x630.png` - Open Graph image for social sharing (1200x1200x630)

## Brand Colors

- **Inkwell Blue (Navy)**: `#13294B` (Primary brand color)
- **Inkwell Gold**: `#D4AF37` (Accent color)
- **Dark Background**: `#0b1020` (App dark mode background)

## Usage

These assets are referenced in:
- `/index.html` - Favicons and OG images
- `/public/site.webmanifest` - PWA icons
- `/src/components/Logo.tsx` - Application logo component
- `/src/components/Auth/AuthHeader.tsx` - Authentication pages
- Various auth pages (`/src/pages/AuthPage.tsx`, etc.)

## Missing Assets

If you see 404 errors for brand assets, please ensure all files listed above are present in this directory.

To quickly generate placeholder assets for development, you can use:
- [favicon.io](https://favicon.io/) for favicons
- [Canva](https://www.canva.com/) for logo designs
- Any image editor to create appropriately sized PNG files

## Notes

- All PNG files should use transparent backgrounds where appropriate
- SVG files should be optimized and minified
- Ensure proper color contrast for accessibility
- Icons should be recognizable at small sizes (16x16)
