#!/bin/bash
#
# Tour System: Pre-Deploy Validation Script
# 
# Runs all required checks before deploying tour system to production.
# Exit code 0 = ready to deploy, non-zero = issues found
#

set -e  # Exit on error

echo ""
echo "🎯 Tour System Pre-Deploy Validation"
echo "====================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track overall status
OVERALL_STATUS=0

# 1. TypeScript Type Checking
echo "📝 Step 1/7: TypeScript Type Checking"
echo "--------------------------------------"
if pnpm typecheck; then
  echo -e "${GREEN}✅ TypeScript: PASS${NC}"
else
  echo -e "${RED}❌ TypeScript: FAIL${NC}"
  OVERALL_STATUS=1
fi
echo ""

# 2. ESLint
echo "🔍 Step 2/7: ESLint (allowing <25 warnings)"
echo "--------------------------------------------"
if pnpm lint:ci; then
  echo -e "${GREEN}✅ Lint: PASS${NC}"
else
  echo -e "${YELLOW}⚠️  Lint: WARNINGS (acceptable if <25)${NC}"
fi
echo ""

# 3. Unit Tests
echo "🧪 Step 3/7: Unit Tests"
echo "-----------------------"
if pnpm test:run; then
  echo -e "${GREEN}✅ Unit Tests: PASS${NC}"
else
  echo -e "${RED}❌ Unit Tests: FAIL${NC}"
  OVERALL_STATUS=1
fi
echo ""

# 4. Anchor Tests
echo "🎯 Step 4/7: Tour Anchor Tests"
echo "-------------------------------"
if pnpm test:anchors; then
  echo -e "${GREEN}✅ Anchor Tests: PASS${NC}"
else
  echo -e "${RED}❌ Anchor Tests: FAIL${NC}"
  OVERALL_STATUS=1
fi
echo ""

# 5. CLI Anchor Verification
echo "🔗 Step 5/7: CLI Anchor Verification"
echo "-------------------------------------"
if pnpm verify-tour-anchors; then
  echo -e "${GREEN}✅ Anchor Verification: PASS${NC}"
else
  echo -e "${RED}❌ Anchor Verification: FAIL${NC}"
  OVERALL_STATUS=1
fi
echo ""

# 6. Build Test
echo "🏗️  Step 6/7: Production Build"
echo "-------------------------------"
if pnpm build; then
  echo -e "${GREEN}✅ Build: PASS${NC}"
else
  echo -e "${RED}❌ Build: FAIL${NC}"
  OVERALL_STATUS=1
fi
echo ""

# 7. Smoke Tests (optional, requires Playwright)
echo "💨 Step 7/7: Tour Smoke Tests (optional)"
echo "-----------------------------------------"
if command -v playwright &> /dev/null; then
  if pnpm test:smoke:tour; then
    echo -e "${GREEN}✅ Smoke Tests: PASS${NC}"
  else
    echo -e "${YELLOW}⚠️  Smoke Tests: FAIL (non-blocking)${NC}"
    # Don't fail overall status for smoke tests
  fi
else
  echo -e "${YELLOW}⚠️  Playwright not found, skipping smoke tests${NC}"
fi
echo ""

# Final Summary
echo "========================================="
if [ $OVERALL_STATUS -eq 0 ]; then
  echo -e "${GREEN}✅ ALL CHECKS PASSED - READY TO DEPLOY${NC}"
  echo ""
  echo "Next Steps:"
  echo "1. Review TOUR_PRODUCTION_READINESS.md"
  echo "2. Ensure all flags disabled by default"
  echo "3. Deploy to production"
  echo "4. Start Phase 1 canary with internal users"
  echo "5. Monitor analytics for 24-48h"
  echo ""
else
  echo -e "${RED}❌ CHECKS FAILED - NOT READY TO DEPLOY${NC}"
  echo ""
  echo "Please fix the failing checks before deploying."
  echo ""
fi

exit $OVERALL_STATUS
