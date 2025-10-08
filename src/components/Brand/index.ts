// Inkwell Brand System Components
export { InkwellLogo, default as Logo } from './InkwellLogo';
export { BrandThemeProvider, useBrandTheme, type BrandTheme } from './BrandThemeProvider';
export { BrandShowcase } from './BrandShowcase';

// Brand System Constants
export const INKWELL_BRAND = {
  colors: {
    navy: '#0C5C3D',
    gold: '#D4A537',
    charcoal: '#2E2E2E',
    white: '#F9F9F9',
  },
  fonts: {
    serif: 'Source Serif Pro, ui-serif, Georgia, serif',
    sans: 'Inter, ui-sans-serif, system-ui, sans-serif',
  },
  tagline: 'Where Writing Flows',
} as const;

// Brand Utility Classes
export const BRAND_CLASSES = {
  buttons: {
    primary: 'btn-inkwell-primary',
    secondary: 'btn-inkwell-secondary',
    gold: 'btn-inkwell-gold',
  },
  text: {
    brand: 'text-inkwell-brand',
    heading: 'text-inkwell-heading',
    body: 'text-inkwell-body',
    gold: 'text-inkwell-gold',
  },
  cards: {
    default: 'card-inkwell',
    dark: 'card-inkwell-dark',
  },
  colors: {
    navy: 'text-inkwell-navy',
    gold: 'text-inkwell-gold',
    charcoal: 'text-inkwell-charcoal',
    white: 'text-white',
    bgNavy: 'bg-inkwell-navy',
    bgGold: 'bg-inkwell-gold',
    bgWhite: 'bg-inkwell-white',
  },
} as const;
