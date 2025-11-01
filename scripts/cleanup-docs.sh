#!/bin/bash
# Documentation Cleanup Script
# Based on DOCUMENTATION_AUDIT_2025.md

set -e

echo "🧹 Inkwell Documentation Cleanup"
echo "=================================="
echo ""

# Create archive directories
echo "📁 Creating archive structure..."
mkdir -p .archive/{implementations,docs,checklists,historical,testing,tour,supabase}

# Phase 1: Archive implementation summaries
echo "📦 Archiving implementation summaries..."
mv --backup=numbered ARCHIVE_ACTIVATION_SUMMARY.md .archive/implementations/ 2>/dev/null || true
mv --backup=numbered AUTH_FIX_SUMMARY.md .archive/implementations/ 2>/dev/null || true
mv --backup=numbered BRANDING_UI_FIXES_COMPLETE.md .archive/implementations/ 2>/dev/null || true
mv --backup=numbered BRAND_DEPLOYMENT_GUIDE.md .archive/implementations/ 2>/dev/null || true
mv --backup=numbered BRAND_FIX_COMPLETE.md .archive/implementations/ 2>/dev/null || true
mv --backup=numbered BRAND_INCONSISTENCY_REPORT.md .archive/implementations/ 2>/dev/null || true
mv --backup=numbered BUG_FIXES_SUMMARY_2025-10-27.md .archive/implementations/ 2>/dev/null || true
mv --backup=numbered CHAPTER_MANAGEMENT_IMPLEMENTATION.md .archive/implementations/ 2>/dev/null || true
mv --backup=numbered CHAPTER_MANAGEMENT_MVP_SUMMARY.md .archive/implementations/ 2>/dev/null || true
mv --backup=numbered CHAPTER_MVP_COMPLETE.md .archive/implementations/ 2>/dev/null || true
mv --backup=numbered CHARACTER_ANALYTICS_FIX.md .archive/implementations/ 2>/dev/null || true
mv --backup=numbered COMPLETE_TEST_SUMMARY.md .archive/testing/ 2>/dev/null || true
mv --backup=numbered CONSOLIDATION_PLAN.md .archive/implementations/ 2>/dev/null || true
mv --backup=numbered CONSOLIDATION_PROGRESS.md .archive/implementations/ 2>/dev/null || true
mv --backup=numbered CREATE_PROJECT_BUTTON_FIX_SUMMARY.md .archive/implementations/ 2>/dev/null || true
mv --backup=numbered DATA_PERSISTENCE_IMPLEMENTATION_SUMMARY.md .archive/implementations/ 2>/dev/null || true
mv --backup=numbered DEPLOYMENT_CHECKLIST.md .archive/checklists/ 2>/dev/null || true
mv --backup=numbered DEPLOYMENT_CHECKLIST_BUG_FIXES.md .archive/checklists/ 2>/dev/null || true
mv --backup=numbered DEPLOYMENT_CHECKLIST_TOURS.md .archive/checklists/ 2>/dev/null || true
mv --backup=numbered DEPLOYMENT_NOTES.md .archive/implementations/ 2>/dev/null || true
mv --backup=numbered DEVLOG_IMPORT_FIX_SUMMARY.md .archive/implementations/ 2>/dev/null || true
mv --backup=numbered ESLINT_CLEANUP_SUMMARY.md .archive/implementations/ 2>/dev/null || true
mv --backup=numbered ESLINT_FINAL_STATUS.md .archive/implementations/ 2>/dev/null || true
mv --backup=numbered FINAL_OPERATIONAL_CHECKLIST.md .archive/checklists/ 2>/dev/null || true
mv --backup=numbered FINAL_STATUS.md .archive/implementations/ 2>/dev/null || true
mv --backup=numbered FINAL_TEST_SUMMARY.md .archive/testing/ 2>/dev/null || true
mv --backup=numbered FIX_SUMMARY.md .archive/implementations/ 2>/dev/null || true
mv --backup=numbered FOOTER_BRAND_UPDATE_SUMMARY.md .archive/implementations/ 2>/dev/null || true
mv --backup=numbered HARDENED_INITIALIZATION_DEPLOYMENT.md .archive/implementations/ 2>/dev/null || true
mv --backup=numbered HARDENED_INITIALIZATION_SUMMARY.md .archive/implementations/ 2>/dev/null || true
mv --backup=numbered HOOKS_HARDENING_COMPLETE.md .archive/implementations/ 2>/dev/null || true
mv --backup=numbered HOOKS_PR_COMMIT.md .archive/implementations/ 2>/dev/null || true
mv --backup=numbered ICON_REPLACEMENT_SUMMARY.md .archive/implementations/ 2>/dev/null || true
mv --backup=numbered IMPLEMENTATION_COMPLETE.md .archive/implementations/ 2>/dev/null || true
mv --backup=numbered IMPLEMENTATION_SUMMARY.md .archive/implementations/ 2>/dev/null || true
mv --backup=numbered INDEXEDDB_POLYFILL_COMPLETE.md .archive/implementations/ 2>/dev/null || true
mv --backup=numbered INDEXEDDB_POLYFILL_SUCCESS.md .archive/implementations/ 2>/dev/null || true
mv --backup=numbered MUTATION_OBSERVER_FIX.md .archive/implementations/ 2>/dev/null || true
mv --backup=numbered ONBOARDING_CONSOLIDATION_SUMMARY.md .archive/implementations/ 2>/dev/null || true
mv --backup=numbered ONBOARDING_GATE_FIX_SUMMARY.md .archive/implementations/ 2>/dev/null || true
mv --backup=numbered PASSWORD_RESET_COMPLETE.md .archive/implementations/ 2>/dev/null || true
mv --backup=numbered PASSWORD_RESET_SETUP_VERIFICATION.md .archive/checklists/ 2>/dev/null || true
mv --backup=numbered PERSISTENCE_LAYER_READY.md .archive/implementations/ 2>/dev/null || true
mv --backup=numbered PHASE_1_SUMMARY.md .archive/historical/ 2>/dev/null || true
mv --backup=numbered PHASE_2B_COMPLETION_SUMMARY.md .archive/historical/ 2>/dev/null || true
mv --backup=numbered PHASE_2_SUMMARY.md .archive/historical/ 2>/dev/null || true
mv --backup=numbered PHASE_3_COMPLETION_SUMMARY.md .archive/historical/ 2>/dev/null || true
mv --backup=numbered PR24_STATUS_SUMMARY.md .archive/historical/ 2>/dev/null || true
mv --backup=numbered PRODUCTION_POLISH_FIXES.md .archive/implementations/ 2>/dev/null || true
mv --backup=numbered PROFILE_REMOVAL_COMPLETE.md .archive/implementations/ 2>/dev/null || true
mv --backup=numbered PROJECT_CREATION_BUTTONS_FIX.md .archive/implementations/ 2>/dev/null || true
mv --backup=numbered PROJECT_NAMING_IMPLEMENTATION.md .archive/implementations/ 2>/dev/null || true
mv --backup=numbered PUSH_COMPLETE_SUMMARY.md .archive/implementations/ 2>/dev/null || true
mv --backup=numbered REACT_HOOKS_FIX_SUMMARY.md .archive/implementations/ 2>/dev/null || true
mv --backup=numbered RELEASE_v0.5.0_COMPLETE.md .archive/historical/ 2>/dev/null || true
mv --backup=numbered RELEASE_v0.5.0_SUMMARY.md .archive/historical/ 2>/dev/null || true
mv --backup=numbered SESSION_SUMMARY.md .archive/historical/ 2>/dev/null || true
mv --backup=numbered SESSION_SUMMARY_2025-10-27.md .archive/historical/ 2>/dev/null || true
mv --backup=numbered SIDEBAR_FIX_SUMMARY.md .archive/implementations/ 2>/dev/null || true
mv --backup=numbered SPOTLIGHT_TOUR_FINAL_INTEGRATION.md .archive/tour/ 2>/dev/null || true
mv --backup=numbered SPOTLIGHT_TOUR_PHASE2_COMPLETE.md .archive/tour/ 2>/dev/null || true
mv --backup=numbered SPOTLIGHT_TOUR_PHASE2_INTEGRATION_COMPLETE.md .archive/tour/ 2>/dev/null || true
mv --backup=numbered SUPABASE_INTEGRATION_COMPLETE.md .archive/supabase/ 2>/dev/null || true
mv --backup=numbered SUPABASE_INTEGRATION_COMPLETE_CHECKLIST.md .archive/checklists/ 2>/dev/null || true
mv --backup=numbered SUPABASE_INTEGRATION_FINAL_CHECKLIST.md .archive/checklists/ 2>/dev/null || true
mv --backup=numbered TEST_COVERAGE_IMPROVEMENT_COMPLETE.md .archive/testing/ 2>/dev/null || true
mv --backup=numbered TEST_FIXES_COMPLETE.md .archive/testing/ 2>/dev/null || true
mv --backup=numbered TEST_FIX_PHASE2_SUMMARY.md .archive/testing/ 2>/dev/null || true
mv --backup=numbered TEST_FIX_QUICK_WIN_COMPLETE.md .archive/testing/ 2>/dev/null || true
mv --backup=numbered TEST_FIX_SUMMARY.md .archive/testing/ 2>/dev/null || true
mv --backup=numbered TEST_OPTIMIZATION_COMPLETE.md .archive/testing/ 2>/dev/null || true
mv --backup=numbered TEST_SUITE_IMPROVEMENT_SUMMARY.md .archive/testing/ 2>/dev/null || true
mv --backup=numbered TEST_SUMMARY.md .archive/testing/ 2>/dev/null || true
mv --backup=numbered TOUR_BOOT_TIMING_FIX.md .archive/tour/ 2>/dev/null || true
mv --backup=numbered TOUR_BUTTON_FIXES_SUMMARY.md .archive/tour/ 2>/dev/null || true
mv --backup=numbered TOUR_BUTTON_FIX_SUMMARY.md .archive/tour/ 2>/dev/null || true
mv --backup=numbered TOUR_DARK_MODE_FIXES_2025-10-27.md .archive/tour/ 2>/dev/null || true
mv --backup=numbered TOUR_DATA_ATTRIBUTES_IMPLEMENTATION.md .archive/tour/ 2>/dev/null || true
mv --backup=numbered TOUR_GUARDRAILS_COMPLETE.md .archive/tour/ 2>/dev/null || true
mv --backup=numbered TOUR_IMPLEMENTATION_SUMMARY.md .archive/tour/ 2>/dev/null || true
mv --backup=numbered TOUR_IMPROVEMENTS_COMPLETE.md .archive/tour/ 2>/dev/null || true
mv --backup=numbered TOUR_IMPROVEMENTS_SUMMARY.md .archive/tour/ 2>/dev/null || true
mv --backup=numbered TOUR_OVERLAY_CLICK_BLOCKING_FIX.md .archive/tour/ 2>/dev/null || true
mv --backup=numbered TOUR_START_BUTTON_FIX_COMPLETE.md .archive/tour/ 2>/dev/null || true
mv --backup=numbered TOUR_TRIGGERS_IMPROVEMENTS.md .archive/tour/ 2>/dev/null || true
mv --backup=numbered TOUR_VERIFICATION_COMPLETE.md .archive/tour/ 2>/dev/null || true
mv --backup=numbered TYPE_CONSOLIDATION_STATUS.md .archive/implementations/ 2>/dev/null || true
mv --backup=numbered USER_PERSISTENCE_SUMMARY.md .archive/implementations/ 2>/dev/null || true
mv --backup=numbered WORLD_BUILDING_IMPLEMENTATION.md .archive/implementations/ 2>/dev/null || true

