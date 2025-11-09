# Inkwell Platform Roadmap

_Last updated: November 9, 2025_

## Vision

Inkwell is an **offline-first writing platform** for serious authors. The focus is a calm, reliable writing flow with smart assistance that stays out of the way.

---

## Current Status: v0.9.1-beta (November 2025)

**Latest Release:** v0.9.1-beta - Onboarding, EPUB, Telemetry & Bundle Guard
**Package Version:** v1.2.1
**Repository:** https://github.com/oklahomahail/Inkwell2
**Live Demo:** https://inkwell-writing.vercel.app

### ✅ Recently Completed

#### Advanced Mode for AI Providers (November 9, 2025)

- **Advanced Mode Toggle**: Persistent opt-in system for power users with localStorage persistence
- **User API Key Overrides**: Secure browser-based storage for custom provider API keys
- **Extended Model Registry**: 9 total models (7 curated baseline + 2 extended experimental)
- **Priority System**: User overrides → Environment variables with graceful fallbacks
- **Comprehensive Testing**: 75 new tests achieving 80.59% coverage across AI configuration layer
- **Error Handling**: Robust localStorage error handling for private browsing and quota scenarios
- **Documentation**: Complete Advanced Mode guide in docs/ai-providers.md

#### v0.9.1-beta - Onboarding, EPUB, Telemetry & Bundle Guard (November 2025)

- **Welcome Project**: Pre-populated sample project for new users with quick start guide
- **EPUB 3.0 Export**: Beta e-book export compatible with Kindle, Apple Books, Calibre
- **Enhanced Telemetry**: Session tracking, export metrics, autosave latency monitoring
- **Bundle Guard**: CI-enforced bundle size limits (+5% warn, +10% error)
- **Privacy Controls**: User-facing telemetry opt-out toggle in Settings
- **Comprehensive Documentation**: autosave.md, backup.md, exporting.md, privacy.md

#### v0.9.0-beta - Reliability & Performance Layer (October 2025)

- **Defensive Guards**: File corruption prevention, defensive IndexedDB access
- **Service Worker Fixes**: Precaching improvements and asset verification
- **Bloat Cleanup (4 Phases)**: Removed unused dependencies, archived 300+ files, 29% bundle reduction
- **Bundle Optimization**: Lazy-loading reduced bundle from 1,151 KB to 812 KB
- **Autosave System**: 2-second debounced saves with latency monitoring
- **3-Tier Recovery**: IndexedDB → localStorage → memory fallback

#### v0.8.0 - Enhanced Export & AI (Historical)

- **Professional Export System**: Multi-format wizard (PDF, DOCX, EPUB, Markdown)
- **AI Plot Analysis**: Comprehensive plot structure analysis with pacing graphs
- **Export Dashboard**: History visualization and analytics
- **Export Readiness**: Real-time project validation and recommendations

See [CHANGELOG.md](../../CHANGELOG.md) for full release history.

---

## Next Up: v1.0.0 - Production Ready (Q4 2025 - Q1 2026)

**Focus:** Polish, Stability, Performance, Documentation

### 🎯 Key Priorities

#### A. Performance & Optimization

- Advanced virtualization for large projects (1000+ scenes)
- Web Worker for search indexing and background processing
- Optimized IndexedDB queries and batch operations
- Memory leak detection and prevention

#### B. Enhanced AI Features

- Streaming AI responses for better UX
- Context-aware AI suggestions based on full manuscript
- Plot hole detection across entire story
- Style consistency analysis

#### C. Advanced Export Features

- EPUB cover image support
- Custom CSS themes for EPUB export
- Professional manuscript formatting templates
- Batch export for multiple formats

#### D. Collaboration Foundation

- Conflict-free data structures for offline collaboration
- Export/import project packages for sharing
- Version history and rollback capabilities

#### E. Documentation & Testing

- Comprehensive user documentation
- Video tutorials and screencasts
- Increase test coverage to 80%+
- E2E testing for critical user journeys

---

## Future Releases (Beyond v1.0.0)

### v2.0.0 - Collaboration & Cloud Sync (Future)

- **Supabase Realtime**: Live presence and collaborative editing
- **Cloud Sync**: Optional cloud backup with conflict resolution
- **Shared Projects**: Multi-user collaboration features
- **Mobile PWA**: Touch-optimized editor for tablets

### Future Enhancements (Roadmap Items)

- **Advanced Analytics**: Writing patterns, productivity insights, story metrics
- **Publishing Integration**: Direct export to publishing platforms
- **AI Story Coach**: Personalized writing feedback and improvement suggestions
- **Theme Marketplace**: Custom editor themes and export templates
- **Plugin System**: Community extensions and integrations

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

### Multi-Profile Workspace System ✅ (October 3, 2025)

- Profile-specific data storage
- Profile switching interface
- Data migration system

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

- **v0.8.0 Scope**: [v0.8.0-scope.md](./v0.8.0-scope.md)
- **Developer Setup**: [../dev/setup.md](../dev/setup.md)
- **Deployment Guide**: [../ops/01-deploy.md](../ops/01-deploy.md)
- **Feature Docs**: [../features/](../features/)
- **Testing Guide**: [../TESTING_GUIDE.md](../TESTING_GUIDE.md)

---

## Feedback and Suggestions

We welcome input on our roadmap! Please submit feature requests through:

1. **GitHub Issues**: [github.com/davehail/inkwell/issues](https://github.com/davehail/inkwell/issues)

---

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for branching, commits, and PR checks.

---

**Last Updated**: November 9, 2025
**Maintainers**: @davehail
**Status**: v0.9.1-beta released, v1.0.0 planning underway
