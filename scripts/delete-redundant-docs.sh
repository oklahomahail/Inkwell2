#!/bin/bash
# Delete Redundant Documentation
# Based on DOCUMENTATION_AUDIT_2025.md Category 3

set -e

echo "🗑️  Inkwell Documentation Cleanup - DELETE Phase"
echo "================================================"
echo ""
echo "⚠️  WARNING: This will permanently delete redundant documentation files"
echo "Press Ctrl+C to cancel, or Enter to continue..."
read

echo "🗑️  Deleting redundant documentation files..."

# Redundant Documentation
git rm -f CLEANUP_QUICKSTART.md 2>/dev/null || true
git rm -f DOCS_BEFORE_AFTER.md 2>/dev/null || true
git rm -f DOCS_INTEGRATION_GUIDE.md 2>/dev/null || true
git rm -f DOCS_READY_TO_DEPLOY.md 2>/dev/null || true
git rm -f DOCS_UPDATE_OCT_2025.md 2>/dev/null || true
git rm -f DOCUMENTATION_CLEANUP_PLAN.md 2>/dev/null || true
git rm -f DOCUMENTATION_INVENTORY.md 2>/dev/null || true
git rm -f README_CLEANUP.md 2>/dev/null || true
git rm -f README_TEST_OPTIMIZATION.md 2>/dev/null || true
git rm -f PR_DESCRIPTION.md 2>/dev/null || true

# Duplicate/Superseded Guides
git rm -f AUTH_TROUBLESHOOTING.md 2>/dev/null || true
git rm -f DEPLOYMENT.md 2>/dev/null || true
git rm -f RELEASE.md 2>/dev/null || true
git rm -f TESTER_GUIDE.md 2>/dev/null || true
git rm -f VERIFICATION_GUIDE.md 2>/dev/null || true
git rm -f MANUAL_VERIFICATION_GUIDE.md 2>/dev/null || true

# Obsolete Quick Reference Docs
git rm -f HARDENED_INITIALIZATION_QUICK_REF.md 2>/dev/null || true
git rm -f HOOKS_QUICK_REF.md 2>/dev/null || true
git rm -f MUTATION_OBSERVER_QUICK_REF.md 2>/dev/null || true
git rm -f QUICK_FIX_REFERENCE.md 2>/dev/null || true
git rm -f QUICK_WINS_IMPLEMENTATION.md 2>/dev/null || true
git rm -f QUICK_WINS_REFERENCE.md 2>/dev/null || true

# Redundant Supabase Docs
git rm -f SUPABASE_AUTH_CHECKLIST.md 2>/dev/null || true
git rm -f SUPABASE_AUTH_DEPLOYMENT_CHECKLIST.md 2>/dev/null || true
git rm -f SUPABASE_DEPLOYMENT_GUIDE.md 2>/dev/null || true
git rm -f SUPABASE_INTEGRATION_CHECKLIST.md 2>/dev/null || true
git rm -f SUPABASE_MIGRATIONS_REFERENCE.md 2>/dev/null || true
git rm -f SUPABASE_MIGRATION_GUIDE.md 2>/dev/null || true
git rm -f SUPABASE_PASSWORD_RESET_CONFIG.md 2>/dev/null || true
git rm -f SUPABASE_QUICKSTART.md 2>/dev/null || true
git rm -f SUPABASE_QUICK_REFERENCE.md 2>/dev/null || true
git rm -f SUPABASE_SETUP_GUIDE.md 2>/dev/null || true
git rm -f SUPABASE_STARTER_PACK.md 2>/dev/null || true
git rm -f docs/SUPABASE_SETUP.md 2>/dev/null || true
git rm -f docs/SUPABASE_AUTH_DEPLOYMENT_CHECKLIST.md 2>/dev/null || true
git rm -f docs/SUPABASE_AUTH_EMAIL_TROUBLESHOOTING.md 2>/dev/null || true

