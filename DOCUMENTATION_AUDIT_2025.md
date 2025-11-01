# Documentation Audit & Cleanup Plan (2025)

**Date**: January 2025
**Purpose**: Clean up redundant, outdated, and irrelevant documentation
**Goal**: Maintain a clean, organized documentation structure

---

## Summary

**Total Documentation Files**: 248 files
**Recommended Actions**:

- **KEEP & UPDATE**: 42 files (core docs)
- **ARCHIVE**: 156 files (historical/completed work)
- **DELETE**: 50 files (redundant/obsolete)

---

## Category 1: KEEP & UPDATE (Core Documentation)

### Essential User-Facing Docs

- `README.md` ✅ **KEEP** - Update with v0.7.1 status and v0.8.0 roadmap
- `CHANGELOG.md` ✅ **KEEP** - Add v0.7.0 and v0.7.1 releases
- `CONTRIBUTING.md` ✅ **KEEP** - Main contributing guide
- `.github/CONTRIBUTING.md` ✅ **KEEP** - GitHub-specific guidelines
- `USER_GUIDE.md` ✅ **KEEP** - Update with Export Dashboard features
- `ROADMAP.md` ✅ **UPDATE** - Replace with v0.8.0 scope plan

### Core Developer Docs (docs/dev/)

- `docs/dev/README.md` ✅ **KEEP**
- `docs/dev/setup.md` ✅ **KEEP**
- `docs/dev/release.md` ✅ **KEEP**
- `docs/dev/ai-services.md` ✅ **KEEP**
- `docs/dev/onboarding.md` ✅ **KEEP**
- `docs/dev/storage.md` ✅ **KEEP**

### Operations Docs (docs/ops/)

- `docs/ops/01-deploy.md` ✅ **KEEP**
- `docs/ops/03-secrets.md` ✅ **KEEP**
- `docs/ops/04-security.md` ✅ **KEEP**
- `docs/ops/telemetry.md` ✅ **KEEP**

### Feature Docs (docs/features/)

- `docs/features/AUTHENTICATION.md` ✅ **KEEP**
- `docs/features/CHAPTER_MANAGEMENT.md` ✅ **KEEP**
- `docs/features/TOUR_SYSTEM.md` ✅ **KEEP**
- `docs/features/export.md` ✅ **UPDATE** - Add v0.7.0 Export Dashboard
- `docs/features/sync.md` ✅ **KEEP**
- `docs/features/tour.md` ✅ **KEEP**

### Product Docs (docs/product/)

- `docs/product/roadmap.md` ✅ **UPDATE** - Replace with v0.8.0 scope
- `docs/product/first-run-experience.md` ✅ **KEEP**
- `docs/product/messaging-changes.md` ✅ **KEEP**

### Testing Docs

- `docs/TESTING.md` ✅ **KEEP**
- `docs/TESTING_GUIDE.md` ✅ **KEEP**
- `docs/test-coverage-summary.md` ✅ **UPDATE** - Add current coverage (735/735 tests)
- `e2e/README.md` ✅ **KEEP**

### Engineering Docs

- `docs/engineering/linting-and-ci-playbook.md` ✅ **KEEP**
- `docs/engineering/WORKFLOW_QUICK_REFERENCE.md` ✅ **KEEP**

### Brand & Design

- `docs/BRANDING_GUIDE.md` ✅ **KEEP**
- `docs/COLORS.md` ✅ **KEEP**
- `docs/BRAND_ACCESSIBILITY_GUIDE.md` ✅ **KEEP**
- `public/assets/brand/README.md` ✅ **KEEP**

### Component READMEs

- `src/components/ErrorBoundary/README.md` ✅ **KEEP**
- `src/components/Onboarding/README.md` ✅ **KEEP**
- `src/components/PWA/README.md` ✅ **KEEP**
- `src/components/Planning/WorldBuilding/README.md` ✅ **KEEP**
- `src/components/ProjectManagement/README.md` ✅ **KEEP**
- `src/tour/README.md` ✅ **KEEP**
- `src/features/plotboards/VIRTUALIZATION.md` ✅ **KEEP**

