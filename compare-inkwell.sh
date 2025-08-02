#!/bin/bash

# Usage: bash compare-inkwell.sh <path_to_github_clone> <path_to_unzipped_local_code>
GITHUB_PATH="$1"
LOCAL_PATH="$2"

if [ -z "$GITHUB_PATH" ] || [ -z "$LOCAL_PATH" ]; then
  echo "Usage: bash compare-inkwell.sh <github_repo_path> <unzipped_code_path>"
  exit 1
fi

echo "🔍 Comparing directories..."
echo "GitHub repo: $GITHUB_PATH"
echo "Unzipped local: $LOCAL_PATH"
echo "-----------------------------------"

# Basic recursive diff
echo "🧾 Modified or differing files:"
diff -qr "$GITHUB_PATH" "$LOCAL_PATH" | tee /tmp/inkwell_diff.txt

echo
echo "⚠️  High-risk files that differ:"
grep -E "src/components/|tailwind.config|index.css|vite.config|main.tsx|App.tsx|package.json" /tmp/inkwell_diff.txt || echo "✅ No high-risk file changes detected."

echo
echo "📁 Files only in one of the directories:"
diff -rq "$GITHUB_PATH" "$LOCAL_PATH" | grep "Only in" || echo "✅ No orphaned files."

echo
echo "🟢 Done. You can also open both folders in VS Code with:"
echo "code --diff \"$GITHUB_PATH\" \"$LOCAL_PATH\""
