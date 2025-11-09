#!/bin/bash

# Documentation Maintenance Script
# Helps identify and archive stale documentation files
# Run this weekly or before major releases

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DAYS_STALE=5
DAYS_CRITICAL=2
ARCHIVE_DIR=".archive"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Documentation Maintenance Report${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "Generated: $(date)"
echo "Project: $PROJECT_ROOT"
echo ""

# Calculate timestamps
NOW=$(date +%s)
STALE_THRESHOLD=$((NOW - (DAYS_STALE * 86400)))
CRITICAL_THRESHOLD=$((NOW - (DAYS_CRITICAL * 86400)))

# Arrays to track files
declare -a STALE_FILES
declare -a CRITICAL_FILES
declare -a TEMP_FILES

echo -e "${BLUE}Scanning markdown files...${NC}"
echo ""

# Find all markdown files (excluding archives and node_modules)
while IFS= read -r file; do
    if [ -f "$file" ]; then
        # Get file modification time
        if [[ "$OSTYPE" == "darwin"* ]]; then
            MTIME=$(stat -f "%m" "$file")
        else
            MTIME=$(stat -c "%Y" "$file")
        fi

        FILENAME=$(basename "$file")

        # Check if it's a temporary/implementation file
        if [[ "$FILENAME" =~ ^(IMPLEMENTATION|COVERAGE|TEST_AUDIT|ONBOARDING_IMPROVEMENTS|CHANGELOG_v[0-9]) ]]; then
            TEMP_FILES+=("$file")
        fi

        # Check if critical files are stale
        if [[ "$FILENAME" =~ ^(README|ROADMAP|CONTRIBUTING|USER_GUIDE|CHANGELOG)\.md$ ]]; then
            if [ "$MTIME" -lt "$CRITICAL_THRESHOLD" ]; then
                CRITICAL_FILES+=("$file")
            fi
        fi

        # Check if regular files are stale
        if [ "$MTIME" -lt "$STALE_THRESHOLD" ]; then
            # Skip if already in critical or temp
            if [[ ! " ${CRITICAL_FILES[@]} " =~ " ${file} " ]] && [[ ! " ${TEMP_FILES[@]} " =~ " ${file} " ]]; then
                STALE_FILES+=("$file")
            fi
        fi
    fi
done < <(find "$PROJECT_ROOT" -name "*.md" -type f -not -path "*/node_modules/*" -not -path "*/.git/*" -not -path "*/$ARCHIVE_DIR/*" -not -path "*/dist/*")

# Report findings
echo -e "${RED}🔴 CRITICAL: Outdated Key Documentation (>${DAYS_CRITICAL} days)${NC}"
if [ ${#CRITICAL_FILES[@]} -eq 0 ]; then
    echo -e "${GREEN}✓ All critical docs are current!${NC}"
else
    for file in "${CRITICAL_FILES[@]}"; do
        REL_PATH="${file#$PROJECT_ROOT/}"
        if [[ "$OSTYPE" == "darwin"* ]]; then
            DAYS_OLD=$(( (NOW - $(stat -f "%m" "$file")) / 86400 ))
        else
            DAYS_OLD=$(( (NOW - $(stat -c "%Y" "$file")) / 86400 ))
        fi
        echo "  - $REL_PATH ($DAYS_OLD days old)"
    done
fi
echo ""

echo -e "${YELLOW}🟡 TEMPORARY: Implementation/Completion Summaries${NC}"
if [ ${#TEMP_FILES[@]} -eq 0 ]; then
    echo -e "${GREEN}✓ No temporary files found!${NC}"
else
    echo "  Consider archiving these files:"
    for file in "${TEMP_FILES[@]}"; do
        REL_PATH="${file#$PROJECT_ROOT/}"
        if [[ "$OSTYPE" == "darwin"* ]]; then
            MTIME=$(stat -f "%m" "$file")
        else
            MTIME=$(stat -c "%Y" "$file")
        fi
        DATE_STR=$(date -r "$MTIME" +%Y-%m-%d)
        echo "  - $REL_PATH (from $DATE_STR)"
    done
fi
echo ""

echo -e "${YELLOW}🟠 STALE: Documentation Not Updated Recently (>${DAYS_STALE} days)${NC}"
if [ ${#STALE_FILES[@]} -eq 0 ]; then
    echo -e "${GREEN}✓ All docs are current!${NC}"
else
    echo "  Review these files for relevance:"
    for file in "${STALE_FILES[@]}"; do
        REL_PATH="${file#$PROJECT_ROOT/}"
        if [[ "$OSTYPE" == "darwin"* ]]; then
            DAYS_OLD=$(( (NOW - $(stat -f "%m" "$file")) / 86400 ))
        else
            DAYS_OLD=$(( (NOW - $(stat -c "%Y" "$file")) / 86400 ))
        fi
        echo "  - $REL_PATH ($DAYS_OLD days old)"
    done
fi
echo ""

# Summary statistics
TOTAL_MD=$(find "$PROJECT_ROOT" -name "*.md" -type f -not -path "*/node_modules/*" -not -path "*/.git/*" -not -path "*/$ARCHIVE_DIR/*" -not -path "*/dist/*" | wc -l | tr -d ' ')
TOTAL_ISSUES=$((${#CRITICAL_FILES[@]} + ${#TEMP_FILES[@]} + ${#STALE_FILES[@]}))

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo "Total markdown files: $TOTAL_MD"
echo "Critical files needing update: ${#CRITICAL_FILES[@]}"
echo "Temporary files to archive: ${#TEMP_FILES[@]}"
echo "Stale files to review: ${#STALE_FILES[@]}"
echo ""

if [ "$TOTAL_ISSUES" -eq 0 ]; then
    echo -e "${GREEN}✓ Documentation health: EXCELLENT${NC}"
    exit 0
elif [ "$TOTAL_ISSUES" -le 5 ]; then
    echo -e "${YELLOW}⚠ Documentation health: GOOD (minor cleanup needed)${NC}"
    exit 0
elif [ "$TOTAL_ISSUES" -le 15 ]; then
    echo -e "${YELLOW}⚠ Documentation health: FAIR (cleanup recommended)${NC}"
    exit 1
else
    echo -e "${RED}⚠ Documentation health: NEEDS ATTENTION (cleanup required)${NC}"
    exit 1
fi
