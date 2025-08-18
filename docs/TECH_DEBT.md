TECH_DEBT / REFACTOR CHECKLIST (Inkwell)

Last updated: today

🔧 Code Quality & Types

Replace any in useWriting.tsx state and return types with real Chapter, Scene, Project types.

Normalize Project vs EnhancedProject types (one source of truth in src/types/project.ts).

Audit path casing on UI imports (Button, etc.) to avoid case-sensitive duplicates on non-macOS filesystems.

Add minimal unit tests for snapshot adapter + services (Vitest + RTL).

Remove unused vars/imports flagged by ESLint (e.g., snapshotAdapter.ts base, various icons/components).

Address ESLint “missing dependency” warnings on hooks (wrap callbacks in useCallback and include deps).

💾 Snapshots & Backups

Auto-prune snapshots (e.g., keep last N per project + daily/weekly).

Snapshot History polish: filters (by label/date), bulk delete, “restore as copy”.

Confirm all code paths use one snapshot service (adapter) and remove legacy helpers.

Add quick action in Topbar: “Manual Snapshot” with toast feedback + spinner.

🤖 AI & Story Architect

Replace any mock Story Architect endpoints with real Claude calls (respect model, tokens, temp from Settings).

Persist Story Architect config per project; allow “Regenerate Chapter” granularly.

Add “Import Diff” preview when merging generated content into existing chapters.

✍️ Writing Experience

Advanced Focus Mode: typewriter scrolling, timed sprints, ambient sounds toggle.

Scene/Chapter reorder UX polish (keyboard-first, accessible drag handles).

Full-text search across projects (index on save; debounce; show snippets).

📊 Analytics & Goals

Writing velocity trendlines + heatmaps (persisted sessions).

Goals: weekly/project goals + streak badges; clean goal reset edge-cases.

🧭 Visual Story Tools

Timeline view (by character + global chronology).

Relationship graph (character nodes + interactions).

Story map / corkboard (reorder scenes as cards; link to editor).

🔐 Reliability & Storage

Quota handling: preflight checks + friendly UI when near limit, auto-backup prompt.

Backup export/import: confirm schema versioning + migrate on import.

Versioned schema migrations in projectSchema.ts (forward-compatible guard rails).

🧩 Architecture & DX

Extract shared UI primitives (Dialog/Toast/Button/etc.) under a single ui/ barrel with strict props.

Create services/index.ts that exports public surface; enforce internal only modules with path rules.

Vitest setup + a few “golden path” tests (snapshots, backup export/import, Story Architect happy path).

Nice-to-Have Process Bits

GitHub label tech-debt and a saved issue template (checklist above).

Small CI job: run pnpm typecheck && pnpm lint on PRs.
