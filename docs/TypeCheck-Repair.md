# TypeCheck Repair Pack

This document details the changes made to fix TypeScript type checking issues in the Inkwell codebase.

## Overview of Changes

### 1. Centralized Type Definitions

- Created `/src/types/index.ts` to house shared type definitions
- Consolidated duplicate types for Theme, ExportFormat, and others
- Established single source of truth for common interfaces

### 2. Feature Flag System

- Properly typed feature flag configuration
- Added strong types for flag categories and configuration
- Fixed AI Writing Assistant flag naming convention

### 3. PWA Service

- Made PWA service development-safe
- Added proper type definitions for registration hook
- Prevented build-time errors from virtual imports

### 4. Component Props

- Fixed PerformanceChart props to match usage
- Added proper typing for chart data and configuration
- Updated PhraseHygieneWidget to accept className

### 5. Test Improvements

- Fixed Sidebar test mocks with proper types
- Replaced Jest references with Vitest
- Added proper default mock states

### 6. Module Exports

- Cleaned up icon exports to match available components
- Fixed snapshot adapter imports
- Updated service exports for consistency

## Migration Steps

1. Update imports to use centralized types:

   ```typescript
   // Old
   import { Theme } from '@/context/AppContext';

   // New
   import { Theme } from '@/types';
   ```

2. Use strongly typed feature flags:

   ```typescript
   // Old
   const flag = FEATURE_FLAGS.some_flag;

   // New
   const flag = FEATURE_FLAGS.someFlag as FeatureFlag;
   ```

3. Update component props:
   ```typescript
   // Performance Chart
   interface PerformanceChartProps {
     type?: PerformanceChartType;
     rows?: Row[];
     xKey: string;
     yKey: string;
     height?: number;
     className?: string;
   }
   ```

## Future Considerations

1. Consider adding zod or io-ts for runtime type validation
2. Set up ESLint rules to prevent type duplication
3. Add test coverage for type boundaries
4. Consider using branded types for more type safety

## Related Issues

- Fixed: Duplicate type definitions (#123)
- Fixed: PWA registration errors (#145)
- Fixed: Feature flag type safety (#156)
- Fixed: Component prop type mismatches (#167)

## Testing

All changes have been verified with:

```bash
pnpm typecheck
pnpm test
```

## Notes

- Some files may require type assertion temporarily
- PWA functionality requires plugin in production only
- Review third-party component type definitions
