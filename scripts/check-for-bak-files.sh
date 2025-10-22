#!/bin/bash
# Script to detect .bak files and backup directories before commit
# Returns exit code 1 if any .bak files or backup directories are found

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔍 Checking for .bak files and backup directories..."

# Check for .bak files in staged files (if in git context)
if git rev-parse --git-dir > /dev/null 2>&1; then
    # Get staged files
    bak_files=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.bak$|\.bak[0-9]$|backup|backups/' || true)
else
    # If not in git context, check all files
    bak_files=$(find . -type f \( -name "*.bak" -o -name "*.bak[0-9]" \) -not -path "./node_modules/*" -not -path "./dist/*" || true)
    backup_dirs=$(find . -type d \( -name "backup" -o -name "backups" \) -not -path "./node_modules/*" -not -path "./dist/*" || true)
    
    if [ -n "$backup_dirs" ]; then
        bak_files="${bak_files}
${backup_dirs}"
    fi
fi

# Check if any .bak files or backup directories were found
if [ -z "$bak_files" ]; then
    echo -e "${GREEN}✅ No .bak files or backup directories found${NC}"
    exit 0
else
    echo -e "${RED}🚨 Found .bak files or backup directories:${NC}"
    echo -e "${RED}${bak_files}${NC}"
    echo ""
    echo -e "${YELLOW}💡 Please remove these files before committing:${NC}"
    echo "   git rm [filename]"
    echo ""
    echo -e "${RED}❌ Commit blocked due to presence of backup files${NC}"
    exit 1
fi
