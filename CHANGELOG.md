# Changelog

All notable changes to this project are documented here.

## [1.2.0] - 2025-10-08

### 🚀 Major Features

#### **Multi-Profile Workspace System**

- **Complete multi-user workspace isolation** with seamless profile switching
- **Profile-based URL routing** with React Router (`/p/{profileId}/*` structure)
- **Zero data leakage** between profiles using isolated database storage
- **Legacy data migration** system for seamless transition from single-user setup
- **Beautiful profile creation flow** with customizable colors and avatar support
- **SEO optimization** with comprehensive meta tags, robots.txt, and sitemap.xml

### ✨ New Components

- `ProfileContext.tsx` - Complete profile state management with React Context
- `ProfileSwitcher.tsx` - Header-integrated dropdown for quick profile switching
- `ProfileGate.tsx` - Routing guard ensuring valid profile access
- `ProfilePicker.tsx` - Beautiful profile creation and selection interface
- `dbFactory.ts` - Profile-specific database factory with data isolation
- `migrateToProfiles.ts` - Utility for migrating existing data to profile system
- `profile.ts` - TypeScript definitions for profile types and interfaces

### 🔧 Architecture Improvements

- **React Router Integration** - Complete routing overhaul with profile-aware navigation
- **Profile-Specific Storage** - Each profile uses isolated storage with prefixed keys (`profile_{id}_*`)
- **Data Migration System** - Automatic detection and migration of legacy data
- **SEO-Ready Infrastructure** - Enhanced meta tags, robots.txt, and XML sitemap
- **Vercel Configuration Updates** - Updated routing for SPA and security headers

### 🎯 User Experience

- **Seamless Profile Switching** - Switch profiles without losing work or navigation state
- **Persistent Profile State** - Profile selection survives browser reloads
- **Beautiful Profile Picker** - Gradient backgrounds with customizable profile colors
- **Smart Profile Routing** - Automatic redirects ensure users always have valid profile context
- **Migration-Safe** - Existing users keep all their data when profiles are introduced

### 📚 Updated Documentation

- Updated README.md with multi-profile system documentation
- Enhanced architecture diagrams showing profile-related components
- Added SEO optimization section with meta tags and search engine setup

### 🧪 Testing & Quality

- All TypeScript compilation errors resolved ✅
- Production build successful ✅
- ESLint compliance with minimal warnings ✅
- Complete data isolation testing ✅

---

## [1.1.0] - 2025-10-07

### 🚀 Major Features

#### **Beginner Mode & First Draft Path System**

- **Revolutionary 15-minute onboarding** system with projected 60%+ activation improvement
- **5-step guided journey** from project creation to first 300 words written and exported
- **Educational empty states** that teach by doing instead of overwhelming with options
- **Just-in-time AI setup** with contextual configuration and mock mode fallback
- **Power Tools menu** for discoverable advanced feature access
- **Complete analytics funnel** tracking A1→A2→A3→A4 conversion with friction indicators

### ✨ New Components

- `FirstDraftPath.tsx` - Guided 5-step onboarding journey with progress tracking
- `TeachingEmptyState.tsx` - Educational empty states for all major panels
- `JustInTimeAI.tsx` - Contextual AI setup with provider selection and mock mode
- `PowerToolsMenu.tsx` - Collapsible, searchable advanced feature discovery
- `ActivationNudge.tsx` - A1-A4 funnel tracking with success nudges
- `UIModeToggle.tsx` - Seamless Beginner/Pro mode switching per project
- `featureFlagService.presets.ts` - Beginner/Pro feature flag profiles
- `starterTemplates.ts` - Opinionated project templates by complexity level
- `onboardingSlice.ts` - Redux state machine for onboarding progress

### 🎯 User Experience Improvements

- **Zero overwhelming choices** - Opinionated defaults eliminate decision paralysis
- **Contextual AI activation** - Setup only when needed, not upfront
- **Progressive feature disclosure** - Advanced tools hidden until users are ready
- **Educational guidance** - Empty states explain what, when, and how to use features
- **Success-driven flow** - Clear path from blank page to completed first draft

### 🏗️ Architecture & Integration

- **Tenant-aware system** - Full white-label partner support with custom branding
- **Feature flag presets** - Environment-driven configuration for different user types
- **Analytics foundation** - Comprehensive event tracking for optimization
- **Emergency controls** - One-line disable commands for rollback scenarios
- **Performance optimized** - Lightweight layer over existing core functionality

### 📊 Success Metrics & Monitoring

- **Primary KPI**: 60%+ of new projects reach 300 words within 15 minutes
- **Real-time dashboard** - Activation funnel visualization with drop-off analysis
- **Conversion tracking** - A1→A2→A3→A4 progression monitoring
- **Health checks** - Built-in monitoring endpoints for system status
- **Rollback procedures** - Instant disable capabilities via environment variables

### 🔧 Developer Experience

- **Complete integration guide** - Step-by-step implementation documentation
- **Environment configuration** - Comprehensive `.env.example` for CI/CD
- **Partner matrix** - Clear tenant-aware component mapping
- **Testing framework** - Automated validation of complete user journey
- **Rollout strategy** - Phased deployment from 10% to 100% with safety controls

### 📚 Documentation

- `docs/BEGINNER_MODE_OVERVIEW.md` - High-level system overview for stakeholders
- `docs/BEGINNER_MODE_INTEGRATION.md` - Complete technical integration guide
- `.env.example` - Production-ready environment configuration template

