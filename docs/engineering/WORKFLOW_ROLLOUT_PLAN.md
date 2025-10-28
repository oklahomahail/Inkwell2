# Workflow Improvements Rollout Plan

**Status:** ✅ Ready for Implementation
**Date:** October 28, 2025
**Owner:** Engineering Team

---

## Overview

This document outlines the step-by-step rollout plan for implementing zero-warning, hardened development workflows in the Inkwell project. The improvements include automated console.log migration, pre-commit hooks, CI gates, and comprehensive documentation.

---

## Quick Start

Run the automated rollout script:

```bash
chmod +x scripts/rollout-workflow-improvements.sh
./scripts/rollout-workflow-improvements.sh
```

Or follow the manual steps below for more control.

---

## Phase 1: Pre-Flight Checks ✈️

**Goal:** Verify prerequisites and baseline state.

### 1.1 Verify Installation

```bash
# Check Node.js version (should be 22.x)
node --version

# Check pnpm version (should be >=9)
pnpm --version

# Verify pnpm installation
pnpm install --frozen-lockfile
```

### 1.2 Baseline Audit

```bash
# Run existing checks
pnpm typecheck
pnpm lint
pnpm test

# Check for console.log usage
git ls-files 'src/**' | xargs grep -n "console\.log(" || echo "✅ No console.log found"

# Verify scripts exist
ls -la scripts/replace-console-logs.mjs
ls -la scripts/prefix-unused-from-eslint.mjs
ls -la scripts/check-file-corruption.sh
ls -la scripts/check-for-bak-files.sh
```

**Expected:** Some console.log calls may exist, lint/test should pass.

---

## Phase 2: Console.log Migration 🔄

**Goal:** Replace all `console.log` with `devLog.debug`.

### 2.1 Run Automated Replacement

```bash
# Dry run (preview changes)
DRY_RUN=true node scripts/replace-console-logs.mjs

# Actually apply changes
node scripts/replace-console-logs.mjs

# Or use the package.json script
pnpm fix:logs:regex
```

### 2.2 Verify Changes

```bash
# Check for remaining console.log
git ls-files 'src/**' | xargs grep -n "console\.log(" || echo "✅ All replaced"

# Ensure code still compiles
pnpm typecheck

# Run tests
pnpm test
```

### 2.3 Manual Review (IMPORTANT)

1. Review all changes in your Git diff
2. Check for any `console.warn`, `console.error`, `console.info` that should stay
3. Verify no breaking changes in complex logging scenarios
4. Test app locally: `pnpm dev`

### 2.4 Commit Migration

```bash
git add -A
git commit -m "refactor: migrate console.log to devLog.debug

- Applied automated regex replacement
- Preserved console.warn/error for actual errors
- Verified all tests pass
"
```

---

## Phase 3: Husky & Pre-Commit Hooks 🪝

**Goal:** Enable pre-commit quality gates.

### 3.1 Verify Husky Setup

```bash
# Husky should already be installed (check package.json)
cat package.json | grep -A2 '"husky"'

# Verify pre-commit hook exists
cat .husky/pre-commit

# Make sure it's executable
chmod +x .husky/pre-commit
```

### 3.2 Test Pre-Commit Hook

```bash
# Make a trivial change
echo "// test" >> src/utils/devLogger.ts

# Try to commit (should run lint-staged)
git add src/utils/devLogger.ts
git commit -m "test: verify pre-commit hook"

# If it runs ESLint, Prettier, and typecheck, it works!
# Revert the test change
git reset HEAD~1
git checkout -- src/utils/devLogger.ts
```

### 3.3 Verify Lint-Staged Config

```bash
# Check lint-staged config in package.json
cat package.json | grep -A15 '"lint-staged"'
```

**Expected output:**

