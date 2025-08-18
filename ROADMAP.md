<paste the ROADMAP.md content here>
# Inkwell Roadmap

_Last updated: August 2025_

Inkwell is a professional, local-first writing platform with AI assistance, story planning, analytics, and clean export options. This roadmap tracks what’s shipped and what’s next.

---

## ✅ Current State (August 2025)

- Core platform complete (Phase 1)
- Phase 2 “Quick Wins” delivered:
  - Enhanced AI Toolbar (Continue Scene, Add Emotion, Improve Flow)
  - Writing Goals (daily goals, session timer, streaks)
  - Story Structure Visualizer (story health score, chapter analysis)
- Infrastructure & polish:
  - App/Claude/Toast contexts stable
  - Auto-save state surfaced in UI
  - Snapshot/backup foundations + adapter (local-first)
  - Analytics (Recharts), keyboard shortcuts, command palette

---

## 🏁 Recent Achievements

- Fixed & unified snapshot service / adapter
- New Backup & Snapshot UI: `BackupControls`, `SnapshotHistoryDialog`
- Topbar save status wired to real auto-save state
- Toast system consolidated (single `ToastProvider`)
- TypeScript/types cleanup, alias paths validated, ESLint/Prettier pass

---

## 🎯 Near Term (1–2 weeks)

- **Story Architect Mode** (outline from premise)
- **Advanced Focus Mode** (typewriter mode, sprints, ambient sounds)
- **Enhanced Analytics** (velocity trend, productivity heat map)
- **Snapshot UX polish** (labels, restore confirmation, diff hints)

**Success criteria**

- Architect Mode generates usable outlines in ≤ 10s
- ≥ 70% of active users try Focus Mode
- Analytics page loads < 150ms with 10k+ words

---

## 🚧 Short Term (1–2 months)

- **Consistency Guardian** (character/timeline/world checks)
- **Visual Story Tools** (Timeline, Corkboard/Map, Relationship Graph)
- **Project Management** (Version history UI, templates, search)

**Success criteria**

- 30% reduction in continuity mistakes (self-report)
- Version restore round-trip < 5s
- Search returns relevant results in < 150ms

---

## 🔭 Mid Term (3–6 months)

- **Collaboration** (presence, multi-user editing, beta readers)
- **Community Connectors** (share drafts / feedback)
- **Advanced AI Research** (facts, genre conventions, inspiration)

**Success criteria**

- 2–3 concurrent editors with conflict-free merges
- Beta reader feedback loop in a single flow
- 40%+ adoption of advanced AI features

---

## 📦 Exports & Publishing (Phase 3 outline)

- Industry-standard manuscript formatting
- Submission packages (synopsis, query letter)
- EPUB + styled PDF exports

**Success criteria**

- 90%+ export success across markets
- 50% improvement in story quality (self-reported)

---

## 🧱 Technical Evolution

- Local-first persistence (IndexedDB + storage adapter)
- Snapshot adapter pattern; emergency cleanup
- TipTap + React 18 + TS + Tailwind
- Performance goals:
  - Editor responsiveness < 200ms
  - Project switch < 300ms
  - Snapshot restore < 5s

---

## ⚠️ Risks & Mitigations

- **Large manuscripts performance** → virtualized views + indexed data
- **Feature creep** → Quick-Wins gating + phased milestones
- **AI rate limits** → queued requests, backoff, cached context
- **Storage quotas** → snapshot pruning + user-visible usage

---

## 🔗 Issue Buckets (labels you can add)

- `phase:2-advanced`
- `feature:architect`
- `feature:consistency-guardian`
- `feature:timeline`
- `feature:version-history`
- `area:editor` / `area:analytics` / `area:export`
- `good-first-issue` / `help-wanted`

---

## 📍 Tracking & Updates

- Roadmap is updated at the end of each sprint.
- Each item should link to a GitHub issue or project task.