---

## Category 2: ARCHIVE (Historical/Completed Work)

### Create `.archive/` directory for completed work

**Implementation Summaries** (move to `.archive/implementations/`):

- `ARCHIVE_ACTIVATION_SUMMARY.md`
- `AUTH_FIX_SUMMARY.md`
- `BRANDING_UI_FIXES_COMPLETE.md`
- `BRAND_DEPLOYMENT_GUIDE.md`
- `BRAND_FIX_COMPLETE.md`
- `BRAND_INCONSISTENCY_REPORT.md`
- `BUG_FIXES_SUMMARY_2025-10-27.md`
- `CHAPTER_MANAGEMENT_IMPLEMENTATION.md`
- `CHAPTER_MANAGEMENT_MVP_SUMMARY.md`
- `CHAPTER_MVP_COMPLETE.md`
- `CHARACTER_ANALYTICS_FIX.md`
- `COMPLETE_TEST_SUMMARY.md`
- `CONSOLIDATION_PLAN.md`
- `CONSOLIDATION_PROGRESS.md`
- `CREATE_PROJECT_BUTTON_FIX_SUMMARY.md`
- `DATA_PERSISTENCE_IMPLEMENTATION_SUMMARY.md`
- `DEPLOYMENT_CHECKLIST.md`
- `DEPLOYMENT_CHECKLIST_BUG_FIXES.md`
- `DEPLOYMENT_CHECKLIST_TOURS.md`
- `DEPLOYMENT_NOTES.md`
- `DEVLOG_IMPORT_FIX_SUMMARY.md`
- `ESLINT_CLEANUP_SUMMARY.md`
- `ESLINT_FINAL_STATUS.md`
- `FINAL_OPERATIONAL_CHECKLIST.md`
- `FINAL_STATUS.md`
- `FINAL_TEST_SUMMARY.md`
- `FIX_SUMMARY.md`
- `FOOTER_BRAND_UPDATE_SUMMARY.md`
- `HARDENED_INITIALIZATION_DEPLOYMENT.md`
- `HARDENED_INITIALIZATION_SUMMARY.md`
- `HOOKS_HARDENING_COMPLETE.md`
- `HOOKS_PR_COMMIT.md`
- `ICON_REPLACEMENT_SUMMARY.md`
- `IMPLEMENTATION_COMPLETE.md`
- `IMPLEMENTATION_SUMMARY.md`
- `INDEXEDDB_POLYFILL_COMPLETE.md`
- `INDEXEDDB_POLYFILL_SUCCESS.md`
- `MUTATION_OBSERVER_FIX.md`
- `ONBOARDING_CONSOLIDATION_SUMMARY.md`
- `ONBOARDING_GATE_FIX_SUMMARY.md`
- `PASSWORD_RESET_COMPLETE.md`
- `PASSWORD_RESET_SETUP_VERIFICATION.md`
- `PERSISTENCE_LAYER_READY.md`
- `PHASE_1_SUMMARY.md`
- `PHASE_2B_COMPLETION_SUMMARY.md`
- `PHASE_2_SUMMARY.md`
- `PHASE_3_COMPLETION_SUMMARY.md`
- `PR24_STATUS_SUMMARY.md`
- `PRODUCTION_POLISH_FIXES.md`
- `PROFILE_REMOVAL_COMPLETE.md`
- `PROJECT_CREATION_BUTTONS_FIX.md`
- `PROJECT_NAMING_IMPLEMENTATION.md`
- `PUSH_COMPLETE_SUMMARY.md`
- `REACT_HOOKS_FIX_SUMMARY.md`
- `RELEASE_v0.5.0_COMPLETE.md`
- `RELEASE_v0.5.0_SUMMARY.md`
- `SESSION_SUMMARY.md`
- `SESSION_SUMMARY_2025-10-27.md`
- `SIDEBAR_FIX_SUMMARY.md`
- `SPOTLIGHT_TOUR_FINAL_INTEGRATION.md`
- `SPOTLIGHT_TOUR_PHASE2_COMPLETE.md`
- `SPOTLIGHT_TOUR_PHASE2_INTEGRATION_COMPLETE.md`
- `SUPABASE_INTEGRATION_COMPLETE.md`
- `SUPABASE_INTEGRATION_COMPLETE_CHECKLIST.md`
- `SUPABASE_INTEGRATION_FINAL_CHECKLIST.md`
- `TEST_COVERAGE_IMPROVEMENT_COMPLETE.md`
- `TEST_FIXES_COMPLETE.md`
- `TEST_FIX_PHASE2_SUMMARY.md`
- `TEST_FIX_QUICK_WIN_COMPLETE.md`
- `TEST_FIX_SUMMARY.md`
- `TEST_OPTIMIZATION_COMPLETE.md`
- `TEST_SUITE_IMPROVEMENT_SUMMARY.md`
- `TEST_SUMMARY.md`
- `TOUR_BOOT_TIMING_FIX.md`
- `TOUR_BUTTON_FIXES_SUMMARY.md`
- `TOUR_BUTTON_FIX_SUMMARY.md`
- `TOUR_DARK_MODE_FIXES_2025-10-27.md`
- `TOUR_DATA_ATTRIBUTES_IMPLEMENTATION.md`
- `TOUR_GUARDRAILS_COMPLETE.md`
- `TOUR_IMPLEMENTATION_SUMMARY.md`
- `TOUR_IMPROVEMENTS_COMPLETE.md`
- `TOUR_IMPROVEMENTS_SUMMARY.md`
- `TOUR_OVERLAY_CLICK_BLOCKING_FIX.md`
- `TOUR_START_BUTTON_FIX_COMPLETE.md`
- `TOUR_TRIGGERS_IMPROVEMENTS.md`
- `TOUR_VERIFICATION_COMPLETE.md`
- `TYPE_CONSOLIDATION_STATUS.md`
- `USER_PERSISTENCE_SUMMARY.md`
- `WORLD_BUILDING_IMPLEMENTATION.md`

