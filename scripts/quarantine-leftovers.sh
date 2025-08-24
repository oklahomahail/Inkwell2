#!/usr/bin/env bash
set -euo pipefail
DEST="archive/_quarantine_$(date +%Y%m%d)"
mkdir -p "$DEST"

move() { [ -e "$1" ] && git mv -f "$1" "$DEST" && echo "→ moved $1"; }

move src/components/TestComponents.tsx
move src/components/Writing/TipTapV3Test.tsx
move src/services/test-import.ts
move src/test.css
move src/components/Panels/patch.diff
move patch.diff
move patch.diff.save
move src/App.tsx.backup
move src/components/Layout.tsx.backup

# any *.backup anywhere
while IFS= read -r -d '' f; do move "$f"; done < <(git ls-files -z '*/*.backup' 'archive/*.backup' 2>/dev/null || true)

echo "Quarantined into $DEST"
