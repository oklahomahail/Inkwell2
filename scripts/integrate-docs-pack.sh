#!/usr/bin/env bash
set -euo pipefail

# Helper script to integrate documentation from the downloaded pack
# Usage:
#   ./scripts/integrate-docs-pack.sh /path/to/inkwell-docs-clean
#   # or rely on default below (note the space in "Inkwell md")

DOCS_PACK_PATH="${1:-$HOME/Downloads/Inkwell md/inkwell-docs-clean}"

if [ ! -d ".git" ]; then
  echo "❌ Error: run this from the repository root ('.git' not found)."
  exit 1
fi

if [ ! -d "$DOCS_PACK_PATH" ]; then
  echo "❌ Error: Documentation pack not found at: $DOCS_PACK_PATH"
  echo ""
  echo "Usage: $0 [path-to-inkwell-docs-clean]"
  echo "Example: $0 \"$HOME/Downloads/Inkwell md/inkwell-docs-clean\""
  exit 1
fi

echo "📦 Integrating documentation pack from: $DOCS_PACK_PATH"
echo ""

timestamp="$(date +%Y%m%d-%H%M%S)"

# Ensure targets exist
mkdir -p docs scripts

# Backup and replace README
if [ -f README.md ]; then
  echo "  → Backing up current README.md to README.md.backup.$timestamp"
  cp "README.md" "README.md.backup.$timestamp"
fi

echo "  → Copying new README.md"
cp "$DOCS_PACK_PATH/README.md" "README.md"

# Copy docs/ (use rsync for safety: handles spaces, hidden files, perms)
if [ -d "$DOCS_PACK_PATH/docs" ]; then
  echo "  → Copying docs/ structure"
  rsync -a "$DOCS_PACK_PATH/docs/" "docs/"
else
  echo "⚠️  Warning: No docs/ folder found in pack"
fi

# Copy scripts
if [ -d "$DOCS_PACK_PATH/scripts" ]; then
  echo "  → Copying cleanup scripts"
  rsync -a "$DOCS_PACK_PATH/scripts/" "scripts/"
  chmod +x scripts/cleanup-docs-*.sh || true
fi

# Sanity check
if [ ! -f "docs/README.md" ]; then
  echo "⚠️  Warning: docs/README.md not present after copy. Verify your pack path."
fi

echo ""
echo "✅ Documentation pack integrated!"
echo ""
echo "Next:"
echo "  1) chmod +x scripts/cleanup-docs-*.sh"
echo "  2) ./scripts/cleanup-docs-all.sh"
echo "  3) git status && git diff README.md"
