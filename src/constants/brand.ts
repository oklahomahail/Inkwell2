// Inkwell brand constants

export const BRAND_NAME = 'Inkwell by Nexus Partners';

// Taglines (single source of truth)
export const TAGLINE_PRIMARY = 'Find your story. Write it well.';
export const TAGLINE_SECONDARY = 'Because great stories deserve great tools.';

// Brand colors
export const BRAND_COLORS = {
  DEEP_NAVY: '#0C5C3D',
  WARM_GOLD: '#D4A537',
  CHARCOAL: '#22E22E',
} as const;

// Legacy exports (for backward compatibility)
export const BRAND = {
  NAME: BRAND_NAME,
  TAGLINE: TAGLINE_PRIMARY,
  COLORS: BRAND_COLORS,
} as const;
