#!/bin/bash

# Inkwell Cloud Sync Audit Runner
# Runs all POC tests and displays results

set -e

echo "╔════════════════════════════════════════════════╗"
echo "║   Inkwell Cloud Sync - Audit Runner           ║"
echo "║   Running all POC tests and benchmarks         ║"
echo "╚════════════════════════════════════════════════╝"
echo ""

# Check if tsx is available
if ! command -v tsx &> /dev/null; then
    echo "❌ tsx not found. Installing..."
    npm install -D tsx
fi

echo "📋 Starting POC Test Suite..."
echo ""

# Test 1: LWW Merge Engine
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 1/3: LWW Merge Engine POC"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
npx tsx docs/sync/poc-suite/01-lww-merge-poc.ts
echo ""

# Test 2: Hydration Benchmark
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 2/3: Hydration Benchmark POC"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
npx tsx docs/sync/poc-suite/02-hydration-benchmark-poc.ts
echo ""

# Test 3: Styled Textarea (browser-based, just show instructions)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 3/3: Styled Textarea Prototype"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Opening browser prototype..."
echo ""

# Try to open in browser (cross-platform)
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    open docs/sync/poc-suite/03-styled-textarea-poc.html
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    xdg-open docs/sync/poc-suite/03-styled-textarea-poc.html
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
    # Windows
    start docs/sync/poc-suite/03-styled-textarea-poc.html
else
    echo "⚠️  Please manually open: docs/sync/poc-suite/03-styled-textarea-poc.html"
fi

echo ""
echo "╔════════════════════════════════════════════════╗"
echo "║   All POC Tests Complete                       ║"
echo "╚════════════════════════════════════════════════╝"
echo ""
echo "📊 Next Steps:"
echo ""
echo "1. Review audit results:"
echo "   • docs/sync/AUDIT_SUMMARY.md (start here)"
echo "   • docs/sync/SUPABASE_AUDIT.md (infrastructure details)"
echo "   • docs/sync/IMPLEMENTATION_DECISION.md (roadmap)"
echo ""
echo "2. Make architectural decisions:"
echo "   • Styled textarea vs contenteditable"
echo "   • Sync queue persistence strategy"
echo "   • Realtime subscription scope"
echo "   • Migration strategy for existing users"
echo ""
echo "3. Begin Phase 1 implementation (schema migrations)"
echo ""
echo "✅ Recommendation: Always-on sync is feasible"
echo "⏱️  Estimated timeline: 9-12 days (4 phases)"
echo "🎯 Risk level: Medium (mitigated by phased approach)"
echo ""
