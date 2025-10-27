#!/bin/bash
# Verification script for bug fixes

echo "🔍 Verifying Bug Fixes..."
echo ""

# Check icon dimensions
echo "1️⃣ Checking PWA icon dimensions..."
file public/assets/brand/inkwell-logo-icon-192.png | grep -q "192 x 192" && echo "✅ 192x192 icon correct" || echo "❌ 192x192 icon incorrect"
file public/assets/brand/inkwell-logo-icon-512.png | grep -q "512 x 512" && echo "✅ 512x512 icon correct" || echo "❌ 512x512 icon incorrect"
echo ""

# Check SVG files exist
echo "2️⃣ Checking brand SVG files..."
[ -f public/assets/brand/inkwell-lockup-dark.svg ] && echo "✅ inkwell-lockup-dark.svg exists" || echo "❌ inkwell-lockup-dark.svg missing"
[ -f public/assets/brand/inkwell-lockup-horizontal.svg ] && echo "✅ inkwell-lockup-horizontal.svg exists" || echo "❌ inkwell-lockup-horizontal.svg missing"
[ -f public/assets/brand/inkwell-wordmark-gold.svg ] && echo "✅ inkwell-wordmark-gold.svg exists" || echo "❌ inkwell-wordmark-gold.svg missing"
echo ""

# Check vite.config.ts for manifest.json removal
echo "3️⃣ Checking Workbox config..."
grep -q '"url": "/manifest.json"' vite.config.ts && echo "❌ manifest.json still in additionalManifestEntries" || echo "✅ manifest.json removed from additionalManifestEntries"
echo ""

# Check theme key in index.html
echo "4️⃣ Checking theme localStorage key..."
grep -q "inkwell:theme" index.html && echo "✅ Correct theme key (inkwell:theme)" || echo "❌ Wrong theme key"
echo ""

# Check for /brand/ references (should be /assets/brand/)
echo "5️⃣ Checking for incorrect /brand/ paths..."
BRAND_REFS=$(grep -r 'src="/brand/' src/pages/*.tsx 2>/dev/null | wc -l)
if [ "$BRAND_REFS" -eq 0 ]; then
  echo "✅ No incorrect /brand/ references in pages"
else
  echo "❌ Found $BRAND_REFS incorrect /brand/ references"
fi
echo ""

# Check safeObserve usage
echo "6️⃣ Checking MutationObserver safety..."
[ -f src/utils/dom/safeObserver.ts ] && echo "✅ safeObserver utility exists" || echo "❌ safeObserver utility missing"
grep -q "safeObserve" src/tour/targets.ts && echo "✅ safeObserve used in tour/targets.ts" || echo "❌ safeObserve not used in tour/targets.ts"
echo ""

echo "✨ Verification complete!"
