# Changelog

All notable changes to this project are documented here.

## [Unreleased]

### Added - Multi-Provider AI System

**Focus**: User Choice, Flexibility, Free Models

#### AI Provider System (#TBD)

- **Multi-Provider Support** - Choose from multiple AI providers
  - OpenRouter (recommended): Free models + unified gateway to 20+ providers
  - OpenAI: GPT-4o, GPT-4 Turbo, GPT-3.5, gpt-4o-mini (free tier)
  - Anthropic: Claude 3.5 Sonnet, Claude 3 Opus, Claude 3 Haiku
  - Extensible architecture for adding new providers

- **Free Models Available**:
  - Gemini 2.0 Flash (OpenRouter, free)
  - Llama 3.2 3B (OpenRouter, free)
  - Mistral 7B (OpenRouter, free)
  - GPT-4o Mini (OpenAI, free tier)

- **Premium Model Support**:
  - User-provided API keys (encrypted client-side)
  - Automatic key validation and testing
  - Per-provider usage tracking
  - Cost transparency (per 1M token pricing)

- **Features**:
  - Streaming text generation with progress callbacks
  - Auto-fallback to free models on key errors
  - Abort/cancel long-running requests
  - System messages and temperature control
  - Per-document provider selection support

- **Security**:
  - Client-side API key encryption (XOR with static key)
  - Keys never sent to Inkwell backend
  - Encrypted localStorage storage
  - Key format validation

- **UI Components**:
  - `AiModelSettings` - Complete settings interface
  - Provider/model selection dropdowns
  - API key management with show/hide
  - Usage statistics dashboard
  - Preference toggles (auto-fallback, tracking)

- **Files**:
  - `src/ai/types.ts` - Core types and interfaces
  - `src/ai/providers/openaiProvider.ts` - OpenAI adapter (streaming support)
  - `src/ai/providers/anthropicProvider.ts` - Anthropic adapter (streaming support)
  - `src/ai/providers/openrouterProvider.ts` - OpenRouter adapter (20+ models)
  - `src/ai/registry.ts` - Provider registry and helpers
  - `src/services/aiService.ts` - Main AI service orchestration
  - `src/services/aiSettingsService.ts` - Settings and encrypted storage
  - `src/components/Settings/AiModelSettings.tsx` - UI component
  - `docs/ai-providers.md` - Complete documentation
  - `docs/examples/ai-generation-example.tsx` - React examples

- **Tests**: 38 comprehensive tests (100% pass rate)
  - `src/ai/__tests__/providers.test.ts` - 22 provider adapter tests
  - `src/services/__tests__/aiService.test.ts` - 16 service tests
  - Coverage: 79.53% statements, 66.5% branches

- **Usage**:

  ```typescript
  import { aiService, aiSettingsService } from '@/ai';

  // Use free model (no key required)
  const result = await aiService.generate('Write a poem');

  // Add API key for premium models
  aiSettingsService.setApiKey('openai', 'sk-...');
  const premium = await aiService.generate('Analyze this', {
    providerId: 'openai',
    modelId: 'gpt-4o',
  });

  // Streaming
  for await (const chunk of aiService.generateStream('Tell a story')) {
    console.log(chunk.content);
  }
  ```

### Added - Production Readiness Pack

**Focus**: Polish, Visibility, Stability

#### Bundle Size Dashboard (#TBD)

- **Enhanced Bundle Reporting** - JSON and HTML report generation
  - JSON output for CI artifacts and automation
  - HTML dashboard with visual size breakdown
  - Tracked metrics: total size, per-bundle deltas, status indicators
  - CLI flags: `--output-json`, `--output-html`

- **CI Integration**:
  - Automatic report generation on every build
  - Uploaded as GitHub Actions artifacts
  - Badge support for README integration
  - Historical tracking via baseline file

- **Files**:
  - `scripts/check-bundle-sizes.mjs` - Enhanced with JSON/HTML export
  - `scripts/generate-bundle-badge.mjs` - Badge data generator
  - `.github/workflows/ci.yml` - Updated artifact uploads

#### Error Boundary UI Tests (#TBD)

- **Comprehensive Error Boundary Testing** - 27 new tests, 100% pass rate
  - AppErrorBoundary: 13 tests covering app/feature/component levels
  - RecoveryErrorBoundary: 14 tests covering autosave/snapshot failures
  - Full coverage of recovery tiers (Supabase → localStorage → user upload)
  - Edge case handling (health checks, service failures, file uploads)

- **Test Coverage**:
  - Error catching and fallback UI rendering
  - Retry and reload button functionality
  - Report issue and copy details features
  - Manual backup file upload flow
  - Recovery success/failure states
  - Development vs production mode behavior

- **Files**:
  - `src/components/ErrorBoundary/__tests__/AppErrorBoundary.test.tsx` - 13 tests
  - `src/components/ErrorBoundary/__tests__/RecoveryErrorBoundary.test.tsx` - 14 tests

#### Performance Baseline Metrics (#TBD)

- **Performance Harness** - Baseline metrics tracking for snappiness
  - Quantified targets: render < 200ms, autosave < 50ms, snapshot < 300ms
  - 12 performance tests covering critical operations
  - Historical baseline tracking (30-entry rolling window)
  - CI integration for regression detection

