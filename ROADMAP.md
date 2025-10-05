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

### Enhanced Timeline Integration – **October 2025**

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

## Phase 3+ – Future Roadmap

- **Phase 3** – Advanced AI Integration (Claude API, plot hole detection, style analysis)
- **Phase 4** – Collaboration Features (multi-user editing, comments, version control)
- **Phase 5** – Publishing & Export (professional formatting, EPUB, platform integration)
- **Phase 6** – Advanced Analytics (writing patterns, productivity insights, story metrics)

---

## Guardrails and principles

- Local‑first storage with explicit, user‑controlled exports.
- AI is opt‑in and transparent; fallbacks preserve core writing flows.
- Minimal UI pauses; long operations must provide progress and a cancel path.
