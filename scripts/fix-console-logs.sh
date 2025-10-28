#!/usr/bin/env bash
# Fix console.log/warn/error statements by converting them to devLog calls

set -e

echo "🔧 Converting console statements to devLog..."

# Function to add devLog import if not present
add_devlog_import() {
  local file="$1"
  if ! grep -q 'import.*devLog.*from.*@/utils/devLog' "$file" && \
     ! grep -q 'import.*devLog.*from.*src/utils/devLog' "$file"; then
    # Check if file has imports
    if grep -q '^import' "$file"; then
      # Add after first import block
      sed -i.bak '1,/^import/s/^\(import.*\)$/\1\nimport devLog from "@\/utils\/devLog";/' "$file" && rm "${file}.bak"
    else
      # Add at top
      echo -e "import devLog from '@/utils/devLog';\n$(cat "$file")" > "$file"
    fi
    echo "  ✓ Added devLog import to $file"
  fi
}

# Function to replace console statements
fix_console_in_file() {
  local file="$1"
  local changed=false
  
  # Check if file has console statements (excluding already-converted devLog files)
  if grep -q 'console\.\(log\|warn\|error\|debug\)' "$file"; then
    echo "  Processing: $file"
    
    # Add import first
    add_devlog_import "$file"
    
    # Replace console.log( → devLog.debug(
    if sed -i.bak 's/console\.log(/devLog.debug(/g' "$file"; then
      changed=true
    fi
    
    # Replace console.warn( → devLog.warn(
    if sed -i.bak 's/console\.warn(/devLog.warn(/g' "$file"; then
      changed=true
    fi
    
    # Replace console.error( → devLog.error(
    if sed -i.bak 's/console\.error(/devLog.error(/g' "$file"; then
      changed=true
    fi
    
    # Replace console.debug( → devLog.debug(
    if sed -i.bak 's/console\.debug(/devLog.debug(/g' "$file"; then
      changed=true
    fi
    
    # Clean up backup files
    rm -f "${file}.bak"
    
    if [ "$changed" = true ]; then
      echo "    ✓ Fixed console statements"
    fi
  fi
}

# Fix all service files
for file in src/services/*.ts; do
  [[ -f "$file" ]] && fix_console_in_file "$file"
done

# Fix all utils (except devLog.ts and devLogger.ts - already have overrides)
for file in src/utils/*.ts; do
  if [[ -f "$file" ]] && [[ "$file" != *"devLog"* ]]; then
    fix_console_in_file "$file"
  fi
done

# Fix RouteGuards
for file in src/components/RouteGuards/*.tsx; do
  [[ -f "$file" ]] && fix_console_in_file "$file"
done

# Fix context files
for file in src/context/*.tsx src/context/*.ts; do
  [[ -f "$file" ]] && fix_console_in_file "$file"
done

# Fix pages
for file in src/pages/*.tsx; do
  [[ -f "$file" ]] && fix_console_in_file "$file"
done

# Fix tour files
for file in src/tour/**/*.ts src/tour/**/*.tsx; do
  [[ -f "$file" ]] && fix_console_in_file "$file"
done

echo "✅ Console statement conversion complete!"
echo ""
echo "Next steps:"
echo "  1. Run: pnpm eslint 'src/**/*.{ts,tsx}' --fix"
echo "  2. Review changes and test"
echo "  3. Run: pnpm lint:ci"
