#!/bin/bash
# CI check to prevent /assets/brand/ paths from being reintroduced in source code
# Run: ./scripts/check-asset-paths.sh

echo "🔍 Checking for forbidden /assets/brand/ paths in source code..."

# Count matches in source files only (exclude docs, scripts, config, etc)
MATCHES=$(find . \
  -type f \
  \( -name "*.tsx" -o -name "*.ts" -o -name "*.jsx" -o -name "*.js" \) \
  ! -path "./node_modules/*" \
  ! -path "./dist/*" \
  ! -path "./.git/*" \
  ! -path "./.github/*" \
  ! -path "./public/*" \
  -exec grep -l '/assets/brand/' {} \; 2>/dev/null | wc -l)

if [ "$MATCHES" -gt 0 ]; then
  echo ""
  echo "❌ ERROR: Found /assets/brand/ in source files:"
  find . \
    -type f \
    \( -name "*.tsx" -o -name "*.ts" -o -name "*.jsx" -o -name "*.js" \) \
    ! -path "./node_modules/*" \
    ! -path "./dist/*" \
    ! -path "./.git/*" \
    ! -path "./.github/*" \
    ! -path "./public/*" \
    -exec grep -n '/assets/brand/' {} + 2>/dev/null
  echo ""
  echo "These paths should use '/brand/' instead"
  exit 1
fi

echo "✅ No forbidden asset paths found in source code"
exit 0
