# Branch Protection Setup Guide

## Overview

This guide shows you how to require the React Hooks linting check in GitHub branch protection rules.

## Required Status Checks

The following CI jobs should be required to pass before merging to `main`:

1. **react-hooks-guard** - React Hooks ESLint checks (from `lint-react-hooks.yml`)
2. **build** - Production build (from `ci.yml`)
3. **test** - Test suite (from `test.yml` or `ci.yml`)
4. **typecheck** - TypeScript compilation (from `ci.yml`)
5. **lint** - General ESLint checks (from `ci.yml`)

## Setup Steps

### 1. Navigate to Branch Protection Settings

1. Go to your GitHub repository
2. Click **Settings** → **Branches**
3. Under "Branch protection rules", click **Add rule** (or edit existing rule for `main`)

### 2. Configure Protection Rule

**Branch name pattern:** `main`

Enable the following:

- ✅ **Require a pull request before merging**
  - ✅ Require approvals: 1 (optional, adjust as needed)

- ✅ **Require status checks to pass before merging**
  - ✅ **Require branches to be up to date before merging**

- ✅ **Require conversation resolution before merging** (recommended)

### 3. Add Required Status Checks

In the "Status checks that are required" section, search for and add:

- `react-hooks-guard` (from `.github/workflows/lint-react-hooks.yml`)
- `build` (from your CI workflow)
- `test` (from your test workflow)
- `typecheck` (from your CI workflow)
- `lint` (from your CI workflow)

> **Note**: Status checks only appear after they've run at least once. Push a PR to trigger them if they don't show up.

### 4. Additional Recommended Settings

- ✅ **Require linear history** - Keeps git history clean
- ✅ **Include administrators** - Even admins must follow the rules
- ✅ **Restrict who can push to matching branches** - Optional: limit to specific teams

### 5. Save Changes

Click **Create** or **Save changes** at the bottom.

## Verification

After setup:

1. Create a test branch with a hooks violation:

```typescript
// Intentional violation for testing
useEffect(() => {
  doSomething(userId);
}, []); // Missing userId in deps
```

2. Open a PR
3. Verify the `react-hooks-guard` check fails
4. Verify you cannot merge until it passes

## Workflow File Reference

The `react-hooks-guard` job comes from `.github/workflows/lint-react-hooks.yml`:

```yaml
name: React Hooks Lint Guard

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main, develop]

jobs:
  react-hooks-guard:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      - name: Run React Hooks ESLint Guard
        run: pnpm lint:hooks
```

## Troubleshooting

**Problem**: Status check doesn't appear in the list

**Solution**:

1. Make sure the workflow has run at least once on a PR
2. Check that the job name in the YAML matches what you're searching for
3. The searchable name is the `jobs.<job-id>` key, not the `name:` field

**Problem**: Check fails but code looks correct

**Solution**:

1. Run `pnpm lint:hooks` locally to see detailed errors
2. Check [eslint.config.hooks.js](../../eslint.config.hooks.js) for the exact rules

## Bypassing (Emergency Only)

If you need to bypass in an emergency:

1. Temporarily disable the branch protection rule
2. Merge the critical fix
3. Re-enable protection immediately
4. Create a follow-up PR to fix the hooks violations

**Better approach**: Fix the violations first, even in emergencies. The hooks lint typically catches real bugs.

## References

- [GitHub Branch Protection Docs](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
