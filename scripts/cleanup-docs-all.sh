#!/usr/bin/env bash
# Quick Documentation Cleanup - All Phases
# Run this to execute the full cleanup in one go
# Flags:
#   --dry-run  : print actions without moving files

set -euo pipefail

DRY_RUN=0
if [[ "${1:-}" == "--dry-run" ]]; then
  DRY_RUN=1
  echo "🔎 Dry run enabled. No changes will be made."
fi

if [ ! -d ".git" ]; then
  echo "❌ Error: run this from the repository root ('.git' not found)."
  exit 1
fi

# Colors
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'

echo "╔════════════════════════════════════════════════╗"
echo "║  Inkwell Documentation Cleanup - Full Suite   ║"
echo "╚════════════════════════════════════════════════╝"
echo ""

# Check for clean working tree (gracefully handle no HEAD case)
if git rev-parse --verify HEAD >/dev/null 2>&1; then
  if ! git diff-index --quiet HEAD --; then
    echo -e "${RED}Error: Git working directory is not clean${NC}"
    echo "Please commit or stash your changes before running cleanup"
    exit 1
  fi
else
  echo -e "${YELLOW}Note: No commits yet. Skipping clean-tree check.${NC}"
fi

echo -e "${BLUE}Preflight OK. Proceeding...${NC}"
echo ""
echo -e "${YELLOW}This will reorganize a large set of documentation files.${NC}"
echo "Changes will be staged but not committed."
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo
[[ $REPLY =~ ^[Yy]$ ]] || { echo "Aborted."; exit 1; }

# Helpers
move() {
  local src="$1"; local dst="$2"
  if [ -e "$src" ]; then
    if [ "$DRY_RUN" -eq 1 ]; then
      echo "DRY-RUN git mv \"$src\" \"$dst\""
    else
      mkdir -p "$(dirname "$dst")"
      git mv "$src" "$dst" 2>/dev/null || true
    fi
    echo -e "${GREEN}✓${NC} $src → $dst"
  fi
}

echo ""
echo "════════════════════════════════════════════════"
echo "Phase 1: Creating Archive Structure"
echo "════════════════════════════════════════════════"

# Create archive directories
if [ "$DRY_RUN" -eq 0 ]; then
  mkdir -p .archive/{summaries,checklists,phase-summaries,migrations}
  mkdir -p docs/{product,user,dev/{linting,performance},features,brand,ops}
fi
echo -e "${GREEN}✓${NC} Ensured .archive/ and docs/ directories exist"

echo ""
echo "════════════════════════════════════════════════"
echo "Phase 2: Archiving Historical Documents"
echo "════════════════════════════════════════════════"

# Phase summaries
for f in PHASE_1_SUMMARY.md PHASE_2_SUMMARY.md PHASE_2B_COMPLETION_SUMMARY.md PHASE_3_COMPLETION_SUMMARY.md; do
  move "$f" ".archive/phase-summaries/$f"
done

# Implementation summaries
summaries=( IMPLEMENTATION_COMPLETE.md IMPLEMENTATION_SUMMARY.md AUTH_FIX_SUMMARY.md BRAND_FIX_COMPLETE.md CHAPTER_MVP_COMPLETE.md CHARACTER_ANALYTICS_FIX.md FOOTER_BRAND_UPDATE_SUMMARY.md ICON_REPLACEMENT_SUMMARY.md INDEXEDDB_POLYFILL_COMPLETE.md INDEXEDDB_POLYFILL_SUCCESS.md ONBOARDING_CONSOLIDATION_SUMMARY.md ONBOARDING_GATE_FIX_SUMMARY.md PASSWORD_RESET_COMPLETE.md PROFILE_REMOVAL_COMPLETE.md SIDEBAR_FIX_SUMMARY.md BRANDING_UI_FIXES_COMPLETE.md COMPLETE_TEST_SUMMARY.md FINAL_TEST_SUMMARY.md TEST_COVERAGE_IMPROVEMENT_COMPLETE.md TEST_FIXES_COMPLETE.md TEST_FIX_QUICK_WIN_COMPLETE.md TEST_FIX_SUMMARY.md TEST_SUITE_IMPROVEMENT_SUMMARY.md TOUR_VERIFICATION_COMPLETE.md SPOTLIGHT_TOUR_FINAL_INTEGRATION.md SPOTLIGHT_TOUR_PHASE2_COMPLETE.md SPOTLIGHT_TOUR_PHASE2_INTEGRATION_COMPLETE.md ARCHIVE_ACTIVATION_SUMMARY.md FIX_SUMMARY.md PRODUCTION_POLISH_FIXES.md CHAPTER_MANAGEMENT_IMPLEMENTATION.md CHAPTER_MANAGEMENT_MVP_SUMMARY.md PROJECT_NAMING_IMPLEMENTATION.md QUICK_WINS_IMPLEMENTATION.md TOUR_BOOT_TIMING_FIX.md TOUR_DATA_ATTRIBUTES_IMPLEMENTATION.md TOUR_IMPLEMENTATION_SUMMARY.md WORLD_BUILDING_IMPLEMENTATION.md DOCS_UPDATE_OCT_2025.md COVERAGE_IMPROVEMENT_PLAN.md TEST_IMPLEMENTATION_PROGRESS.md TEST_OPTIMIZATION_COMPLETE.md TEST_PRUNING_ANALYSIS.md TEST_PRUNING_RECOMMENDATIONS.md README_TEST_OPTIMIZATION.md REMAINING_FEATURES.md NEXT_STEPS.md SESSION_SUMMARY_2025-10-27.md BRAND_COLORS_REFERENCE.md BRAND_DEPLOYMENT_GUIDE.md BRAND_INCONSISTENCY_REPORT.md CHANGELOG-AI-PLOT-ANALYSIS.md ARCHITECTURE_IMPLEMENTATION.md INTEGRATION_GUIDE.md TEST_FIX_PHASE2_SUMMARY.md TEST_FIXES_NEEDED.md TEST_SUMMARY.md TOUR_GUARDRAILS_COMPLETE.md QUICK_WINS_REFERENCE.md GO_DECISION.md )
for f in "${summaries[@]}"; do
  move "$f" ".archive/summaries/$f"
