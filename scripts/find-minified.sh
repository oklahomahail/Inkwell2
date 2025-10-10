#!/usr/bin/env bash
set -euo pipefail
ROOT="${1:-src}"
THRESH="${2:-800}" # max allowed line length
echo "Scanning $ROOT for single-line/minified files (> $THRESH chars per line)..."
fd -e ts -e tsx "$ROOT" | while read -r f; do
  if awk -v T="$THRESH" 'length($0)>T{print FILENAME; exit}' "$f" >/dev/null; then
    echo "$f"
  fi
done | sort -u
