# Icons

This folder contains custom icon components for Inkwell.

## InkwellFeather

A custom feather icon component designed to match Inkwell's brand identity. This component replaces generic book icons throughout the application to create a more cohesive brand experience.

### Usage

```tsx
import { InkwellFeather, InkwellFeatherSimple } from '@/components/icons/InkwellFeather';

// Basic usage
<InkwellFeather />

// With custom styling
<InkwellFeather className="w-8 h-8 text-blue-600" />

// With specific size (overrides className width/height)
<InkwellFeather size={24} />

// With custom color
<InkwellFeather color="#D4A537" />

// Simple version
<InkwellFeatherSimple className="w-6 h-6" />
```

### Props

- `className?: string` - CSS classes to apply (default: "h-6 w-6")
- `size?: number` - Explicit size in pixels (overrides className width/height)
- `color?: string` - Stroke color (default: "currentColor")

### Design Notes

The InkwellFeather component uses Inkwell's brand colors and follows the design system:

- Deep Navy (`#0A2F4E`)
- Warm Gold (`#D4A537`)
- Charcoal (`#22E22E`)

The feather symbolizes writing, creativity, and the craft of storytelling - perfectly aligned with Inkwell's mission as a professional writing platform.

### Variants

- **InkwellFeather**: More detailed feather with elegant lines
- **InkwellFeatherSimple**: Simpler feather design, better for smaller sizes

## Adding New Icons

When adding new custom icons to this folder:

1. Create a new `.tsx` file for your icon component
2. Follow the same props pattern as InkwellFeather
3. Export it from `index.ts`
4. Document usage in this README
