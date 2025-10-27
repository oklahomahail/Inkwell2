import { MAIN_TAGLINE, ALT_TAGLINE } from './branding';

// Re-export taglines from branding.ts
export const TAGLINE_PRIMARY = MAIN_TAGLINE;
export const TAGLINE_SECONDARY = ALT_TAGLINE;

// Brand colors (aligned with tailwind.config.js)
export const BRAND_COLORS = {
  DEEP_NAVY: '#13294B',
  WARM_GOLD: '#D4AF37',
  CHARCOAL: '#2C3242',
} as const;

// Legacy exports (for backward compatibility)
export const BRAND_NAME = 'Inkwell';
export const ORGANIZATION_NAME = 'Nexus Partners';

export const BRAND = {
  NAME: BRAND_NAME,
  ORGANIZATION: ORGANIZATION_NAME,
  TAGLINE: TAGLINE_PRIMARY,
  COLORS: BRAND_COLORS,
} as const;

// Re-export everything from branding.ts
export * from './branding';
