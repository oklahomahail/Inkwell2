# Inkwell Repository Cleanup Audit

**Date**: November 15, 2025
**Branch**: cleanup/2025-11-obsolete-audit
**Objective**: Remove obsolete documentation, archived code, and unused scripts

---

## Summary

**Total Files Identified for Deletion**: ~180+
**Categories**:

- 📁 .archive/ directory: 150+ files (implementation notes, releases, tours, brands)
- 📁 .implementations/ directory: 10+ files
- 📄 Root-level docs: 25+ obsolete files
- 🧹 Archived source code: 5 files in src/components/Onboarding/\_archive/
- 📜 Scripts: TBD (need verification)

---

## Phase 1: Archive Directory (.archive/)

**Total**: 150+ markdown files

### Subcategories:

- `2025-Q3/` - 16 files (consolidated deployment notes, old session summaries)
- `alpha-launch-2025-10/` - 5 files (alpha launch checklists)
- `brands/` - 3 files (brand deployment guides)
- `docs-phase4-2025-11/` - 23 files (deployment checklists, smoke tests, fixes)
- `implementation-notes/2025-11/` - 8 files (coverage reports, test audits)
- `implementations/` - 75+ files (old summaries, fix packages, phase completions)
- `releases/` - 9 files (old deployment checklists)
- `roadmaps/` - 1 file
- `tests/` - 1 file
- `tours/` - 5 files

**Rationale**: All superseded by:

- Current CHANGELOG.md
- ARCHITECTURE_AUDIT_SUMMARY.md
- CRITICAL_FIXES_ACTION_PLAN.md
- Active docs/ directory

**Action**: Delete entire .archive/ directory

---

## Phase 2: Root-Level Obsolete Documentation

Files to delete:

1. `ANALYTICS_DASHBOARD_IMPLEMENTATION.md` - superseded by docs/dev/analytics-dashboard.md
2. `BEFORE_AFTER_COMPARISON.md` - archived duplicate
3. `COMPLETE_FIX_PACKAGE.md` - archived duplicate
4. `DEFENSIVE_GUARDS_COMPLETE.md` - archived duplicate
5. `DEFENSIVE_GUARDS_DEPLOY_CHECKLIST.md` - archived duplicate
6. `DEFENSIVE_GUARDS_INDEX.md` - moved to docs/engineering/
7. `DEFENSIVE_GUARDS_USAGE_GUIDE.md` - moved to docs/engineering/
8. `DEPLOYMENT_CHECKLIST.md` - superseded by docs/DEPLOYMENT.md
9. `DEPLOYMENT_CHECKLIST_DEFENSIVE_GUARDS.md` - archived duplicate
10. `DEPLOYMENT_READY_SUMMARY.md` - old implementation summary
11. `DNS_STATUS.md` - no longer relevant
12. `DOMAIN-FIX-DEPLOYMENT-CHECKLIST.md` - one-time fix
13. `EXECUTE_NOW.md` - ???
14. `FIX_INDEX.md` - superseded by ARCHITECTURE_AUDIT_INDEX.md
15. `FORMATTING_IMPLEMENTATION_SUMMARY.md` - old implementation summary
16. `MIGRATION_GUIDE.md` - check if superseded by docs/
17. `PRECACHE_REENABLE_GUIDE.md` - one-time guide
18. `QUICK_REFERENCE.md` - superseded by docs/QUICK_REFERENCE.md
19. `QUICK_TEST_GUIDE.md` - superseded by docs/TESTING_GUIDE.md
20. `README_DEFENSIVE_GUARDS.md` - moved to docs/engineering/
21. `SECURITY_FIXES_APPLIED.md` - old fix log
22. `SW_AND_ASSETS_FIXES_COMPLETE.md` - old fix log
23. `TOUR_DEFENSIVE_GUARDS.md` - archived duplicate
24. `USER_GUIDE.md` - check if still needed

**Keep**:

