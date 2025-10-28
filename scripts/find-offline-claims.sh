#!/usr/bin/env bash
set -euo pipefail

# Find and report all instances of "offline-first" messaging
# Run this to identify places that need updating to "local-first" messaging

echo "Searching for 'offline-first' messaging to update..."
echo ""

echo "=== Exact match: 'offline-first' ==="
git grep -n "offline-first" || echo "  (none found)"
echo ""

echo "=== Exact match: 'offline first' ==="
git grep -n "offline first" || echo "  (none found)"
echo ""

echo "=== Context: 'offline' with 'first', 'only', or 'always' ==="
git grep -n "offline" | grep -i -E "(first|only|always)" || echo "  (none found)"
echo ""

echo "=== Suggested updates ==="
echo "Replace with one of:"
echo "  • 'Local-first writing app with optional cloud sync'"
echo "  • 'Works offline, syncs when you're online'"
echo "  • 'Your work saves on your device and syncs securely to the cloud when available'"
echo ""

echo "Files to check:"
echo "  • README.md"
echo "  • docs/**/*.md"
echo "  • Landing page components"
echo "  • About/Welcome content"
echo "  • Meta descriptions"
echo ""
