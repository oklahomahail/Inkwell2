#!/bin/bash
# Phase 2: Consolidate Core Documentation
# This script reorganizes docs into the new structure

set -e

echo "📚 Phase 2: Consolidate Core Documentation"
echo "==========================================="
echo ""

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

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

echo "→ Product Documentation"
move_file "ROADMAP.md" "docs/product/ROADMAP.md"
move_file "PLATFORM_OVERVIEW.md" "docs/product/PLATFORM_OVERVIEW.md"
move_file "RELEASE.md" "docs/product/RELEASE.md"

echo ""
echo "→ User Documentation"
move_file "USER_GUIDE.md" "docs/user/USER_GUIDE.md"

echo ""
echo "→ Developer Documentation"
move_file "DEPLOYMENT.md" "docs/dev/DEPLOYMENT.md"
move_file "MODULE_CONTRACTS.md" "docs/dev/MODULE_CONTRACTS.md"
move_file "TESTER_GUIDE.md" "docs/dev/TESTING_GUIDE.md"

# Performance docs
echo ""
echo "→ Performance Documentation"
move_file "docs/TRACE_SYSTEM.md" "docs/dev/performance/TRACE_SYSTEM.md"
move_file "docs/PERFORMANCE_GUARDRAILS.md" "docs/dev/performance/PERFORMANCE_GUARDRAILS.md"
move_file "docs/PERFORMANCE.md" "docs/dev/performance/PERFORMANCE.md"

# Linting
echo ""
echo "→ Linting Documentation"
move_file "docs/ESLINT_MIGRATION.md" "docs/dev/linting/ESLINT_MIGRATION.md"

# Feature docs
echo ""
echo "→ Feature Documentation"
move_file "docs/AI_SERVICES.md" "docs/features/AI_SERVICES.md"
move_file "docs/PLOT_BOARDS.md" "docs/features/PLOT_BOARDS.md"

# Auth
echo ""
echo "→ Authentication Documentation"
move_file "docs/SUPABASE_SETUP.md" "docs/features/AUTHENTICATION.md"
move_file "AUTH_TROUBLESHOOTING.md" "docs/features/AUTH_TROUBLESHOOTING.md"

# Tour system
echo ""
echo "→ Tour System Documentation"
move_file "docs/TOUR_QUICK_REFERENCE.md" "docs/features/TOUR_SYSTEM.md"

# Brand
echo ""
echo "→ Brand Documentation"
move_file "docs/BRAND_UPDATE_SUMMARY.md" "docs/brand/BRAND_GUIDE.md"
move_file "docs/BRAND_ACCESSIBILITY_GUIDE.md" "docs/brand/ACCESSIBILITY.md"

# Ops
echo ""
echo "→ Operations Documentation"
move_file "docs/UPTIME_MONITORING.md" "docs/ops/UPTIME_MONITORING.md"
move_file "docs/ROLLBACK_PROCEDURES.md" "docs/ops/ROLLBACK_PROCEDURES.md"

echo ""
echo -e "${GREEN}✓ Phase 2 complete!${NC}"
echo ""
echo "Next: Review moved files and create consolidated versions where needed"
