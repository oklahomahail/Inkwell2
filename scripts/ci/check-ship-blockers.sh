#!/usr/bin/env bash
set -euo pipefail

echo "Checking for ship-blocker tags..."
# Only these tags block shipping
PATTERN='TODO\[SHIP\]|FIXME\[SHIP\]|HACK\[SHIP\]'
if rg -n --no-heading -S "${PATTERN}" src/; then
  echo "Found ship-blocker tags. Remove or resolve before shipping."
  exit 1
else
  echo "No ship-blocker tags found."
fi
