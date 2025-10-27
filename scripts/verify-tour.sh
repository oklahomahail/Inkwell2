#!/bin/bash

# Quick Tour Verification Script
# This script performs automated checks for the tour implementation

set -e

echo "🎯 Tour Verification Script"
echo "=========================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counter
PASSED=0
FAILED=0

check_pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((PASSED++))
}

check_fail() {
    echo -e "${RED}✗${NC} $1"
    ((FAILED++))
}

check_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

echo "1. Checking Tour Files..."
echo "-------------------------"

# Check key tour files exist
files=(
    "src/tour/TourService.ts"
    "src/tour/tourEntry.ts"
    "src/tour/configs/defaultTour.ts"
    "src/components/Onboarding/WelcomeModal.tsx"
    "src/components/Onboarding/utils/tourSafety.ts"
    "src/components/Onboarding/tourRegistry.ts"
    "src/components/Navigation/HelpMenu.tsx"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        check_pass "Found: $file"
    else
        check_fail "Missing: $file"
    fi
done

echo ""
echo "2. Checking Feature Flag..."
echo "---------------------------"

if grep -q "tour_simpleTour" src/services/featureFlagService.ts; then
    check_pass "Feature flag 'tour_simpleTour' exists"
    
    if grep -A 3 "tour_simpleTour" src/services/featureFlagService.ts | grep -q "enabled: true"; then
        check_pass "Feature flag is enabled by default"
    else
        check_warn "Feature flag may not be enabled"
    fi
else
    check_fail "Feature flag 'tour_simpleTour' not found"
fi

echo ""
echo "3. Checking Tour Steps..."
echo "------------------------"

if grep -q "CORE_TOUR_STEPS" src/components/Onboarding/tourRegistry.ts; then
    check_pass "CORE_TOUR_STEPS defined in registry"
else
    check_warn "CORE_TOUR_STEPS not found in registry"
fi

if grep -q "defaultTourSteps" src/tour/configs/defaultTour.ts; then
    check_pass "defaultTourSteps defined in config"
else
    check_fail "defaultTourSteps not found"
fi

echo ""
echo "4. Checking Global Functions..."
echo "-------------------------------"

if grep -q "inkwellStartTour" src/tour/tourEntry.ts; then
    check_pass "Global inkwellStartTour() function exposed"
else
    check_fail "Global inkwellStartTour() not found"
fi

echo ""
echo "5. Checking Help Menu Integration..."
echo "------------------------------------"

if grep -q "startDefaultTour" src/components/Navigation/HelpMenu.tsx; then
    check_pass "Help menu imports startDefaultTour"
else
    check_warn "Help menu may not have Restart Tour option"
fi

if grep -q "RotateCw" src/components/Navigation/HelpMenu.tsx; then
    check_pass "Restart Tour button icon imported"
else
    check_warn "Restart Tour button may be missing"
fi

echo ""
echo "6. Checking Tour Safety..."
echo "-------------------------"

if grep -q "skipMissingAnchors" src/components/Onboarding/utils/tourSafety.ts; then
    check_pass "Tour safety uses skipMissingAnchors"
else
    check_fail "skipMissingAnchors not configured"
fi

if grep -q "configure.*skipMissingAnchors.*true" src/components/Onboarding/utils/tourSafety.ts; then
    check_pass "skipMissingAnchors enabled in safety utils"
else
    check_warn "skipMissingAnchors may not be enabled"
fi

echo ""
echo "7. Checking Test Coverage..."
echo "----------------------------"

test_files=(
    "src/components/Onboarding/__tests__/tourSafety.test.ts"
    "src/tour/__tests__/TourService.test.ts"
    "e2e/tour-happy-path.spec.ts"
)

for file in "${test_files[@]}"; do
    if [ -f "$file" ]; then
        check_pass "Test file exists: $file"
    else
        check_warn "Test file missing: $file"
    fi
done

echo ""
echo "8. Checking Analytics..."
echo "-----------------------"

if grep -q "tourAnalytics.started" src/tour/TourService.ts; then
    check_pass "Analytics: tour_started tracked"
else
    check_warn "tour_started event may not be tracked"
fi

if grep -q "tourAnalytics.stepViewed" src/tour/TourService.ts; then
    check_pass "Analytics: tour_step_viewed tracked"
else
    check_warn "tour_step_viewed event may not be tracked"
fi

if grep -q "tourAnalytics.completed" src/tour/TourService.ts; then
    check_pass "Analytics: tour_completed tracked"
else
    check_warn "tour_completed event may not be tracked"
fi

if grep -q "tourAnalytics.skipped" src/tour/TourService.ts; then
    check_pass "Analytics: tour_skipped tracked"
else
    check_warn "tour_skipped event may not be tracked"
fi

echo ""
echo "=========================="
echo "Summary"
echo "=========================="
echo -e "Passed: ${GREEN}${PASSED}${NC}"
echo -e "Failed: ${RED}${FAILED}${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All critical checks passed!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Run unit tests: pnpm test --run src/components/Onboarding/__tests__/"
    echo "2. Run E2E tests: pnpm test:e2e e2e/tour-happy-path.spec.ts"
    echo "3. Manual testing: pnpm dev"
    echo "4. Test console command: inkwellStartTour()"
    exit 0
else
    echo -e "${RED}✗ Some checks failed. Please review.${NC}"
    exit 1
fi
