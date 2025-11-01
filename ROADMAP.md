# Inkwell Platform Roadmap 2025

_Last updated: January 2025_

## Vision

Inkwell is an offline-first writing platform for serious authors. The focus is a calm, reliable writing flow with smart assistance that stays out of the way.

---

## Current Status: v0.7.1 (January 2025)

**Latest Release:** v0.7.1 - Export Dashboard UI Finalization
**GitHub Release:** https://github.com/oklahomahail/Inkwell2/releases/tag/v0.7.1

### ✅ Recently Completed

#### v0.7.1 - Export Dashboard UI Finalization (January 2025)

- **Theme Reactivity**: ChapterDistributionChart and ExportStats with smooth theme transitions
- **Error Boundaries**: ExportDashboardErrorBoundary for graceful error recovery
- **Performance**: 60fps transitions using requestAnimationFrame
- **Test Coverage**: 735/735 tests passing, 0 TypeScript errors

#### v0.7.0 - Export Dashboard with Telemetry (December 2024)

- **Export Dashboard**: Comprehensive export history visualization
- **Export Statistics**: Real-time export analytics and metrics
- **Chapter Distribution**: Visual word count distribution across chapters
- **Export History**: Detailed export records with filtering and search
- **Telemetry Integration**: Full export tracking and analytics
- **E2E Testing**: 14 comprehensive Playwright tests

#### v0.5.0 - Supabase Integration (October 2025)

- **Local-First Architecture**: IndexedDB + Supabase dual persistence with optional cloud sync
- **Conflict Detection & Sync Queue**: Intelligent conflict resolution with last-write-wins strategy
- **Cloud Sync UI**: Real-time sync status badges and cloud sync toggle control
- **Row-Level Security (RLS)**: Postgres RLS policies enforcing user data isolation
- **8 Core Migrations**: Fully tested migration suite with profiles, roles, and bulk operations

#### Spotlight Tour System (October 2025)

- **Interactive Guided Tours**: SpotlightOverlay UI component with keyboard navigation
- **Auto-start Integration**: First-time user onboarding on dashboard
- **Feature-Specific Tours**: AI tools and Export feature tours
- **Analytics Integration**: Tour completion tracking via analyticsService
- **Accessibility**: Full keyboard navigation and ARIA support

---

## Next Up: v0.8.0 (Q1 2025)

**Target:** Mid-late January 2025
**Focus:** Author Flow, Reliability, Publishing, Intelligence, Polish

For complete v0.8.0 scope, see [docs/product/v0.8.0-scope.md](docs/product/v0.8.0-scope.md)

### 🎯 Key Features

#### A. Chapter Editing Experience

- Enhanced chapter editor with autosave queue + debounce
- Inline word/character count indicator
- Conflict resolver for stale local vs. remote changes
- Autosave status indicator in Topbar

#### B. EPUB Export

- Professional e-book output with JSZip + manifest builder
- Auto-generated metadata (title, author, ISBN, cover, TOC)
- EPUB validation (OPF, NCX, XHTML)
- Integration with Export Dashboard

#### C. Enhanced AI Assistance

- Claude streaming (ClaudeService 2.0)
- Chapter summary cache for AI context awareness
- "Ask Inkwell" shortcut (⌘⇧A) for contextual prompts
- Inline AI rewrite and feedback side panel

#### D. Timeline & Conflict Detection

- Timeline Inspector modal with chapter sequence visualization
- AI-assisted detection of temporal inconsistencies
- Exportable timeline views (CSV, Markdown)

#### E. Onboarding & UX Polish

- Quick Tour V2 (3-step overlay on first launch)
- Persistent Docs Drawer
- Enhanced Command Palette discoverability
- Refined Tailwind design tokens

### 📦 Release Plan

| Phase   | Target | Focus             |
| ------- | ------ | ----------------- |
| Phase 1 | Week 1 | Editor + Autosave |
| Phase 2 | Week 2 | EPUB Export       |
| Phase 3 | Week 3 | AI + Timeline     |
| Phase 4 | Week 4 | UX Polish         |

---

## Future Releases

### v0.9.0 - Collaboration (Q2 2025)

- **Supabase Realtime**: Live presence and collaborative editing
- **User Profiles**: Public author profiles and project sharing
- **Shared Projects**: Multi-user collaboration with conflict resolution
- **Push Notifications**: Supabase Functions for notification delivery
- **PWA Integration**: Progressive Web App capabilities

### v1.0.0 - Production Ready (Q3 2025)

- **Advanced AI Integration**: Plot hole detection, style analysis
- **Professional Publishing**: Advanced EPUB, MOBI, PDF export templates
- **Analytics Dashboard**: Writing patterns, productivity insights
- **Mobile Optimization**: Touch-optimized editor and mobile PWA

### Future Enhancements

- **Phase 4**: Collaboration Features (multi-user editing, comments, version control)
- **Phase 5**: Publishing & Export (professional formatting, EPUB, platform integration)
- **Phase 6**: Advanced Analytics (writing patterns, productivity insights, story metrics)

---

## Completed Milestones

### Enhanced Timeline Integration (October 2025) ✅

- **Enhanced Timeline Service**: Comprehensive conflict detection (5 types)
- **Scene-Timeline Linkage**: Bidirectional linking with auto-detection
- **Timeline Navigation**: Chronological scene navigation
- **Timeline Health Scoring**: 0-100 quality assessment
- **Three New UI Components**: ValidationPanel, LinkageSuggestions, Navigation
- **22 New Tests**: 88 total tests passing (100% success rate)

### Story Architect - Claude API Integration ✅

- Live Claude API calls with fallback to mock generator
- Robust error handling and graceful degradation
- Deterministic options and token budgeting
- Logging and telemetry for debugging

### Enhanced Writing Editor ✅

- TypeScript error resolution across editor and services
- Improved selection, undo/redo, and snapshot reliability
- Enhanced stability for long-session usage

---

## Guardrails and Principles

- **Local-first storage** with explicit, user-controlled exports
- **AI is opt-in** and transparent; fallbacks preserve core writing flows
- **Minimal UI pauses**; long operations provide progress and cancel path
- **Privacy-first**: No data sent to cloud without explicit user consent
- **Accessibility**: WCAG AA compliant throughout
- **Performance**: Typing latency < 20ms, autosave < 300ms

---

## Documentation

- **v0.8.0 Scope**: [docs/product/v0.8.0-scope.md](docs/product/v0.8.0-scope.md)
- **Developer Setup**: [docs/dev/setup.md](docs/dev/setup.md)
- **Deployment Guide**: [docs/ops/01-deploy.md](docs/ops/01-deploy.md)
- **Feature Docs**: [docs/features/](docs/features/)
- **Testing Guide**: [docs/TESTING_GUIDE.md](docs/TESTING_GUIDE.md)

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for branching, commits, and PR checks.

---

**Last Updated**: January 2025
**Maintainers**: @davehail
**Status**: v0.7.1 released, v0.8.0 planning underway