done

# Checklists
checklists=( DEPLOYMENT_CHECKLIST.md DEPLOYMENT_CHECKLIST_TOURS.md DEPLOYMENT_NOTES.md FINAL_OPERATIONAL_CHECKLIST.md PASSWORD_RESET_SETUP_VERIFICATION.md PASSWORD_RESET_TESTING_CHECKLIST.md QA_CHECKLIST.md SMOKE_TEST_CHECKLIST.md SMOKE_TEST_IMPLEMENTATION.md SPOTLIGHT_TOUR_INTEGRATION_CHECKLIST.md SUPABASE_AUTH_CHECKLIST.md SUPABASE_AUTH_DEPLOYMENT_CHECKLIST.md TEST_ACTION_CHECKLIST.md TEST_OPTIMIZATION_CHECKLIST.md TOUR_VERIFICATION_CHECKLIST.md VERIFICATION_GUIDE.md )
for f in "${checklists[@]}"; do
  move "$f" ".archive/checklists/$f"
done

echo ""
echo "════════════════════════════════════════════════"
echo "Phase 3: Reorganizing Core Documentation"
echo "════════════════════════════════════════════════"

# Product
move "ROADMAP.md" "docs/product/ROADMAP.md"
move "PLATFORM_OVERVIEW.md" "docs/product/PLATFORM_OVERVIEW.md"
move "RELEASE.md" "docs/product/RELEASE.md"

# User
move "USER_GUIDE.md" "docs/user/USER_GUIDE.md"

# Dev
move "DEPLOYMENT.md" "docs/dev/DEPLOYMENT.md"
move "MODULE_CONTRACTS.md" "docs/dev/MODULE_CONTRACTS.md"
move "TESTER_GUIDE.md" "docs/dev/TESTING_GUIDE.md"

# Performance
move "docs/TRACE_SYSTEM.md" "docs/dev/performance/TRACE_SYSTEM.md"
move "docs/PERFORMANCE_GUARDRAILS.md" "docs/dev/performance/PERFORMANCE_GUARDRAILS.md"
move "docs/PERFORMANCE.md" "docs/dev/performance/PERFORMANCE.md"

# Linting
move "docs/ESLINT_MIGRATION.md" "docs/dev/linting/ESLINT_MIGRATION.md"

# Features
move "docs/AI_SERVICES.md" "docs/features/AI_SERVICES.md"
move "docs/PLOT_BOARDS.md" "docs/features/PLOT_BOARDS.md"
move "docs/SUPABASE_SETUP.md" "docs/features/AUTHENTICATION.md"
move "AUTH_TROUBLESHOOTING.md" "docs/features/AUTH_TROUBLESHOOTING.md"
move "docs/TOUR_QUICK_REFERENCE.md" "docs/features/TOUR_SYSTEM.md"

# Brand
move "docs/BRAND_UPDATE_SUMMARY.md" "docs/brand/BRAND_GUIDE.md"
move "docs/BRAND_ACCESSIBILITY_GUIDE.md" "docs/brand/ACCESSIBILITY.md"

# Ops
move "docs/UPTIME_MONITORING.md" "docs/ops/UPTIME_MONITORING.md"
move "docs/ROLLBACK_PROCEDURES.md" "docs/ops/ROLLBACK_PROCEDURES.md"

echo ""
echo "════════════════════════════════════════════════"
echo "Summary"
echo "════════════════════════════════════════════════"
echo ""

if [ "$DRY_RUN" -eq 0 ]; then
  ARCHIVED_COUNT=$(find .archive -type f -name "*.md" 2>/dev/null | wc -l | tr -d ' ')
  DOCS_COUNT=$(find docs -type f -name "*.md" 2>/dev/null | wc -l | tr -d ' ')
else
  ARCHIVED_COUNT="(dry-run)"
  DOCS_COUNT="(dry-run)"
fi

echo -e "${GREEN}✓${NC} Archived: ~$ARCHIVED_COUNT files"
echo -e "${GREEN}✓${NC} Organized: ~$DOCS_COUNT files"

echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Review: git status"
echo "2. Inspect: tree docs/ -L 2 && tree .archive/ -L 2"
echo "3. Manual consolidate (if present):"
echo "   - docs/features/AI_SERVICES.md  (merge AI_INTEGRATION.md, AI_PLOT_ANALYSIS.md)"
echo "   - docs/features/CHAPTER_MANAGEMENT.md"
echo "   - docs/features/TOUR_SYSTEM.md"
echo "   - docs/features/AUTHENTICATION.md"
echo "   - docs/brand/BRAND_GUIDE.md"
echo "   - docs/user/USER_GUIDE.md"
echo ""
echo "4. Commit:"
echo "   git add . && git commit -m 'docs: reorganize documentation structure'"
echo ""
echo -e "${GREEN}✨ Cleanup complete!${NC}"
