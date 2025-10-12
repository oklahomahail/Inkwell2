# Constants

This directory contains global constants used throughout the Inkwell application.

## Usage

All constants are re-exported through the barrel file (`index.ts`). Always import constants through the barrel file rather than directly from individual files:

```typescript
// ✅ Good: Import from the barrel file
import { BRAND_NAME, TAGLINE_PRIMARY } from '@/constants';

// ❌ Bad: Direct import from individual files
import { BRAND_NAME } from '@/constants/brand';
```

## Available Constants

### Brand Constants (`brand.ts`)

Brand-related constants including name, taglines, and colors:

- `BRAND_NAME`: The full name of the application
- `TAGLINE_PRIMARY`: Main tagline used in marketing
- `TAGLINE_SECONDARY`: Secondary tagline for additional context
- `BRAND_COLORS`: Object containing the brand color palette
  - `DEEP_NAVY`
  - `WARM_GOLD`
  - `CHARCOAL`

For legacy support, a default export `BRAND` object is also available, but prefer using the named exports.
