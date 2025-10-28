#!/bin/bash
# Lighthouse Performance Check Script
# Usage: ./scripts/lighthouse-check.sh

set -e

echo "🔦 Lighthouse Performance Check for Tour Improvements"
echo "=================================================="
echo ""

# Check if dev server is running
if ! curl -s http://localhost:5173 > /dev/null; then
    echo "❌ Dev server not running at http://localhost:5173"
    echo "Please start it with: pnpm dev"
    exit 1
fi

echo "✅ Dev server is running"
echo ""

# Check if lighthouse is installed
if ! command -v lighthouse &> /dev/null; then
    echo "⚠️  Lighthouse CLI not found. Installing..."
    npm install -g lighthouse
fi

echo "📊 Running Lighthouse audit..."
echo ""

# Create reports directory
mkdir -p reports/lighthouse

# Run Lighthouse with detailed output
lighthouse http://localhost:5173 \
  --output=html \
  --output=json \
  --output-path=reports/lighthouse/tour-improvements-$(date +%Y%m%d-%H%M%S) \
  --chrome-flags="--headless" \
  --only-categories=performance,accessibility,best-practices \
  --quiet

echo ""
echo "✅ Lighthouse audit complete!"
echo ""
echo "📁 Reports saved to: reports/lighthouse/"
echo ""

# Parse JSON results and display key metrics
LATEST_JSON=$(ls -t reports/lighthouse/*.json | head -1)

if command -v jq &> /dev/null; then
    echo "📈 Key Metrics:"
    echo "==============="
    
    PERFORMANCE=$(jq '.categories.performance.score * 100' "$LATEST_JSON")
    ACCESSIBILITY=$(jq '.categories.accessibility.score * 100' "$LATEST_JSON")
    BEST_PRACTICES=$(jq '.categories["best-practices"].score * 100' "$LATEST_JSON")
    FCP=$(jq '.audits["first-contentful-paint"].numericValue / 1000' "$LATEST_JSON")
    TTI=$(jq '.audits.interactive.numericValue / 1000' "$LATEST_JSON")
    TBT=$(jq '.audits["total-blocking-time"].numericValue' "$LATEST_JSON")
    
    echo "Performance:        ${PERFORMANCE}%"
    echo "Accessibility:      ${ACCESSIBILITY}%"
    echo "Best Practices:     ${BEST_PRACTICES}%"
    echo ""
    echo "First Contentful Paint: ${FCP}s"
    echo "Time to Interactive:    ${TTI}s"
    echo "Total Blocking Time:    ${TBT}ms"
    echo ""
    
    # Check for regressions
    if (( $(echo "$PERFORMANCE < 90" | bc -l) )); then
        echo "⚠️  WARNING: Performance score below 90%"
    fi
    
    if (( $(echo "$FCP > 1.0" | bc -l) )); then
        echo "⚠️  WARNING: First Contentful Paint > 1.0s"
    fi
    
    if (( $(echo "$TTI > 2.0" | bc -l) )); then
        echo "⚠️  WARNING: Time to Interactive > 2.0s"
    fi
    
    if (( $(echo "$TBT > 150" | bc -l) )); then
        echo "⚠️  WARNING: Total Blocking Time > 150ms"
    fi
else
    echo "💡 Tip: Install jq for detailed metrics parsing"
    echo "    brew install jq"
fi

echo ""
echo "🌐 To view the HTML report, open:"
echo "   $(ls -t reports/lighthouse/*.html | head -1)"
echo ""
echo "✅ Done!"
