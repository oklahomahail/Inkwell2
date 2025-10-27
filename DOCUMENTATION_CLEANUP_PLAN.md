# Inkwell Documentation Cleanup Plan

**Date:** October 27, 2025  
**Status:** In Progress

## Executive Summary

This document outlines a comprehensive plan to reorganize Inkwell's documentation from **205+ scattered markdown files** into a clean, maintainable structure with ~30 core documents.

## Current State Analysis

### Root Directory Chaos

- **205+ total markdown files** across root, /docs, and subdirectories
- **Massive redundancy:** Multiple versions of README, overlapping summaries
- **Unclear organization:** Mix of implementation summaries, checklists, guides, and historical artifacts
- **Hard to navigate:** New contributors and users can't find current, authoritative information

### Categories of Documents

1. **Implementation Summaries** (~60 files)
   - Phase summaries (PHASE_1, PHASE_2, PHASE_2B, PHASE_3)
   - Feature completion summaries (AUTH_FIX, BRAND_FIX, CHAPTER_MVP, etc.)
   - Quick win summaries

2. **Checklists & Procedures** (~40 files)
   - Deployment checklists
   - Testing checklists
   - Verification guides
   - QA procedures

3. **Technical Guides** (~30 files)
   - Setup guides
   - Integration guides
   - Troubleshooting docs
   - Architecture docs

4. **Historical/Obsolete** (~50 files)
   - Old implementation notes
   - Completed migration docs
   - Superseded guides

5. **Core Docs** (~25 files)
   - README, CHANGELOG, ROADMAP
   - CONTRIBUTING, DEPLOYMENT
   - User guides, feature docs

## Target Structure

```
📁 inkwell/
├── README.md                           # Main project overview
├── CHANGELOG.md                        # Version history
├── CONTRIBUTING.md                     # How to contribute
│
├── 📁 docs/
│   ├── README.md                       # Documentation index
│   │
│   ├── 📁 product/
│   │   ├── ROADMAP.md                 # Product roadmap
│   │   ├── PLATFORM_OVERVIEW.md       # What Inkwell does
│   │   └── RELEASE_NOTES.md           # Release history
│   │
│   ├── 📁 user/
│   │   ├── USER_GUIDE.md              # End-user documentation
│   │   ├── BEGINNER_MODE.md           # Beginner mode features
│   │   └── TROUBLESHOOTING.md         # User troubleshooting
│   │
│   ├── 📁 dev/
│   │   ├── SETUP.md                   # Developer setup guide
│   │   ├── DEPLOYMENT.md              # Deployment procedures
│   │   ├── TESTING.md                 # Testing guide
│   │   ├── ARCHITECTURE.md            # System architecture
│   │   ├── MODULE_CONTRACTS.md        # Module interfaces
│   │   │
│   │   ├── 📁 linting/
│   │   │   └── ESLINT_MIGRATION.md
│   │   │
│   │   └── 📁 performance/
│   │       ├── TRACE_SYSTEM.md
│   │       └── PERFORMANCE_GUARDRAILS.md
│   │
│   ├── 📁 features/
│   │   ├── AI_SERVICES.md             # AI integration
│   │   ├── PLOT_BOARDS.md             # Plot board system
│   │   ├── CHAPTER_MANAGEMENT.md      # Chapter features
│   │   ├── WORLD_BUILDING.md          # World building tools
│   │   ├── TOUR_SYSTEM.md             # Spotlight tours
│   │   └── AUTHENTICATION.md          # Supabase auth
│   │
│   ├── 📁 brand/
│   │   ├── BRAND_GUIDE.md             # Visual identity
│   │   └── ACCESSIBILITY.md           # A11y standards
│   │
│   └── 📁 ops/
│       ├── UPTIME_MONITORING.md       # Monitoring setup
│       └── ROLLBACK_PROCEDURES.md     # Emergency procedures
│
└── 📁 .archive/
    ├── 📁 summaries/                   # Implementation summaries
    ├── 📁 checklists/                  # Completed checklists
    ├── 📁 phase-summaries/             # Historical phase docs
    └── 📁 migrations/                  # Old migration guides
```

## Action Plan

### Phase 1: Archive Historical Documents ✅

Move completed implementation summaries and phase documents to `.archive/`:

**To `.archive/phase-summaries/`:**

- PHASE_1_SUMMARY.md
- PHASE_2_SUMMARY.md
- PHASE_2B_COMPLETION_SUMMARY.md
- PHASE_3_COMPLETION_SUMMARY.md

**To `.archive/summaries/`:**

- All \*\_COMPLETE.md files
- All \*\_SUMMARY.md files
- All _\_FIX_.md files
- IMPLEMENTATION\_\*.md files

**To `.archive/checklists/`:**

- All \*\_CHECKLIST.md files
- All _\_VERIFICATION_.md files
- DEPLOYMENT_NOTES.md

### Phase 2: Consolidate Core Documentation

#### 2.1 Product Documentation

- **Merge:** ROADMAP.md + TECHNICAL_ROADMAP.md → `docs/product/ROADMAP.md`
- **Move:** PLATFORM_OVERVIEW.md → `docs/product/PLATFORM_OVERVIEW.md`
- **Consolidate:** RELEASE.md + RELEASE_NOTES_v\*.md → `docs/product/RELEASE_NOTES.md`