- `README.md` - main readme
- `CHANGELOG.md` - active changelog
- `CONTRIBUTING.md` - contributor guide
- `ARCHITECTURE_AUDIT_INDEX.md` - recent audit (11/15)
- `ARCHITECTURE_AUDIT_SUMMARY.md` - recent audit (11/15)
- `CRITICAL_FIXES_ACTION_PLAN.md` - recent audit (11/15)
- `REALTIME_AUDIT_*` (4 files) - recent audit (11/15)
- `TROUBLESHOOTING.md` - active troubleshooting

---

## Phase 3: .implementations Directory

**All files are old implementation summaries**:

1. EPUB_FOUNDATION_CHECKLIST.md
2. PRE_MERGE_QA_CHECKLIST.md
3. PR_DESCRIPTION_V0.9.0.md
4. QA_COMPLETION_SUMMARY.md
5. QUICK_START_DOCS_QA_CHECKLIST.md
6. V0.9.1_CLOSEOUT.md
7. WEEK1_AUTOSAVE_METRICS.md
8. WEEK1_ERROR_BOUNDARIES_RECOVERY.md
9. WEEK1_INDEXEDDB_OPTIMIZATION.md
10. WEEK1_OFFLINE_QUEUE_UI.md
11. WELCOME_PROJECT_HANDOFF.md

**Action**: Delete entire .implementations/ directory

---

## Phase 4: Archived Source Code

**Files in src/components/Onboarding/\_archive/**:

1. OnboardingOrchestrator.tsx
2. TutorialRouter.tsx
3. TourProvider.tsx
4. TourOverlay.tsx
5. InkwellTourOverlay.tsx

**Verification**: Check for imports

```bash
rg "OnboardingOrchestrator|TutorialRouter|TourProvider|TourOverlay|InkwellTourOverlay" src/
```

**Action**: Delete if no active imports found

---

## Phase 5: Scripts Audit

**Keep** (actively used):

- All `check-*.sh` scripts (pre-commit hooks)
- deploy.sh
- setup-supabase.sh
- verify-migration.sh
- coverage-diff.mjs
- audit-tests.mjs

**Delete candidates** (need verification):

- cleanup-docs-\*.sh (one-time cleanup scripts)
- delete-redundant-docs.sh (one-time)
- deploy-brand-update.sh (one-time)
- configure-sentry.md (should be in docs/)
- configure-supabase.md (should be in docs/)
- fix-console-\*.sh/mjs (one-time fixes)
- remove-dark-mode.js (one-time feature removal)
- strip-dark-mode.ts (one-time feature removal)
- prefix-unused-\*.ts/mjs (one-time codemods)
- tailwind-text-replacer.\* (one-time migration)
- verify-create-project-fix.sh (one-time verification)
- verify-hooks-hardening.sh (one-time verification)
- verify-password-reset.ts (one-time verification)
- verify-tour-_._ (multiple old tour verification scripts)
- verify_deployment\*.sh (one-time scripts)
- scripts/codemods/ (old one-time migrations)

**Action**: Move one-time scripts to scripts/archive/

---

## Phase 6: Unused Dependencies

From depcheck:

- `@anthropic-ai/sdk` - check if used in API routes
- `autoprefixer` - likely still needed for Tailwind
- `postcss` - likely still needed for Tailwind
- `stylelint-config-standard` - check if stylelint is configured

**Action**: Verify and remove if truly unused

---

## Verification Checklist

After all deletions:

```bash
# 1. Build
pnpm build

# 2. Type check
pnpm typecheck

# 3. Lint
pnpm lint

# 4. Test
pnpm test

# 5. Check for broken imports
rg "from.*/_archive" src/
rg "from.*\.archive" src/

# 6. Check for broken doc links
rg "\[.*\]\(\.archive" .
rg "\[.*\]\(\.implementations" .
```

---

## Estimated Impact

**Files deleted**: ~180-200
**Disk space freed**: ~5-10 MB
**Build impact**: None (only docs/archives)
**Runtime impact**: None
**Breaking changes**: None (no active code references)

---

## Rollback Plan

If needed:

```bash
git checkout main -- .archive
git checkout main -- .implementations
git checkout main -- [specific files]
```

Or revert the entire cleanup:

```bash
git reset --hard origin/main
```
