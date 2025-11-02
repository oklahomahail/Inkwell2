#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

# ---- Configure your dependency sets here ----
APP_PKGS=(
  "@dnd-kit/core" "@dnd-kit/modifiers" "@dnd-kit/sortable" "@dnd-kit/utilities"
  "@sentry/react" "@sparticuz/chromium" "@supabase/supabase-js" "@tanstack/react-virtual"
  "@tiptap/core" "@tiptap/extension-character-count" "@tiptap/extension-history"
  "@tiptap/extension-placeholder" "@tiptap/extension-typography" "@tiptap/pm"
  "@tiptap/react" "@tiptap/starter-kit" "clsx" "crypto-js" "date-fns" "file-saver" "jose"
  "jszip" "path-to-regexp" "puppeteer-core" "react" "react-dom" "react-router-dom"
  "recharts" "uuid" "workbox-window" "zod" "zustand"
)

DEV_TYPES_MAP=(
  "@types/crypto-js:crypto-js"
  "@types/file-saver:file-saver"
  "@types/history:history"
  "@types/react-router-dom:react-router-dom"
  "@types/recharts:recharts"
)

DEV_ONLY=(
  "@changesets/cli" "@playwright/test" "@tailwindcss/aspect-ratio" "@tailwindcss/forms"
  "@tailwindcss/typography" "@testing-library/jest-dom" "@testing-library/react"
  "@testing-library/user-event" "@types/node" "@types/react" "@types/react-dom"
  "@typescript-eslint/eslint-plugin" "@typescript-eslint/parser" "@vercel/node"
  "@vitejs/plugin-react" "@vitest/coverage-v8" "autoprefixer" "depcheck" "eslint"
  "eslint-import-resolver-typescript" "eslint-plugin-import" "eslint-plugin-react-hooks"
  "eslint-plugin-react-refresh" "eslint-plugin-unused-imports" "fake-indexeddb" "glob"
  "globals" "history" "husky" "jscodeshift" "jsdom" "knip" "lint-staged" "madge"
  "magic-string" "postcss" "prettier" "stylelint" "stylelint-config-standard" "tailwindcss"
  "tree-cli" "ts-node" "ts-prune" "tsx" "typescript" "vite" "vite-plugin-pwa"
  "vite-tsconfig-paths" "vitest"
)

echo "Scanning for usage in src/, test/, e2e/ ..."
UNUSED=()
USED=()

scan_pkg() {
  local pkg="$1"
  # Look for import/require or obvious usage strings
  if rg -n --no-heading -S "(from\\s+['\"]${pkg}['\"])|(^\\s*import\\s+.*${pkg})|(${pkg}\\/)" src test e2e 2>/dev/null | head -n1 >/dev/null; then
    USED+=("$pkg")
  else
    UNUSED+=("$pkg")
  fi
}

for p in "${APP_PKGS[@]}"; do scan_pkg "$p"; done

# Map @types/* to parents and drop types if parent is unused
TYPES_TO_REMOVE=()
for map in "${DEV_TYPES_MAP[@]}"; do
  types_pkg="${map%%:*}"
  parent="${map##*:}"
  if printf '%s\n' "${UNUSED[@]}" | rg -qx "$parent"; then
    # parent unused: safe to remove @types package if installed
    if jq -e --arg p "$types_pkg" '.devDependencies[$p]' package.json >/dev/null; then
      TYPES_TO_REMOVE+=("$types_pkg")
    fi
  fi
done

# Print summary
printf "\n=== USED (keep) ===\n";  printf "%s\n" "${USED[@]}" | sort
printf "\n=== UNUSED (candidates to remove) ===\n"; printf "%s\n" "${UNUSED[@]}" | sort

# Compose removal command
if ((${#UNUSED[@]})); then
  echo -e "\n# If this matches your intent, run:"
  echo "pnpm remove ${UNUSED[*]}"
fi

if ((${#TYPES_TO_REMOVE[@]})); then
  echo "pnpm remove -D ${TYPES_TO_REMOVE[*]}"
fi

echo -e "\nNote:"
echo "• If you plan to ship EPUB soon, keep jszip."
echo "• If Chapter DnD is active, keep @dnd-kit/*."
echo "• If TipTap editor lands in v0.8.x, keep @tiptap/*."
echo "• If PWA is enabled, keep workbox-window."
echo "• If charts are CSS-only, recharts can go."
