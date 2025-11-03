#!/bin/bash
# verify-sw-asset-fixes.sh
# Verification script for Service Worker & Asset fixes
# Run: chmod +x verify-sw-asset-fixes.sh && ./verify-sw-asset-fixes.sh

echo "🔍 Verifying Service Worker & Asset Fixes"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERROR_COUNT=0

# Helper functions
pass() {
  echo -e "${GREEN}✅ $1${NC}"
}

fail() {
  echo -e "${RED}❌ $1${NC}"
  ((ERROR_COUNT++))
}

warn() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

# 1. Check vite.config.ts for duplicate manifest entries
echo "📋 Checking vite.config.ts..."
if grep -q "'/site.webmanifest'" vite.config.ts; then
  if grep "'/site.webmanifest'" vite.config.ts | grep -q "additionalManifestEntries"; then
    fail "site.webmanifest found in additionalManifestEntries (should be removed)"
  elif grep "'/site.webmanifest'" vite.config.ts | grep -q "includeAssets"; then
    fail "site.webmanifest found in includeAssets (should be removed)"
  fi
else
  pass "site.webmanifest not in duplicated in config"
fi
echo ""

# 2. Check for old asset paths in source files
echo "📋 Checking for old asset paths in source code..."
OLD_PATHS=$(grep -r "/assets/brand" src/ 2>/dev/null | grep -v node_modules | wc -l)
if [ "$OLD_PATHS" -gt 0 ]; then
  fail "Found $OLD_PATHS references to /assets/brand (should all be /brand)"
else
  pass "No old /assets/brand paths in src/"
fi
echo ""

# 3. Check index.html for brand asset fixes
echo "📋 Checking index.html..."
if grep -q '/brand/inkwell-favicon' index.html; then
  pass "Favicon paths updated to /brand/"
else
  fail "Favicon paths not updated to /brand/"
fi

if grep -q '/brand/inkwell-og' index.html; then
  pass "OG:image paths updated to /brand/"
else
  fail "OG:image paths not updated to /brand/"
fi

if grep -q '/brand/inkwell-logo-icon-192.png' index.html; then
  pass "Tile image path updated to /brand/"
else
  fail "Tile image path not updated to /brand/"
fi
echo ""

# 4. Check if brand assets exist
echo "📋 Checking brand assets in public/..."
if [ -d "public/assets/brand" ]; then
  pass "Brand assets directory exists at public/assets/brand/"

  ASSET_COUNT=$(find public/assets/brand -type f | wc -l)
  if [ "$ASSET_COUNT" -gt 0 ]; then
    pass "Found $ASSET_COUNT brand asset files"
  else
    fail "Brand asset directory is empty"
  fi
else
  fail "Brand assets directory not found at public/assets/brand/"
fi
echo ""

# 5. Check if site.webmanifest exists
echo "📋 Checking site.webmanifest..."
if [ -f "public/site.webmanifest" ]; then
  pass "site.webmanifest exists in public/ (correct location)"
else
  fail "site.webmanifest not found in public/"
fi
echo ""

# 6. Check main.tsx for SW cache cleanup
echo "📋 Checking main.tsx for SW cleanup logic..."
if grep -q "SKIP_WAITING" src/main.tsx; then
  pass "SW cache cleanup logic found in main.tsx"
else
  fail "SW cache cleanup logic not found in main.tsx"
fi

if grep -q "controllerchange" src/main.tsx; then
  pass "Service Worker controller change listener found"
else
  fail "Service Worker controller change listener not found"
fi
echo ""

# 7. Check component files for path updates
echo "📋 Checking React components..."
COMPONENTS=(
  "src/components/Logo.tsx"
  "src/components/Auth/AuthHeader.tsx"
  "src/components/Layout/MainLayout.tsx"
  "src/pages/AuthPage.tsx"
  "src/pages/ForgotPassword.tsx"
  "src/pages/UpdatePassword.tsx"
)

for file in "${COMPONENTS[@]}"; do
  if [ -f "$file" ]; then
    if grep -q "/assets/brand" "$file"; then
      fail "$file still has /assets/brand paths"
    else
      pass "$file paths updated"
    fi
  fi
done
echo ""

# Summary
echo "=========================================="
if [ $ERROR_COUNT -eq 0 ]; then
  echo -e "${GREEN}✅ All checks passed!${NC}"
  echo ""
  echo "Next steps:"
  echo "1. Run: pnpm build"
  echo "2. Verify dist/brand/ has assets"
  echo "3. Verify dist/site.webmanifest exists"
  echo "4. Hard refresh in browser (Cmd+Shift+R)"
  echo "5. Check DevTools for fresh SW & no 404s"
  exit 0
else
  echo -e "${RED}❌ $ERROR_COUNT issue(s) found${NC}"
  echo ""
  echo "Please review the failures above and fix them."
  exit 1
fi
