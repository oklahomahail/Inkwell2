#!/usr/bin/env bash
set -euo pipefail

echo "🚀 Workflow Improvements Rollout Script"
echo "========================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Create feature branch
echo -e "${YELLOW}Step 1: Creating feature branch...${NC}"
git checkout -b chore/workflow-improvements-pack
echo -e "${GREEN}✓ Branch created${NC}"
echo ""

# Step 2: Install dependencies
echo -e "${YELLOW}Step 2: Installing dependencies...${NC}"
pnpm install
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

# Step 3: Make scripts executable
echo -e "${YELLOW}Step 3: Making scripts executable...${NC}"
chmod +x .husky/pre-commit || true
chmod +x scripts/replace-console-logs.mjs || true
chmod +x scripts/check-file-corruption.sh 2>/dev/null || true
chmod +x scripts/check-for-bak-files.sh 2>/dev/null || true
echo -e "${GREEN}✓ Scripts are executable${NC}"
echo ""

# Step 4: Sweep console.logs
echo -e "${YELLOW}Step 4: Replacing console.log with devLog.debug...${NC}"
pnpm fix:logs:regex
echo -e "${GREEN}✓ Console.log replacement complete${NC}"
echo ""

# Step 5: Fix unused variables
echo -e "${YELLOW}Step 5: Fixing unused variables...${NC}"
pnpm eslint "src/**/*.{ts,tsx}" -f json -o eslint-report.json || true
node scripts/prefix-unused-from-eslint.mjs eslint-report.json || echo "No unused vars or script not found"
echo -e "${GREEN}✓ Unused variables processed${NC}"
echo ""

# Step 6: Auto-fix ESLint issues
echo -e "${YELLOW}Step 6: Running ESLint auto-fix...${NC}"
pnpm eslint "src/**/*.{ts,tsx,js,jsx}" --fix
echo -e "${GREEN}✓ ESLint auto-fix complete${NC}"
echo ""

# Step 7: Verify local CI
echo -e "${YELLOW}Step 7: Running local CI verification...${NC}"
echo ""

echo "  → Typechecking..."
pnpm typecheck
echo -e "${GREEN}  ✓ Typecheck passed${NC}"

echo "  → Linting with zero warnings..."
pnpm lint:ci
echo -e "${GREEN}  ✓ Lint passed${NC}"

echo "  → Running tests..."
pnpm test:ci
echo -e "${GREEN}  ✓ Tests passed${NC}"

echo "  → Building..."
pnpm build
echo -e "${GREEN}  ✓ Build successful${NC}"
echo ""

# Step 8: Git add and status
echo -e "${YELLOW}Step 8: Staging changes...${NC}"
git add -A
echo ""
echo "Changes to be committed:"
git status --short
echo ""

# Step 9: Commit
echo -e "${YELLOW}Step 9: Creating commit...${NC}"
git commit -m "chore: workflow improvements (regex log replacer, husky hooks, CI playbook)"
echo -e "${GREEN}✓ Commit created${NC}"
echo ""

# Step 10: Push
echo -e "${YELLOW}Step 10: Pushing to remote...${NC}"
git push -u origin chore/workflow-improvements-pack
echo -e "${GREEN}✓ Pushed to origin${NC}"
echo ""

echo "============================================"
echo -e "${GREEN}🎉 Rollout complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Open a PR at: https://github.com/$(git remote get-url origin | sed 's/.*github.com[:/]\(.*\)\.git/\1/')/compare/chore/workflow-improvements-pack"
echo "2. Use the PR template from docs/engineering/PR_TEMPLATE.md"
echo "3. After merge, configure branch protection in GitHub UI"
echo ""
