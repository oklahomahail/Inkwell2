# Inkwell Brand Assets

This directory contains all brand assets for the Inkwell writing platform.

## Directory Structure

```
public/brand/
├── logos/          # Logo variations and formats
├── colors/         # Color palette swatches and exports
├── icons/          # App icons, favicons, and UI icons
├── assets/         # Supporting brand elements
└── README.md       # This file
```

## Usage Guidelines

All brand assets follow the guidelines outlined in our [Brand Guide](../../docs/BRANDING_GUIDE.md).

### Color System
- **Primary**: Deep Navy (#0A2F4E)
- **Secondary**: Warm Gold (#D4A537)  
- **Neutral**: Charcoal (#22E22E)

### Typography
- **Heading**: Source Serif Pro
- **Body**: Inter

## File Formats

- **Logos**: Available in SVG, PNG (multiple sizes), and PDF formats
- **Colors**: CSS variables, Tailwind config, and design tool swatches
- **Icons**: SVG format with React component exports

## Implementation

Brand assets are imported throughout the application via:
- Direct public URL references for static assets
- React components for interactive elements
- CSS custom properties for colors and spacing

For implementation details, see the [Brand Integration Guide](../../docs/BRANDING_GUIDE.md#implementation).