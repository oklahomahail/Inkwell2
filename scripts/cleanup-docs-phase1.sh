#!/bin/bash
# Inkwell Documentation Cleanup Script
# This script helps organize the documentation structure

set -e  # Exit on error

echo "🧹 Inkwell Documentation Cleanup"
echo "================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to archive files
archive_file() {
    local file=$1
    local dest_dir=$2
    
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} Archiving: $file → .archive/$dest_dir/"
        git mv "$file" ".archive/$dest_dir/"
    else
        echo -e "${YELLOW}⊘${NC} File not found: $file"
    fi
}

# Function to move files
move_file() {
    local src=$1
    local dest=$2
    
    if [ -f "$src" ]; then
        echo -e "${GREEN}✓${NC} Moving: $src → $dest"
        mkdir -p "$(dirname "$dest")"
        git mv "$src" "$dest"
    else
        echo -e "${YELLOW}⊘${NC} File not found: $src"
    fi
}

# Function to delete files
delete_file() {
    local file=$1
    
    if [ -f "$file" ]; then
        echo -e "${RED}✗${NC} Deleting: $file"
        git rm "$file"
    else
        echo -e "${YELLOW}⊘${NC} File not found: $file"
    fi
}

# Create directory structure
echo "📁 Creating directory structure..."
mkdir -p .archive/{summaries,checklists,phase-summaries,migrations}
mkdir -p docs/{product,user,dev/linting,dev/performance,features,brand,ops}

echo ""
echo "Phase 1: Archive Historical Documents"
echo "======================================"

# Phase summaries
echo ""
echo "→ Archiving phase summaries..."
archive_file "PHASE_1_SUMMARY.md" "phase-summaries"
archive_file "PHASE_2_SUMMARY.md" "phase-summaries"
archive_file "PHASE_2B_COMPLETION_SUMMARY.md" "phase-summaries"
archive_file "PHASE_3_COMPLETION_SUMMARY.md" "phase-summaries"

# Implementation summaries
echo ""
echo "→ Archiving implementation summaries..."
archive_file "IMPLEMENTATION_COMPLETE.md" "summaries"
archive_file "IMPLEMENTATION_SUMMARY.md" "summaries"
archive_file "AUTH_FIX_SUMMARY.md" "summaries"
archive_file "BRAND_FIX_COMPLETE.md" "summaries"
archive_file "CHAPTER_MVP_COMPLETE.md" "summaries"
archive_file "CHARACTER_ANALYTICS_FIX.md" "summaries"
archive_file "FOOTER_BRAND_UPDATE_SUMMARY.md" "summaries"
archive_file "ICON_REPLACEMENT_SUMMARY.md" "summaries"
archive_file "INDEXEDDB_POLYFILL_COMPLETE.md" "summaries"
archive_file "INDEXEDDB_POLYFILL_SUCCESS.md" "summaries"
archive_file "ONBOARDING_CONSOLIDATION_SUMMARY.md" "summaries"
archive_file "ONBOARDING_GATE_FIX_SUMMARY.md" "summaries"
archive_file "PASSWORD_RESET_COMPLETE.md" "summaries"
archive_file "PROFILE_REMOVAL_COMPLETE.md" "summaries"
archive_file "SIDEBAR_FIX_SUMMARY.md" "summaries"
archive_file "BRANDING_UI_FIXES_COMPLETE.md" "summaries"
archive_file "COMPLETE_TEST_SUMMARY.md" "summaries"
archive_file "FINAL_TEST_SUMMARY.md" "summaries"
archive_file "TEST_COVERAGE_IMPROVEMENT_COMPLETE.md" "summaries"
archive_file "TEST_FIXES_COMPLETE.md" "summaries"
archive_file "TEST_FIX_QUICK_WIN_COMPLETE.md" "summaries"
archive_file "TEST_FIX_SUMMARY.md" "summaries"
archive_file "TEST_SUITE_IMPROVEMENT_SUMMARY.md" "summaries"
archive_file "TOUR_VERIFICATION_COMPLETE.md" "summaries"
archive_file "SPOTLIGHT_TOUR_FINAL_INTEGRATION.md" "summaries"
archive_file "SPOTLIGHT_TOUR_PHASE2_COMPLETE.md" "summaries"
archive_file "SPOTLIGHT_TOUR_PHASE2_INTEGRATION_COMPLETE.md" "summaries"
archive_file "ARCHIVE_ACTIVATION_SUMMARY.md" "summaries"
archive_file "FIX_SUMMARY.md" "summaries"
archive_file "PRODUCTION_POLISH_FIXES.md" "summaries"

