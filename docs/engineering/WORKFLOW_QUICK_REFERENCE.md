# Quick Reference: Development Workflow

**Last Updated:** October 28, 2025

---

## 🚀 Essential Commands

### Pre-Commit (Local Development)

```bash
pnpm fix:auto          # Fix ALL issues automatically
pnpm lint:fix          # Fix ESLint issues
pnpm format            # Fix Prettier formatting
pnpm lint:css:fix      # Fix Stylelint issues
```

### Checks (What CI Runs)

```bash
pnpm ci                # Run all CI checks locally
pnpm typecheck         # TypeScript type checking
pnpm lint:ci           # ESLint with zero warnings
pnpm test              # Run all tests
pnpm prettier:check    # Check formatting
```

### Console.log Migration

```bash
pnpm fix:logs:regex    # Replace console.log → devLog.debug
```

---

## 🔥 Quick Fixes

### "Pre-commit hook failed"

```bash
# Run auto-fix
pnpm fix:auto

# Check what's wrong
pnpm lint:ci
pnpm typecheck

# Force commit (emergency only!)
git commit --no-verify -m "message"
```

### "CI failing on console.log"

```bash
# Find and fix console.log calls
git ls-files 'src/**' | xargs grep -n "console\.log("

# Auto-replace
pnpm fix:logs:regex
```

### "Linting takes forever"

```bash
# Use relaxed mode during development
pnpm lint:relaxed

# CI uses strict mode
pnpm lint:ci
```

### "Type errors I can't fix"

```bash
# Check which files have errors
pnpm typecheck

# Use @ts-expect-error with explanation (last resort)
// @ts-expect-error - TODO: Fix after library upgrade
const value = problematicCode();
```

---

## 🎯 Workflow

### Starting Work

```bash
git checkout -b feature/my-feature
pnpm install           # Ensure deps are fresh
pnpm dev               # Start dev server
```

### Before Committing

```bash
pnpm fix:auto          # Auto-fix everything
pnpm ci                # Verify CI will pass
git add -A
git commit -m "feat: my feature"  # Pre-commit hooks run automatically
```

### Opening a PR

```bash
git push origin feature/my-feature
# Create PR on GitHub
# Wait for CI to pass (Lint, Typecheck, Test)
# Request review
```

### After PR Approval

```bash
# Merge via GitHub UI
# Branch protection ensures CI passed
# PR template checklist completed
```

---

## 📝 Logging Standards

### ✅ Use This

```typescript
import { devLog } from '@/utils/devLogger';

devLog.debug('User action:', { userId, action }); // Debug info
console.warn('API deprecated:', endpoint); // Warnings
console.error('Failed to load:', error); // Errors
```

### ❌ Don't Use This

```typescript
console.log('Debug info'); // ❌ Will fail CI grep check
```

---

## 🧪 Testing

### Run Tests

```bash
pnpm test              # All tests
pnpm test:coverage     # With coverage report
pnpm test:ci           # What CI runs (typecheck + test)
```

### Test Files Location

```
src/
  __tests__/           # Unit tests
  *.test.ts            # Co-located tests
```

---

## 🔧 Pre-Commit Hooks

### What Runs Automatically

When you commit, lint-staged runs:

**TypeScript files (`.ts`, `.tsx`):**

1. ESLint auto-fix (`--max-warnings=0`)
2. Prettier format
3. TypeScript type check

**CSS files (`.css`):**

1. Stylelint auto-fix
2. Prettier format

**JSON/Markdown (`.json`, `.md`):**

1. Prettier format

### Bypassing Hooks (Emergency Only)

```bash
git commit --no-verify -m "emergency fix"
export HUSKY=0  # Disable all hooks
```

---

## 🚨 CI Gates

CI must pass before merging to `main`:

1. **Grep for console.log** - No `console.log` allowed
2. **Lint** - ESLint with `--max-warnings=0`
3. **Typecheck** - No TypeScript errors
4. **Test** - All tests pass

---

## 🛠️ VS Code Setup

Auto-format on save is configured via `.vscode/settings.json`:

- ✅ Format on save (Prettier)
- ✅ ESLint auto-fix on save
- ✅ Stylelint auto-fix on save
- ✅ Organize imports disabled (ESLint handles it)

**Install these extensions:**

- ESLint (`dbaeumer.vscode-eslint`)
- Prettier (`esbenp.prettier-vscode`)
- Stylelint (`stylelint.vscode-stylelint`)
- Tailwind CSS IntelliSense (`bradlc.vscode-tailwindcss`)

---

## 📚 Full Documentation

For complete details, see:

- [Linting & CI Playbook](./linting-and-ci-playbook.md)
- [Workflow Rollout Plan](./WORKFLOW_ROLLOUT_PLAN.md)

---

## 💡 Pro Tips

1. **Run `pnpm ci` before pushing** - Catches CI failures locally
2. **Use `pnpm fix:auto` liberally** - Fixes most issues automatically
3. **Keep commits small** - Pre-commit hooks run faster
4. **Don't fight the linter** - If it's consistently flagging something, there's usually a better pattern
5. **Use `devLog.debug` for temporary debugging** - Tree-shakes in production

---

## 🆘 Get Help

- **Playbook:** `docs/engineering/linting-and-ci-playbook.md`
- **Rollout Plan:** `docs/engineering/WORKFLOW_ROLLOUT_PLAN.md`
- **Issues:** Open a GitHub issue with label `workflow`
- **Slack:** #engineering-help

---

**Happy coding! 🎉**
