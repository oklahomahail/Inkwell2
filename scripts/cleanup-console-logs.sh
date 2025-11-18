#!/bin/bash
# Console Log Cleanup Script
# Replaces console.log with devLog in source files
# Safe to run multiple times (idempotent)

set -e

echo "🧹 Console Log Cleanup Script"
echo "=============================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counter
TOTAL_FILES=0
MODIFIED_FILES=0

# Find all TypeScript/TSX files (excluding test files, archived files, and node_modules)
echo "📁 Scanning for console.log statements..."
echo ""

# Use find to locate files, excluding specific directories
while IFS= read -r file; do
  # Skip if file doesn't exist (shouldn't happen, but safety check)
  if [ ! -f "$file" ]; then
    continue
  fi

  TOTAL_FILES=$((TOTAL_FILES + 1))

  # Check if file contains console.log (not console.warn or console.error)
  if grep -q "console\.log(" "$file"; then
    echo -e "${YELLOW}Found console.log in:${NC} $file"

    # Create backup
    cp "$file" "$file.bak"

    # Replace console.log with devLog
    # This preserves the rest of the line
    sed -i '' 's/console\.log(/devLog.log(/g' "$file"

    # Check if devLog is already imported
    if ! grep -q "import.*devLog.*from.*@/utils/devLog" "$file"; then
      # Add import at the top (after existing imports)
      # Find the last import line
      LAST_IMPORT_LINE=$(grep -n "^import" "$file" | tail -1 | cut -d: -f1)

      if [ -n "$LAST_IMPORT_LINE" ]; then
        # Add import after the last import
        sed -i '' "${LAST_IMPORT_LINE}a\\
import devLog from '@/utils/devLog';
" "$file"
        echo -e "  ${GREEN}✓${NC} Added devLog import"
      else
        # No imports found, add at the top
        sed -i '' "1i\\
import devLog from '@/utils/devLog';\\

" "$file"
        echo -e "  ${GREEN}✓${NC} Added devLog import (top of file)"
      fi
    fi

    MODIFIED_FILES=$((MODIFIED_FILES + 1))
    echo -e "  ${GREEN}✓${NC} Replaced console.log with devLog"
    echo ""
  fi
done < <(find src -type f \( -name "*.ts" -o -name "*.tsx" \) \
  ! -path "*/node_modules/*" \
  ! -path "*/.archive-*/*" \
  ! -path "*/test/*" \
  ! -path "*/__tests__/*" \
  ! -path "*.test.ts" \
  ! -path "*.test.tsx" \
  ! -path "*.spec.ts" \
  ! -path "*.spec.tsx")

echo ""
echo "=============================="
echo -e "${GREEN}✓${NC} Cleanup complete!"
echo ""
echo "Files scanned:   $TOTAL_FILES"
echo "Files modified:  $MODIFIED_FILES"
echo ""

if [ $MODIFIED_FILES -gt 0 ]; then
  echo -e "${YELLOW}⚠️  Backup files created:${NC} *.bak"
  echo "   Review changes, then remove backups with: find src -name '*.bak' -delete"
  echo ""
  echo "Next steps:"
  echo "  1. Review the changes: git diff src/"
  echo "  2. Run tests: pnpm test"
  echo "  3. Run type check: pnpm typecheck"
  echo "  4. If all good, commit: git add src/ && git commit -m 'refactor: replace console.log with devLog'"
  echo "  5. Clean up backups: find src -name '*.bak' -delete"
else
  echo -e "${GREEN}No console.log statements found!${NC}"
fi

echo ""
