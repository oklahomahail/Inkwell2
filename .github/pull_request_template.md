# Pull Request

## What changed

-

## Why (user impact)

-

## How to test

1.
2.

## Screenshots / Logs

## <!-- Add screenshots or relevant logs if applicable -->

## Rollback plan

- Revert #<PR> or deploy commit <sha>.

---

## Checklist

<!-- Mark with 'x' when complete -->

### Code Quality

- [ ] Tests pass locally (`pnpm test`)
- [ ] Build succeeds (`pnpm build`)
- [ ] No TypeScript errors (`pnpm typecheck`)
- [ ] Linting passes with zero warnings (`pnpm lint:ci`)
- [ ] **React Hooks rules pass** (`pnpm lint:hooks`) - see [Quick Ref](../HOOKS_QUICK_REF.md)
- [ ] Prettier formatting applied (`pnpm prettier:check`)
- [ ] No `console.log` statements (use `devLog.debug` instead)
- [ ] Pre-commit hooks ran successfully
- [ ] README tree updated if file structure changed (`pnpm tree:update`)

### Testing

- [ ] New tests added for new functionality
- [ ] All edge cases considered and tested
- [ ] Manual testing completed

### Static Asset Check (if applicable)

<!-- If your changes affect middleware, routing, or static asset handling -->

- [ ] JS/CSS assets load with correct Content-Type
- [ ] Service worker (registerSW.js) loads correctly
- [ ] Static assets bypass authentication (no redirects to /sign-in)
- [ ] Verified with `./scripts/verify_deployment.sh` after deployment

### Documentation

- [ ] Code is well-commented where needed
- [ ] JSDoc comments added for public APIs
- [ ] Migration guide included (for breaking changes)