# Archive docs/ files
echo "📦 Archiving docs/ directory files..."
mv --backup=numbered docs/CRITICAL_FIXES_2025-10-10.md .archive/docs/ 2>/dev/null || true
mv --backup=numbered docs/PHASE_1_INTEGRATION_COMPLETE.md .archive/docs/ 2>/dev/null || true
mv --backup=numbered docs/PHASE_1_UX_POLISH.md .archive/docs/ 2>/dev/null || true
mv --backup=numbered docs/PHASE_3_IMPLEMENTATION_CHECKLIST.md .archive/checklists/ 2>/dev/null || true
mv --backup=numbered docs/PRODUCTION_READINESS_SUMMARY.md .archive/docs/ 2>/dev/null || true
mv --backup=numbered docs/SUPABASE_AUTH_FIXES_OCT_2025.md .archive/supabase/ 2>/dev/null || true
mv --backup=numbered docs/INDEXEDDB_POLYFILL_IMPLEMENTATION.md .archive/docs/ 2>/dev/null || true
mv --backup=numbered docs/INDEXEDDB_POLYFILL_SETUP.md .archive/docs/ 2>/dev/null || true
mv --backup=numbered docs/BRAND_UPDATE_SUMMARY.md .archive/docs/ 2>/dev/null || true
mv --backup=numbered docs/EXECUTE_ROLLOUT.md .archive/docs/ 2>/dev/null || true
mv --backup=numbered docs/GO_DECISION_FINAL.md .archive/docs/ 2>/dev/null || true
mv --backup=numbered docs/engineering/TEAM_ANNOUNCEMENT.md .archive/docs/ 2>/dev/null || true
mv --backup=numbered docs/engineering/WORKFLOW_IMPLEMENTATION_SUMMARY.md .archive/docs/ 2>/dev/null || true
mv --backup=numbered docs/engineering/WORKFLOW_ROLLOUT_PLAN.md .archive/docs/ 2>/dev/null || true
mv --backup=numbered docs/engineering/WORKFLOW_VERIFICATION_CHECKLIST.md .archive/checklists/ 2>/dev/null || true
mv --backup=numbered docs/engineering/workflow-improvements-summary.md .archive/docs/ 2>/dev/null || true

echo "✅ Archive phase complete!"
echo ""
echo "📊 Summary:"
echo "- Archived implementation summaries → .archive/implementations/"
echo "- Archived historical docs → .archive/historical/"
echo "- Archived checklists → .archive/checklists/"
echo "- Archived testing docs → .archive/testing/"
echo "- Archived tour docs → .archive/tour/"
echo "- Archived supabase docs → .archive/supabase/"
echo ""
echo "⚠️  Next steps (manual):"
echo "1. Review .archive/ contents"
echo "2. Run delete script for redundant files"
echo "3. Update core documentation"
echo "4. Commit changes"
