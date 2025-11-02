#!/usr/bin/env bash
set -euo pipefail

# Usage: npm run audit [--quick] [--ci]
# Produces .audit/* artifacts and docs/release/ship-readiness-latest.md

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
AUDIT_DIR="${ROOT_DIR}/.audit"
DOCS_DIR="${ROOT_DIR}/docs/release"
mkdir -p "${AUDIT_DIR}" "${DOCS_DIR}"

IS_CI=false
QUICK=false
for arg in "$@"; do
  case "$arg" in
    --ci) IS_CI=true ;;
    --quick) QUICK=true ;;
  esac
 done

echo "Running repository audit..."
echo "Output folder: ${AUDIT_DIR}"

# A. Placeholder and stub sweeps
echo "Scanning for TODOs and stubs..."
rg -n --no-heading -S 'TODO|FIXME|XXX|TBD|HACK|WIP|TEMP|PUNT|stub|placeholder|not implemented|unimplemented|@deprecated' \
  --glob '!**/*.spec.*' \
  "${ROOT_DIR}" > "${AUDIT_DIR}/todos.txt" || true

echo "Scanning for throw patterns..."
rg -n --no-heading -S 'throw new Error\\(|assert\\.fail\\(|//\\s*throw\\b|return\\s+null\\s*//\\s*stub' \
  "${ROOT_DIR}" > "${AUDIT_DIR}/throws.txt" || true

echo "Scanning for any and ts-ignore..."
rg -n --no-heading -S '@ts-ignore|: any\\b|satisfies\\s+any\\b' \
  "${ROOT_DIR}" > "${AUDIT_DIR}/types-softness.txt" || true

echo "Scanning for console usage outside tests..."
rg -n --no-heading -S '\\bconsole\\.(log|warn|error|debug)\\(' \
  --glob '!**/*.spec.*' "${ROOT_DIR}" > "${AUDIT_DIR}/console-usage.txt" || true

echo "Scanning for placeholder strings..."
rg -n --no-heading -S 'lorem ipsum|foo|bar|baz|mock data|coming soon' \
  "${ROOT_DIR}" > "${AUDIT_DIR}/placeholders.txt" || true

echo "Scanning feature flags..."
rg -n --no-heading -S 'VITE_\\w+|feature\\s*flag|flags?\\.\\w+' \
  "${ROOT_DIR}/src" | sort > "${AUDIT_DIR}/feature-flags.txt" || true

# B. Unused code and dependency audit
if [[ "${QUICK}" == "false" ]]; then
  echo "Running ts-prune..."
  npx -y ts-prune > "${AUDIT_DIR}/ts-prune.txt" || true

  echo "Running knip..."
  npx -y knip --strict > "${AUDIT_DIR}/knip.txt" || true

  echo "Running depcheck..."
  npx -y depcheck > "${AUDIT_DIR}/depcheck.txt" || true
else
  echo "Quick mode: skipping ts-prune, knip, depcheck"
  : > "${AUDIT_DIR}/ts-prune.txt"
  : > "${AUDIT_DIR}/knip.txt"
  : > "${AUDIT_DIR}/depcheck.txt"
fi

# C. Routes and tests
echo "Collecting declared routes..."
rg -n --no-heading -S '<Route\\s+path=' "${ROOT_DIR}/src" \
  > "${AUDIT_DIR}/routes.txt" || true

echo "Collecting routes used in tests..."
rg -n --no-heading -S '/dashboard/|/settings|/projects|/editor|/onboarding' \
  "${ROOT_DIR}/e2e" "${ROOT_DIR}/test" 2>/dev/null \
  > "${AUDIT_DIR}/route-tests.txt" || true

# D. Manifest and service worker sanity
echo "Checking manifest and PWA icons..."
rg -n --no-heading -S 'manifest|apple-touch-icon|favicon|icons' \
  "${ROOT_DIR}/public" "${ROOT_DIR}/index.html" \
  > "${AUDIT_DIR}/manifest-icons.txt" || true

echo "Checking service worker cache versioning..."
rg -n --no-heading -S 'CACHE_VERSION|CACHE_NAME|caches\\.keys' \
  "${ROOT_DIR}/src" "${ROOT_DIR}/public" "${ROOT_DIR}"'/sw*' "${ROOT_DIR}"'/service-worker*' 2>/dev/null \
  > "${AUDIT_DIR}/service-worker.txt" || true

# E. Counts
count_file() { [[ -f "$1" ]] && wc -l < "$1" | tr -d ' ' || echo 0; }

COUNT_TODOS=$(count_file "${AUDIT_DIR}/todos.txt")
COUNT_THROWS=$(count_file "${AUDIT_DIR}/throws.txt")
COUNT_TYPES_SOFT=$(count_file "${AUDIT_DIR}/types-softness.txt")
COUNT_CONSOLE=$(count_file "${AUDIT_DIR}/console-usage.txt")
COUNT_PLACEHOLDERS=$(count_file "${AUDIT_DIR}/placeholders.txt")
COUNT_FLAGS=$(count_file "${AUDIT_DIR}/feature-flags.txt")
COUNT_TSPRUNE=$(grep -c . "${AUDIT_DIR}/ts-prune.txt" 2>/dev/null || echo 0)
COUNT_KNIP=$(grep -c . "${AUDIT_DIR}/knip.txt" 2>/dev/null || echo 0)
COUNT_DEPCHECK=$(grep -c . "${AUDIT_DIR}/depcheck.txt" 2>/dev/null || echo 0)
COUNT_ROUTES=$(count_file "${AUDIT_DIR}/routes.txt")
COUNT_ROUTE_TESTS=$(count_file "${AUDIT_DIR}/route-tests.txt")

# F. Generate Ship Readiness Report stub
REPORT="${DOCS_DIR}/ship-readiness-latest.md"
cat > "${REPORT}" <<EOF
# Ship Readiness

Summary
Status: to fill in
Primary flow: Project to Write Chapter to Autosave to Export

Blockers
(identify from .audit findings)

Paper Cuts
(list high impact polish tasks)

Technical Debt
(reference ts-prune, knip, types-softness)

Deletes
(dead code found by ts-prune or knip)

Routes and Tests
Routes defined: ${COUNT_ROUTES}
Routes referenced in tests: ${COUNT_ROUTE_TESTS}
See .audit/routes.txt and .audit/route-tests.txt

Types and Lints
any or ts-ignore occurrences: $((${COUNT_TYPES_SOFT:-0}))
Console usage outside tests: ${COUNT_CONSOLE}
Deprecated or TODO-like tags: ${COUNT_TODOS}
Throw patterns and stubs: ${COUNT_THROWS}

Unused and Dependencies
ts-prune lines: ${COUNT_TSPRUNE}
knip lines: ${COUNT_KNIP}
depcheck lines: ${COUNT_DEPCHECK}

Assets and PWA
Manifest and icons review: see .audit/manifest-icons.txt
Service worker cache versioning: see .audit/service-worker.txt

Can Ship Checklist
[ ] Happy path E2E: create project, write, autosave, export
[ ] No console errors in production build
[ ] Offline write to sync verified
[ ] Docs updated: Getting Started, Exports, Autosave

EOF

echo "Audit complete."
echo "Artifacts:"
echo "  ${AUDIT_DIR}/"
ls -1 "${AUDIT_DIR}" || true
echo "Report:"
echo "  ${REPORT}"

if [[ "${IS_CI}" == "true" ]]; then
  # Exit nonzero only on clear ship blockers tags to fail CI early
  bash "${ROOT_DIR}/scripts/ci/check-ship-blockers.sh" || exit $?
fi
