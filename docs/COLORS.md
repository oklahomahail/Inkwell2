# Inkwell Blue & Gold Color System

This document defines the updated Inkwell brand colors, replacing the previous green-focused palette with a more accessible blue and gold theme.

## Primary Brand Colors

### Navy Blue (`#13294B`)

- **Use**: Primary brand color, buttons, headers, logos
- **Accessibility**: High contrast on white backgrounds
- **CSS Class**: `bg-inkwell-navy`, `text-inkwell-navy`

### Warm Gold (`#D4AF37`)

- **Use**: Accent color, highlights, call-to-action elements
- **Accessibility**: Good contrast when used carefully
- **CSS Class**: `bg-inkwell-gold`, `text-inkwell-gold`

### Rich Charcoal (`#2C3242`)

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
navy-600: #13294B  /* Primary brand color */
navy-700: #0e1e38  /* Hover states, darker accents */
navy-800: #0a1525  /* Dark theme backgrounds */
navy-900: #050b12  /* Darkest navy, high contrast text */
```

## Extended Gold Scale

```css
gold-50:  #fef9e7  /* Light gold backgrounds */
gold-100: #fcf0c3  /* Subtle gold accents */
gold-200: #f8e59b  /* Medium gold highlights */
gold-400: #e3be4b  /* Bright gold for emphasis */
gold-500: #D4AF37  /* Primary gold */
gold-600: #b38d22  /* Darker gold for hover states */
gold-700: #8c6b12  /* Deep gold for text on light */
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
    navy: '#13294B',
    gold: '#D4AF37',
    charcoal: '#2C3242',
    white: '#FAFAFA',
    // ... extended scales
  }
}
```

Use with standard Tailwind classes:

- `bg-inkwell-navy`
- `text-inkwell-gold`
- `border-inkwell-navy-200`
- `hover:bg-inkwell-navy-700`
