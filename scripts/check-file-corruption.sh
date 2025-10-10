#!/bin/bash

# File Corruption Detection Script
# Checks for minified/corrupted TypeScript and TSX files that shouldn't be minified
# Returns exit code 1 if corruption is detected, 0 otherwise

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔍 Checking for corrupted files..."

# Find TypeScript and TSX files that might be corrupted
# We look for files that have very few lines but are very long
corrupted_files=()

# Check staged files only if in git context, otherwise check all
if git rev-parse --git-dir > /dev/null 2>&1; then
    # In git repo - check staged files
    files_to_check=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|tsx)$' | head -100 || true)
    if [ -z "$files_to_check" ]; then
        echo "✅ No TypeScript files staged for commit"
        exit 0
    fi
else
    # Not in git repo - check all files in src
    files_to_check=$(find src -name "*.ts" -o -name "*.tsx" 2>/dev/null | head -100 || true)
fi

if [ -z "$files_to_check" ]; then
    echo "✅ No TypeScript files to check"
    exit 0
fi

echo "📁 Checking $(echo "$files_to_check" | wc -l) files..."

for file in $files_to_check; do
    if [ ! -f "$file" ]; then
        continue
    fi
    
    # Skip test files and generated files
    if [[ "$file" =~ \.(test|spec)\.tsx?$ ]] || [[ "$file" =~ /generated/ ]] || [[ "$file" =~ \.d\.ts$ ]]; then
        continue
    fi
    
    # Get file stats
    line_count=$(wc -l < "$file" 2>/dev/null || echo "0")
    
    # Skip empty files
    if [ "$line_count" -eq 0 ]; then
        continue
    fi
    
    # Check if file has suspiciously few lines but long content
    if [ "$line_count" -le 5 ]; then
        # Check if any line is unusually long (likely minified)
        max_line_length=$(awk 'length > max_length { max_length = length } END { print max_length+0 }' "$file" 2>/dev/null || echo "0")
        
        if [ "$max_line_length" -gt 500 ]; then
            # This looks like a corrupted/minified file
            corrupted_files+=("$file")
            echo -e "${RED}❌ CORRUPTED: $file (${line_count} lines, max line: ${max_line_length} chars)${NC}"
        fi
    fi
    
    # Also check for files that are completely empty but should have content
    if [ "$line_count" -eq 0 ] && [ -s "$file" ]; then
        corrupted_files+=("$file")
        echo -e "${RED}❌ EMPTY: $file (0 lines but non-zero size)${NC}"
    fi
done

# Report results
if [ ${#corrupted_files[@]} -eq 0 ]; then
    echo -e "${GREEN}✅ No file corruption detected${NC}"
    exit 0
else
    echo -e "${RED}🚨 CORRUPTION DETECTED in ${#corrupted_files[@]} file(s):${NC}"
    for file in "${corrupted_files[@]}"; do
        echo -e "${RED}  - $file${NC}"
    done
    echo ""
    echo -e "${YELLOW}💡 To fix corrupted files, run:${NC}"
    echo "   git checkout HEAD -- <corrupted-file>"
    echo ""
    echo -e "${YELLOW}Or to restore all corrupted files from origin/main:${NC}"
    for file in "${corrupted_files[@]}"; do
        echo "   git checkout origin/main -- $file"
    done
    echo ""
    echo -e "${RED}❌ Commit blocked due to file corruption${NC}"
    exit 1
fi