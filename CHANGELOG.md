# Changelog

All notable changes to this project are documented here.

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
