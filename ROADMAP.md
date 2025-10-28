# Inkwell Platform Roadmap 2025

_Last updated: October 5, 2025_

## Vision

Inkwell is an offline‑first writing platform for serious authors. The focus is a calm, reliable writing flow with smart assistance that stays out of the way.

## What changed in this update

- **Enhanced Timeline Integration** – **COMPLETED** – Comprehensive conflict detection, scene linkage, and chronological navigation
- **Timeline Validation System** – **COMPLETED** – 5 types of conflict detection with auto-fix capabilities
- **Scene-Timeline Linkage** – **COMPLETED** – Intelligent auto-detection and manual linking with validation
- **Timeline Navigation** – **COMPLETED** – Chronological scene navigation with sibling detection
- **Story Architect Service** – **IN PROGRESS** – Next immediate priority for Phase 2 completion

---

## Completed (since v0.4.0)

### v0.5.0 – Supabase Integration Complete – **October 28, 2025** ✅

- **Local-First Architecture** – IndexedDB + Supabase dual persistence with optional cloud sync
- **Conflict Detection & Sync Queue** – Intelligent conflict resolution with last-write-wins strategy
- **Cloud Sync UI** – Real-time sync status badges and cloud sync toggle control
- **Row-Level Security (RLS)** – Postgres RLS policies enforcing user data isolation
- **Server-Controlled Timestamps** – `updated_at` managed by database triggers for consistency
- **8 Core Migrations** – Fully tested migration suite with profiles, roles, and bulk operations
- **Comprehensive Documentation** – Complete setup guides, migration references, and quickstart docs
- **Developer Scripts** – Health checks, migration tools, and testing utilities

> **Why this matters**: Establishes production-ready cloud sync foundation enabling collaboration features, real-time updates, and data portability while maintaining local-first reliability.

### Spotlight Tour Phase 2 – **October 25, 2025** ✅

- **Interactive Guided Tours** with SpotlightOverlay UI component
- **Auto-start Integration** for first-time users on dashboard
- **Feature-Specific Tours** for AI tools and Export features
- **Analytics Integration** via analyticsService adapter
- **Help Menu Launchers** for replaying tours
- **6-step Default Tour** covering all major UI areas
- **Accessibility Features** with keyboard navigation and ARIA support
- **Comprehensive Documentation** in `/docs/TOUR_QUICK_REFERENCE.md`

### Enhanced Timeline Integration – **October 2025** ✅

- **Enhanced Timeline Service** (`enhancedTimelineService.ts`) – Comprehensive conflict detection and validation system
- **5 Types of Conflict Detection**:
  - Time overlap conflicts (characters in multiple locations simultaneously)
  - Character presence validation (timeline vs chapter consistency)
  - Location mismatch detection (impossible travel times)
  - POV inconsistencies (POV character validation)
  - Chronological errors (invalid time ranges)
- **Scene-Timeline Linkage** – Bidirectional linking with intelligent auto-detection based on content analysis
- **Timeline Navigation** – Chronological scene navigation with sibling scene detection
- **Timeline Health Scoring** – Overall timeline quality assessment (0-100 scale) with optimization suggestions
- **Three New UI Components**:
  - `TimelineValidationPanel` – Visual conflict detection with auto-fix capabilities
  - `SceneLinkageSuggestions` – AI-powered scene linkage recommendations
  - `TimelineNavigation` – Chronological navigation between scenes
- **Enhanced Timeline Panel** – Modern tabbed interface integrating all timeline features
- **Comprehensive Test Suite** – 22 new tests, 88 total tests passing (100% success rate)
- **Performance Optimization** – Validated for projects with 1000+ timeline events

> **Why this matters**: This establishes a robust foundation for story consistency validation and provides writers with powerful tools to maintain narrative coherence across complex timelines.

### Story Architect – Real Claude API integration with fallback

- `storyArchitectService` now uses live Claude API calls.
- Robust error handling routes failures to the existing mock generator so flows continue gracefully.
- Deterministic options and token budgeting added to protect responsiveness in long documents.
- Logs and surface‑level telemetry added for easier debugging during Phase 2 work.

### Enhanced Writing Editor – Stability + TS fixes

- Resolved TypeScript errors across the editor and shared services.
- Improved selection, undo/redo, and snapshot reliability under long‑session usage.

---

## Phase 2 – Story Architect Mode (Current Focus)

**Status**: Timeline Integration ✅ **COMPLETED** – Story Architect ⏳ **IN PROGRESS**

### Next Immediate Priorities

- **Story Architect Service** – Core service implementation for scene outline management and story structure templates
- **Story Outline Editor** – Interactive outline editing interface with drag-and-drop reordering
- **Template System** – Predefined story structure templates (3-act, hero's journey, Save the Cat, etc.)
- **Architect Panel Integration** – Main story architect interface with visualization
- **Advanced Integration Features** – Scene dependency tracking and plot thread analysis

### Still Planned

- **Consistency Guardian** – cross‑chapter continuity checks and style guidance (enhanced with timeline integration)
- **Advanced Focus Mode** – deeper distraction‑reduction and context scoping for long writing sessions
- **Quality of life** – incremental editor ergonomics, prompt presets, and export polish
- **Reliability** – background save hardening and defensive guards around long operations

### Documentation & UX Hardening – **Current Sprint**

**Documentation Updates**:

- ✅ Removed all Clerk references, updated to Supabase-only
- ✅ Added Spotlight Tour integration guide
- ✅ Clarified theme default (light mode primary)
- ✅ Documented Focus Mode exit (Esc key)
- ✅ Enhanced troubleshooting with Settings/MutationObserver fixes
- ✅ Added testing guide for Vitest + IndexedDB

**Quick Wins (UI)**:

- ⏳ Add visible "Exit Focus Mode" button
- ⏳ Improve Settings panel routing guards
- ⏳ Add data-tour-id attributes for feature tours

---

## Phase 3+ – Future Roadmap

### v0.6.0 – Realtime + Collaboration (Planned)

- **Supabase Realtime** – Live presence, cursor sync, and collaborative editing
- **User Profiles** – Public author profiles and project sharing capabilities
- **Shared Projects** – Multi-user collaboration with conflict resolution
- **Push Notifications** – Supabase Functions for notification delivery
- **PWA Integration** – Progressive Web App capabilities with offline analytics
- **Realtime Sync** – Live updates across devices and collaborators

---- **Phase 3** – Advanced AI Integration (Claude API, plot hole detection, style analysis)

- **Phase 4** – Collaboration Features (multi-user editing, comments, version control)
- **Phase 5** – Publishing & Export (professional formatting, EPUB, platform integration)
- **Phase 6** – Advanced Analytics (writing patterns, productivity insights, story metrics)

---

## Guardrails and principles

- Local‑first storage with explicit, user‑controlled exports.
- AI is opt‑in and transparent; fallbacks preserve core writing flows.
- Minimal UI pauses; long operations must provide progress and a cancel path.
