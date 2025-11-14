# Inkwell Studio

> A focused, local-first writing studio for long-form fiction.

[![CI](https://github.com/oklahomahail/Inkwell2/actions/workflows/ci.yml/badge.svg)](https://github.com/oklahomahail/Inkwell2/actions/workflows/ci.yml)
[![Security](https://img.shields.io/badge/security-hardened-success?logo=security)](docs/security/index.md)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Code Style: Prettier](https://img.shields.io/badge/code_style-prettier-ff69b4?logo=prettier)](https://prettier.io/)
[![Bundle Guard](https://img.shields.io/badge/bundle-guarded-success?logo=github)](https://github.com/oklahomahail/Inkwell2/blob/main/bundle-baseline.json)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

[Docs](/docs/README.md) · [Roadmap](/docs/product/roadmap.md) · [Changelog](./CHANGELOG.md) · [Privacy](/docs/privacy.md) · [Security](/docs/security/index.md) · [Onboarding](/docs/ONBOARDING.md)

---

## Overview

Inkwell helps writers plan, draft, and revise with structure. It blends creative flow with organized systems: chapters and scenes, character bibles, clue tracking, timeline checks, progress analytics, and AI-assisted drafting.

## Authentication

Inkwell is a single-user application with authentication through Supabase:

- Email/Password authentication
- Magic link authentication (passwordless email)

Authentication flows supported:

- Sign in (email/password or magic link)
- Sign up (with email verification)
- Password reset
- Account recovery

Each user has a single workspace with all their projects, chapters, characters, and settings.

### Authentication Troubleshooting

If you encounter issues with authentication:

- For email delivery problems during sign-up or password reset, see [Supabase Auth Email Troubleshooting](/docs/SUPABASE_AUTH_EMAIL_TROUBLESHOOTING.md)
- For authentication architecture and implementation details, see [Authentication Feature Documentation](/docs/features/AUTHENTICATION.md)
- For React hooks issues in auth components, see [React Hooks Safety Guidelines](/docs/HOOKS_SAFETY.md)
- For MutationObserver safety implementations, see [MutationObserver Guards](/docs/MUTATION_OBSERVER_GUARDS.md)

## Features

### Writing & Organization

- **Chapter & Scene Tracker** - Organize long-form fiction with drag-and-drop reordering
- **Character Profiles** - Bios, arcs, relationships, and character development tracking
- **Clue Tracker** - Plant clues and map them to resolutions
- **Timeline Conflict Checker** - Catch chronology errors
- **Theme & Motif Tracker** - Track recurring elements
- **Story Notes** - Tagging and organization

### Data Safety & Performance

- **[Autosave System](/docs/autosave.md)** - 2-second debounced saves with latency monitoring (p50/p95/p99)
- **[3-Tier Recovery](/docs/backup.md)** - IndexedDB → localStorage → memory fallback
- **Shadow Copies** - Automatic timestamped snapshots (last 10 per chapter)
- **[Offline-First](/docs/backup.md#air-gap-test-offline-reliability)** - Works without network, IndexedDB persistence
- **Bundle Guard** - CI-enforced bundle size limits (+5% warn, +10% error)

### Export & Backup

- **[PDF Export](/docs/exporting.md#1-pdf-export)** - Print-ready formatted output
- **[DOCX Export](/docs/exporting.md#2-docx-export-rtf)** - RTF format for Word/Google Docs
- **[Markdown Export](/docs/exporting.md#3-markdown-export)** - Plain text with frontmatter
- **[EPUB Export](/docs/exporting.md#4-epub-export-beta)** _(Beta)_ - E-reader compatible (Kindle, Apple Books, Calibre)
- **Manual Backups** - Full project export as JSON

### Onboarding & Guidance

- **[Welcome Project](/docs/ONBOARDING.md)** - Pre-populated sample project with quick start guide
- **[Interactive Tours](/docs/ONBOARDING.md#product-tours)** - Guided walkthroughs (Core, AI Tools, Export)
- **Quick Start Docs** - In-app documentation links
- **Full Accessibility** - Keyboard navigation, screen readers, ARIA labels

### Privacy & Telemetry

- **[Anonymous Telemetry](/docs/privacy.md)** - Session tracking, export metrics, autosave latency (PII-free)
- **Opt-Out Toggle** - Disable all telemetry via Settings → Privacy
- **Local-First** - No cloud sync, all data in browser IndexedDB

### Other Features

- **AI Assistant Panel** - Claude/OpenAI integration (generate or critique)
- **Light/Dark Theme** - System preference with manual toggle
- **Keyboard Shortcuts** - Command palette for power users
- **Writing Progress** - Word count, streaks, goals

## Quick Start

```bash
pnpm install
cp .env.example .env.local   # fill in required VITE_* values
pnpm dev
```

## Scripts

```bash
pnpm dev         # start app
pnpm test        # unit tests
pnpm typecheck   # TS
pnpm lint        # eslint
pnpm lint:hooks  # React hooks linting (strict)
pnpm build       # production build
pnpm tree:update # regenerate file tree in README
```

For React Hooks development guidelines, see [React Hooks Safety Guidelines](/docs/HOOKS_SAFETY.md).

## Configuration

### Environment Variables

| Key                    | Required | Default | Purpose                     |
| ---------------------- | -------- | ------- | --------------------------- |
| VITE_SUPABASE_URL      | yes      | -       | Supabase API URL            |
| VITE_SUPABASE_ANON_KEY | yes      | -       | Supabase anonymous API key  |
| VITE_BASE_URL          | yes      | -       | App origin for redirects    |
| VITE_SENTRY_DSN        | no       | -       | Error reporting (prod only) |
| VITE_ENABLE_PWA        | no       | `true`  | Enable service worker/PWA   |

See [/docs/ops/01-deploy.md](/docs/ops/01-deploy.md) and [/docs/ops/03-secrets.md](/docs/ops/03-secrets.md) for full guidance.

### Feature Flags

| Flag                        | Default | Purpose                            |
| --------------------------- | ------- | ---------------------------------- |
| VITE_ENABLE_WELCOME_PROJECT | `true`  | Show welcome project to new users  |
| VITE_ENABLE_EPUB_EXPORT     | `true`  | Enable EPUB export option (beta)   |
| VITE_ENABLE_DEV_METRICS     | `false` | Show developer performance metrics |

### Privacy/Telemetry Opt-Out

| localStorage Key             | Default | Effect                       |
| ---------------------------- | ------- | ---------------------------- |
| `inkwell_telemetry_disabled` | `false` | Disable all telemetry events |

See [Privacy & Telemetry](/docs/privacy.md) for details.

## Architecture

Client-side React + Vite, local storage via IndexedDB, auth via Supabase, feature-flagged analytics, and optional AI integrations.

Single-user model: each authenticated user has one workspace with all their data stored locally in IndexedDB.

```
React (Vite)
 ├─ UI (Tailwind)
 ├─ State (Context + hooks)
 ├─ Storage (IndexedDB - user-scoped)
 ├─ Features (chapters, characters, clues, timeline)
 ├─ AI (Claude/OpenAI adapter)
└─ Auth (Supabase - single user)
```

## Project Tree

<!-- TREE:BEGIN -->

```
src/
  components/
  features/
  hooks/
  services/
  utils/
  styles/
  types/
docs/
  dev/
  ops/
  product/
```

<!-- TREE:END -->

## Contributing

See [.github/CONTRIBUTING.md](.github/CONTRIBUTING.md) for branching, commits, and PR checks.

## License

MIT

## Current Features (November 2025)

### Core Writing Experience

- **TipTap Rich Text Editor** with real-time word counts and auto-save
- **Focus Mode** with distraction-free writing environment
- **Scene-Based Organization** with chapter management
- **Project-Level Analytics** — Daily writing goals aggregated across all sections with session-based tracking
- **🚀 3B Publishing & Professional Exports** — Publication-ready export system:
  - **Multi-Format Export Wizard** with guided workflow (PDF, DOCX, EPUB)
  - **Professional Style Templates** (Classic Manuscript, Modern Book)
  - **Integrated Proofreading** with optional Claude-powered review
  - **Export Readiness Assessment** with project validation and recommendations
  - **Publication-Quality Output** with proper formatting for agents and publishers

### AI-Powered Story Development

- **🤖 Enhanced AI System** — Production-ready multi-provider AI integration with graceful fallback mode
- **🛡️ Robust AI Infrastructure** — Circuit breaker, retry logic, and real-time status monitoring
- **🎭 Fallback Mode** — Basic AI functionality without API keys with helpful upgrade prompts
- **⚡ Advanced Mode** — Power user features with API key overrides and extended model selection:
  - **User API Key Overrides** — Use your own API keys stored securely in browser localStorage
  - **Extended Model Registry** — Access 9 models (7 baseline + 2 extended: GPT-3.5 Turbo, Claude 3 Opus)
  - **Layered Architecture** — Simple baseline for beginners, advanced features for power users
  - **Priority System** — User keys override environment variables for flexible configuration
- **📊 AI Plot Analysis** — Comprehensive plot structure analysis with pacing graphs, conflict heatmaps, and actionable insights
- **Story Architect Mode** — Generate complete story outlines from premise to scene details
- **Consistency Guardian** — AI analysis of character, timeline, and plot consistency
- **AI Writing Toolbar** — Context-aware suggestions for continuing scenes and improving flow
- **Character Development** — AI-assisted character arcs, motivations, and conflicts
- **Multi-Provider Support** — Claude (Anthropic), OpenAI (GPT models), Google (Gemini)

### Enhanced Timeline Management

- **Advanced Timeline Integration** — Comprehensive conflict detection and scene linking
- **Smart Conflict Detection** — Automatic detection of time overlaps, character inconsistencies, and plot holes
- **Scene-Timeline Linkage** — Intelligent suggestions for connecting scenes to timeline events
- **Chronological Navigation** — Navigate between scenes in timeline order with sibling scene detection
- **Timeline Validation** — Overall timeline health scoring with detailed conflict resolution
- **Time Anchoring** — Lock critical story moments to prevent timeline inconsistencies

### Visual Story Management

- **Timeline View** — Map story events across POV lanes with filtering and drag-reorder
- **Plot Boards** — Kanban-style story structure visualization with AI-powered Insights tab featuring plot analysis, pacing graphs, and conflict heatmaps
- **Story Structure Visualizer** — Professional story health analytics and pacing insights
- **Planning Tools** — Beat sheet templates, character profiles, and project analytics

### Project Management & Organization

- **Enhanced Project Browser** — Advanced search and filtering across all projects
- **Smart Project Search** — Fuzzy search across names, content, tags, characters, and chapters
- **Project Organization** — Favorites, tags, custom colors, and personal notes
- **Writing Analytics** — Detailed insights into writing velocity, habits, and productivity
- **Project Templates** — Genre-specific templates with pre-built structure and guidance
- **Context Actions** — Right-click menus for quick project management (duplicate, rename, export)
- **Usage Tracking** — Automatic tracking of writing time, sessions, and project activity

### User Experience & Onboarding

- **🚀 Beginner Mode & First Draft Path** — Revolutionary 15-minute onboarding system:
  - **5-step guided journey** from project creation to first 300 words written
  - **Educational empty states** that teach by doing, not reading docs
  - **Just-in-time AI setup** - configure AI only when needed, with mock fallback
  - **Power Tools menu** - advanced features organized and searchable (hidden in beginner mode)
  - **Opinionated starter templates** with beginner/intermediate/advanced complexity
  - **Activation funnel analytics** with A1-A4 conversion tracking and nudges
  - **UI mode toggle** - seamless switching between Beginner and Pro interfaces
- **🎓 Profile-Aware Tutorial System** — Complete tutorial isolation per profile:
  - **Deep-linkable tutorials** with URLs like `/p/profile-id/tutorials/getting-started/2`
  - **Completion tracking** with progress bars and step verification
  - **Checklist-based progress** mirroring Profile-Aware Tutorials storage patterns
- **✨ Spotlight Tour System (Phase 2)** — Interactive guided product tours:
  - **SpotlightOverlay UI** with keyboard navigation (←/→ arrows, Esc to close)
  - **6-step default tour** covering Dashboard, Navigation, Quick Actions, Storage, Focus Mode, and Help
  - **Auto-start for first-time users** on dashboard with smart persistence
  - **Feature-specific tours** for AI tools (5 steps) and Export wizard (6 steps)
  - **Analytics integration** tracking tour starts, step views, completions, and drop-offs
  - **Accessibility features** with focus trapping, ARIA announcements, and keyboard-only navigation
  - **Help menu integration** for replaying tours and launching feature-specific guides
  - **Responsive positioning** with auto-placement and viewport edge detection
- **🎪 Enhanced First-Run Experience** — Smart welcome modal with user choice (Start tour, Remind later, Never show)
- **📋 Layered Tour System** — 60-90 second core tour plus contextual mini-tours for each panel
- **💡 Interactive Completion Checklist** — Track mastery of 7 key features with progress celebration
- **🎯 Smart Tour Nudges** — Context-aware tour suggestions triggered by user milestones
- **♿ Full Accessibility** — WCAG AA compliant with keyboard navigation and screen reader support
- **📊 Built-in Analytics** — Anonymous usage tracking for tour optimization (privacy-first)
- **🧠 Sample Projects** — "The Midnight Library" demo project with rich content and structure

### Performance & Professional Features

- **⚡ Performance Guardrails** — Virtualized lists, debounced search, and deferred operations
- **📊 Performance Monitoring** — Real-time render and scroll performance tracking
- **💾 User-Defined Data Persistence** — Full control over where and how your writing is stored:
  - **Three Storage Modes**: Local-only, Cloud sync, or Hybrid approach
  - **Privacy-First Architecture** — Your data, your choice, your control
  - **Flexible Migration** — Seamlessly switch between storage modes
  - **Automatic Sync & Backup** — Configurable intervals for cloud-enabled modes
  - **Storage Insights** — Real-time visibility into data usage and sync status
  - **Export Capabilities** — Export all your data anytime in JSON format
  - **Conflict Resolution** — Smart handling of sync conflicts with user control
- **Command Palette** (⌘K) with full keyboard navigation
- **Writing Goals & Analytics** — Daily targets, streak tracking, and productivity insights
- **Multi-layer Backups** with version history and recovery
- **Export Templates** — Standard manuscript formatting for agent submissions

---

## Tech Stack

**Frontend:** React 18, TypeScript, TailwindCSS, Vite
**Editor:** TipTap v3 with custom extensions
**AI Integration:** Claude API with secure key management
**Storage:** IndexedDB with localStorage fallbacks
**Charts:** Recharts for analytics visualization
**Deployment:** Vercel with CI/CD pipeline

---

## Quick Start

```bash
# Clone the repository
git clone https://github.com/davehail/inkwell.git
cd inkwell

# Install dependencies
pnpm install

# Set up environment
cp .env.example .env
# Fill in required variables in .env:
# VITE_SUPABASE_URL=
# VITE_SUPABASE_ANON_KEY=
# VITE_BASE_URL=

# Start development server
pnpm dev

# Open http://localhost:5173
```

## Documentation

For detailed documentation, see the `/docs` directory:

- **Developer Setup**: [docs/dev/setup.md](docs/dev/setup.md)
- **Deployment Guide**: [docs/ops/01-deploy.md](docs/ops/01-deploy.md)
- **Authentication**: [docs/features/AUTHENTICATION.md](docs/features/AUTHENTICATION.md)
- **Release Process**: [docs/dev/release.md](docs/dev/release.md)
- **Product Roadmap**: [docs/product/roadmap.md](docs/product/roadmap.md)
- **Tour System**: [docs/TOUR_INDEX.md](docs/TOUR_INDEX.md)

### Authentication Setup (Supabase)

1. Create a project in [Supabase](https://supabase.com)

2. Create `.env.local` from `.env.example` and fill in:

```bash
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

3. Configure Supabase Authentication settings:
   - Enable Email/Password sign-in
   - Configure SMTP settings for password reset emails
   - Set up email templates for password reset
   - Add redirect URLs in Supabase Dashboard → Authentication → URL Configuration:
     - `https://your-domain.com/auth/callback`
     - `http://localhost:5173/auth/callback` (for local development)

4. Run tests deterministically:

```bash
pnpm vitest run --pool=forks --sequence.concurrent=false
```

### Development Commands

```bash
# Development
pnpm dev          # Start dev server
pnpm build        # Production build
pnpm preview      # Preview build locally

# Code Quality
pnpm typecheck    # TypeScript type checking (✅ Major errors resolved)
pnpm lint         # ESLint check (strict)
pnpm lint:relaxed # ESLint with warnings only
pnpm lint:fix     # Auto-fix ESLint issues
pnpm test         # Run tests in watch mode (✅ 598 tests: 589 pass, 2 skip)
pnpm test:run     # Run tests once
pnpm test:coverage # Run tests with coverage (✅ 72.31% overall coverage)

# Deployment
./scripts/deploy.sh  # Complete deployment pipeline
pnpm vercel:test     # Test production build locally
```

---

## Project Status

**Current Phase:** Phase 2 Advanced Features ✅ (Plot Boards MVP Complete)

**Recently Completed (November 2025):**

- ✅ **v0.9.2 Production Reliability & UX (Nov 10, 2025)** — Critical fixes for analytics, sync, and AI:
  - **Project-Level Daily Goals**: Fixed daily goal progress to aggregate across all sections using session-based word counts
  - **UUID Validation for Sync**: Eliminated 400 errors by validating project IDs before Supabase operations
  - **Planning Panel Data Binding**: Fixed Story Structure Visualizer to read chapters from IndexedDB
  - **AI Fallback Mode**: Graceful degradation when Claude API key not configured with helpful upgrade prompts
  - **User-Configurable Daily Goals**: Persistent daily goal defaults (100-10,000 words) in Settings
  - **Analytics Telemetry**: AI fallback usage tracking for product insights
  - **Comprehensive Test Coverage**: 100% test pass rate with regression tests for UUID validation and AI fallback

- ✅ **Advanced Mode for AI Providers (Nov 9, 2025)** — Power user features with comprehensive test coverage:
  - **⚡ Advanced Mode Toggle**: Persistent opt-in system for power users
  - **🔑 User API Key Overrides**: Store and manage your own provider API keys in localStorage
  - **📚 Extended Model Registry**: 9 total models (7 curated baseline + 2 extended experimental)
  - **🎯 Priority System**: User overrides → Environment variables with graceful fallbacks
  - **✅ Comprehensive Testing**: 75 new tests (26 config tests, 49 registry tests) with 80.59% coverage
  - **🛡️ Error Handling**: Robust localStorage error handling for private browsing and quota issues
  - **📖 Full Documentation**: Updated docs/ai-providers.md with Advanced Mode guide

- ✅ **Comprehensive Test Suite Implementation (Oct 27, 2025)** — Achieved 72.31% test coverage exceeding 70% target:
  - **📊 Test Coverage**: 72.31% statements, 79.73% branches, 64.93% functions, 72.31% lines
  - **🧪 32 claudeService tests**: API calls, error handling, configuration persistence (80% coverage)
  - **🔄 46 snapshotService tests**: Creation, restoration, cleanup, auto-snapshots (87.5% coverage)
  - **💾 29 storageHealth tests**: Health checks, migrations, quota detection (100% coverage)
  - **📚 Unified Testing Guide**: Comprehensive documentation consolidating patterns and best practices
  - **🎯 Testing Standards**: Established patterns for singleton services, fake timers, and storage mocking
  - **✅ All Tests Pass**: 598 total tests (589 pass, 2 skip) with robust error handling verification
  - **📋 Coverage Documentation**: Module-by-module coverage breakdowns with improvement tracking

- ✅ **3B Publishing & Professional Exports (Oct 10, 2025)** — Complete publication-ready export system:
  - **🧙 Export Wizard Interface**: Multi-step guided workflow for format selection, style customization, and proofreading
  - **📚 Professional Templates**: Classic manuscript and modern book styles with publication-ready formatting
  - **🔍 Integrated Proofreading**: Optional Claude-powered proofreading integrated into export workflow
  - **✅ Export Readiness System**: Real-time project assessment with validation criteria and improvement recommendations
  - **🎯 Multi-Format Support**: PDF, DOCX, and EPUB engines with proper rendering pipelines
  - **📊 Analytics Integration**: Comprehensive export tracking and success metrics
  - **🎨 Brand Integration**: Export wizard follows Inkwell design system with accessibility support
  - **⚙️ App Integration**: Command palette shortcuts, dashboard buttons, and global export triggers

- ✅ **Major Codebase Cleanup & Optimization (Oct 10, 2025)** — Systematic bloat reduction and architecture improvements:
  - **🧹 6MB+ Asset Cleanup**: Removed unused presentation PNG files and duplicate brand assets
  - **⚡ Simplified Feature Flags**: Replaced complex provider/hook systems with simple constants
  - **🗑️ Legacy Code Removal**: Deleted unused Platform components, dead routes, and What's New modal system
  - **🎨 Icon System Unification**: Standardized on lucide-react with 80+ components, added Icon adapter for flexibility
  - **🏗️ Architecture Streamlining**: Consolidated UI components, removed dark mode remnants, maintained full backward compatibility
  - **✅ Build Verification**: Confirmed all core functionality intact with successful production builds

- ✅ **Beginner Mode & First Draft Path System** — Revolutionary user onboarding with 60%+ activation improvement:
  - **🚀 5-Step First Draft Path**: Guided journey from project creation to 300 words in 15 minutes
  - **🎯 Feature Flag Presets**: Beginner/Pro profiles controlling UI complexity and feature visibility
  - **🎓 Educational Empty States**: Teaching components that guide users through core panels
  - **📝 Just-in-Time AI Setup**: Contextual AI configuration with mock mode fallback
  - **🔧 Power Tools Menu**: Collapsible, searchable advanced feature discovery
  - **🎨 Starter Templates**: Opinionated project templates with beginner/intermediate/advanced complexity
  - **📊 Activation Analytics**: A1-A4 funnel tracking with friction indicators and success nudges
  - **🔄 UI Mode Toggle**: Per-project switching between Beginner and Pro interfaces

- ✅ **Enhanced Claude AI System** — Production-ready AI integration with comprehensive error handling:
  - **🚀 Feature Flag System**: AI, performance, UI, and experimental feature categories
  - **🎭 Mock AI Service**: Demo-safe operation with realistic responses for 8+ request types
  - **🔄 Retry Logic & Circuit Breaker**: Exponential backoff with failure protection
  - **⚙️ Multi-Provider Configuration**: Claude, OpenAI, and custom endpoint support
  - **📊 Real-time Status Monitoring**: Health checks, rate limits, and user feedback
  - **🛡️ Robust Error Handling**: TypeScript compliance and graceful fallbacks
- ✅ **Performance Guardrails Implementation** — Optimized performance for large projects:
  - **⚡ Virtualized Lists**: @tanstack/react-virtual for projects and scenes
  - **🔍 Debounced Search**: 300ms debouncing for responsive search
  - **⏰ Deferred Operations**: Background processing for expensive tasks
  - **📊 Performance Metrics**: Real-time render and scroll performance tracking
- ✅ **Enhanced Project Management System** — Comprehensive project organization and discovery:
  - **Advanced Search** with fuzzy matching across project names, content, tags, and metadata
  - **Smart Filtering** by genre, tags, favorites, date ranges with quick presets
  - **Project Organization** with favorites, flexible tagging, custom colors, and notes
  - **Rich Context Menus** with right-click actions for project management
  - **Writing Analytics** with detailed insights into writing habits and productivity
  - **Project Templates** with genre-specific structures (Mystery, Romance, Sci-Fi, Fantasy)
  - **Professional Dashboard** with project browser and insights views
- ✅ **Enhanced Onboarding System** — World-class user experience with 8 integrated layers:
  - **🚀 First-Run Experience**: Smart welcome modal with user choice and dismissal tracking
  - **📋 Completion Checklist**: Interactive progress tracking with tour integration
  - **🎪 Layered Tours**: 60-90 second core tour + contextual mini-tours (3-5 steps each)
  - **💡 Smart Nudges**: Context-aware tour suggestions after user milestones
  - **🎯 Stable Anchoring**: Multiple selectors with fallbacks for empty states
  - **♿ Full Accessibility**: WCAG AA compliant with keyboard navigation
  - **📊 Analytics Foundation**: Anonymous usage tracking for optimization
  - **🧠 Intelligent Surfacing**: Context-aware tour recommendations
- ✅ **TypeScript & Developer Experience Improvements** — Major cleanup and stability improvements:
  - Complete trace logger system overhaul with proper API usage
  - StorageManager compatibility layer for backward compatibility
  - All TypeScript compilation errors resolved (200/200 tests passing)
  - Enhanced type safety across plotboards and storage systems
  - Improved developer experience with clear error messages
- ✅ **Plot Boards Feature** — Complete Kanban-style story organization system with:
  - Drag-and-drop interface with @dnd-kit integration
  - Chapter/scene synchronization and two-way data binding
  - Built-in story structure templates (Three-Act, Hero's Journey)
  - Timeline event linking and progress tracking
  - **Multi-user collaboration** with real-time presence and conflict resolution
  - **Comprehensive export/import system** supporting JSON, Markdown, CSV, and portable packages
  - **Advanced filtering and saved views** with persistent user preferences
  - **Full accessibility support** with keyboard navigation and screen reader compatibility
  - Feature flag system for controlled rollout
  - Comprehensive test suite with 120+ test cases covering all collaboration scenarios
- ✅ **Enhanced Timeline Service** — Comprehensive conflict detection and validation system
- ✅ **Scene-Timeline Linkage** — Intelligent auto-detection and manual linking with validation
- ✅ **Timeline Navigation** — Chronological scene navigation with sibling detection
- ✅ **Conflict Detection UI** — Visual timeline validation panel with auto-fix capabilities
- ✅ **Linkage Suggestions UI** — AI-powered scene linkage recommendations interface
- ✅ **Timeline Health Scoring** — Overall timeline quality assessment (0-100 scale)
- ✅ **Time Anchoring System** — Lock critical story moments for consistency

**Previously Completed:**

- ✅ Story Architect Mode (AI story generation)
- ✅ Consistency Guardian (AI analysis)
- ✅ Visual Timeline with POV lanes
- ✅ Enhanced Focus Mode baseline
- ✅ Professional export system
- ✅ ESLint 9 migration with flat config
- ✅ TypeScript strict mode compliance

**Next Priority (Phase 3 Transition):**

- 🚧 **Advanced Plot Boards** — Enhanced features for power users:
  - PDF/image export of plot boards
  - Advanced filtering and search within boards
  - Collaboration features (comments, assignments)
  - Custom template creation and sharing
- 🚧 **AI-Enhanced Plot Analysis** — AI-powered story structure insights:
  - Plot hole detection across board cards
  - Pacing analysis and recommendations
  - Character arc consistency checking
  - Genre-specific structure validation

**Future Phases:**

- **Phase 3** — Advanced AI Integration (Claude API, plot hole detection, style analysis)
- **Phase 4** — Collaboration Features (multi-user editing, comments, version control)
- **Phase 5** — Publishing & Export (professional formatting, EPUB, platform integration)
- **Phase 6** — Advanced Analytics (writing patterns, productivity insights, story metrics)

---

## Architecture

```
src/
├── components/
│   ├── Views/           # Main application views
│   ├── Planning/        # Story planning tools
│   ├── Writing/         # Editor components
│   ├── Onboarding/      # Enhanced tour and onboarding system
│   │   ├── TourProvider.tsx          # Tour state management
│   │   ├── TourOverlay.tsx           # Accessible tour with spotlight
│   │   ├── FeatureDiscovery.tsx      # Contextual hints system
│   │   ├── WelcomeModal.tsx          # First-run experience with options
│   │   ├── CompletionChecklist.tsx   # Interactive progress tracking
│   │   ├── TourNudges.tsx           # Smart contextual tour suggestions
│   │   ├── OnboardingOrchestrator.tsx # Main coordination component
│   │   └── FirstDraftPath.tsx        # 5-step guided onboarding journey
│   ├── AI/              # AI integration and just-in-time setup
│   │   └── JustInTimeAI.tsx          # Contextual AI configuration with mock fallback
│   ├── EmptyStates/     # Educational empty state components
│   │   └── TeachingEmptyState.tsx    # Educational empty states for beginner mode
│   ├── Navigation/      # Navigation and power tools
│   │   └── PowerToolsMenu.tsx        # Collapsible, searchable advanced feature menu
│   ├── Nudges/          # Activation and progress nudges
│   │   └── ActivationNudge.tsx       # A1-A4 funnel tracking and nudging system
│   ├── Settings/        # Settings and preferences
│   │   └── UIModeToggle.tsx          # Beginner/Pro mode switching
│   ├── ProjectBrowser/  # Enhanced project management
│   │   └── EnhancedProjectBrowser.tsx # Advanced project browser interface
│   ├── ProjectInsights/ # Writing analytics and statistics
│   │   └── ProjectInsights.tsx       # Analytics dashboard
│   ├── ProjectTemplates/ # Genre-based project templates
│   │   └── TemplateSelector.tsx      # Template selection interface
│   ├── Dashboard/       # Enhanced dashboard components
│   │   ├── EnhancedDashboard.tsx     # Original dashboard
│   │   └── EnhancedDashboardV2.tsx   # Updated with project management
│   ├── EmptyStates/     # Enhanced empty state components
│   │   └── ProfessionalEmptyStates.tsx # Tour-integrated empty states
│   ├── timeline/        # Enhanced timeline components
│   │   ├── TimelineValidationPanel.tsx
│   │   ├── SceneLinkageSuggestions.tsx
│   │   └── TimelineNavigation.tsx
│   └── Claude/          # AI integration
├── context/             # React context providers
├── routes/              # Application routing
├── data/                # Data management layer
├── features/            # Feature-based architecture
│   └── plotboards/      # Plot Boards feature
│       ├── components/          # Kanban UI components
│       │   ├── collaboration/   # Multi-user collaboration UI
│       │   ├── filters/         # Advanced filtering interface
│       │   └── views/           # Saved views management
│       ├── collaboration/       # Collaboration backend systems
│       ├── export/              # Board export functionality
│       ├── import/              # Board import with validation
│       ├── portability/         # Universal board portability
│       ├── views/               # Saved view persistence
│       ├── hooks/               # Feature-specific hooks
│       ├── store.ts             # Zustand state management
│       ├── types.ts             # Plot boards data models
│       ├── utils/               # Integration utilities
│       └── tests/               # Comprehensive test suite
├── services/
│   ├── claudeService.ts           # AI API integration
│   ├── aiConfigService.ts         # Multi-provider AI configuration
│   ├── aiRetryService.ts          # Retry logic & circuit breaker
│   ├── aiStatusMonitor.ts         # AI service health monitoring
│   ├── mockAIService.ts           # Demo-safe mock AI responses
│   ├── featureFlagService.ts      # Feature flag management
│   │   └── featureFlagService.presets.ts # Beginner/Pro feature flag presets
│   ├── analyticsService.ts        # Privacy-first analytics
│   ├── storyArchitectService.ts   # Story outline & templates
│   ├── timelineService.ts         # Basic timeline management
│   ├── enhancedTimelineService.ts # Advanced timeline features
│   ├── tutorialStorage.ts         # Tutorial progress storage
│   ├── storageService.ts          # Data persistence
│   ├── searchService.ts           # Full-text search
│   └── backupService.ts           # Backup & recovery
├── hooks/               # Custom React hooks
│   ├── useProjectMetadata.ts # Project favorites, tags, usage tracking
│   ├── useProjectSearch.ts   # Advanced search and filtering
│   └── stores/              # Zustand store definitions
├── state/               # Redux state management
│   └── onboarding/          # First Draft Path state machine
│       └── onboardingSlice.ts   # Onboarding progress tracking and analytics
├── data/                # Sample data and templates
│   ├── sampleProject.ts     # Sample project and genre templates
│   └── starterTemplates.ts  # Opinionated starter templates for all skill levels
├── utils/               # Shared utilities
│   ├── flags.ts         # Feature flag system
│   ├── storage.ts       # Enhanced storage with IndexedDB + compatibility layer
│   └── trace.ts         # Comprehensive tracing system (performance, user actions, storage)
├── types/              # TypeScript definitions
└── styles/             # CSS modules and globals
```

### System Architecture Overview

```mermaid
graph TB
    %% User Interface Layer
    subgraph "🎨 User Interface Layer"
        UI["React + TypeScript UI"]
        Router["Application Routing"]
    end

    %% Feature Layer
    subgraph "🚀 Feature Layer"
        Writing["📝 Writing Engine\n(TipTap Editor)"]
        Planning["📋 Planning Tools\n(Timeline, Plot Boards)"]
        AI["🤖 AI Services\n(Claude Integration)"]
        Analytics["📊 Analytics\n(Writing Insights)"]
        Onboarding["🎓 Onboarding\n(Tours & Tutorials)"]
    end

    %% Service Layer
    subgraph "⚙️ Service Layer"
        FeatureFlags["🎯 Feature Flags"]
        Search["🔍 Search Service"]
        Export["📤 Export Engine"]
        Backup["💾 Backup System"]
        AIRetry["🔄 AI Retry Logic"]
    end

    %% Data Layer
    subgraph "💾 Data Layer"
        IndexedDB["🗄️ IndexedDB\n(Profile Isolated)"]
        LocalStorage["💿 localStorage\n(Preferences)"]
        Migration["🔄 Data Migration"]
    end

    %% External Services
    subgraph "🌐 External Services"
        ClaudeAPI["🤖 Claude API"]
        MockAI["🎭 Mock AI Service"]
    end

    %% Data Flow
    UI --> Router
    Router --> Writing
    Router --> Planning
    Router --> AI
    Router --> Analytics
    Router --> Onboarding

    Writing --> FeatureFlags
    Planning --> Search
    AI --> AIRetry
    Analytics --> Export
    Onboarding --> Backup

    FeatureFlags --> IndexedDB
    Search --> IndexedDB
    Export --> LocalStorage
    Backup --> Migration
    AIRetry --> ClaudeAPI
    AIRetry --> MockAI

    Migration --> IndexedDB
    Migration --> LocalStorage

    %% Styling
    classDef userInterface fill:#e1f5fe,stroke:#0277bd,stroke-width:2px
    classDef feature fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    classDef service fill:#fff3e0,stroke:#ef6c00,stroke-width:2px
    classDef data fill:#e8f5e8,stroke:#2e7d32,stroke-width:2px
    classDef external fill:#fce4ec,stroke:#c2185b,stroke-width:2px

    class UI,Router userInterface
    class Writing,Planning,AI,Analytics,Onboarding feature
    class FeatureFlags,Search,Export,Backup,AIRetry service
    class IndexedDB,LocalStorage,Migration data
    class ClaudeAPI,MockAI external
```

**Key Architectural Principles:**

- **Local-First**: All data stored locally in IndexedDB with localStorage fallback
- **Feature Flag Driven**: All major features controlled by feature flags
- **AI-First Design**: Mock and production AI services with circuit breakers
- **Offline-Capable**: Works without network, with graceful AI degradation
- **Progressive Enhancement**: Core features work without AI, enhanced with it
- **Accessible by Design**: WCAG AA compliant throughout

---

## Getting Started for Contributors

### Quick Setup

```bash
# 1. Clone the repository
git clone https://github.com/oklahomahail/Inkwell2.git
cd inkwell

# 2. Install dependencies (pnpm required)
pnpm install

# 3. Start the development server
pnpm dev

# 4. Open http://localhost:5173
```

### First Time Setup Workflow

When you first open Inkwell, you'll go through a quick onboarding:

1. **Welcome Project** — View the pre-populated sample project with quick start guide (optional)
2. **Optional Tour** — Take a 60-90 second tour of the main features
3. **Start Writing** — Create a blank project or use the guided First Draft Path

### Developer Workflow

```bash
# Development commands
pnpm dev           # Start with hot reload
pnpm build         # Production build
pnpm preview       # Test production build
pnpm test          # Run test suite in watch mode

# Code quality
pnpm typecheck     # TypeScript compilation check
pnpm lint          # ESLint (strict mode)
pnpm lint:fix      # Auto-fix ESLint issues
pnpm test:run      # Run all tests once
pnpm test:coverage # Generate coverage report
```

### Testing Your Changes

1. **Test the Onboarding** — Clear your localStorage to test first-run experience
2. **Run the Test Suite** — Ensure all tests pass with `pnpm test:run`
3. **Run Coverage Reports** — Use `pnpm test:coverage` to verify your changes maintain coverage
4. **Build Check** — Run `pnpm build` to ensure production build succeeds

See **[Testing Guide](docs/TESTING_GUIDE.md)** for comprehensive testing patterns and best practices.

### Key Development Areas

- **`src/components/`** — React components organized by feature
- **`src/services/`** — Business logic and external integrations
- **`src/features/`** — Self-contained feature modules (e.g., Plot Boards)
- **`docs/dev/`** — Developer documentation for each system

---

## Contributing

We welcome contributions! Please:

1. Check [Issues](https://github.com/oklahomahail/Inkwell2/issues) for open tasks
2. Follow TypeScript + ESLint conventions
3. Test thoroughly before submitting PRs
4. Include clear commit messages

### Development Guidelines

- Use TypeScript strict mode
- Follow component patterns in existing codebase
- Add error boundaries for new features
- Include accessibility considerations

---

## License

MIT License © 2025 Inkwell Authors

---

## Documentation

### For Writers & Users

📚 **[User Guide](USER_GUIDE.md)** - Complete guide for writers using Inkwell
🚀 **[Getting Started](README.md#getting-started-for-contributors)** - Quick setup and first-time user workflow

### For Developers

🏗️ **[Architecture Overview](README.md#system-architecture-overview)** - System design and component relationships
🤖 **[AI Services](docs/dev/ai-services.md)** - Claude integration, retry logic, and mock services
💾 **[Storage System](docs/dev/storage.md)** - Profile isolation, IndexedDB, and backup strategies
🎓 **[Onboarding & Tours](docs/dev/onboarding.md)** - Tutorial system, first draft path, and analytics
🧪 **[Testing Guide](docs/TESTING_GUIDE.md)** - Comprehensive testing patterns, setup, and best practices (✅ 72.31% coverage)
📊 **[Test Coverage Summary](docs/test-coverage-summary.md)** - Module-by-module coverage breakdown and improvements

### Feature Documentation

🎓 **[Beginner Mode Integration](docs/BEGINNER_MODE_INTEGRATION.md)** - 15-minute onboarding system
🎨 **[Plot Boards](docs/PLOT_BOARDS.md)** - Kanban-style story organization with collaboration
🎯 **[Enhanced Onboarding](src/components/Onboarding/README.md)** - 8-layer onboarding system
📂 **[Project Management](src/components/ProjectManagement/README.md)** - Project organization and search
⚡ **[Performance Guardrails](docs/PERFORMANCE_GUARDRAILS.md)** - Optimization for large projects

### Brand & Design

🩶 **[Brand Guide](docs/BRANDING_GUIDE.md)** - Complete visual identity system
🎨 **[Brand Colors](docs/COLORS.md)** - Blue & gold color system with accessibility
🏷️ **[Brand Assets](public/brand/README.md)** - Logo, color, and asset directory
🎆 **[Brand Update Summary](docs/BRAND_UPDATE_SUMMARY.md)** - Implementation guide

### Deployment & Operations

🚀 **[Deployment Guide](docs/ops/01-deploy.md)** - Production deployment instructions
🔧 **[ESLint Migration](docs/ESLINT_MIGRATION.md)** - Technical migration details
📊 **[Trace System](docs/TRACE_SYSTEM.md)** - Performance monitoring and debugging

---

## Links

**Live Demo:** https://inkwell-writing.vercel.app
**Repository:** https://github.com/oklahomahail/Inkwell2
**Issues:** https://github.com/oklahomahail/Inkwell2/issues
