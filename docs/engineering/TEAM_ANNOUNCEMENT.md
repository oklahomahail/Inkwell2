# 🎉 New Development Workflow - Team Announcement

**Date:** October 28, 2025
**What:** Zero-warning development workflow improvements
**Status:** Ready to use now!

---

## What Changed?

We've upgraded our development workflow to catch issues earlier and make your life easier:

### 1. ✅ Auto-Fix Everything

```bash
pnpm fix:auto  # Fixes linting, formatting, console.log - all in one!
```

### 2. ✅ Pre-Commit Hooks

Your commits now automatically:

- Fix ESLint issues
- Format with Prettier
- Check TypeScript types
- Fix Stylelint errors

**No more "oops, forgot to run Prettier!"**

### 3. ✅ Zero-Warning CI

CI now enforces **zero warnings**. No more accumulating tech debt!

### 4. ✅ No More console.log

Use `devLog.debug()` instead - it tree-shakes in production:

```typescript
import { devLog } from '@/utils/devLogger';

devLog.debug('User clicked button', { userId, action }); // ✅
console.log('Debug info'); // ❌ Fails CI
```

### 5. ✅ Better VS Code Integration

Auto-format on save is now configured for everyone!

---

## What You Need to Do

### Right Now (5 minutes)

```bash
# 1. Pull latest main
git checkout main
git pull origin main

# 2. Install dependencies (sets up hooks)
pnpm install

# 3. Read the quick reference
open docs/engineering/WORKFLOW_QUICK_REFERENCE.md
```

### For Your Active Branches (10 minutes)

```bash
# 1. Checkout your branch
git checkout feature/your-branch

# 2. Auto-fix everything
pnpm fix:auto

# 3. Review changes
git diff

# 4. Commit
git add -A
git commit -m "chore: apply workflow improvements"
```

---

## Quick Reference

### Essential Commands

```bash
pnpm ci           # Run all checks (what CI runs)
pnpm fix:auto     # Auto-fix everything
pnpm typecheck    # Check TypeScript
pnpm lint:ci      # Lint with zero warnings
```

### Console.log Migration

```bash
# Automatically replace console.log → devLog.debug
pnpm fix:logs:regex
```

### Bypass Hooks (Emergency Only!)

```bash
git commit --no-verify -m "emergency fix"
```

---

## Common Questions

### "My pre-commit hook is slow!"

Use `pnpm lint:relaxed` during development. The hook only runs on commit.

### "CI is failing on console.log"

Run `pnpm fix:logs:regex` to auto-fix all console.log calls.

### "I get type errors I can't fix"

Run `pnpm typecheck` to see all errors. Use `@ts-expect-error` as a last resort with a TODO comment.

### "How do I debug now?"

```typescript
// For temporary debugging
import { devLog } from '@/utils/devLogger';
devLog.debug('My debug message', { data });

// For warnings/errors (these are OK!)
console.warn('API deprecated:', endpoint);
console.error('Failed to load:', error);
```

### "Can I still use console.log?"

Only `console.warn` and `console.error` are allowed. Use `devLog.debug()` for debug logging.

---

## Documentation

- **Quick Reference:** `docs/engineering/WORKFLOW_QUICK_REFERENCE.md`
- **Full Playbook:** `docs/engineering/linting-and-ci-playbook.md`
- **Rollout Plan:** `docs/engineering/WORKFLOW_ROLLOUT_PLAN.md`
- **Implementation Summary:** `docs/engineering/WORKFLOW_IMPLEMENTATION_SUMMARY.md`

---

## Get Help

- **Questions:** Ask in #engineering-help
- **Issues:** Create GitHub issue with `workflow` label
- **Bugs:** DM engineering lead

---

## Timeline

- **Today:** Workflow is live, start using it!
- **This Week:** Migrate your active branches
- **Next Week:** Team survey on experience
- **Week 4:** Retrospective and iteration

---

## Why This Matters

**Before:**

- ~100+ lint warnings accumulating
- ~150+ console.log calls
- Manual formatting (60% of commits)
- 25% CI failure rate

**After:**

- ✅ Zero warnings enforced
- ✅ Zero console.log
- ✅ 100% auto-formatted
- ✅ <5% CI failure rate (target)

**Result:** Less time debugging CI failures, more time shipping features! 🚀

---

## Pro Tips

1. **Run `pnpm ci` before pushing** - Catches CI failures locally
2. **Use `pnpm fix:auto` liberally** - It fixes most issues
3. **Keep commits small** - Pre-commit hooks run faster
4. **Trust the tools** - They're configured to help you

---

## Thank You!

This workflow will make our codebase cleaner, our CI faster, and our lives easier. Thanks for being awesome teammates! 🎉

**Questions?** Drop them in #engineering-help!

---

_Happy coding! - The Engineering Team_