```json
"lint-staged": {
  "*.{ts,tsx}": [
    "eslint --fix --max-warnings=0",
    "prettier --write",
    "bash -c 'tsc --noEmit'"
  ],
  "*.css": [
    "stylelint --fix",
    "prettier --write"
  ],
  "*.{json,md}": [
    "prettier --write"
  ]
}
```

---

## Phase 4: CI Pipeline Hardening 🔒

**Goal:** Add CI gates for zero-warning enforcement.

### 4.1 Verify CI Workflow

```bash
# Check for console.log grep guard
grep -A10 "Grep for console.log" .github/workflows/ci.yml
```

**Expected:** Should see the grep check before lint step.

### 4.2 Test CI Locally

```bash
# Run the same checks CI will run
pnpm typecheck
pnpm lint:ci  # Note: --max-warnings=0
pnpm test

# Verify no console.log
git ls-files 'src/**' | xargs grep -n "console\.log(" && exit 1 || echo "✅ Pass"
```

### 4.3 Push and Verify

```bash
# Push to a feature branch
git checkout -b test/workflow-improvements
git push origin test/workflow-improvements

# Open PR and verify CI passes
```

---

## Phase 5: Documentation & Team Onboarding 📚

**Goal:** Update docs and communicate changes to team.

### 5.1 Review Engineering Playbook

```bash
# Open the playbook
open docs/engineering/linting-and-ci-playbook.md

# Or use your editor
code docs/engineering/linting-and-ci-playbook.md
```

**Verify sections:**

- ✅ Quick Reference with all commands
- ✅ Pre-commit hooks explained
- ✅ CI/CD pipeline documented
- ✅ Troubleshooting guide

### 5.2 Update README (if needed)

Add badges and quick links:

```markdown
<!-- In your README.md -->

## Development Workflow

[![CI](https://github.com/your-org/inkwell/actions/workflows/ci.yml/badge.svg)](https://github.com/your-org/inkwell/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![Code Style: Prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://prettier.io/)

See [Linting & CI Playbook](./docs/engineering/linting-and-ci-playbook.md) for complete workflow guide.

### Quick Commands

- `pnpm ci` - Run all CI checks locally
- `pnpm fix:auto` - Auto-fix linting, formatting, and console.log issues
- `pnpm dev` - Start development server
```

### 5.3 Team Communication

**Send this message to your team:**

---

> **🎉 New Workflow Improvements Deployed!**
>
> We've upgraded our development workflow with zero-warning enforcement:
>
> **Key Changes:**
>
> 1. ✅ Pre-commit hooks now auto-fix most issues
> 2. ✅ CI enforces zero warnings (no more `--max-warnings=100`)
> 3. ✅ `console.log` → `devLog.debug` migration complete
> 4. ✅ Comprehensive engineering playbook added
>
> **Action Required:**
>
> 1. Pull latest `main` branch
> 2. Run `pnpm install` to update hooks
> 3. Read the playbook: `docs/engineering/linting-and-ci-playbook.md`
> 4. Run `pnpm fix:auto` on your active branches
>
> **If you hit issues:**
>
> - Check the troubleshooting section in the playbook
> - Run `pnpm ci` to see what CI will run
> - Ask in #engineering-help
>
> Happy coding! 🚀

---

## Phase 6: GitHub Branch Protection 🛡️

**Goal:** Enforce CI checks via branch protection rules.

### 6.1 Configure Branch Protection (GitHub UI)

1. Go to GitHub repo → Settings → Branches
2. Add rule for `main` branch:
   - ✅ Require pull request before merging
   - ✅ Require approvals: 1
   - ✅ Dismiss stale reviews when new commits are pushed
   - ✅ Require status checks to pass:
     - `Lint`
     - `Typecheck`
     - `Test`
   - ✅ Require branches to be up to date before merging
   - ✅ Include administrators (recommended)

3. Save changes

### 6.2 Verify Protection

```bash
# Try to push directly to main (should fail)
git checkout main
echo "test" >> README.md
git add README.md
git commit -m "test: verify branch protection"
git push origin main  # Should be rejected!

# Cleanup
git reset HEAD~1
git checkout -- README.md
```

