# Linting and CI Playbook

## Overview

**Implementation Date:** October 28, 2025

This document provides a comprehensive guide to the linting, formatting, and CI/CD workflows for the Inkwell project. It covers local development workflows, pre-commit hooks, and continuous integration checks.

---

## Table of Contents

1. [Quick Reference](#quick-reference)
2. [Local Development Workflow](#local-development-workflow)
3. [Pre-Commit Hooks](#pre-commit-hooks)
4. [Automated Fixes](#automated-fixes)
5. [CI/CD Pipeline](#cicd-pipeline)
6. [Troubleshooting](#troubleshooting)

---

## Quick Reference

### Essential Commands

```bash
# Run all checks (what CI runs)
pnpm ci

# Auto-fix most issues
pnpm fix:auto

# Individual checks
pnpm typecheck          # TypeScript type checking
pnpm lint              # ESLint (auto-fixable)
pnpm lint:ci           # ESLint (strict, no warnings)
pnpm test              # Run tests
pnpm prettier:check    # Check formatting

# Individual fixes
pnpm lint:fix          # Fix ESLint issues
pnpm format            # Fix formatting
pnpm fix:logs:regex    # Replace console.log with devLog.debug
```

---

## Local Development Workflow

### 1. Before Committing

The pre-commit hook will automatically run, but you can manually run checks:

```bash
# Quick check (recommended before commit)
pnpm check

# Full CI check (what runs on GitHub)
pnpm ci
```

### 2. Fixing Common Issues

#### No-Console Rule Violations

The project enforces `no-console` in production code. Use `devLog` instead:

```bash
# Automatically replace console.log with devLog.debug
pnpm fix:logs:regex
```

**Before:**

```typescript
console.log('Debug info:', data);
```

**After:**

```typescript
import { devLog } from '@/utils/devLog';

devLog.debug('Debug info:', data);
```

#### Unused Variables

```bash
# Step 1: Generate lint report
pnpm lint:json

# Step 2: Auto-prefix unused vars with underscore
pnpm fix:unused

# Step 3: Fix remaining issues
pnpm lint:fix
```

#### All-in-One Fix

```bash
# Runs: fix:logs:regex → lint:json → fix:unused → lint:fix
pnpm fix:auto
```

---

## Pre-Commit Hooks

### What Runs on Every Commit

The `.husky/pre-commit` hook enforces quality standards:

1. **Lint-Staged** (on changed files only)
   - ESLint with auto-fix and `--max-warnings=0`
   - Prettier formatting
   - TypeScript type checking
   - Stylelint for CSS files

2. **Lint:CI** (full codebase)
   - ESLint with zero warnings allowed
   - Enforces no-console rule

3. **Corruption Detection**
   - Checks for file corruption patterns

4. **Backup File Detection**
   - Prevents committing `.bak`, `~`, etc.

### Bypassing Pre-Commit Hooks

**⚠️ Not recommended** - Only use for emergency fixes:

```bash
git commit --no-verify -m "emergency: description"
```

### Configuring Lint-Staged

Edit `package.json`:

```json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix --max-warnings=0", "prettier --write", "bash -c 'tsc --noEmit'"],
    "*.css": ["stylelint --fix", "prettier --write"],
    "*.{json,md}": ["prettier --write"]
  }
}
```

---

## Automated Fixes

### Console Log Replacer

**Script:** `scripts/replace-console-logs.mjs`

**What it does:**

- Finds all `console.log` calls in `src/**/*.{ts,tsx,js,jsx}`
- Replaces with `devLog.debug`
- Auto-injects import if missing
- Skips test files and scripts

**Usage:**

```bash
pnpm fix:logs:regex
```

**Example transformation:**

```typescript
// Before
function handleClick() {
  console.log('Button clicked');
  doSomething();
}

// After
import { devLog } from '@/utils/devLog';

function handleClick() {
  devLog.debug('Button clicked');
  doSomething();
}
```

### Unused Variable Prefixer

**What it does:**

- Reads ESLint JSON report
- Prefixes unused vars with `_`
- Satisfies ESLint without removing potentially needed code

**Usage:**

```bash
pnpm lint:json        # Generate report
pnpm fix:unused       # Apply fixes
```

---

## CI/CD Pipeline

### GitHub Actions Workflow

**File:** `.github/workflows/ci.yml`

**On every push/PR:**

1. **Typecheck** → `pnpm typecheck`
2. **Lint** → `pnpm lint:ci` (zero warnings)
3. **Tests** → `pnpm test:ci`
4. **Audits** → `pnpm ci:audit`
   - Knip (unused exports)
   - Depcheck (unused dependencies)
   - Madge (orphaned files, circular deps)

### CI Command

Locally replicate CI:

```bash
pnpm ci
```

**Equivalent to:**

```bash
pnpm typecheck && \
pnpm lint && \
pnpm test:run && \
pnpm ci:audit
```

---

## Troubleshooting

### "ESLint errors prevent commit"

**Fix ESLint issues:**

```bash
pnpm lint:fix
```

**Check remaining issues:**

```bash
pnpm lint:ci
```

### "TypeScript errors prevent commit"

**Check errors:**

```bash
pnpm typecheck
```

**Common fixes:**

- Add missing types
- Fix incorrect type usage
- Update imports

### "Prettier formatting issues"

**Auto-fix:**

```bash
pnpm format
```

### "Pre-commit hook takes too long"

**Optimize lint-staged:**

The hook only runs on staged files, but full `lint:ci` runs on entire codebase. To speed up:

1. Commit smaller changesets
2. Run `pnpm fix:auto` before staging
3. Use `pnpm check` during development

### "Husky not running"

**Reinstall hooks:**

```bash
pnpm prepare
```

**Check hook file:**

```bash
cat .husky/pre-commit
```

### "Console.log still in code"

**Manual replacement:**

```bash
pnpm fix:logs:regex
```

**Then commit:**

```bash
git add .
git commit -m "fix: replace console.log with devLog"
```

---

## Best Practices

### Development Workflow

1. **During Development**
   - Use `devLog.debug()` instead of `console.log()`
   - Run `pnpm typecheck` periodically
   - Use `pnpm lint:fix` to auto-fix issues

2. **Before Committing**
   - Run `pnpm check` or `pnpm fix:auto`
   - Review changes with `git diff`
   - Let pre-commit hooks run

3. **After Failed Commit**
   - Read error messages carefully
   - Run suggested fix commands
   - Commit again (hooks will re-run)

### Code Quality Rules

- ✅ **DO:** Use `devLog.debug()`, `devLog.info()`, `devLog.warn()`, `devLog.error()`
- ❌ **DON'T:** Use `console.log()`, `console.warn()`, etc. in `src/`
- ✅ **DO:** Fix ESLint warnings immediately
- ❌ **DON'T:** Disable ESLint rules without team discussion
- ✅ **DO:** Keep TypeScript strict mode enabled
- ❌ **DON'T:** Use `@ts-ignore` without explanation

### When to Skip Hooks

**Valid reasons:**

- Emergency hotfix (revert later)
- WIP commit to temporary branch
- Automated bot commits

**Invalid reasons:**

- "I'll fix it later" (tech debt accumulation)
- "It works on my machine" (CI will fail)
- "Just want to save progress" (use `git stash` instead)

---

## Configuration Files

### ESLint

- **Config:** `eslint.config.js`
- **Rules:** Enforces no-console, strict types, React best practices

### TypeScript

- **Config:** `tsconfig.json`
- **Mode:** Strict

### Prettier

- **Config:** `.prettierrc` (or in `package.json`)
- **Runs:** On save (if configured in VS Code)

### Stylelint

- **Config:** `.stylelintrc.json`
- **Scope:** CSS files only

### Husky

- **Hooks:** `.husky/pre-commit`
- **Init:** `pnpm prepare` (runs post-install)

---

## Scripts Reference

| Script                | Purpose                   | When to Use              |
| --------------------- | ------------------------- | ------------------------ |
| `pnpm ci`             | Full CI check             | Before pushing to GitHub |
| `pnpm check`          | Quick local check         | Before committing        |
| `pnpm fix:auto`       | Auto-fix most issues      | Daily cleanup            |
| `pnpm lint:ci`        | Strict lint (no warnings) | CI enforcement           |
| `pnpm lint:fix`       | Fix ESLint issues         | Quick fixes              |
| `pnpm typecheck`      | Type check only           | During development       |
| `pnpm format`         | Format all files          | Formatting issues        |
| `pnpm fix:logs:regex` | Replace console.log       | Migration cleanup        |
| `pnpm fix:unused`     | Prefix unused vars        | After refactoring        |

---

## Summary

The Inkwell project uses a multi-layered approach to code quality:

1. **Pre-commit hooks** catch issues before they're committed
2. **Automated scripts** fix common problems automatically
3. **CI pipeline** enforces standards on all changes
4. **Developer tools** make it easy to maintain quality

**Golden Rule:** If CI fails, the local workflow should catch it first. Run `pnpm ci` before pushing!

---

**Last Updated:** 2025-01-XX
**Maintained By:** Inkwell Engineering Team