**Docs to Archive** (move to `.archive/docs/`):

- `docs/CRITICAL_FIXES_2025-10-10.md`
- `docs/PHASE_1_INTEGRATION_COMPLETE.md`
- `docs/PHASE_1_UX_POLISH.md`
- `docs/PHASE_3_IMPLEMENTATION_CHECKLIST.md`
- `docs/PRODUCTION_READINESS_SUMMARY.md`
- `docs/SUPABASE_AUTH_FIXES_OCT_2025.md`
- `docs/INDEXEDDB_POLYFILL_IMPLEMENTATION.md`
- `docs/INDEXEDDB_POLYFILL_SETUP.md`
- `docs/BRAND_UPDATE_SUMMARY.md`
- `docs/EXECUTE_ROLLOUT.md`
- `docs/GO_DECISION_FINAL.md`
- `docs/engineering/TEAM_ANNOUNCEMENT.md`
- `docs/engineering/WORKFLOW_IMPLEMENTATION_SUMMARY.md`
- `docs/engineering/WORKFLOW_ROLLOUT_PLAN.md`
- `docs/engineering/WORKFLOW_VERIFICATION_CHECKLIST.md`
- `docs/engineering/workflow-improvements-summary.md`

---

## Category 3: DELETE (Redundant/Obsolete)

### Redundant Documentation

