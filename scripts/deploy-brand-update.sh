#!/bin/bash
# Deploy Brand Update Script
# Ensures brand assets are properly cached and deployed

set -e

echo "🎨 Deploying Inkwell Brand Update..."

# 1. Clean build
echo "📦 Building production bundle..."
pnpm run build

# 2. Verify brand assets exist
echo "🔍 Verifying brand assets..."
if [ ! -f "public/favicon.svg" ]; then
  echo "❌ Error: favicon.svg not found!"
  exit 1
fi

if [ ! -f "public/brand/inkwell-logo-primary.svg" ]; then
  echo "❌ Error: inkwell-logo-primary.svg not found!"
  exit 1
fi

if [ ! -f "public/brand/inkwell-logo-alt.svg" ]; then
  echo "❌ Error: inkwell-logo-alt.svg not found!"
  exit 1
fi

echo "✅ All brand assets verified"

# 3. Check file sizes
echo "📊 Brand asset sizes:"
ls -lh public/favicon.svg public/brand/inkwell-logo-*.svg

# 4. Deploy to Vercel (production)
echo "🚀 Deploying to Vercel production..."
vercel deploy --prod

echo ""
echo "✨ Deployment complete!"
echo ""
echo "📋 Post-deployment checklist:"
echo "  1. Hard refresh browser (Cmd+Shift+R / Ctrl+Shift+F5)"
echo "  2. Clear browser cache if needed"
echo "  3. Check favicon in browser tab"
echo "  4. Verify sidebar logo (collapsed & expanded)"
echo "  5. Test dark mode logo switching on dashboard"
echo "  6. Check mobile PWA installation icon"
echo ""
echo "🔗 Production URL: https://inkwell.leadwithnexus.com"
