#!/bin/bash

# React Hooks Hardening Verification Script
# Run this to verify all hardening measures are in place

set -e

echo "🔍 Verifying React Hooks Hardening Implementation..."
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

success() {
    echo -e "${GREEN}✓${NC} $1"
}

warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

error() {
    echo -e "${RED}✗${NC} $1"
}

# Check 1: lint:hooks script exists
echo "Checking pnpm scripts..."
if grep -q '"lint:hooks"' package.json; then
    success "lint:hooks script defined"
else
    error "lint:hooks script not found in package.json"
    exit 1
fi

# Check 2: lint-staged includes hooks config
echo "Checking lint-staged configuration..."
if grep -q "eslint.config.hooks.js" package.json; then
    success "lint-staged includes hooks linting"
else
    error "lint-staged missing hooks config"
    exit 1
fi

# Check 3: Husky is installed
echo "Checking Husky installation..."
if [ -d ".husky" ]; then
    success "Husky directory exists"
else
    error "Husky not installed"
    exit 1
fi

# Check 4: Pre-commit hook exists
if [ -f ".husky/pre-commit" ]; then
    success "Pre-commit hook exists"
else
    error "Pre-commit hook missing"
    exit 1
fi

# Check 5: PR template has hooks checkbox
echo "Checking PR template..."
if grep -q "lint:hooks" .github/pull_request_template.md; then
    success "PR template includes hooks checkbox"
else
    error "PR template missing hooks checkbox"
    exit 1
fi

# Check 6: README has hooks documentation
echo "Checking README documentation..."
if grep -q "HOOKS_QUICK_REF.md" README.md; then
    success "README links to hooks documentation"
else
    warning "README missing hooks docs link (recommended)"
fi

# Check 7: Documentation files exist
echo "Checking documentation files..."
if [ -f "HOOKS_QUICK_REF.md" ]; then
    success "HOOKS_QUICK_REF.md exists"
else
    error "HOOKS_QUICK_REF.md missing"
    exit 1
fi

if [ -f "REACT_HOOKS_FIX_SUMMARY.md" ]; then
    success "REACT_HOOKS_FIX_SUMMARY.md exists"
else
    error "REACT_HOOKS_FIX_SUMMARY.md missing"
    exit 1
fi

if [ -f "docs/dev/README.md" ]; then
    success "docs/dev/README.md exists"
else
    warning "docs/dev/README.md missing (recommended)"
fi

if [ -f "docs/dev/BRANCH_PROTECTION_SETUP.md" ]; then
    success "docs/dev/BRANCH_PROTECTION_SETUP.md exists"
else
    warning "docs/dev/BRANCH_PROTECTION_SETUP.md missing (recommended)"
fi

if [ -f "docs/dev/PERFORMANCE_VALIDATION.md" ]; then
    success "docs/dev/PERFORMANCE_VALIDATION.md exists"
else
    warning "docs/dev/PERFORMANCE_VALIDATION.md missing (recommended)"
fi

# Check 8: GitHub workflow exists
echo "Checking GitHub Actions workflow..."
if [ -f ".github/workflows/lint-react-hooks.yml" ]; then
    success "lint-react-hooks.yml workflow exists"
else
    error "lint-react-hooks.yml workflow missing"
    exit 1
fi

# Check 9: ESLint hooks config exists
echo "Checking ESLint configuration..."
if [ -f "eslint.config.hooks.js" ]; then
    success "eslint.config.hooks.js exists"
else
    error "eslint.config.hooks.js missing"
    exit 1
fi

# Check 10: Test the hooks linter
echo "Testing hooks linter execution..."
if pnpm lint:hooks --help > /dev/null 2>&1; then
    success "pnpm lint:hooks command works"
else
    error "pnpm lint:hooks command failed"
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ All hardening measures verified!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Next steps:"
echo "1. Set up branch protection (see docs/dev/BRANCH_PROTECTION_SETUP.md)"
echo "2. Test with a sample PR containing a hooks violation"
echo "3. Validate performance after memoization changes (see docs/dev/PERFORMANCE_VALIDATION.md)"
echo ""
