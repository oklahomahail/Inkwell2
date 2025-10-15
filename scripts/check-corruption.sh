#!/bin/bash
# Corruption Detection Script
# Detects files that are "pancaked" (too few lines or extremely long lines)

set -e

EXTS='ts|tsx|js|jsx|json|css|scss|md|html'
MAX_LINE_LENGTH=3000
MIN_LINES=2
CORRUPTION_THRESHOLD=10  # Max percentage of files that can be corrupted

echo "🔍 Checking for file corruption..."

# Find all relevant files
TOTAL_FILES=0
CORRUPTED_FILES=0

while IFS= read -r file; do
    if [[ ! "$file" =~ (node_modules|\.next|dist|build|\.vercel|\.turbo|\.cache|coverage|\.vite|\.parcel-cache|\.pnpm-store|\.git|test/run.*\.ts) ]]; then
        ((TOTAL_FILES++))
        
        LINES=$(awk 'END{print NR}' "$file")
        
        # Check for too few lines (pancaked files)
        if [ "$LINES" -le "$MIN_LINES" ] && [ -s "$file" ]; then
            # Check if it's a legitimate small file
            if [[ "$file" =~ /index\.(ts|tsx|js)$ ]] || [[ "$file" =~ \.config\.(ts|js)$ ]] || [[ "$file" =~ \.setup\.(ts|js)$ ]] || [[ "$file" =~ \.css$ && "$LINES" -le 2 ]]; then
                continue  # Skip legitimate small files and CSS templates
            fi
            echo "❌ CORRUPTED (few lines): $file ($LINES lines)"
            ((CORRUPTED_FILES++))
            continue
        fi
        
        # Check for extremely long lines
        if awk -v max="$MAX_LINE_LENGTH" 'length($0) > max { exit 1 }' "$file"; then
            : # File is OK
        else
            echo "❌ CORRUPTED (long line): $file"
            ((CORRUPTED_FILES++))
        fi
    fi
done < <(find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.json" -o -name "*.css" -o -name "*.scss" -o -name "*.md" -o -name "*.html" \))

# Calculate corruption percentage
if [ "$TOTAL_FILES" -gt 0 ]; then
    CORRUPTION_PERCENT=$((CORRUPTED_FILES * 100 / TOTAL_FILES))
else
    CORRUPTION_PERCENT=0
fi

echo ""
echo "📊 CORRUPTION SUMMARY:"
echo "   Total files checked: $TOTAL_FILES"
echo "   Corrupted files: $CORRUPTED_FILES"
echo "   Corruption rate: $CORRUPTION_PERCENT%"

if [ "$CORRUPTED_FILES" -eq 0 ]; then
    echo "✅ No corruption detected!"
    exit 0
elif [ "$CORRUPTION_PERCENT" -le "$CORRUPTION_THRESHOLD" ]; then
    echo "⚠️  Low corruption detected ($CORRUPTION_PERCENT% <= $CORRUPTION_THRESHOLD%)"
    exit 0
else
    echo "🚨 HIGH CORRUPTION DETECTED ($CORRUPTION_PERCENT% > $CORRUPTION_THRESHOLD%)"
    echo "   This indicates widespread file corruption that needs immediate attention."
    exit 1
fi