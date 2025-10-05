# Changelog

All notable changes to this project are documented here.

## [1.0.5] – 2025-10-05

### 🔧 **TypeScript & Developer Experience Improvements**

#### Fixed

- **Trace Logger System** — Complete overhaul of tracing infrastructure
  - Resolved "TraceLogger has no call signatures" errors across all plotboards files
  - Updated all trace calls to use proper `trace.log(message, type, level, metadata)` API
  - Fixed test mocks to match the correct trace logger interface
  - Now properly traces performance, user actions, and storage operations

- **Storage Manager Interface** — Enhanced storage compatibility
  - Added missing methods: `getItem()`, `setItem()`, `removeItem()`, `getAllKeys()`
  - Created compatibility layer for existing localStorage-style code
  - Resolved "Property does not exist" errors in plotboards storage operations

- **TypeScript Compilation Issues**
  - Fixed duplicate `PlotColumnType` identifier in PlotColumn.tsx
  - Resolved interface mismatches across storage and trace systems
  - Eliminated critical compilation blockers that were preventing builds

- **Test Suite Stability**
  - All plotboards tests now pass (200/200 tests passing)
  - Fixed trace mocking in test files to match updated API
  - Improved test reliability and eliminated flaky test failures

#### Developer Experience

- **Reduced TypeScript Errors** — From hundreds of compilation errors to mostly non-critical warnings
- **Improved Logging** — Consistent trace logging across all plotboards features with proper categorization
- **Better Error Messages** — Clear, actionable error information for debugging
- **Enhanced Type Safety** — Proper interfaces and compatibility layers prevent future type mismatches

#### Technical Details

- Updated 7 plotboards files with correct trace logger usage
- Added StorageManager compatibility methods for backward compatibility
- Fixed test mocks across 3 test suites
- Maintained 100% test pass rate throughout cleanup process
- Preserved all existing functionality while improving type safety

### Performance

- No performance impact — changes are purely type-safety and developer experience improvements
- Trace logging now provides better performance insights across the application
- Storage operations remain fast with added compatibility layer

### Testing

- **All 200 tests passing** including full plotboards test suite
- Enhanced test mocks for improved reliability
- Better test coverage for trace logging functionality

---

## [1.0.4] – 2025-10-05

### 🎯 **Major Feature Release: Enhanced Timeline Integration**

#### Added

- **Enhanced Timeline Service** (`enhancedTimelineService.ts`)
  - Comprehensive conflict detection system with 5 types of validation
  - Scene-to-timeline bidirectional linking with intelligent validation
  - Auto-detection of scene linkages based on content analysis
  - Timeline navigation between scenes in chronological order
  - Time anchoring system for critical story moments
  - Overall timeline health scoring (0-100 scale)
  - Optimization suggestions for timeline improvements

- **Timeline Validation Panel** (`TimelineValidationPanel.tsx`)
  - Visual conflict display with color-coded severity levels
  - Expandable conflict details with evidence and suggestions
  - Auto-fix integration for resolvable timeline issues
  - Interactive navigation to problematic events and scenes
  - Overall timeline health dashboard

- **Scene Linkage Suggestions** (`SceneLinkageSuggestions.tsx`)
  - AI-powered scene linkage recommendations
  - Confidence scoring with detailed reasoning
  - Accept/dismiss functionality for suggestions
  - Progress tracking for project linkage completion
  - Batch operation support

- **Timeline Navigation** (`TimelineNavigation.tsx`)
  - Previous/next scene navigation in timeline order
  - Concurrent scene detection and display
  - Visual timeline position indicators
  - Quick actions for timeline overview

- **Enhanced Timeline Panel Integration**
  - Modern tabbed interface (Events, Validation, Linkages, Navigation)
  - State management across tabs with enhanced event selection
  - Real-time updates after linkage changes
  - Responsive design improvements

#### Conflict Detection Types

- **Time Overlap Conflicts**: Detects characters appearing simultaneously in different locations
- **Character Presence Validation**: Ensures timeline events match chapter character assignments
- **Location Mismatch Detection**: Identifies impossible travel times between locations
- **POV Inconsistencies**: Validates POV characters are included in event participant lists
- **Chronological Errors**: Catches invalid time ranges and temporal inconsistencies

#### Technical Improvements

- **Comprehensive Test Suite**: 22 new tests covering all enhanced timeline functionality
- **Performance Optimization**: Validated for projects with 1000+ timeline events
- **Type Safety**: Full TypeScript implementation with comprehensive interfaces
- **Error Handling**: Graceful degradation with informative error messages
- **Storage Optimization**: Smart caching and localStorage efficiency improvements

### Performance

- Timeline validation completes in <5 seconds for complex projects
- Auto-detection processes large timelines efficiently
- Smart caching reduces repeated computation overhead
- Memory optimization for large project handling

### Testing

- Total test suite: 88 tests (66 existing + 22 new)
- 100% test pass rate with comprehensive edge case coverage
- Performance benchmarking for large datasets
- Error scenario validation

## [1.0.3] – 2025-10-05

### Added

- **Professional Design System**: Comprehensive CSS variable system with consistent colors, typography, spacing, and theming
- **Enhanced Main Layout**: Modern collapsible sidebar with smooth animations and responsive design
- **Professional Dashboard**: Improved project overview with onboarding flow, quick actions, and writing statistics
- **Enhanced Writing Experience**: Focus mode improvements, real-time statistics, auto-save indicators, and progress tracking
- **Professional Empty States**: Better user onboarding with guided setup and helpful tips for new users
- **Dark Mode Support**: Complete theming system with proper contrast ratios across all components

### Improved

- **User Experience**: Clear visual hierarchy and intuitive navigation flows
- **Onboarding**: Welcome screens and guidance for first-time users
- **Writing Statistics**: Real-time word count, reading time, and daily goal progress
- **Responsive Design**: Better mobile and tablet experience
- **Accessibility**: Improved focus management and keyboard navigation

### Technical

- New MainLayout component with collapsible sidebar architecture
- EnhancedDashboard with professional project management UI
- EnhancedWritingPanel with focus mode and writing statistics
- Professional empty state components for better UX
- CSS design system with semantic color tokens and spacing scales
- Improved component architecture and code organization

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
