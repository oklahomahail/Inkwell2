# Changelog

All notable changes to this project are documented here.

## [1.0.6] – 2025-10-06

### 🚀 **Major Feature Release: Comprehensive Project Management & Onboarding**

#### Added

- **Interactive Guided Tour System** — Complete first-time user onboarding experience
  - Spotlight-based step-by-step feature introduction with keyboard navigation
  - Progressive feature discovery with contextual hints and prioritized tooltips
  - Smart tour state management with persistent progress tracking
  - Multiple tour types: first-time users, feature-specific, and contextual guidance
  - Integration with empty states including option to explore sample projects
  - Auto-start for first-time users with manual tour restart capability

- **Sample Demo Project** — "The Midnight Library" showcasing all features
  - Complete multi-chapter story structure with rich metadata
  - Character profiles, plot threads, and timeline events
  - Genre classification and writing goals demonstration
  - Integrated with guided tour for hands-on feature exploration

- **Project Template System** — Genre-based project creation
  - Pre-configured templates for Mystery, Romance, Sci-Fi, Fantasy, Literary Fiction, and Thriller
  - Template-specific chapter structures, character archetypes, and plot frameworks
  - Customizable genre selection with smart defaults
  - Seamless integration with project creation workflow

- **Enhanced Project Browser** — Advanced project management interface
  - Fuzzy search across project names, descriptions, content, and tags
  - Advanced filtering by favorites, genres, tags, and project status
  - Multiple sorting options: recent, alphabetical, word count, progress, creation date
  - Visual project cards with rich metadata display
  - Project statistics: word count, completion percentage, last modified

- **Project Favoriting System** — Organize important projects
  - One-click favorite/unfavorite with persistent storage
  - Filter favorites for quick access to priority projects
  - Visual indicators throughout the interface
  - Integrated with search and sorting functionality

- **Project Tagging System** — Flexible project organization
  - Custom tag creation and management with color coding
  - Tag-based filtering and search capabilities
  - Bulk tagging operations for efficient organization
  - Tag analytics and usage statistics

- **Project Context Menu** — Right-click actions for efficient project management
  - Quick actions: favorite, rename, duplicate, delete, export
  - Contextual actions based on project state and user permissions
  - Keyboard shortcuts for power users
  - Confirmation dialogs for destructive actions

- **Project Insights Dashboard** — Writing analytics and progress tracking
  - Writing velocity charts and trends analysis
  - Time spent tracking with daily/weekly/monthly breakdowns
  - Genre distribution visualization across all projects
  - Word count trends and writing streak tracking
  - Goal progress monitoring and achievement tracking

- **Enhanced Dashboard V2** — Unified project and insights interface
  - Toggleable views between project browser and analytics
  - Smart empty state handling with onboarding guidance
  - Responsive design optimized for various screen sizes
  - Integration with tour system for contextual help

#### Enhanced Features

- **Advanced Search Capabilities**
  - Fuzzy matching algorithm with relevance scoring
  - Multi-field search across all project metadata
  - Real-time search results with debounced input
  - Search history and saved search functionality

- **Project Metadata Management**
  - Comprehensive metadata tracking with local storage persistence
  - Automatic metadata updates on project interactions
  - Backup and restore functionality for project data
  - Migration support for existing project structures

#### Technical Implementation

- **New React Hooks**
  - `useProjectMetadata`: Manages favorites, tags, and project-related metadata
  - `useProjectSearch`: Provides sophisticated search and filtering capabilities
  - `useTourState`: Handles guided tour progression and state management

- **New Components**
  - `GuidedTour`: Interactive tour system with spotlight effects
  - `EnhancedProjectBrowser`: Advanced project management interface
  - `ProjectInsights`: Analytics dashboard with charts and statistics
  - `EnhancedDashboardV2`: Unified dashboard with project and insights views
  - `ProjectTemplateSelector`: Genre-based template selection interface

- **Enhanced Services**
  - Tour progression tracking with localStorage persistence
  - Project template generation and customization
  - Advanced search indexing and fuzzy matching algorithms
  - Project analytics calculation and trend analysis

### Performance

- Optimized search performance with debounced input and indexed searching
- Efficient metadata storage with selective localStorage updates
- Lazy loading for project insights and analytics components
- Smooth animations and transitions throughout the interface
- Memory-efficient tour state management with cleanup

### User Experience

- **First-Time User Journey**: Complete onboarding from account creation to first project
- **Progressive Disclosure**: Features introduced gradually based on user progress
- **Contextual Help**: Always-available assistance through tour system
- **Power User Features**: Advanced search, bulk operations, and keyboard shortcuts
- **Visual Feedback**: Clear progress indicators, loading states, and success confirmations

### Testing

- Comprehensive test coverage for all new hooks and components
- User journey testing from onboarding through advanced features
- Performance testing with large project datasets
- Cross-browser compatibility verification
- Accessibility compliance testing

### Documentation

- Updated README with comprehensive feature descriptions
- Detailed onboarding guide for new users
- Advanced features documentation for power users
- Developer documentation for contributing to the project
- API documentation for new hooks and services

---

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