- **Tracked Metrics**:
  - IndexedDB operations (read/write) - Target: < 50ms
  - Snapshot creation with compression - Target: < 300ms
  - Word count calculation - Target: < 10ms
  - Cross-chapter search - Target: < 100ms
  - Large project handling - Target: < 50ms
  - Content compression - Target: < 200ms

- **Scripts**:
  - `tests/performance/baseline.test.ts` - Performance test suite
  - `scripts/performance-report.mjs` - Report generator with pass/warn/fail
  - `performance-baseline.json` - Historical baseline storage

- **Package Scripts**:
  - `pnpm test:perf` - Run performance tests
  - `pnpm test:perf:report` - Generate performance report

#### Beta Changelog Documentation (#TBD)

- **Production-Ready Documentation** - Comprehensive release notes
  - Stability highlights (E2EE, 100% model coverage, 0 regressions)
  - Performance metrics baseline with actual vs target
  - Bundle guard status and size deltas
  - Next steps: AI streaming, performance dashboard, v1.0 stabilization

### Summary

This release establishes production-readiness infrastructure:

- ✅ **Bundle Dashboard**: Visual tracking + automated reporting
- ✅ **Error Boundary Tests**: 27 tests ensuring graceful failure handling
- ✅ **Performance Baseline**: Quantified "snappiness" targets with CI enforcement
- ✅ **Beta Changelog**: Clear communication of stability milestones

**Test Status**: 1374 tests total → 1401 tests (+27) → 0 regressions
**Coverage**: Model coverage remains at 100% branch coverage

---

## [0.9.1-beta] - 2025-11-05

### Added - Onboarding, EPUB Export, Telemetry & Bundle Guard