#### 2.2 User Documentation

- **Merge:** USER_GUIDE.md + BEGINNER_MODE_INTEGRATION.md + docs/ONBOARDING.md → `docs/user/USER_GUIDE.md`
- **Keep:** docs/TROUBLESHOOTING.md → `docs/user/TROUBLESHOOTING.md`

#### 2.3 Developer Documentation

- **Create:** `docs/dev/SETUP.md` (merge setup-related content from README)
- **Move:** DEPLOYMENT.md → `docs/dev/DEPLOYMENT.md`
- **Move:** docs/TESTING.md + docs/TESTING_GUIDE.md → `docs/dev/TESTING.md` (merged)
- **Create:** `docs/dev/ARCHITECTURE.md` (consolidate architecture docs)
- **Keep:** MODULE_CONTRACTS.md → `docs/dev/MODULE_CONTRACTS.md`

#### 2.4 Feature Documentation

- **Merge:** docs/AI_SERVICES.md + docs/AI_INTEGRATION.md + docs/AI_PLOT_ANALYSIS.md → `docs/features/AI_SERVICES.md`
- **Keep:** docs/PLOT_BOARDS.md → `docs/features/PLOT_BOARDS.md`
- **Merge:** CHAPTER*MANAGEMENT*\*.md → `docs/features/CHAPTER_MANAGEMENT.md`
- **Merge:** WORLD*BUILDING*\*.md → `docs/features/WORLD_BUILDING.md`
- **Merge:** All TOUR\_\*.md files → `docs/features/TOUR_SYSTEM.md`
- **Merge:** All SUPABASE*AUTH*_.md + AUTH\__.md → `docs/features/AUTHENTICATION.md`

#### 2.5 Brand Documentation

- **Consolidate:** docs/BRAND*UPDATE_SUMMARY.md + docs/BRANDING_GUIDE.md + docs/COLORS.md + BRAND*\*.md → `docs/brand/BRAND_GUIDE.md`
- **Keep:** docs/BRAND_ACCESSIBILITY_GUIDE.md → `docs/brand/ACCESSIBILITY.md`

#### 2.6 Performance Documentation

- **Merge:** docs/TRACE_SYSTEM.md + docs/PERFORMANCE_GUARDRAILS.md + docs/PERFORMANCE.md → `docs/dev/performance/PERFORMANCE.md`

### Phase 3: Remove Redundant Files

**Delete duplicates:**

- README (1).md, README (2).md
- ai-services.md (if duplicate of docs/AI_SERVICES.md)

**Delete obsolete:**

- Old IndexedDB polyfill docs (implementation complete)
- Old Clerk migration docs (replaced by Supabase)
- Superseded quick reference docs

### Phase 4: Create Navigation

Create `docs/README.md` as documentation index:

- Link to all major sections
- Quick start guide
- "Find what you need" guide

Update root README.md:

- Link to docs/README.md
- Keep high-level overview only
- Remove redundant setup instructions

### Phase 5: Update Links

- Update all internal doc links to new locations
- Update .github templates to reference new structure
- Update package.json scripts if any reference docs

## File Mapping Reference

### Archive Mappings

| Original Location     | New Location              | Status     |
| --------------------- | ------------------------- | ---------- |
| PHASE\_\*\_SUMMARY.md | .archive/phase-summaries/ | ✅ Planned |
| \*\_COMPLETE.md       | .archive/summaries/       | ✅ Planned |
| \*\_CHECKLIST.md      | .archive/checklists/      | ✅ Planned |

### Documentation Reorganization

| Original                     | New Location                 | Action       |
| ---------------------------- | ---------------------------- | ------------ |
| ROADMAP.md                   | docs/product/ROADMAP.md      | Move + merge |
| USER_GUIDE.md                | docs/user/USER_GUIDE.md      | Move + merge |
| DEPLOYMENT.md                | docs/dev/DEPLOYMENT.md       | Move         |
| docs/AI_SERVICES.md          | docs/features/AI_SERVICES.md | Consolidate  |
| docs/BRAND_UPDATE_SUMMARY.md | docs/brand/BRAND_GUIDE.md    | Merge        |

## Success Criteria

- ✅ Root directory has < 10 markdown files
- ✅ Clear docs/ structure with 5-6 main categories
- ✅ No duplicate documentation
- ✅ All links updated and working
- ✅ New contributors can find setup guide in < 30 seconds
- ✅ Historical context preserved in .archive/

## Timeline

1. **Phase 1 (Archive):** 30 minutes - Move historical files
2. **Phase 2 (Consolidate):** 2-3 hours - Merge and reorganize
3. **Phase 3 (Cleanup):** 30 minutes - Delete redundant files
4. **Phase 4 (Navigation):** 1 hour - Create index docs
5. **Phase 5 (Links):** 1 hour - Update all references

**Total estimated time:** 5-6 hours

## Rollback Plan

If issues arise:

1. All moves tracked in this document
2. Git history preserves all deletions
3. Can restore from `.archive/` or git history
4. Incremental approach allows reverting individual phases

## Notes

- Preserve all git history
- Use `git mv` for file moves to maintain history
- Review each merge carefully for current/accurate content
- Prioritize clarity over completeness - better to have 1 great doc than 5 okay ones

---

**Next Steps:** Execute Phase 1 - Archive historical documents