- `CLEANUP_QUICKSTART.md` ❌ **DELETE** - One-time cleanup guide
- `DOCS_BEFORE_AFTER.md` ❌ **DELETE** - Historical comparison
- `DOCS_INTEGRATION_GUIDE.md` ❌ **DELETE** - Superseded
- `DOCS_READY_TO_DEPLOY.md` ❌ **DELETE** - One-time checklist
- `DOCS_UPDATE_OCT_2025.md` ❌ **DELETE** - One-time update log
- `DOCUMENTATION_CLEANUP_PLAN.md` ❌ **DELETE** - Old cleanup plan
- `DOCUMENTATION_INVENTORY.md` ❌ **DELETE** - Old inventory
- `README_CLEANUP.md` ❌ **DELETE** - One-time cleanup
- `README_TEST_OPTIMIZATION.md` ❌ **DELETE** - One-time task
- `PR_DESCRIPTION.md` ❌ **DELETE** - Single PR description

### Duplicate/Superseded Guides

- `AUTH_TROUBLESHOOTING.md` ❌ **DELETE** - Covered in docs/features/AUTHENTICATION.md
- `DEPLOYMENT.md` ❌ **DELETE** - Covered in docs/ops/01-deploy.md
- `RELEASE.md` ❌ **DELETE** - Covered in docs/dev/release.md
- `TESTER_GUIDE.md` ❌ **DELETE** - Covered in docs/TESTING_GUIDE.md
- `VERIFICATION_GUIDE.md` ❌ **DELETE** - Covered in docs/TESTING_GUIDE.md
- `MANUAL_VERIFICATION_GUIDE.md` ❌ **DELETE** - Covered in docs/TESTING_GUIDE.md

### Obsolete Quick Reference Docs

- `HARDENED_INITIALIZATION_QUICK_REF.md` ❌ **DELETE** - Implementation complete
- `HOOKS_QUICK_REF.md` ❌ **DELETE** - Covered in docs/engineering/
- `MUTATION_OBSERVER_QUICK_REF.md` ❌ **DELETE** - Covered in docs/
- `QUICK_FIX_REFERENCE.md` ❌ **DELETE** - Temporary reference
- `QUICK_WINS_IMPLEMENTATION.md` ❌ **DELETE** - One-time tasks
- `QUICK_WINS_REFERENCE.md` ❌ **DELETE** - One-time tasks

### Redundant Supabase Docs

- `SUPABASE_AUTH_CHECKLIST.md` ❌ **DELETE** - Covered in docs/features/AUTHENTICATION.md
- `SUPABASE_AUTH_DEPLOYMENT_CHECKLIST.md` ❌ **DELETE** - Duplicate
- `SUPABASE_DEPLOYMENT_GUIDE.md` ❌ **DELETE** - Covered in docs/ops/
- `SUPABASE_INTEGRATION_CHECKLIST.md` ❌ **DELETE** - Implementation complete
- `SUPABASE_MIGRATIONS_REFERENCE.md` ❌ **DELETE** - Use supabase/README.md
- `SUPABASE_MIGRATION_GUIDE.md` ❌ **DELETE** - Use supabase/README.md
- `SUPABASE_PASSWORD_RESET_CONFIG.md` ❌ **DELETE** - Covered in docs/features/
- `SUPABASE_QUICKSTART.md` ❌ **DELETE** - Use docs/ops/
- `SUPABASE_QUICK_REFERENCE.md` ❌ **DELETE** - Use docs/ops/
- `SUPABASE_SETUP_GUIDE.md` ❌ **DELETE** - Use docs/ops/
- `SUPABASE_STARTER_PACK.md` ❌ **DELETE** - Use docs/ops/
- `docs/SUPABASE_SETUP.md` ❌ **DELETE** - Duplicate
- `docs/SUPABASE_AUTH_DEPLOYMENT_CHECKLIST.md` ❌ **DELETE** - Duplicate
- `docs/SUPABASE_AUTH_EMAIL_TROUBLESHOOTING.md` ❌ **DELETE** - Merge into features/AUTHENTICATION.md

### Redundant Tour Docs

