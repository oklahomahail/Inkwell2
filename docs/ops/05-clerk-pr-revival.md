# Clerk Integration PR Revival Guide

## Background

PR #19 (`chore/restart-clerk-integration`) was closed due to merge conflicts after PR #22 was merged to main. This document provides the clean path to revive the Clerk type integrity work.

## Option A: Reopen Same PR (Recommended if branch exists)

```bash
# Fetch latest changes
git fetch origin

# Check out the original branch
git checkout chore/restart-clerk-integration

# Rebase onto latest main
git rebase origin/main

# Resolve conflicts as they arise
# Key conflict hotspots to watch:
# - src/App.tsx (ClerkProvider initialization)
# - src/AppProviders.tsx (Provider ordering)
# - src/components/Onboarding/ProfileTourProvider.tsx (tests)
# - src/components/Profile/ProfileActions.tsx (new file, may conflict)
# - src/services/ProfileService.ts (new file, may conflict)
# - package.json & pnpm-lock.yaml (dependency conflicts)

# For each conflict:
git add <resolved-files>
git rebase --continue

# Once rebase complete, verify everything works
pnpm install
pnpm tsc --noEmit  # typecheck
pnpm lint
pnpm test
pnpm build

# Force push (safe because PR is closed)
git push --force-with-lease

# Reopen PR in GitHub UI (button appears after push)
```

## Option B: Fresh PR with Cherry-Picked Commits

```bash
# Start fresh from main
git fetch origin
git checkout -b chore/clerk-integration-v2 origin/main

# List commits from old branch to identify good ones
git log origin/chore/restart-clerk-integration --oneline

# Cherry-pick the commits you want (one at a time)
git cherry-pick <sha1>
# Resolve conflicts if needed, then:
git add -A
git cherry-pick --continue

# Repeat for each commit
git cherry-pick <sha2>
git cherry-pick <sha3>

# Verify everything works
pnpm install
pnpm tsc --noEmit
pnpm lint
pnpm test
pnpm build

# Push new branch
git push -u origin chore/clerk-integration-v2

# Open fresh PR with tight description
gh pr create --title "chore: restore Clerk type integrity" --body "$(cat <<'EOF'
## What changed
- Restored type integrity for Clerk integration
- Fixed ClerkProvider initialization
- Updated auth guards and middleware

## Why (user impact)
- Eliminates TypeScript errors in auth flow
- Ensures proper typing for user/session objects
- Prevents runtime auth errors

## How to test
1. Deploy preview and verify no console errors
2. Test sign up/sign in flow
3. Verify site.webmanifest loads (200 status)
4. Check no "development keys" warning in console

## Rollback plan
- Revert this PR or deploy commit from main before merge

## Environment Setup Required
Before merging, ensure Vercel has:
- VITE_CLERK_PUBLISHABLE_KEY (Preview + Production)
- CLERK_SECRET_KEY (Preview + Production)
EOF
)"
```

## Conflict Resolution Hotspots

### 1. AppProviders / ClerkProvider

**File:** `src/App.tsx` or `src/AppProviders.tsx`

**Issue:** ClerkProvider initialization and env variable reads may conflict with new structure.

**Resolution:**

- Keep the ClerkProvider wrapper from the Clerk branch
- Ensure `publishableKey` is read from `import.meta.env.VITE_CLERK_PUBLISHABLE_KEY`
- Maintain provider order: Clerk → Feature Flags → Toast → Profile → ...

### 2. site.webmanifest Route Handling

**File:** May affect routing or auth guards

**Issue:** Auth guards might block manifest file (401/403)

**Resolution:**

- Ensure `/site.webmanifest` is in public routes list
- Verify `publicRoutes` prop on `<ClerkProvider>` includes manifest
- Test with: `curl -I https://preview-url/site.webmanifest` (should be 200)

### 3. Removed middleware.ts

**File:** Check for any imports/references

**Issue:** Old branch may reference middleware that was removed

**Resolution:**

- Remove all imports of `middleware.ts`
- Move auth logic to guards/components if needed
- Verify no broken imports remain

### 4. Package Dependencies

**Files:** `package.json`, `pnpm-lock.yaml`

**Issue:** Clerk packages may have version conflicts

**Resolution:**

```bash
# Accept incoming changes for package.json Clerk deps
# Then regenerate lockfile
pnpm install
```

## Vercel Environment Variables

Before merging, configure in Vercel Dashboard:

### Production + Preview

```
VITE_CLERK_PUBLISHABLE_KEY=pk_live_xxx  # or pk_test_xxx for staging
CLERK_SECRET_KEY=sk_live_xxx            # or sk_test_xxx for staging
```

### Verification Steps

1. Trigger preview deploy for the PR
2. Open preview URL
3. Check browser console:
   - ✅ No "Clerk loaded with development keys" warning
   - ✅ No auth-related errors
4. Test sign-up flow end-to-end
5. Test sign-in flow
6. Verify `/site.webmanifest` returns 200: `curl -I <preview-url>/site.webmanifest`

## Post-Merge Checklist

- [ ] Production deploy succeeds
- [ ] Auth flow works in production
- [ ] No console errors/warnings
- [ ] Manifest file loads correctly
- [ ] User sessions persist across refreshes

## Resources

- Original PR: #19 (closed)
- Clerk Docs: https://clerk.com/docs
- Environment Variables: Vercel Dashboard → Settings → Environment Variables