---

## Phase 7: Final Sanity Checks 🧪

**Goal:** Verify entire workflow end-to-end.

### 7.1 Full Workflow Test

```bash
# Create a test branch
git checkout -b test/final-workflow-check

# Make a change
echo "// workflow test" >> src/utils/devLogger.ts

# Stage and commit (pre-commit hook should run)
git add src/utils/devLogger.ts
git commit -m "test: verify full workflow"

# Push and create PR
git push origin test/final-workflow-check

# Verify in GitHub:
# 1. CI runs automatically
# 2. All checks pass (Lint, Typecheck, Test)
# 3. PR template appears
# 4. Can't merge until approved (if protection enabled)

# Cleanup
git checkout main
git branch -D test/final-workflow-check
git push origin --delete test/final-workflow-check
```

### 7.2 Verify VS Code Integration

1. Open project in VS Code
2. Make a change to a TypeScript file
3. Save → should auto-format with Prettier
4. Check that ESLint errors show inline
5. Verify Stylelint works on CSS files

### 7.3 Production Build Verification

```bash
# Ensure production build works
pnpm build

# Verify devLog tree-shakes (optional but recommended)
# Build size should NOT include debug logging in prod
ls -lh dist/assets/*.js
```

---

## Rollback Plan 🔄

If something goes wrong, here's how to rollback:

### Quick Rollback

```bash
# Restore previous commit
git revert HEAD

# Or reset to before migration
git reset --hard origin/main

# Re-run installation
pnpm install
```

### Disable Pre-Commit Hooks (Emergency)

```bash
# Temporarily disable hooks
export HUSKY=0

# Or remove hook
rm .husky/pre-commit

# Commit without hooks
git commit --no-verify -m "emergency fix"
```

### Restore Console.log (if needed)

```bash
# Manually revert the migration commit
git revert <commit-hash>

# Or use git reflog to find previous state
git reflog
git reset --hard <previous-hash>
```

---

## Success Criteria ✅

The rollout is successful when:

- [ ] All `console.log` migrated to `devLog.debug`
- [ ] Pre-commit hooks run on every commit
- [ ] CI passes with `--max-warnings=0`
- [ ] No console.log grep guard failures in CI
- [ ] Branch protection enabled on main
- [ ] Team onboarded via playbook
- [ ] VS Code auto-formatting works
- [ ] Production builds successfully
- [ ] Tests pass locally and in CI

---

## Timeline

- **Phase 1-2:** 1-2 hours (migration)
- **Phase 3-4:** 30 minutes (hooks & CI)
- **Phase 5:** 1 hour (docs & communication)
- **Phase 6:** 15 minutes (branch protection)
- **Phase 7:** 30 minutes (verification)

**Total:** ~3-4 hours for complete rollout

---

## Post-Rollout Monitoring

### Week 1: Monitor for Issues

- Check CI failure rates
- Monitor #engineering-help for workflow questions
- Track pre-commit hook performance
- Verify no false positives in console.log grep

### Week 2: Gather Feedback

- Survey team on workflow experience
- Identify pain points
- Iterate on tooling as needed

### Week 4: Retro

- Document lessons learned
- Update playbook based on real-world usage
- Consider additional improvements

---

## Support & Resources

- **Playbook:** `docs/engineering/linting-and-ci-playbook.md`
- **Scripts:** `scripts/` directory
- **CI Config:** `.github/workflows/ci.yml`
- **Questions:** Ask in #engineering-help or create an issue

---

## Appendix: Automated Rollout Script

The `scripts/rollout-workflow-improvements.sh` script automates most of this process. Review it before running:

```bash
cat scripts/rollout-workflow-improvements.sh
```

Run with:

```bash
./scripts/rollout-workflow-improvements.sh
```

---

**Good luck with the rollout! 🚀**