- `TOUR_BUTTON_QUICK_FIX.md` ❌ **DELETE** - Fixed
- `TOUR_BUTTON_TESTING_GUIDE.md` ❌ **DELETE** - Covered in TESTING_GUIDE.md
- `TOUR_DEBUGGING_GUIDE.md` ❌ **DELETE** - Covered in docs/TOUR_INDEX.md
- `TOUR_IMPLEMENTATION_QUICK_REF.md` ❌ **DELETE** - Use docs/TOUR_QUICK_REFERENCE.md
- `TOUR_OVERLAY_DIAGNOSTIC.md` ❌ **DELETE** - Fixed
- `TOUR_UI_FIXES_PLAN.md` ❌ **DELETE** - Complete
- `TOUR_VERIFICATION_CHECKLIST.md` ❌ **DELETE** - Complete
- `docs/TOUR_DATA_ATTRIBUTES_IMPLEMENTATION.md` ❌ **DELETE** - Duplicate of docs/TOUR_DATA_ATTRIBUTES.md
- `docs/TOUR_INTEGRATION_STATUS.md` ❌ **DELETE** - Status doc (complete)
- `docs/TOUR_POST_DEPLOY_GUARDRAILS.md` ❌ **DELETE** - Merge into TOUR_INDEX.md
- `docs/TOUR_PRODUCTION_READINESS.md` ❌ **DELETE** - Status doc
- `docs/TOUR_ROLLOUT_INDEX.md` ❌ **DELETE** - Duplicate
- `docs/TOUR_SHIP_CHECKLIST.md` ❌ **DELETE** - Status doc
- `docs/PR_TEMPLATE_TOUR_CHECKLIST.md` ❌ **DELETE** - One-time template

### Redundant Testing Docs

- `TEST_ACTION_CHECKLIST.md` ❌ **DELETE** - Use docs/TESTING_GUIDE.md
- `TEST_FIXES_NEEDED.md` ❌ **DELETE** - Fixed
- `TEST_IMPLEMENTATION_PROGRESS.md` ❌ **DELETE** - Status doc
- `TEST_OPTIMIZATION_CHECKLIST.md` ❌ **DELETE** - Complete
- `TEST_PRUNING_ANALYSIS.md` ❌ **DELETE** - One-time analysis
- `TEST_PRUNING_RECOMMENDATIONS.md` ❌ **DELETE** - One-time analysis
- `docs/testing/CREATE_PROJECT_BUTTON_TEST_GUIDE.md` ❌ **DELETE** - One-time fix
- `docs/troubleshooting/CREATE_PROJECT_BUTTON_FIX.md` ❌ **DELETE** - One-time fix

### One-Time Checklists/Templates

- `QA_CHECKLIST.md` ❌ **DELETE** - One-time checklist
- `QA_TEST_PLAN_PERSISTENCE.md` ❌ **DELETE** - One-time plan
- `SMOKE_TEST_CHECKLIST.md` ❌ **DELETE** - Use docs/SMOKE_TEST_SCRIPT.md
- `SMOKE_TEST_IMPLEMENTATION.md` ❌ **DELETE** - Implementation complete
- `SPOTLIGHT_TOUR_INTEGRATION_CHECKLIST.md` ❌ **DELETE** - Complete
- `PASSWORD_RESET_QUICKSTART.md` ❌ **DELETE** - Feature complete
- `PASSWORD_RESET_TESTING_CHECKLIST.md` ❌ **DELETE** - Feature complete
- `FEEDBACK_TEMPLATE.md` ❌ **DELETE** - Use GitHub issues

### Obsolete Technical Docs

- `ARCHITECTURE_IMPLEMENTATION.md` ❌ **DELETE** - Use README.md architecture section
- `MODULE_CONTRACTS.md` ❌ **DELETE** - Obsolete
- `PLATFORM_OVERVIEW.md` ❌ **DELETE** - Use README.md
- `TECHNICAL_ROADMAP.md` ❌ **DELETE** - Use docs/product/roadmap.md
- `REMAINING_FEATURES.md` ❌ **DELETE** - Use docs/product/roadmap.md
- `NEXT_STEPS.md` ❌ **DELETE** - Use docs/product/roadmap.md
- `GO_DECISION.md` ❌ **DELETE** - Historical decision doc
- `COVERAGE_IMPROVEMENT_PLAN.md` ❌ **DELETE** - Complete

