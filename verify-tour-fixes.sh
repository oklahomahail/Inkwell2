#!/bin/bash
# Verification script for tour and dark mode fixes
# Run this after deployment to verify fixes are working

echo "🔍 Tour & Dark Mode Fix Verification"
echo "====================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
  echo "❌ Error: Must run from project root"
  exit 1
fi

echo "1️⃣ Checking for MutationObserver safety..."
grep -r "safeObserve" src/tour/targets.ts > /dev/null && echo "✅ Tour targets using safeObserve" || echo "❌ Missing safeObserve in targets"
grep -r "safeObserve" src/components/Onboarding/hooks/useSpotlightAutostart.ts > /dev/null && echo "✅ Autostart using safeObserve" || echo "❌ Missing safeObserve in autostart"

echo ""
echo "2️⃣ Checking portal safety..."
grep -r "document.body" src/tour/ui/portal.tsx > /dev/null && echo "✅ Portal checks for document.body" || echo "⚠️ Portal may not check for body"

echo ""
echo "3️⃣ Checking theme initialization..."
grep -r "classList.toggle('dark'" src/main.tsx > /dev/null && echo "✅ main.tsx using toggle approach" || echo "❌ main.tsx not using toggle"
grep -r "classList.add('dark')" index.html > /dev/null && echo "✅ index.html conditionally adds dark class" || echo "❌ index.html not conditionally adding dark"

echo ""
echo "4️⃣ Checking boot probe timing..."
grep -r "DOMContentLoaded" index.html > /dev/null && echo "✅ Boot probe waits for DOMContentLoaded" || echo "❌ Boot probe may run too early"

echo ""
echo "5️⃣ Running TypeScript check..."
npx tsc --noEmit 2>&1 | head -20

echo ""
echo "6️⃣ Building project..."
npm run build 2>&1 | tail -10

echo ""
echo "✨ Verification complete!"
echo ""
echo "Manual testing checklist:"
echo "  [ ] Open in incognito/private window"
echo "  [ ] Verify light mode is default (no dark mode flash)"
echo "  [ ] Check browser console for errors"
echo "  [ ] Verify tour loads without MutationObserver error"
echo "  [ ] Check that tour spotlight appears correctly"
echo "  [ ] Verify theme toggle works"
echo "  [ ] Test on slow network (DevTools throttling)"
