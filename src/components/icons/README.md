# InkwellFeather Icon System

A standardized, type-safe icon system for the Inkwell writing platform, built on top of Lucide React icons.

## Overview

The InkwellFeather icon system provides:

- **Centralized icon registry** for consistency across the application
- **Standardized size variants** (`xs`, `sm`, `md`, `lg`, `xl`, `2xl`)
- **Theme-aware color variants** with dark mode support
- **Type-safe icon names** to prevent typos and missing icons
- **Accessibility support** with automatic aria-labels
- **Performance optimization** through single import

## Quick Start

```tsx
import InkwellFeather from '@/components/icons/InkwellFeather';

// Basic usage
<InkwellFeather name="home" />

// With size and color
<InkwellFeather name="writing" size="lg" color="primary" />

// With custom styling
<InkwellFeather
  name="analytics"
  size="md"
  color="brand"
  className="hover:text-blue-500 transition-colors"
/>
```

## Available Icons

### Navigation & Core

- `home` - Homepage/dashboard
- `settings` - Configuration and preferences
- `analytics` - Charts and data analysis
- `timeline` - Time-based views
- `writing` - Writing interface
- `planning` - Story planning tools
- `search` - Search functionality
- `menu` - Navigation menu
- `close` - Close/dismiss actions

### Writing & Content

- `edit` - Edit content
- `document` - File/document representation
- `save` - Save actions
- `copy` - Copy to clipboard
- `delete` - Remove/trash items
- `add` - Create new items
- `check` - Confirm/complete actions

### UI Elements & States

- `chevron-left`, `chevron-right`, `chevron-up`, `chevron-down` - Navigation
- `arrow-left`, `arrow-right` - Directional actions
- `show`, `hide` - Visibility toggles
- `lock`, `unlock` - Security states
- `refresh` - Reload/sync actions

## Size Variants

| Size  | Class       | Pixels | Usage                        |
| ----- | ----------- | ------ | ---------------------------- |
| `xs`  | `w-3 h-3`   | 12px   | Small indicators, badges     |
| `sm`  | `w-4 h-4`   | 16px   | Inline text icons, buttons   |
| `md`  | `w-5 h-5`   | 20px   | Default size, list items     |
| `lg`  | `w-6 h-6`   | 24px   | Toolbar buttons, headers     |
| `xl`  | `w-8 h-8`   | 32px   | Large buttons, feature icons |
| `2xl` | `w-12 h-12` | 48px   | Hero sections, empty states  |

```tsx
// Size examples
<InkwellFeather name="home" size="xs" />   // 12px
<InkwellFeather name="home" size="sm" />   // 16px
<InkwellFeather name="home" size="md" />   // 20px (default)
<InkwellFeather name="home" size="lg" />   // 24px
<InkwellFeather name="home" size="xl" />   // 32px
<InkwellFeather name="home" size="2xl" />  // 48px
```

## Color Variants

| Color       | Light Mode        | Dark Mode         | Usage                         |
| ----------- | ----------------- | ----------------- | ----------------------------- |
| `default`   | `text-gray-600`   | `text-gray-400`   | Standard content icons        |
| `primary`   | `text-blue-600`   | `text-blue-400`   | Primary actions, links        |
| `secondary` | `text-gray-500`   | `text-gray-500`   | Secondary content             |
| `success`   | `text-green-600`  | `text-green-400`  | Success states, confirmations |
| `warning`   | `text-amber-600`  | `text-amber-400`  | Warnings, cautions            |
| `error`     | `text-red-600`    | `text-red-400`    | Errors, destructive actions   |
| `muted`     | `text-gray-400`   | `text-gray-600`   | Disabled, inactive states     |
| `accent`    | `text-indigo-600` | `text-indigo-400` | Accent features               |
| `brand`     | `text-amber-600`  | `text-amber-400`  | Brand-specific elements       |

```tsx
// Color examples
<InkwellFeather name="check" color="success" />
<InkwellFeather name="alert" color="warning" />
<InkwellFeather name="delete" color="error" />
<InkwellFeather name="star" color="brand" />
```

## Accessibility

The component automatically provides accessibility features:

```tsx
// Automatic aria-label from icon name
<InkwellFeather name="home" />
// Results in: aria-label="home"

// Hyphenated names become spaced
<InkwellFeather name="chevron-left" />
// Results in: aria-label="chevron left"

// Custom accessibility
<InkwellFeather
  name="home"
  aria-label="Navigate to homepage"
  title="Go to main dashboard"
/>
```

## Advanced Usage

### Custom Styling

