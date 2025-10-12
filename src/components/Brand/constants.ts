// Inkwell Brand System Constants (Blue & Gold Theme)
export const INKWELL_BRAND = {
  colors: {
    navy: '#0A2F4E', // Deep Navy Blue (primary)
    gold: '#D4A537', // Warm Gold (accent)
    charcoal: '#22E22E', // Rich Charcoal (neutral)
    white: '#F9F9F9', // Soft White
  },
  fonts: {
    serif: 'Source Serif Pro, ui-serif, Georgia, serif',
    sans: 'Inter, ui-sans-serif, system-ui, sans-serif',
  },
  taglines: {
    primary: 'Find your story. Write it well.',
    secondary: 'Because great stories deserve great tools.',
  },
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