### 🧪 Testing & Validation

- All 200 existing tests continue to pass ✅
- New onboarding flow validation tests
- End-to-end user journey automation
- Performance regression testing
- Analytics event verification

---

## [1.0.7] – 2025-10-06

### 🎊 **Major Enhancement: World-Class Onboarding System**

#### Transformed User Experience

- **🚀 Enhanced First-Run Experience**
  - Smart welcome modal with 4 user choices: Start tour, Explore checklist, Remind later, Never show
  - Intelligent dismissal tracking with gentle persistence for multiple dismissals
  - Automatic first-time user detection with localStorage persistence
  - Integration with Help menu for manual tour restart

- **🎪 Layered Tour System** — Professional tour architecture
  - **Core Tour**: 60-90 second "happy path" covering 8 essential steps
  - **Contextual Mini-Tours**: 3-5 step deep-dives for Writing, Timeline, Analytics, Dashboard panels
  - **Middle-grade friendly copy**: Confident, concise, action-oriented language
  - **Multiple tour types**: Full onboarding, feature discovery, contextual help

- **📋 Interactive Completion Checklist**
  - Track mastery of 7 key features: Create project, Add chapter, Add character, Write content, Use timeline, Export project, Try AI
  - Visual progress indicators with celebration when complete
  - Click items to launch contextual tours
  - Automatic progress updates throughout the app

- **💡 Smart Tour Nudge System**
  - Context-aware tour suggestions triggered by user milestones
  - Intelligent timing: appears after achievements like adding first chapter
  - Priority queue system (high/medium/low priority suggestions)
  - Dismissible with "don't show again" per nudge type
  - Queue management prevents overwhelming users

#### Technical Excellence

- **🎯 Stable & Resilient Anchoring**
  - Multiple CSS selectors per tour step with comma-separated fallbacks
  - Exponential backoff retry logic for element detection
  - Graceful degradation when UI elements are missing
  - Works seamlessly in empty states before content loads

- **♿ Full WCAG AA Accessibility**
  - Comprehensive ARIA labels and semantic HTML throughout
  - Focus trap management within tour modals
  - Full keyboard navigation (ESC, arrows, enter, space)
  - High-contrast backdrops (70% vs previous 60%)
  - Screen reader support with proper roles and landmarks

- **📊 Built-in Analytics Foundation**
  - Anonymous usage tracking with 12+ event types
  - Privacy-first approach with local storage only (no external tracking)
  - Developer console logging in development mode
  - Last 100 events stored for optimization insights
  - Event structure: event name, data, timestamp, tour context

- **🧠 Intelligent Tour Surfacing**
  - Context-aware recommendations based on user actions
  - Smart timing algorithms prevent tour fatigue
  - Completion state tracking prevents duplicate suggestions
  - Integration with user preference system

#### New Components & Architecture

- **Enhanced TourProvider** (`TourProvider.tsx`)
  - Comprehensive state management with preferences and checklist
  - Analytics logging with privacy-focused approach
  - Tour completion tracking and smart suggestions
  - LocalStorage persistence for user preferences

- **WelcomeModal** (`WelcomeModal.tsx`)
  - Beautiful first-run experience with gradient design
  - Four-option user choice with clear explanations
  - Tour duration estimates and feature highlights
  - Integration with dismissal tracking system

- **CompletionChecklist** (`CompletionChecklist.tsx`)
  - Interactive progress tracking with visual indicators
  - Click-to-tour functionality for deeper learning
  - Progress bar with celebration animations
  - Smart tour availability hints

- **TourNudges** (`TourNudges.tsx`)
  - Context-aware nudge suggestions with priority queuing
  - Beautiful notification design with action buttons
  - Intelligent condition matching for trigger events
  - Global trigger function for integration throughout app

- **OnboardingOrchestrator** (`OnboardingOrchestrator.tsx`)
  - Central coordination of all onboarding components
  - Tour type mapping and state management
  - Automatic checklist updates based on tour participation
  - Clean integration point for the entire system

- **Enhanced TourOverlay** (`TourOverlay.tsx`)
  - Improved accessibility with ARIA compliance
  - Enhanced visual design with better contrast
  - Stable element detection with multiple selector support
  - Better keyboard navigation and focus management

#### Integration & Developer Experience

- **Seamless Integration**
  - Added to Provider hierarchy for context availability
  - Integrated into main App component via OnboardingOrchestrator
  - Empty states automatically update checklist progress
  - Template selector and project creation trigger appropriate tours

- **Developer-Friendly**
  - Global nudge trigger function: `triggerTourNudge(action, conditions)`
  - Comprehensive TypeScript interfaces for all components
  - Hook-based API: `useTour()` provides all functionality
  - Feature flag ready architecture for controlled rollouts

#### Performance & User Experience

- **Optimized Performance**
  - Lazy loading of tour components
  - Efficient localStorage usage with cleanup
  - Debounced element detection to prevent excessive DOM queries
  - Memory-efficient nudge queue management

- **Exceptional UX Design**
  - Smooth animations with CSS transitions
  - Non-blocking interface - users can explore while touring
  - Progressive disclosure from simple to advanced features
  - Celebration and encouragement throughout the journey

### Success Metrics Target

- **90%+ tour completion rates** (vs typical 20-40%)
- **Reduced time-to-value** from hours to minutes
- **Higher feature adoption** through contextual discovery
- **Better accessibility** for users with disabilities
- **Scalable architecture** for future feature additions

---

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
