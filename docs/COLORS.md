# Inkwell Blue & Gold Color System

This document defines the updated Inkwell brand colors, replacing the previous green-focused palette with a more accessible blue and gold theme.

## Primary Brand Colors

### Navy Blue (`#0A2F4E`)

- **Use**: Primary brand color, buttons, headers, logos
- **Accessibility**: High contrast on white backgrounds
- **CSS Class**: `bg-inkwell-navy`, `text-inkwell-navy`

### Warm Gold (`#D4A537`)

- **Use**: Accent color, highlights, call-to-action elements
- **Accessibility**: Good contrast when used carefully
- **CSS Class**: `bg-inkwell-gold`, `text-inkwell-gold`

### Rich Charcoal (`#22E22E`)

- **Use**: Body text, secondary elements, neutral backgrounds
- **Accessibility**: Excellent readability
- **CSS Class**: `bg-inkwell-charcoal`, `text-inkwell-charcoal`

## Extended Navy Blue Scale

For better design flexibility and accessibility:

```css
navy-50:  #f1f5f9  /* Light backgrounds, subtle accents */
navy-100: #e2e8f0  /* Card backgrounds, dividers */
navy-200: #cbd5e1  /* Borders, inactive states */
navy-500: #334155  /* Secondary text on light backgrounds */
navy-600: #0A2F4E  /* Primary brand color */
navy-700: #1e293b  /* Hover states, darker accents */
navy-800: #0f172a  /* Dark theme backgrounds */
navy-900: #020617  /* Darkest navy, high contrast text */
```

## Extended Gold Scale

```css
gold-50:  #fef7e0  /* Light gold backgrounds */
gold-100: #fde68a  /* Subtle gold accents */
gold-200: #fcd34d  /* Medium gold highlights */
gold-400: #f59e0b  /* Bright gold for emphasis */
gold-500: #D4A537  /* Primary gold */
gold-600: #b8941f  /* Darker gold for hover states */
gold-700: #92750f  /* Deep gold for text on light */
```

## Usage Guidelines

### Accessibility

- Navy blue provides WCAG AA compliant contrast on white
- Gold should be used sparingly for text due to lower contrast
- Always test color combinations for readability
- Dark theme uses lighter variants for better visibility

### Brand Applications

- **Primary CTAs**: Navy background with white text
- **Secondary CTAs**: Navy text on light background
- **Accents**: Gold for highlights, icons, decorative elements
- **Text Hierarchy**: Charcoal for body, Navy for headings
- **Backgrounds**: Navy-50/100 for subtle sections

### Logo Usage

- **On White**: Navy text with gold feather
- **On Navy**: Gold/white text with gold feather
- **On Dark**: Light variants for visibility
- **Small Sizes**: Use SVG versions for crispness

## Implementation

All colors are defined in `tailwind.config.js` under the `inkwell` color family:

```javascript
colors: {
  inkwell: {
    navy: '#0A2F4E',
    gold: '#D4A537',
    charcoal: '#22E22E',
    // ... extended scales
  }
}
```

Use with standard Tailwind classes:

- `bg-inkwell-navy`
- `text-inkwell-gold`
- `border-inkwell-navy-200`
- `hover:bg-inkwell-navy-700`
