#!/bin/bash
# Quick verification script for tour data attributes implementation
# Run this after starting the dev server

echo "🚀 Tour Data Attributes - Quick Verification"
echo "============================================="
echo ""

# Check if server is running
echo "1️⃣  Checking if dev server is running..."
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "   ✅ Dev server is running at http://localhost:3000"
else
    echo "   ❌ Dev server not running. Please run: pnpm dev"
    exit 1
fi

echo ""
echo "2️⃣  Checking for data-tour-id attributes in codebase..."

# Count occurrences of each tour ID
EXPORT_OPEN=$(grep -r "data-tour-id=\"export-open\"" src/ | wc -l | tr -d ' ')
EXPORT_TEMPLATE=$(grep -r "data-tour-id=\"export-template\"" src/ | wc -l | tr -d ' ')
EXPORT_RUN=$(grep -r "data-tour-id=\"export-run\"" src/ | wc -l | tr -d ' ')
MODEL_SELECTOR=$(grep -r "data-tour-id=\"model-selector\"" src/ | wc -l | tr -d ' ')
ASSISTANT_PANEL=$(grep -r "data-tour-id=\"assistant-panel\"" src/ | wc -l | tr -d ' ')
PRIVACY_HINT=$(grep -r "data-tour-id=\"privacy-hint\"" src/ | wc -l | tr -d ' ')

echo ""
echo "   Export Tour Attributes:"
echo "   • export-open:     $([[ $EXPORT_OPEN -gt 0 ]] && echo '✅' || echo '❌') ($EXPORT_OPEN found)"
echo "   • export-template: $([[ $EXPORT_TEMPLATE -gt 0 ]] && echo '✅' || echo '❌') ($EXPORT_TEMPLATE found)"
echo "   • export-run:      $([[ $EXPORT_RUN -gt 0 ]] && echo '✅' || echo '❌') ($EXPORT_RUN found)"

echo ""
echo "   AI Tools Tour Attributes:"
echo "   • model-selector:  $([[ $MODEL_SELECTOR -gt 0 ]] && echo '✅' || echo '❌') ($MODEL_SELECTOR found)"
echo "   • assistant-panel: $([[ $ASSISTANT_PANEL -gt 0 ]] && echo '✅' || echo '❌') ($ASSISTANT_PANEL found)"
echo "   • privacy-hint:    $([[ $PRIVACY_HINT -gt 0 ]] && echo '✅' || echo '❌') ($PRIVACY_HINT found)"

echo ""
echo "3️⃣  Checking for TourCompletionCard integration..."

TOUR_CARD_IMPORT=$(grep -r "import.*TourCompletionCard" src/components/Panels/AnalyticsPanel.tsx | wc -l | tr -d ' ')
TOUR_CARD_USAGE=$(grep -r "<TourCompletionCard" src/components/Panels/AnalyticsPanel.tsx | wc -l | tr -d ' ')

echo "   • Import:          $([[ $TOUR_CARD_IMPORT -gt 0 ]] && echo '✅' || echo '❌') ($TOUR_CARD_IMPORT found)"
echo "   • Usage:           $([[ $TOUR_CARD_USAGE -gt 0 ]] && echo '✅' || echo '❌') ($TOUR_CARD_USAGE found)"

echo ""
echo "============================================="
echo ""

# Calculate total
TOTAL=0
[[ $EXPORT_OPEN -gt 0 ]] && ((TOTAL++))
[[ $EXPORT_TEMPLATE -gt 0 ]] && ((TOTAL++))
[[ $EXPORT_RUN -gt 0 ]] && ((TOTAL++))
[[ $MODEL_SELECTOR -gt 0 ]] && ((TOTAL++))
[[ $ASSISTANT_PANEL -gt 0 ]] && ((TOTAL++))
[[ $PRIVACY_HINT -gt 0 ]] && ((TOTAL++))

echo "📊 Summary: $TOTAL/6 tour attributes implemented"

if [[ $TOTAL -eq 6 ]] && [[ $TOUR_CARD_IMPORT -gt 0 ]] && [[ $TOUR_CARD_USAGE -gt 0 ]]; then
    echo "✨ All implementation requirements met!"
    echo ""
    echo "🔍 Next Steps:"
    echo "   1. Open http://localhost:3000 in your browser"
    echo "   2. Open DevTools (F12 or Cmd+Option+I)"
    echo "   3. Run: scripts/verify-tour-attributes.js"
    echo "   4. Expected: 9/9 attributes present (100%)"
    echo ""
    echo "   Or manually verify:"
    echo "   • Navigate to Analytics → See TourCompletionCard"
    echo "   • Open Settings → Privacy → See privacy-hint"
    echo "   • Open Settings → AI → See model-selector"
    echo "   • Open Writing view → See assistant-panel"
    echo "   • Click Export button → See export modal with attributes"
else
    echo "⚠️  Some attributes or integrations are missing"
    echo "   Please review TOUR_DATA_ATTRIBUTES_IMPLEMENTATION.md"
fi

echo ""
