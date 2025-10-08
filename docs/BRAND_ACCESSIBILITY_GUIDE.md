# Inkwell Brand System - Accessibility Guidelines

## WCAG Compliance Summary

Our Inkwell brand colors have been tested for accessibility compliance according to WCAG 2.1 guidelines. Here are the results and recommendations:

## Color Contrast Test Results

### ✅ Excellent Combinations (WCAG AAA Compliant - 7:1+)

- **White backgrounds with Navy text**: 11.50:1 ratio
- **Navy backgrounds with White text**: 11.50:1 ratio
- **White backgrounds with Charcoal text**: 11.99:1 ratio
- **Charcoal backgrounds with White text**: 11.99:1 ratio
- **Gold backgrounds with Black text**: 9.99:1 ratio

### ✅ Good Combinations (WCAG AA Compliant - 4.5:1+)

- **Gold backgrounds with Navy text**: 5.47:1 ratio
- **Navy backgrounds with Gold text**: 5.47:1 ratio

### ⚠️ Use with Caution (Below WCAG AA)

- **White backgrounds with Gold text**: 2.10:1 ratio

## Usage Guidelines

### Primary Text Combinations

**Always use these for body text and important content:**

- Navy (#1e3a5f) on white backgrounds
- White on navy (#1e3a5f) backgrounds
- Charcoal (#2d3748) on white backgrounds
- White on charcoal backgrounds

### Accent and Interactive Elements

**Safe for buttons, links, and highlights:**

- Gold (#d4af37) on navy backgrounds
- Navy text on gold backgrounds
- Black text on gold backgrounds

### Gold Text Restrictions

**Gold text on light backgrounds should only be used for:**

- Large headings (24px+ / 1.5rem+)
- Bold/semibold weights (600+)
- Non-essential decorative elements
- Brief labels with sufficient size

## Implementation Guidelines

### CSS Classes for Accessible Combinations

```css
/* Primary text combinations */
.text-accessible-light {
  @apply text-inkwell-navy bg-white;
}

.text-accessible-dark {
  @apply text-white bg-inkwell-navy;
}

.text-accessible-charcoal {
  @apply text-inkwell-charcoal bg-white;
}

/* Interactive elements */
.interactive-gold-on-navy {
  @apply text-inkwell-gold bg-inkwell-navy;
}

.interactive-navy-on-gold {
  @apply text-inkwell-navy bg-inkwell-gold;
}

/* Gold text - use sparingly */
.accent-gold-large {
  @apply text-inkwell-gold text-xl font-semibold;
}
```

### Component-Specific Guidelines

#### Buttons

- **Primary**: Gold background with navy text
- **Secondary**: Navy background with white text
- **Ghost**: Navy text on transparent/white background

#### Navigation

- **Sidebar**: Navy background with white text, gold accents
- **Links**: Navy text, gold on hover
- **Active states**: Gold background with navy text

#### Forms

- **Labels**: Navy or charcoal text
- **Inputs**: White background with navy text
- **Focus states**: Gold border, navy text
- **Error states**: Red text with sufficient contrast

#### Cards and Containers

- **Primary**: White background with navy text
- **Dark theme**: Charcoal background with white text
- **Accents**: Gold borders or highlights

## Testing and Validation

### Automated Testing

Run this accessibility check in your browser console:

```javascript
// Test contrast ratio for any element
function checkContrast(element) {
  const styles = getComputedStyle(element);
  const bg = styles.backgroundColor;
  const fg = styles.color;
  // Use WebAIM or similar contrast checker
  console.log('Background:', bg, 'Foreground:', fg);
}

// Check all text elements
document
  .querySelectorAll('p, h1, h2, h3, h4, h5, h6, a, button, span')
  .forEach((el) => checkContrast(el));
```

### Manual Testing Checklist

- [ ] All body text meets WCAG AA (4.5:1) minimum
- [ ] Headings and important text meet WCAG AAA (7:1) when possible
- [ ] Interactive elements have sufficient contrast
- [ ] Focus indicators are clearly visible
- [ ] Color is not the only means of conveying information

### Browser Testing

Test accessibility across:

- Chrome DevTools Lighthouse audit
- Firefox Accessibility Inspector
- Safari Web Inspector
- Screen reader testing (VoiceOver, NVDA)

## Dark Mode Considerations

In dark mode, our color relationships maintain accessibility:

- **Background**: Charcoal (#2d3748) with 11.99:1 contrast to white text
- **Primary text**: White (#ffffff)
- **Secondary elements**: Gold (#d4af37) maintains 5.47:1 contrast
- **Borders and accents**: Gold with 30% opacity for subtle contrast

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Colour Contrast Analyser](https://www.tpgi.com/color-contrast-checker/)

## Updates and Maintenance

This document should be updated whenever:

- New brand colors are introduced
- Color values are modified
- New component patterns are created
- Accessibility standards change

Last updated: $(date +'%Y-%m-%d')