```tsx
// Hover effects
<InkwellFeather
  name="writing"
  className="hover:text-blue-500 hover:scale-110 transition-all duration-200"
/>

// Responsive sizing
<InkwellFeather
  name="menu"
  className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6"
/>

// Animation
<InkwellFeather
  name="refresh"
  className="animate-spin"
/>
```

### Button Integration

```tsx
function IconButton({ icon, children, ...props }) {
  return (
    <button
      className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-100"
      {...props}
    >
      <InkwellFeather name={icon} size="sm" />
      {children}
    </button>
  );
}

// Usage
<IconButton icon="save">Save Draft</IconButton>
<IconButton icon="analytics">View Analytics</IconButton>
```

### Navigation Menu

```tsx
const navigationItems = [
  { name: 'Dashboard', icon: 'home', href: '/dashboard' },
  { name: 'Writing', icon: 'writing', href: '/write' },
  { name: 'Planning', icon: 'planning', href: '/plan' },
  { name: 'Timeline', icon: 'timeline', href: '/timeline' },
  { name: 'Analytics', icon: 'analytics', href: '/analytics' },
];

function Navigation() {
  return (
    <nav>
      {navigationItems.map((item) => (
        <a
          key={item.name}
          href={item.href}
          className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-100"
        >
          <InkwellFeather name={item.icon} size="sm" color="default" />
          <span>{item.name}</span>
        </a>
      ))}
    </nav>
  );
}
```

## Type Safety

The system provides full TypeScript support:

```tsx
import type { InkwellIconName, IconSize, IconColor } from '@/components/icons/InkwellFeather';

// Type-safe icon props
interface IconButtonProps {
  icon: InkwellIconName;  // Only allows valid icon names
  size?: IconSize;        // Only allows valid sizes
  color?: IconColor;      // Only allows valid colors
}

// Compile-time error for invalid icon names
<InkwellFeather name="invalid-icon" />  // ❌ TypeScript error
<InkwellFeather name="home" />          // ✅ Valid
```

## Migration Guide

### From Direct Lucide Imports

**Before:**

```tsx
import { Home, Settings, BarChart3 } from 'lucide-react';

<Home className="w-5 h-5 text-gray-600" />
<Settings className="w-4 h-4 text-blue-500" />
<BarChart3 className="w-6 h-6 text-green-500" />
```

**After:**

```tsx
import InkwellFeather from '@/components/icons/InkwellFeather';

<InkwellFeather name="home" />
<InkwellFeather name="settings" size="sm" color="primary" />
<InkwellFeather name="analytics" size="lg" color="success" />
```

### Benefits of Migration

- **Consistency**: All icons follow the same sizing and color system
- **Maintainability**: Central registry makes it easy to update or swap icons
- **Bundle size**: Tree-shaking only imports used icons
- **Type safety**: Prevents typos and ensures icons exist
- **Accessibility**: Automatic aria-labels and titles

## Performance

- **Tree-shaking**: Only imports icons that are actually used
- **Memoization**: Icons are efficiently rendered and cached
- **Size optimization**: Lucide icons are optimized SVGs
- **Bundle impact**: Minimal overhead beyond the base Lucide React package

## Testing

The icon system includes comprehensive tests:

```bash
# Run icon system tests
pnpm test src/components/icons/InkwellFeather.test.tsx

# Test coverage includes:
# - Icon registry validation
# - Size and color variant application
# - Accessibility features
# - Error handling for invalid icons
# - Performance benchmarks
```

## Contributing

### Adding New Icons

1. Import the icon from `lucide-react`
2. Add it to the `INKWELL_ICONS` registry with a semantic name
3. Update the documentation
4. Add test coverage

```tsx
// In InkwellFeather.tsx
import { NewIcon } from 'lucide-react';

export const INKWELL_ICONS = {
  // ... existing icons
  'new-feature': NewIcon,
} as const;
```

### Naming Conventions

- Use kebab-case for icon names: `chevron-left`, `more-horizontal`
- Choose semantic names over icon-specific names: `analytics` not `bar-chart-3`
- Group related icons with consistent prefixes: `chevron-*`, `arrow-*`
- Keep names concise but descriptive: `edit` not `edit-content`

## Support

For issues, feature requests, or questions about the icon system:

1. Check the [icon registry](./InkwellFeather.tsx#INKWELL_ICONS) for available icons
2. Review the [test suite](./InkwellFeather.test.tsx) for usage examples
3. Consult the [Lucide React docs](https://lucide.dev/guide/packages/lucide-react) for underlying icon behavior