**Major Features**: Welcome Project (#6), Quick Start Docs (#7), EPUB Export (#9), Telemetry (#14), Bundle Guard (#15)

#### Welcome Project & Onboarding (#6, #7)

- **Welcome Project** - Pre-populated sample project for new users
  - 3 chapters with embedded quick start guide
  - Demonstrates core features (chapters, scenes, characters)
  - Auto-created on first visit, deleted after tour completion
  - Feature-flagged: `VITE_ENABLE_WELCOME_PROJECT` (default: true)

- **Quick Start Documentation** - In-project guidance links
  - Help menu with documentation shortcuts
  - Learn More links in onboarding modals
  - Contextual documentation for export, AI tools

- **Telemetry Events**:
  - `onboarding.welcome.created` - Welcome project created
  - `onboarding.welcome.deleted` - Welcome project deleted
  - `onboarding.welcome.skipped` - User skipped welcome project
  - `onboarding.welcome.completed` - User completed onboarding

#### EPUB 3.0 Export (#9)

- **EPUB Export (Beta)** - Minimal, valid EPUB 3.0 with single-spine content
  - Package metadata (title, author, language, UUID)
  - Navigation document (TOC from chapter titles)
  - Single content document with all chapters
  - Mandatory EPUB structure (mimetype, container.xml, package.opf)
  - Feature-flagged: `VITE_ENABLE_EPUB_EXPORT` (default: true)

- **Validation**:
  - Passes `epubcheck --mode basic`
  - Opens in Calibre, Apple Books, Google Play Books
  - Kindle-compatible (via KindleGen conversion)

- **Known Limitations (Phase 1)**:
  - No custom CSS (basic reader defaults)
  - No cover image
  - Single-spine only (one HTML file)
  - No extended metadata (publisher, date, rights)

- **Files**:
  - `src/services/export/exportService.epub.ts` (295 lines)
  - `src/services/__tests__/exportService.epub.test.ts` (27 tests, all passing)
  - `.implementations/EPUB_FOUNDATION_CHECKLIST.md` (comprehensive QA guide)

- **Telemetry Events**:
  - `export.epub.success` - EPUB export succeeded
  - `export.epub.failure` - EPUB export failed

#### Telemetry & Privacy (#14)

- **Session Tracking** - Anonymous session monitoring
  - `session.start` (on app boot)
  - `session.end` (on unload/background)
  - Session ID (UUID v4) in sessionStorage, cleared on tab close

- **Export Tracking** - Anonymous export metrics
  - `export.run` (format: PDF/DOCX/EPUB/MARKDOWN/TXT, chapters: all/subset)
  - No content, titles, or identifiable data collected

- **Privacy**:
  - All telemetry PII-free (no writing, project names, or personal info)
  - Opt-out via Settings → Privacy (coming) or localStorage flag
  - `inkwell_telemetry_disabled=true` disables all events
  - Transmitted via `navigator.sendBeacon()` API

- **Files**:
  - `src/services/telemetry.ts` - Session management, export events
  - `src/main.tsx` - Session start/end wiring
  - `docs/privacy.md` - Privacy documentation with event tables

#### Bundle Guard (#15)

- **CI Bundle Size Enforcement** - Automated bundle size monitoring
  - Per-chunk thresholds: +5% warn, +10% error
  - 22 tracked chunks (largest: index-CbLRcMAx.js @ 1127 KB)
  - CI fails if any chunk exceeds error threshold
  - Bundle baseline: `bundle-baseline.json`

- **Scripts**:
  - `scripts/generate-bundle-baseline.mjs` - Generate baseline from build
  - `scripts/check-bundle-sizes.mjs` - CI validation script

- **CI Integration**:
  - `.github/workflows/ci.yml` - Added bundle size guard step
  - Badge in README: [![Bundle Guard](https://img.shields.io/badge/bundle-guarded-success)](...)

### Documentation

- **[docs/autosave.md](docs/autosave.md)** - Autosave system guide (debounce, latency, troubleshooting)
- **[docs/backup.md](docs/backup.md)** - Backup & recovery system (shadow copies, manual backups, 3-tier recovery)
- **[docs/exporting.md](docs/exporting.md)** - Export format guide (PDF, DOCX, Markdown, EPUB, TXT)
- **[docs/privacy.md](docs/privacy.md)** - Privacy & telemetry documentation
- **[docs/README.md](docs/README.md)** - Documentation index with quick links

### Changed

- **README.md** - Updated features list with links to documentation
- **README.md** - Added feature flags and privacy opt-out tables
- **README.md** - Added bundle guard badge

### Fixed

- **Language normalization** - EPUB nav/content now normalize language codes to lowercase
- **Export telemetry** - Added `emitExportRun()` to all export methods

---

## [0.9.0-beta] - 2025-02-04

### Added - E2EE Foundation (Client-Side Encryption for Cloud Backups)

**Major Feature**: Optional zero-knowledge end-to-end encryption for Supabase cloud sync.

**Core Capabilities**:

- **Client-Side Encryption**:
  - Argon2id key derivation (memory-hard, ~300-500ms)
  - XChaCha20-Poly1305 authenticated encryption
  - Lazy-loaded libsodium WASM (+150KB, only when E2EE enabled)
  - PBKDF2 + AES-GCM fallback for WebCrypto-only environments

- **Storage Modes**:
  - **Local Only**: Device-only storage (no cloud)
  - **Hybrid Sync**: Manual backup/restore with optional E2EE
  - **Cloud Sync**: Automatic background sync (Beta)

- **Security Properties**:
  - ✅ Zero-knowledge: Server never sees plaintext keys or content
  - ✅ Master key derived from passphrase, never leaves device
  - ✅ DEK (data encryption key) wrapped with master key before storage
  - ✅ Forward-compatible schema versioning (`crypto_version`)
  - ✅ Row-level security via Supabase RLS policies

- **User Experience**:
  - Storage Mode selector in Settings
  - Passphrase set/change flow with strength meter
  - Recovery Kit export (JSON download)
  - Recovery Kit import (drag-drop or file browse)
  - Manual backup/restore buttons
  - Real-time sync status indicator (synced, pending, offline, error)

- **Background Sync Worker** (Beta):
  - Queued push/pull with exponential backoff
  - Max 5 retry attempts with up to 5-minute backoff
  - Telemetry: track sync duration, success/failure rates
  - Pause/resume on connectivity changes

**Database Schema**:

- Projects table: `crypto_enabled`, `wrapped_dek`, `kdf_params`, `crypto_version`
- Chapters table: `content_ciphertext`, `content_nonce`, `crypto_version`
- Migration: `supabase/migrations/20250204000000_e2ee_foundation.sql`

**Files Added**:

- `src/types/crypto.ts` - Type definitions
- `src/services/cryptoService.ts` - Core crypto (Argon2id, XChaCha20-Poly1305)
- `src/services/syncService.ts` - Manual push/pull with E2EE gate
- `src/services/localGatewayImpl.ts` - IndexedDB integration
- `src/services/backgroundSyncWorker.ts` - Background sync with queue and backoff
- `src/components/Settings/StorageModePanel.tsx` - Settings UI
- `src/services/__tests__/cryptoService.test.ts` - Crypto tests (6/9 passing, 3 browser-only)
- `supabase/migrations/20250204000000_e2ee_foundation.sql`

**Documentation**:

- `docs/E2EE_ARCHITECTURE.md` - Complete architecture overview
- `docs/E2EE_IMPLEMENTATION_GUIDE.md` - Step-by-step production guide

**Tradeoffs**:

- ⚠️ No server-side search on encrypted fields
- ⚠️ Passphrase loss = unrecoverable data (by design)
- ⚠️ ~1-5ms encryption overhead per chapter

**Testing**:

- 737/740 tests passing (3 encryption tests skipped in Node env, work in browser)
- Manual backup/restore tested locally
- Recovery Kit export/import tested

**Next Steps**:

- [ ] Apply Supabase migration to dev environment
- [ ] Enable `VITE_ENABLE_E2EE_SYNC=true` in production
- [ ] Wire StorageModePanel into main Settings view
- [ ] Beta test with 5-10 users

**GitHub Branch**: `feat/e2ee-supabase-sync` (5 commits ahead of main)

**Security**: This feature implements zero-knowledge encryption. Supabase never sees plaintext content when E2EE is enabled.

---

## [0.7.1] - 2025-01-XX

### Added

- **Theme Reactivity for Export Dashboard** - ChapterDistributionChart and ExportStats now smoothly re-render on theme changes
- **ExportDashboardErrorBoundary** - Graceful error handling for Export Dashboard with retry mechanisms

### Improved

- 60fps performance for theme transitions using `requestAnimationFrame`
- Memory leak prevention with proper event listener cleanup
- Error recovery UX with user-friendly fallback UI

### Technical

- Added `themechange` event integration for reactive components
- 735/735 tests passing
- 0 TypeScript errors
- Pre-commit hooks verified

**GitHub Release**: [v0.7.1](https://github.com/oklahomahail/Inkwell2/releases/tag/v0.7.1)

---

## [0.7.0] - 2024-12-XX

### Added - Export Dashboard with Telemetry & Analytics

**Major Feature**: Comprehensive export history visualization and analytics system.

**Core Components**:

- **Export Dashboard** (`ExportDashboard.tsx`) - Main dashboard with stats, charts, and export history
- **Export Statistics** (`ExportStats.tsx`) - Real-time export metrics (total, success/fail, duration, word counts)
- **Chapter Distribution Chart** (`ChapterDistributionChart.tsx`) - Visual word count distribution across chapters
- **Exports Table** (`ExportsTable.tsx`) - Detailed export records with timestamps and metadata
- **Export History Service** (`exportHistory.ts`) - IndexedDB-backed persistence and querying

**Export Capabilities**:

- Quick Actions: Export PDF, DOCX, Markdown with one click
- Export tracking with comprehensive telemetry
- Export history persistence (last 50 exports per project)
- Clear history functionality

**Integration**:

- Accessible via Command Palette (⌘E shortcut)
- ViewSwitcher integration with lazy loading
- Full dark mode support
- Error boundaries and loading states

**Testing**:

- 14 comprehensive E2E tests (Playwright)
- Tests cover: basic UI, export actions, history, stats, persistence, edge cases

**Files Added**:

- `src/components/Dashboard/ExportDashboard.tsx`
- `src/components/Dashboard/ExportStats.tsx`
- `src/components/Dashboard/ExportsTable.tsx`
- `src/components/Dashboard/ChapterDistributionChart.tsx`
- `src/services/exportHistory.ts`
- `src/types/export.ts`
- `e2e/export-dashboard.spec.ts`

**Documentation**:

- Export Dashboard integrated into README
- E2E test documentation

**GitHub Release**: [v0.7.0](https://github.com/oklahomahail/Inkwell2/releases/tag/v0.7.0)

---

## [Unreleased - Pre v0.7.0]

### Added - User-Defined Data Persistence System

**New Feature:** Users now have full control over where and how their writing data is stored.

**What's New:**

- **Three Storage Modes:**
  - **Local-Only**: All data stays on your device, no cloud sync
  - **Cloud Sync**: Real-time synchronization with Supabase backend
  - **Hybrid**: Local-first with periodic cloud backups
- **User-Facing Controls:**
  - Settings page for choosing and configuring persistence mode
  - Real-time sync status and storage usage insights
  - Manual sync and backup triggers
  - Data export functionality (JSON format)
- **Technical Implementation:**
  - `userPersistenceService`: Central service for persistence management
  - `useUserPersistence`: React hook for component integration
  - Smart migration between storage modes
  - Conflict resolution UI for sync conflicts
  - Browser capability detection (private mode, storage persistence)
- **Privacy-First Design:**
  - User choice at every step
  - Clear explanations of each mode's tradeoffs
  - No data sent to cloud without explicit user consent
  - Easy export and portability

**Files Added:**

- `src/types/persistenceConfig.ts` - Type definitions
- `src/services/userPersistenceService.ts` - Core service
- `src/hooks/useUserPersistence.ts` - React hook
- `src/components/Settings/PersistenceModeSelector.tsx` - Mode selection UI
- `src/components/Settings/PersistenceAdvancedSettings.tsx` - Advanced controls
- `src/components/Settings/DataPersistenceSettingsPage.tsx` - Full settings page

**Documentation:**

- `DATA_PERSISTENCE_IMPLEMENTATION.md` - Technical implementation guide
- `USER_GUIDE_DATA_PERSISTENCE.md` - User-facing documentation
- `USER_PERSISTENCE_SUMMARY.md` - Feature summary
- `INTEGRATION_EXAMPLES.md` - Code integration examples

**Next Steps:**

- Integration with main settings navigation
- Onboarding flow for first-time setup
- Migration progress UI
- Comprehensive testing

For technical details, see [DATA_PERSISTENCE_IMPLEMENTATION.md](./DATA_PERSISTENCE_IMPLEMENTATION.md)

### Removed - Multi-Profile Workspace System

**Breaking Change:** Inkwell has been simplified to a single-user model. The multi-profile workspace system has been completely removed.

**What Changed:**

- Removed all profile-related contexts, providers, components, and hooks
- Simplified authentication to direct user access (no profile layer)
- Migrated from profile-based routes (`/p/{profileId}/*`) to direct routes (`/dashboard`, `/writing`, etc.)
- Updated storage keys from `inkwell:profile:{id}:*` to `inkwell:user:*`
- Removed ProfileContext, ProfileProvider, ProfileMenu, ProfileSwitcher, ProfilePicker, ProfileGate
- All tests updated to use user context instead of profile context

**Migration Handled Automatically:**

- ✅ Legacy storage keys automatically migrated on first app load
- ✅ Old profile-based URLs redirect to new routes
- ✅ User data preserved during migration
- ✅ No manual user action required

**Benefits:**

- Simpler codebase (~2,000 lines removed)
- Clearer data ownership model
- Reduced complexity and maintenance burden
- Better performance (no profile switching overhead)

For technical details, see [PROFILE_REMOVAL_COMPLETE.md](./PROFILE_REMOVAL_COMPLETE.md)

### Added - Spotlight Tour UI (Phase 2 - Integration Complete)

- **Core UI Components** for guided product tours
  - **SpotlightOverlay**: Main orchestrator with keyboard navigation and accessibility
  - **SpotlightMask**: SVG-based dark overlay with spotlight cutout and focus ring
  - **SpotlightTooltip**: Positioned tooltip card with step content, progress, and navigation
  - **useSpotlightUI**: React hook for tour state subscription and target resolution
- **Geometry & Positioning Utilities**
  - `geometry.ts`: Viewport helpers, anchor rect computation, RAF throttling
  - `positioning.ts`: Auto-placement algorithm for optimal tooltip positioning
  - `portal.tsx`: React portal for z-index isolation
  - `a11y.ts`: Focus trap, focus restoration, ARIA live announcements
- **Integration Adapters**
  - **analyticsAdapter.ts**: Analytics event tracking for tour lifecycle
  - **routerAdapter.ts**: Route-based navigation and anchor refresh
  - **tourLifecycleIntegration.tsx**: Connects events to analytics and persistence
- **Configuration & Persistence**
  - **defaultTour.ts**: Pre-configured onboarding tour with 6 steps
  - **persistence.ts**: localStorage-based completion tracking
  - **tourEntry.ts**: Convenience functions (`startDefaultTour()`, `shouldAutoStartTour()`)
- **Keyboard Navigation**: Arrow keys (←/→) for step navigation, Escape to close
- **Accessibility Features**
  - Focus trap constrains tab navigation to tour overlay
  - Screen reader announcements for step changes via ARIA live regions
  - Keyboard-accessible navigation buttons
  - `role="dialog"` and `aria-modal="true"` for proper semantics
- **Analytics Integration**
  - `tour_started`: Track tour initiation
  - `tour_step_viewed`: Track step views with placement and target resolution
  - `tour_completed`: Track successful tour completion
  - `tour_skipped`: Track early exits with drop-off point
- **Comprehensive Documentation**
  - `docs/features/tour.md`: Feature guide with usage, customization, and troubleshooting
  - `docs/architecture/spotlight-tour-architecture.md`: System design, data flow, and integration points
  - `docs/ops/telemetry.md`: Analytics events, metrics, and privacy considerations
  - `docs/product/first-run-experience.md`: Onboarding flow design and optimization
  - `docs/integration/spotlight-tour-integration.md`: Step-by-step integration guide

### Integration Ready

- ✅ Analytics adapter with event tracking
- ✅ Router adapter for route-based steps
- ✅ Persistence layer for completion tracking
- ✅ Default tour configuration
- ✅ Lifecycle integration component
- ✅ Entry point functions for triggering tours

### Next Steps

- Mount `SpotlightOverlay` in app root
- Mount `TourLifecycleIntegration` in app root
- Call `useTourRouterAdapter()` in app component
- Add `data-tour-id` attributes to UI elements
- Connect help menu to `startDefaultTour()`

### Technical

- Resilient target resolution with fallback selectors
- Responsive tooltip positioning with viewport edge detection
- Dark mode support via Tailwind CSS design tokens
- Performance optimized with RAF-throttled viewport updates
- Memoized anchor rect calculations to minimize re-renders
- Safe analytics tracking (errors don't break tour flow)
- localStorage persistence with graceful fallback

## 1.3.0 - PDF Export (Public Beta)

### Added

- **PDF Export Feature** with two professional templates
  - **Manuscript Standard**: Complete manuscript export with professional formatting
    - Serif body font (Georgia, Times New Roman, 12pt)
    - 1.15 line spacing, 1-inch margins, A4 page size
    - Headers with title/author, footers with page numbers
    - Chapter titles start new pages with orphan/widow control
  - **Analysis Summary**: One-page plot analysis report
    - Letter-graded scorecard (Structure, Pacing, Scene Purpose, Coverage)
    - Top 5 insights with severity indicators
    - Pacing chart and arc heatmap visualizations
    - Color-coded grade badges (A-F scale)
- **Export API**: Serverless PDF generation endpoint (`/api/export/pdf`)
  - Puppeteer-core + @sparticuz/chromium for Vercel deployment
  - 10MB HTML payload limit with security controls
  - 30-second timeout, 1GB memory allocation
- **Keyboard Shortcut**: `Cmd+E` to open export modal
- **Telemetry**: Export events tracking (started/succeeded/failed with duration and file size)
- **E2E Tests**: API endpoint validation with fixture HTML

### Technical

- Print CSS optimization with @page rules and proper page break controls
- Template renderers with HTML escaping and sanitization
- SVG to data URL utilities for chart embedding
- Vercel function configuration in vercel.json

### Documentation

- Comprehensive export feature guide at `docs/features/export.md`
- Template descriptions, use cases, and troubleshooting
- API reference and examples

### Limitations

- PDF only (no DOCX support yet)
- Analysis export requires Plot Analysis to be run first
- System fonts only, fixed margins
- Single-page analysis summaries

## 1.1.0

### Minor Changes

- Brand design system update and CSS build fixes:
  - Consolidated all brand assets into `/public/assets/brand/`
  - Implemented new semantic color system with HSL-based CSS variables
  - Added brand component utility classes (ink-header, ink-sidebar, ink-nav-item, ink-btn)
  - Updated MainLayout to use new branding system
  - Fixed CSS build error by using native CSS properties instead of @apply with custom utilities
  - Updated web manifest, favicons, and Open Graph meta tags
  - Removed legacy brand asset files from old locations

### Patch Changes

- 76d989d: Added self-healing repository features:
  - Environment variables normalization with runtime guards
  - Structured documentation in `/docs` directory
  - Repository hygiene improvements
  - CI workflow for automated checks
  - Release process documentation and changesets setup
  - Branch protection automation script

## [Unreleased]

### Added

- Self-healing repository features
  - Environment variables normalization with runtime guards
  - Structured documentation in `/docs` directory
  - Repository hygiene improvements
  - CI workflow for automated checks
  - Release process documentation
  - Branch protection automation script
- Enhanced authentication system
  - Email/password authentication
  - Combined UI for magic link and password sign-in
  - Improved password reset flow
  - Better redirect handling across auth flows
  - Updated branding on authentication pages

### Fixed

- Logo rendering in authentication pages
- Topbar display on authentication routes
- SVG asset paths with robust fallback logic

## [1.0.3] - 2025-10-13

### Fixed

- Router issues in production:
  - Moved BrowserRouter to root (main.tsx)
  - Made error boundaries location-safe
  - Added router guards for providers
  - Fixed useLocation calls outside Router context
  - Added useIsInRouter utility for safe routing

### Changed

- Refactored provider architecture for proper Router context
- Updated test suite for Router-aware components
- Improved error boundary implementation

### Added

- New routerGuards utility for safe Router hook usage
- Enhanced window.location mocking in tests

# Changelog

All notable changes to this project are documented here.

## [v1.2.5] - 2025-10-12

### 🔍 **Type-Safety & Test Infrastructure**

#### **TypeScript & Path Resolution**

- **Fixed Import Path Resolution** - Unified alias configuration across Vite, TypeScript, and Vitest
- **Enhanced Type Safety** - Fixed unused parameter and argument warnings across multiple components
- **Keyboard Event Handling** - Improved event typing in modal components
- **Documentation Updates** - Better type documentation in component props

#### **Timeline Conflict Detection**

- **New Timeline Conflict Service** - Added comprehensive service for detecting story timeline inconsistencies
- **Conflict Types**:
  - Chronology conflicts
  - Knowledge conflicts
  - Presence conflicts
  - Age inconsistencies
- **Mock Infrastructure** - Complete test mocking for timeline service dependencies

#### **Test Infrastructure**

- **Enhanced Mocking** - Improved test mocks for storage, timeline, and character services
- **Path Resolution** - Fixed test imports with proper alias support
- **Clean Test Runs** - All tests passing with proper type checking

---

## [v1.2.4] - 2025-10-10

### 🎯 **Critical Issues Resolution & Platform Stability**

#### **Dark Mode Conflicts Fixed**

- **Unified Theme Service** - Created single source of truth theme management (`src/services/theme.ts`)
- **Resolved Multiple Theme Systems** - Eliminated conflicts between Tailwind darkMode:'class', prefers-color-scheme watchers, and localStorage values
- **Fixed Theme Persistence** - Consistent theme behavior across app restarts and browser sessions
- **Removed Conflicting Code** - Cleaned up duplicate theme management in CompleteWritingPlatform

#### **Profile Creation Enhanced**

- **Fixed Error Toast Issues** - Proper async handling prevents success operations showing error toasts
- **Added Toast Integration** - ProfilePicker now uses unified toast system for user feedback
- **Enhanced Loading States** - Proper loading indicators and double-submit prevention
- **Improved Error Handling** - Better error messages and async operation handling

#### **Deployment Verification**

- **Verified Live Site** - Confirmed inkwell.leadwithnexus.com serves correct content with 200 status
- **DNS Configuration Validated** - Proper CNAME setup to cname.vercel-dns.com
- **Production Build Success** - Latest deployment working correctly

#### **Data Integrity & Analysis Tools**

- **Corruption Detection System** - Added comprehensive data integrity monitoring with `CorruptionSentinels`
- **Analysis Components** - New analysis tools for plot, character, theme, and conflict analysis
- **Export Enhancements** - Enhanced ExportWizard with comprehensive testing and validation
- **Recovery Mechanisms** - Automatic data corruption detection and recovery systems

#### **User Experience Improvements**

- **Better Loading States** - Enhanced user feedback throughout ProfilePicker workflow
- **Unified Toast System** - Consistent success/error messaging across the application
- **Theme Stability** - Dark mode no longer "comes back" unexpectedly
- **Reliable Profile Creation** - Smooth profile creation workflow with proper error handling

---

## [v1.2.3] - 2025-10-10

### 🚀 3B Publishing & Professional Exports

#### **Complete Publication-Ready Export System**

- **Multi-Step Export Wizard** - Guided workflow with format selection, style customization, proofreading, and review steps
- **Professional Templates** - Classic manuscript and modern book styles with publication-ready formatting
- **Multi-Format Support** - PDF, DOCX, and EPUB export engines with proper rendering pipelines
- **Integrated Proofreading** - Optional Claude-powered proofreading seamlessly integrated into export workflow
- **Export Readiness Assessment** - Real-time project validation with improvement recommendations
- **Publication-Quality Output** - Professional formatting suitable for agents, publishers, and self-publishing

#### **Export Wizard Components**

- `ExportWizard.tsx` - Main wizard orchestrator with step management and state handling
- `ExportWizardModal.tsx` - Modal wrapper with escape key handling and backdrop interaction
- `FormatStep.tsx` - Format selection (PDF, DOCX, EPUB) with descriptions and recommendations
- `StyleStep.tsx` - Template selection with live preview and customization options
- `ProofreadStep.tsx` - Proofreading configuration with Claude integration toggle
- `ReviewStep.tsx` - Final review and confirmation with export settings summary
- `ProgressBar.tsx` - Visual progress indicator with step labels and completion states
- `DownloadCard.tsx` - Download interface with file details and restart options

#### **Core Export Infrastructure**

- `exportTypes.ts` - Comprehensive type definitions for export formats, styles, and configurations
- `exportController.ts` - Central orchestration of the export process with progress tracking
- `manuscriptAssembler.ts` - Content normalization and assembly for different output formats
- `exportEngines/` - Dedicated engines for PDF, DOCX, and EPUB with proper rendering
- `exportTemplates/` - Professional style presets with shared assets (CSS, HTML, SVG)
- `proofread/` - Proofreading service with Claude integration hooks

#### **User Interface Integration**

- **Export Ready Badge** - Project readiness assessment with visual indicators and quick access
- **Dashboard Integration** - Export buttons in project overview with readiness status
- **Command Palette Integration** - ⌘⇧E shortcut for quick export wizard access
- **Analytics Integration** - Comprehensive export tracking and success metrics
- **Accessibility Support** - Full keyboard navigation and screen reader compatibility

#### **Brand & Design Integration**

- **Inkwell Design System** - Export wizard follows established navy and gold brand colors
- **Professional Styling** - Clean, publication-focused interface with proper typography
- **Responsive Design** - Mobile-friendly wizard with adaptive layouts
- **Status Indicators** - Clear visual feedback for readiness, progress, and completion states

#### **Technical Implementation**

- **Hook-based State Management** - `useExportWizard` hook for consistent wizard state across app
- **Modular Architecture** - Self-contained export system with clear separation of concerns
- **Error Handling** - Comprehensive error boundaries and user-friendly error messages
- **Performance Optimization** - Lazy loading and efficient rendering for large projects

### 🎯 User Experience Enhancements

- **Guided Export Flow** - Step-by-step process eliminates confusion and ensures quality output
- **Real-Time Validation** - Immediate feedback on project readiness and required improvements
- **Professional Output** - Publication-ready formatting that meets industry standards
- **Contextual Help** - Tooltips and descriptions throughout the export process
- **Progress Tracking** - Visual indicators show export progress and estimated completion time

---

## [v1.2.2] - 2025-10-10

### 🧹 Major Codebase Cleanup & Optimization

#### **System-wide Bloat Reduction**

- **Removed 6MB+ of unused presentation assets** - Eliminated large PNG branding files that weren't referenced in code
- **Simplified feature flag infrastructure** - Replaced complex provider/hook systems with simple constants in `src/config/features.ts`
- **Deleted legacy components** - Removed unused Platform components, CompleteWritingPlatform, and EnhancedDashboardV2
- **Consolidated UI system** - Confirmed canonical Button/Card/Toast components in `src/components/ui/` are properly used
- **Unified icon system** - Added Icon adapter for lucide-react with 80+ components already using it consistently
- **Removed dark mode remnants** - Cleaned up leftover `dark:` classes and theme infrastructure

#### **Architecture Improvements**

- **Feature flags now use simple `FEATURES` constants** instead of complex provider/hook systems
- **Icon system unified on lucide-react** with adapter for future flexibility
- **Component system already well-architected** with canonical ui components
- **Analytics system kept as-is** - already well-designed with typed events
- **Build verification confirmed** - all core functionality remains intact

#### **Developer Experience**

- **Removed What's New modal system** - Eliminated unnecessary feature announcement infrastructure
- **Deleted dead routes and panels** - Cleaned up unused routing components and legacy dashboard variants
- **Streamlined build process** - Build succeeds cleanly despite some minified file parsing issues
- **Maintained backward compatibility** - All existing functionality preserved

### 🎨 Brand System Update

#### **New Blue & Gold Visual Identity**

- **Complete color system overhaul** with navy blue primary and warm gold accents
- **Extended color scales** with 50-900 variants for design flexibility
- **WCAG AA accessibility compliance** maintained across all color combinations
- **Brand asset integration** with 6 professional PNG variations and optimized SVG assets
- **Updated all components** to use new Inkwell navy (#0A2F4E) and gold (#D4A537) colors

#### **Enhanced Brand Components**

- **Flexible Logo component** with 8 variants (mark-light/dark, wordmark-light/dark, outline variations, SVG options)
- **Branded empty states** with subtle navy/gold gradients and professional styling
- **Professional login page** with split-screen navy brand panel design
- **Dashboard welcome hero** with branded logo circles and theme-appropriate variants
- **Updated PWA manifest** with navy theme color for native app integration

#### **New Brand Documentation**

- **Color System Guide** (`docs/COLORS.md`) with accessibility guidelines and usage examples
- **Brand Update Summary** (`docs/BRAND_UPDATE_SUMMARY.md`) with implementation guide and component usage
- **Updated Branding Guide** (`docs/BRANDING_GUIDE.md`) with new color tokens and design patterns
- **Comprehensive Tailwind integration** with `inkwell-navy`, `inkwell-gold`, and extended color scales

#### **Technical Implementation**

- **Tailwind config extended** with complete navy (50-900) and gold (50-700) color scales
- **Component updates** across Logo, Welcome, EmptyStates, Login, and BrandedEmptyState
- **Backward compatibility** maintained with legacy `ink` color tokens
- **Professional brand assets** organized in `public/brand/` with proper naming conventions

---

## [v1.2.1] - 2025-10-08

### 🐛 Critical Bug Fixes

#### **Fixed Production JavaScript Crashes**

- **Fixed TDZ crash in TourProvider/ProfileTourProvider** (logAnalytics init order)
  - Resolved temporal dead zone `ReferenceError: Cannot access 'L' before initialization`
  - Moved function declarations before first usage to prevent hoisting issues
  - Added comprehensive TDZ regression tests to prevent future occurrences
  - Both tour providers now safely handle function initialization order

- **Repaired PWA icon assets** (SVG→PNG conversion)
  - Fixed invalid PWA manifest icons that were SVG files mislabeled as PNG
  - Generated proper PNG icons at all required sizes (72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 384x384, 512x512)
  - Resolved Progressive Web App installation failures across all browsers
  - Used company branding colors (#0A2F4E navy, #D4A537 gold) for consistent icon design

### 🔧 Developer Experience Improvements

- **Enabled source maps for production debugging**
  - Added source map generation in vite.config.ts for enhanced error tracking
  - Improved production debugging capabilities while maintaining performance

### 📊 Enhanced Telemetry & Analytics

- **Extended telemetry coverage in logAnalytics functions**
  - Integrated with existing analyticsService for proper event tracking
  - Added error tracking for telemetry failures with fallback mechanisms
  - Enhanced tour event tracking with structured analytics (tour_started, tour_completed, tour_skipped, tour_step_completed)
  - Dynamic import fallbacks prevent circular dependencies

### 🧪 Testing & Quality Assurance

- **Added comprehensive TDZ regression tests**
  - Tests ensure tour providers can mount without throwing ReferenceError exceptions
  - Validates early logAnalytics calls during component initialization
  - Covers both TourProvider and ProfileTourProvider with mocked dependencies
  - Cross-provider compatibility testing for nested provider scenarios

- **Bundle size audit completed**
  - Verified no import chain inflation after refactoring
  - Total bundle size remains reasonable at ~2.19 MB (gzipped: ~457 KB)
  - Analytics service properly integrated without bundle bloat

### 💻 Technical Improvements

- **All tests passing**: 223 tests across 12 test files ✅
- **Production build successful**: Clean compilation with no errors ✅
- **Enhanced error handling**: Telemetry errors are tracked and handled gracefully ✅
- **Source maps enabled**: Better debugging in production environments ✅

---

## [1.2.0] - 2025-10-08

### 🚀 Major Features

#### **Multi-Profile Workspace System**

- **Complete multi-user workspace isolation** with seamless profile switching
- **Profile-based URL routing** with React Router (`/p/{profileId}/*` structure)
- **Zero data leakage** between profiles using isolated database storage
- **Legacy data migration** system for seamless transition from single-user setup
- **Beautiful profile creation flow** with customizable colors and avatar support
- **SEO optimization** with comprehensive meta tags, robots.txt, and sitemap.xml

#### **Profile-Aware Tutorial System**

- **Complete tutorial isolation per profile** with independent progress tracking
- **Deep-linkable tutorial URLs** with routes like `/p/{profileId}/tutorials/{slug}/{step}`
- **Automatic profile switching** resets tutorial UI to that profile's state
- **Legacy tutorial migration** moves existing progress to first created profile
- **Shareable tutorial links** with profile context for team onboarding
- **Profile-scoped Redux state** with updated onboarding slice structure
- **Tutorial entry point guards** ensuring all tutorial access requires active profile

### ✨ New Components

- `ProfileContext.tsx` - Complete profile state management with React Context
- `ProfileSwitcher.tsx` - Header-integrated dropdown for quick profile switching
- `ProfileGate.tsx` - Routing guard ensuring valid profile access
- `ProfilePicker.tsx` - Beautiful profile creation and selection interface
- `dbFactory.ts` - Profile-specific database factory with data isolation
- `migrateToProfiles.ts` - Utility for migrating existing data to profile system
- `profile.ts` - TypeScript definitions for profile types and interfaces
- `ProfileTourProvider.tsx` - Profile-aware tour provider replacing original TourProvider
- `TutorialRouter.tsx` - Dedicated routing system for profile-aware tutorials
- `tutorialStorage.ts` - Profile-isolated tutorial storage service with migration
- `tutorialLinks.ts` - Utility functions for profile-aware tutorial URL generation
- `tutorialStorage.test.ts` - Comprehensive test suite for tutorial isolation

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

- **Scene Linkage Suggestions** (`SceneLinkageSuggestions.ts`)
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
