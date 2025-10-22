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

- [ ] Tests pass locally (`pnpm test`)
- [ ] Build succeeds (`pnpm build`)
- [ ] No TypeScript errors (`pnpm tsc --noEmit`)
- [ ] Linting passes (`pnpm lint`)
- [ ] README tree updated if file structure changed (`pnpm tree:update`)

## Static Asset Check (if applicable)

<!-- If your changes affect middleware, routing, or static asset handling -->

- [ ] JS/CSS assets load with correct Content-Type
- [ ] Service worker (registerSW.js) loads correctly
- [ ] Static assets bypass authentication (no redirects to /sign-in)
- [ ] Verified with `./scripts/verify_deployment.sh` after deployment
