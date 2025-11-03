#!/bin/bash
# Comprehensive verification of defensive guards and asset fixes
# Run: ./verify-defensive-guards.sh

set -e

echo "════════════════════════════════════════════════════════════════"
echo "🛡️  Defensive Guards & Asset Fixes Verification"
echo "════════════════════════════════════════════════════════════════"
echo ""

# 1. Check for forbidden asset paths
echo "1️⃣  Checking for forbidden /assets/brand/ paths..."
if bash scripts/check-asset-paths.sh > /dev/null 2>&1; then
  echo "   ✅ PASS: No forbidden asset paths in source"
else
  echo "   ❌ FAIL: Forbidden asset paths found"
  exit 1
fi
echo ""

# 2. Verify key files exist
echo "2️⃣  Verifying defensive guards files exist..."
FILES=(
  "src/tour/utils/layoutGuards.ts"
  "src/tour/components/TourOrchestrator.tsx"
  ".github/workflows/check-asset-paths.yml"
  "scripts/check-asset-paths.sh"
  ".git/hooks/pre-commit"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "   ✅ $file"
  else
    echo "   ❌ MISSING: $file"
    exit 1
  fi
done
echo ""

# 3. Verify key functions in layoutGuards.ts
echo "3️⃣  Verifying layoutGuards.ts exports..."
FUNCTIONS=(
  "waitForLayoutSettled"
  "observeAnchor"
  "createDebouncedMeasure"
  "recordMeasurement"
  "recordAdjustment"
  "isElementInViewport"
)

for func in "${FUNCTIONS[@]}"; do
  if grep -q "export.*$func" src/tour/utils/layoutGuards.ts; then
    echo "   ✅ $func exported"
  else
    echo "   ❌ MISSING EXPORT: $func"
    exit 1
  fi
done
echo ""

# 4. Verify TourOrchestrator integration
echo "4️⃣  Verifying TourOrchestrator integration..."
IMPORTS=(
  "waitForLayoutSettled"
  "observeAnchor"
  "createDebouncedMeasure"
  "recordMeasurement"
  "recordAdjustment"
)

for import in "${IMPORTS[@]}"; do
  if grep -q "$import" src/tour/components/TourOrchestrator.tsx; then
    echo "   ✅ $import used in TourOrchestrator"
  else
    echo "   ❌ MISSING USAGE: $import"
    exit 1
  fi
done
echo ""

# 5. Verify SKIP_WAITING logic in main.tsx
echo "5️⃣  Verifying SKIP_WAITING logic in main.tsx..."
if grep -q "SKIP_WAITING" src/main.tsx; then
  echo "   ✅ SKIP_WAITING promotion logic present"
else
  echo "   ⚠️  WARNING: SKIP_WAITING logic missing (optional for older versions)"
fi
echo ""

# 6. Verify brand assets in public folder
echo "6️⃣  Verifying brand assets placement..."
if [ -d "public/brand" ]; then
  BRAND_FILES=$(find public/brand -type f | wc -l)
  echo "   ✅ public/brand/ exists with $BRAND_FILES files"
else
  echo "   ⚠️  WARNING: public/brand/ directory not found"
fi
echo ""

# 7. Verify analytics hooks
echo "7️⃣  Verifying analytics telemetry setup..."
if grep -q "trackEvent" src/tour/hooks/useAnalytics.ts 2>/dev/null; then
  echo "   ✅ useAnalytics hook has trackEvent"
else
  echo "   ⚠️  WARNING: Analytics hook not verified"
fi
echo ""

# 8. Run build
echo "8️⃣  Running build to verify no compile errors..."
if npm run build > /tmp/build.log 2>&1; then
  echo "   ✅ Build successful"
else
  echo "   ❌ FAIL: Build failed"
  echo "   Last 20 lines of build output:"
  tail -20 /tmp/build.log
  exit 1
fi
echo ""

# 9. Verify dist/brand exists after build
echo "9️⃣  Verifying brand assets in dist/..."
if [ -d "dist/brand" ]; then
  DIST_BRAND_FILES=$(find dist/brand -type f | wc -l)
  echo "   ✅ dist/brand/ exists with $DIST_BRAND_FILES files"
else
  echo "   ❌ FAIL: dist/brand/ missing after build"
  exit 1
fi
echo ""

# 10. Verify service worker generated
echo "🔟  Verifying service worker generation..."
if [ -f "dist/sw.js" ]; then
  echo "   ✅ dist/sw.js generated"
  if grep -q "precache" dist/sw.js; then
    echo "   ✅ Service worker has precache manifest"
  else
    echo "   ⚠️  WARNING: Precache manifest not found in SW"
  fi
else
  echo "   ❌ FAIL: dist/sw.js missing"
  exit 1
fi
echo ""

# 11. Verify no duplicate entries in site.webmanifest
echo "1️⃣1️⃣  Checking for precache conflicts..."
if [ -f "vite.config.ts" ]; then
  # Count how many times site.webmanifest appears in config
  MANIFEST_COUNT=$(grep -c "site.webmanifest" vite.config.ts || echo "0")
  if [ "$MANIFEST_COUNT" -le 1 ]; then
    echo "   ✅ No duplicate site.webmanifest entries"
  else
    echo "   ⚠️  WARNING: Multiple site.webmanifest entries found ($MANIFEST_COUNT)"
  fi
else
  echo "   ⚠️  WARNING: vite.config.ts not found"
fi
echo ""

# Final summary
echo "════════════════════════════════════════════════════════════════"
echo "✅ All defensive guards verification checks PASSED!"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "📊 Next Steps:"
echo "  1. Deploy to production"
echo "  2. Monitor tour_step_adjusted events (should trend to ~0)"
echo "  3. Review dashboard for layout adjustments per session"
echo "  4. After 2 releases: remove SKIP_WAITING logic from src/main.tsx"
echo ""
echo "📝 Documentation:"
echo "  - DEFENSIVE_GUARDS_COMPLETE.md (implementation summary)"
echo "  - DEFENSIVE_GUARDS_USAGE_GUIDE.md (drop-in usage examples)"
echo "  - BEFORE_AFTER_COMPARISON.md (what changed)"
echo ""
