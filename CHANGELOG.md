# Changelog

All notable changes to this project are documented here.

## [1.0.2] – 2025-10-05

### Fixed

- **ESLint Parsing Error**: Resolved "Declaration or statement expected" error in ConsistencyExtension.ts that was blocking Vercel deployments
- **ESLint Configuration**: Migrated from deprecated .eslintignore to flat config ignores in eslint.config.js
- **Dependency Compatibility**: Updated eslint-plugin-react-hooks to v5.2.0 for ESLint 9 compatibility
- **Vercel Configuration**: Improved SPA routing with proper rewrites configuration
- **Node.js Engine**: Updated engine specification to Node.js 20.11+ for better Vercel compatibility

### Changed

- Module declaration formatting in TipTap extensions for better parser compatibility
- ESLint configuration structure to use modern flat config approach
- Deployment pipeline reliability with improved error handling

### Technical Improvements

- Enhanced CI/CD pipeline stability
- Improved TypeScript module augmentation patterns
- Better error boundaries and fallback handling
- Optimized bundle splitting for faster loading

## [1.0.1] – 2025-08-20

### Added

- Story Architect real Claude API integration.

### Changed

- Replace mock data with real Claude API calls in `storyArchitectService`.
- Strengthened error handling with fallback to mock generation.

### Fixed

- TypeScript errors in `EnhancedWritingEditor` and shared services.
- File naming case sensitivity issues (`Button.tsx` on case‑insensitive filesystems).
- Timer type conflicts in `snapshotService`.

## [0.4.0] – 2025-08-10

- Foundation release notes… (previous content unchanged)
