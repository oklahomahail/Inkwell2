#!/bin/bash
# Inkwell Test Audit Commands
# Quick commands for test auditing workflow

echo "🔍 Inkwell Test Audit Helper"
echo "=============================="

# Baseline coverage
echo "📊 Running baseline coverage..."
pnpm test:coverage --reporter=verbose 2>&1 | tee .audit/coverage-baseline.txt

# List all test files with line counts  
echo "📋 Test inventory:"
find src tests -name "*.test.*" -o -name "*.spec.*" | xargs wc -l | sort -n

# Run tests by category
echo "🧪 Running tests by category..."

echo "  → Unit tests (components):"
pnpm test:run --reporter=verbose src/components 2>&1 | grep -E "(✓|×|PASS|FAIL)"

echo "  → Service tests:"
pnpm test:run --reporter=verbose src/services 2>&1 | grep -E "(✓|×|PASS|FAIL)"

echo "  → Utility tests:" 
pnpm test:run --reporter=verbose src/utils 2>&1 | grep -E "(✓|×|PASS|FAIL)"

echo "  → E2E tests:"
pnpm test:run --reporter=verbose tests/ 2>&1 | grep -E "(✓|×|PASS|FAIL)"

echo "⚡ Performance measurement:"
echo "Run this to measure test duration:"
echo "time pnpm test:run --reporter=verbose"

echo ""
echo "🎯 Quick audit candidates to check:"
echo "- Tests with many CSS class assertions (expect().toHaveClass())"
echo "- Tests with querySelector() calls"  
echo "- Tests with artificial performance measurements"
echo "- Snapshot tests without behavior assertions"
echo "- Tests that break when styles change"

echo ""
echo "✅ Audit complete! Check .audit/tests-audit-report.md for details"