# Redundant Tour Docs
git rm -f TOUR_BUTTON_QUICK_FIX.md 2>/dev/null || true
git rm -f TOUR_BUTTON_TESTING_GUIDE.md 2>/dev/null || true
git rm -f TOUR_DEBUGGING_GUIDE.md 2>/dev/null || true
git rm -f TOUR_IMPLEMENTATION_QUICK_REF.md 2>/dev/null || true
git rm -f TOUR_OVERLAY_DIAGNOSTIC.md 2>/dev/null || true
git rm -f TOUR_UI_FIXES_PLAN.md 2>/dev/null || true
git rm -f TOUR_VERIFICATION_CHECKLIST.md 2>/dev/null || true
git rm -f docs/TOUR_DATA_ATTRIBUTES_IMPLEMENTATION.md 2>/dev/null || true
git rm -f docs/TOUR_INTEGRATION_STATUS.md 2>/dev/null || true
git rm -f docs/TOUR_POST_DEPLOY_GUARDRAILS.md 2>/dev/null || true
git rm -f docs/TOUR_PRODUCTION_READINESS.md 2>/dev/null || true
git rm -f docs/TOUR_ROLLOUT_INDEX.md 2>/dev/null || true
git rm -f docs/TOUR_SHIP_CHECKLIST.md 2>/dev/null || true
git rm -f docs/PR_TEMPLATE_TOUR_CHECKLIST.md 2>/dev/null || true

# Redundant Testing Docs
git rm -f TEST_ACTION_CHECKLIST.md 2>/dev/null || true
git rm -f TEST_FIXES_NEEDED.md 2>/dev/null || true
git rm -f TEST_IMPLEMENTATION_PROGRESS.md 2>/dev/null || true
git rm -f TEST_OPTIMIZATION_CHECKLIST.md 2>/dev/null || true
git rm -f TEST_PRUNING_ANALYSIS.md 2>/dev/null || true
git rm -f TEST_PRUNING_RECOMMENDATIONS.md 2>/dev/null || true
git rm -f docs/testing/CREATE_PROJECT_BUTTON_TEST_GUIDE.md 2>/dev/null || true
git rm -f docs/troubleshooting/CREATE_PROJECT_BUTTON_FIX.md 2>/dev/null || true

# One-Time Checklists/Templates
git rm -f QA_CHECKLIST.md 2>/dev/null || true
git rm -f QA_TEST_PLAN_PERSISTENCE.md 2>/dev/null || true
git rm -f SMOKE_TEST_CHECKLIST.md 2>/dev/null || true
git rm -f SMOKE_TEST_IMPLEMENTATION.md 2>/dev/null || true
git rm -f SPOTLIGHT_TOUR_INTEGRATION_CHECKLIST.md 2>/dev/null || true
git rm -f PASSWORD_RESET_QUICKSTART.md 2>/dev/null || true
git rm -f PASSWORD_RESET_TESTING_CHECKLIST.md 2>/dev/null || true
git rm -f FEEDBACK_TEMPLATE.md 2>/dev/null || true

# Obsolete Technical Docs
git rm -f ARCHITECTURE_IMPLEMENTATION.md 2>/dev/null || true
git rm -f MODULE_CONTRACTS.md 2>/dev/null || true
git rm -f PLATFORM_OVERVIEW.md 2>/dev/null || true
git rm -f TECHNICAL_ROADMAP.md 2>/dev/null || true
git rm -f REMAINING_FEATURES.md 2>/dev/null || true
git rm -f NEXT_STEPS.md 2>/dev/null || true
git rm -f GO_DECISION.md 2>/dev/null || true
git rm -f COVERAGE_IMPROVEMENT_PLAN.md 2>/dev/null || true

# Miscellaneous
git rm -f "# Code Citations.md" 2>/dev/null || true
git rm -f .bfg-replacements.txt 2>/dev/null || true

# Duplicate Integration/Examples
git rm -f INTEGRATION_EXAMPLES.md 2>/dev/null || true
git rm -f INTEGRATION_GUIDE.md 2>/dev/null || true
git rm -f CHAPTER_MANAGEMENT_EXAMPLES.md 2>/dev/null || true
git rm -f CHAPTER_MANAGEMENT_QUICKSTART.md 2>/dev/null || true
git rm -f DATA_PERSISTENCE_QUICKSTART.md 2>/dev/null || true
git rm -f USER_GUIDE_DATA_PERSISTENCE.md 2>/dev/null || true

# Duplicate AI Docs
git rm -f docs/AI_INTEGRATION.md 2>/dev/null || true
git rm -f docs/AI_PLOT_ANALYSIS.md 2>/dev/null || true
git rm -f docs/AI_SERVICES.md 2>/dev/null || true
git rm -f docs/story-architect-enhancement.md 2>/dev/null || true
git rm -f docs/enhanced-ai-toolbar.md 2>/dev/null || true

# Additional duplicates
git rm -f RELEASE_NOTES_v1.3.2.md 2>/dev/null || true
git rm -f DATA_PERSISTENCE_IMPLEMENTATION.md 2>/dev/null || true

echo "✅ Redundant files deleted!"
echo ""
echo "📊 Next steps:"
echo "1. Review git status to see what was deleted"
echo "2. Update core documentation"
echo "3. Commit all changes together"
