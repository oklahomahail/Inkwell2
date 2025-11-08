# Inkwell Brand Assets

This directory contains the official Inkwell brand assets used throughout the application.

## Files

### Primary Assets (Your Custom Designs)

- **`inkwell-icon-new.svg`** (1.5MB) - Your custom icon/favicon (from 1.svg)
  - Used as: `/favicon.svg` in the root
  - Purpose: Browser tab icon, sidebar collapsed state, panel headers
  - Size: Scalable vector, typically displayed at 32x32 to 48x48 pixels

- **`inkwell-logo-primary.svg`** (140KB) - Your custom primary logo (from 2.svg)
  - Purpose: Full logo for sidebar (expanded state), dashboard (light mode)
  - Display: ~200px width max in sidebar, ~80px height on dashboard

- **`inkwell-logo-alt.svg`** (356KB) - Your custom alternate logo (from 3.svg)
  - Purpose: Alternative logo for dark mode dashboard
  - Display: ~80px height on dashboard

### PNG Icons (For PWA/Mobile)

- `inkwell-icon-32.png` - 32x32 favicon fallback
- `inkwell-icon-64.png` - 64x64 favicon fallback
- `inkwell-icon-180.png` - 180x180 Apple Touch Icon
- `inkwell-icon-192.png` - 192x192 PWA icon
- `inkwell-icon-512.png` - 512x512 PWA icon

## Usage Locations

| Location | Asset Used | Size |
|----------|-----------|------|
| Browser Tab | `/favicon.svg` | 32x32 |
| Sidebar (collapsed) | `/favicon.svg` | 32x32 |
| Sidebar (expanded) | `/brand/inkwell-logo-primary.svg` | h-10 (~40px) |
| Dashboard (light) | `/brand/inkwell-logo-primary.svg` | h-20 (~80px) |
| Dashboard (dark) | `/brand/inkwell-logo-alt.svg` | h-20 (~80px) |
| Writing Panel | `/favicon.svg` | 32x32 |
| Analytics Panel | `/favicon.svg` | 40x40 |
| Timeline Panel | `/favicon.svg` | 40x40 |
| Settings Panel | `/favicon.svg` | 48x48 |

## Brand Colors

- **Primary Navy**: `#13294B` (Inkwell Blue)
- **Accent Gold**: `#D4AF37` (Inkwell Gold)
- **Background**: `#FFFFFF` (Light) / `#0b1323` (Dark)