# Checklists
echo ""
echo "→ Archiving checklists..."
archive_file "DEPLOYMENT_CHECKLIST.md" "checklists"
archive_file "DEPLOYMENT_CHECKLIST_TOURS.md" "checklists"
archive_file "DEPLOYMENT_NOTES.md" "checklists"
archive_file "FINAL_OPERATIONAL_CHECKLIST.md" "checklists"
archive_file "PASSWORD_RESET_SETUP_VERIFICATION.md" "checklists"
archive_file "PASSWORD_RESET_TESTING_CHECKLIST.md" "checklists"
archive_file "QA_CHECKLIST.md" "checklists"
archive_file "SMOKE_TEST_CHECKLIST.md" "checklists"
archive_file "SMOKE_TEST_IMPLEMENTATION.md" "checklists"
archive_file "SPOTLIGHT_TOUR_INTEGRATION_CHECKLIST.md" "checklists"
archive_file "SUPABASE_AUTH_CHECKLIST.md" "checklists"
archive_file "SUPABASE_AUTH_DEPLOYMENT_CHECKLIST.md" "checklists"
archive_file "TEST_ACTION_CHECKLIST.md" "checklists"
archive_file "TEST_OPTIMIZATION_CHECKLIST.md" "checklists"
archive_file "TOUR_VERIFICATION_CHECKLIST.md" "checklists"
archive_file "VERIFICATION_GUIDE.md" "checklists"

# Implementation guides (completed features)
echo ""
echo "→ Archiving completed implementation guides..."
archive_file "CHAPTER_MANAGEMENT_IMPLEMENTATION.md" "summaries"
archive_file "CHAPTER_MANAGEMENT_MVP_SUMMARY.md" "summaries"
archive_file "PROJECT_NAMING_IMPLEMENTATION.md" "summaries"
archive_file "QUICK_WINS_IMPLEMENTATION.md" "summaries"
archive_file "TOUR_BOOT_TIMING_FIX.md" "summaries"
archive_file "TOUR_DATA_ATTRIBUTES_IMPLEMENTATION.md" "summaries"
archive_file "TOUR_IMPLEMENTATION_SUMMARY.md" "summaries"
archive_file "WORLD_BUILDING_IMPLEMENTATION.md" "summaries"

# Old documentation
echo ""
echo "→ Archiving old/obsolete docs..."
archive_file "DOCS_UPDATE_OCT_2025.md" "summaries"
archive_file "COVERAGE_IMPROVEMENT_PLAN.md" "summaries"
archive_file "TEST_IMPLEMENTATION_PROGRESS.md" "summaries"
archive_file "TEST_OPTIMIZATION_COMPLETE.md" "summaries"
archive_file "TEST_PRUNING_ANALYSIS.md" "summaries"
archive_file "TEST_PRUNING_RECOMMENDATIONS.md" "summaries"
archive_file "README_TEST_OPTIMIZATION.md" "summaries"
archive_file "REMAINING_FEATURES.md" "summaries"
archive_file "NEXT_STEPS.md" "summaries"
archive_file "SESSION_SUMMARY_2025-10-27.md" "summaries"

# Brand documents (to be consolidated)
echo ""
echo "→ Archiving brand documents (will consolidate)..."
archive_file "BRAND_COLORS_REFERENCE.md" "summaries"
archive_file "BRAND_DEPLOYMENT_GUIDE.md" "summaries"
archive_file "BRAND_INCONSISTENCY_REPORT.md" "summaries"

echo ""
echo -e "${GREEN}✓ Phase 1 complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Review archived files in .archive/"
echo "2. Run Phase 2 to consolidate documentation"
echo "3. Commit changes: git commit -m 'docs: archive historical documentation'"
