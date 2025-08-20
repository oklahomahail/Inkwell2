# Inkwell Platform Roadmap 2025

_Last updated: August 20, 2025_

## Vision

Inkwell is an offline‑first writing platform for serious authors. The focus is a calm, reliable writing flow with smart assistance that stays out of the way.

## What changed in this update

- **Story Architect API Integration** – moved from remaining to **Completed**.
- **Enhanced Writing Editor fixes** – TypeScript errors resolved and editor stability improved.
- **Advanced Focus Mode** – still in the pipeline. Not yet implemented.

---

## Completed (since v0.4.0)

### Story Architect – Real Claude API integration with fallback

- `storyArchitectService` now uses live Claude API calls.
- Robust error handling routes failures to the existing mock generator so flows continue gracefully.
- Deterministic options and token budgeting added to protect responsiveness in long documents.
- Logs and surface‑level telemetry added for easier debugging during Phase 2 work.

### Enhanced Writing Editor – Stability + TS fixes

- Resolved TypeScript errors across the editor and shared services.
- Improved selection, undo/redo, and snapshot reliability under long‑session usage.

> **Why this matters**: The real Claude integration proves the architecture for complex AI‑assisted features and sets the foundation for the rest of Phase 2.

---

## Phase 2 – In progress / upcoming

- **Consistency Guardian** – cross‑chapter continuity checks and style guidance.
- **Advanced Focus Mode** – deeper distraction‑reduction and context scoping for long writing sessions. _Status: pipeline_.
- **Quality of life** – incremental editor ergonomics, prompt presets, and export polish.
- **Reliability** – background save hardening and defensive guards around long operations.

---

## Guardrails and principles

- Local‑first storage with explicit, user‑controlled exports.
- AI is opt‑in and transparent; fallbacks preserve core writing flows.
- Minimal UI pauses; long operations must provide progress and a cancel path.