### Miscellaneous

- `# Code Citations.md` ❌ **DELETE** - Unclear purpose
- `.bfg-replacements.txt` ❌ **DELETE** - One-time BFG operation
- `.audit/` directory ❌ **KEEP** - Contains baseline data

### Duplicate Integration/Examples

- `INTEGRATION_EXAMPLES.md` ❌ **DELETE** - Covered in feature docs
- `INTEGRATION_GUIDE.md` ❌ **DELETE** - Covered in docs/dev/
- `CHAPTER_MANAGEMENT_EXAMPLES.md` ❌ **DELETE** - Use docs/features/CHAPTER_MANAGEMENT.md
- `CHAPTER_MANAGEMENT_QUICKSTART.md` ❌ **DELETE** - Use docs/features/CHAPTER_MANAGEMENT.md
- `DATA_PERSISTENCE_QUICKSTART.md` ❌ **DELETE** - Use docs/features/
- `USER_GUIDE_DATA_PERSISTENCE.md` ❌ **DELETE** - Merge into USER_GUIDE.md

### Duplicate AI Docs

- `docs/AI_INTEGRATION.md` ❌ **DELETE** - Use docs/dev/ai-services.md
- `docs/AI_PLOT_ANALYSIS.md` ❌ **DELETE** - Use docs/dev/ai-services.md
- `docs/AI_SERVICES.md` ❌ **DELETE** - Duplicate
- `docs/story-architect-enhancement.md` ❌ **DELETE** - Use docs/dev/ai-services.md
- `docs/enhanced-ai-toolbar.md` ❌ **DELETE** - Use docs/dev/ai-services.md
- `docs/claude/StoryArchitect-Prompts.md` ✅ **KEEP** - Useful reference

---

## Action Plan

### Phase 1: Create Archive Structure

```bash
mkdir -p .archive/{implementations,docs,checklists,historical}
```

### Phase 2: Move Files to Archive

```bash
# Move implementation summaries
mv *_SUMMARY.md *_COMPLETE.md *_FIX*.md .archive/implementations/

# Move historical docs
mv PHASE_*.md SESSION_*.md .archive/historical/

# Move checklists
mv *_CHECKLIST.md *_TESTING*.md .archive/checklists/
```

### Phase 3: Delete Redundant Files

```bash
# See Category 3 list above
git rm [files]
```

### Phase 4: Update Core Docs

1. Update `README.md` with v0.7.1 status
2. Update `CHANGELOG.md` with v0.7.0 and v0.7.1
3. Replace `ROADMAP.md` with v0.8.0 scope plan
4. Update `docs/features/export.md` with Export Dashboard details
5. Update `docs/test-coverage-summary.md` with 735/735 tests

### Phase 5: Create New Structure

```
docs/
├── dev/              # Developer guides (setup, release, services)
├── ops/              # Operations (deploy, secrets, security)
├── product/          # Product docs (roadmap, messaging, UX)
├── features/         # Feature-specific docs
├── architecture/     # Architecture docs
├── engineering/      # Engineering practices
└── README.md         # Docs index
```

---

## v0.8.0 Integration Plan

Create new doc: `docs/product/v0.8.0-scope.md` with the v0.8.0 scope plan provided by the user.

Update `ROADMAP.md` to reference v0.8.0 scope and deprecate outdated roadmap sections.

---

## Success Criteria

- ✅ Core docs are up-to-date and accurate
- ✅ No redundant or duplicate documentation
- ✅ Clear navigation structure in `/docs`
- ✅ v0.8.0 scope is documented
- ✅ All historical work is archived, not deleted
- ✅ README reflects current state (v0.7.1)

---

**Next**: Execute cleanup script and update core documentation
