# Release Process

## Scope

This guide covers promoting code from `develop` to `main`, producing a stable Production release on inkwell.leadwithnexus.com

## Preflight

1. Confirm develop is green
   - CI passes: typecheck, test, build
   - Preview deployment on Vercel loads cleanly
   - Manual smoke test
     - Loads Dashboard, Writing, Timeline, Settings
     - No white screen at route changes or hard refresh
     - Command palette opens and closes
     - Notifications bell state does not throw
     - Settings page renders without compact or detailed reference errors
2. Verify feature flags
   - Production defaults OFF, Preview ON as needed
   - Confirm NEXT_PUBLIC_ENV is preview on Preview, production on Production
3. Update CHANGELOG.md
   - Summarize user-visible changes, fixes, migrations if any

## Promotion

1. Create PR: develop into main
   - Title: Release vX.Y.Z
   - Include CHANGELOG excerpt
2. Ensure all checks pass on PR
3. Review and approve, squash or merge commit as preferred
4. Merge PR to main

## Tag and notes

1. Tag the commit
   ```sh
   git tag vX.Y.Z
   git push origin vX.Y.Z
   ```
2. Create a GitHub Release with the same tag, paste CHANGELOG snippet

## Post deploy verification

1. Vercel Production deployment turns green
2. Visit https://inkwell.leadwithnexus.com
   - Hard refresh with cache clear
   - Repeat the smoke test routes
3. Error monitoring
   - Review client error logs for the new deployment
   - Verify no increases in error rate or new compact, detailed, theme, or storage errors

## Rollback plan

- If a blocker appears, revert to the previous known good deployment from Vercel dashboard
- Or redeploy tag vX.Y.Z-1

## Communication

- Post release notes to testers and stakeholders
  - Production changes
  - What to test in Preview next
  - Where to leave feedback

## Environment Configuration Reference

### Production (main branch)

- Domain: inkwell.leadwithnexus.com
- NEXT_PUBLIC_ENV=production
- Feature flags: All OFF by default

### Preview (develop branch)

- Domain: Auto-assigned vercel.app URL
- NEXT_PUBLIC_ENV=preview
- Feature flags: ON as needed for testing

### Development (local)

- NEXT_PUBLIC_ENV=development
- Feature flags: Configurable per developer
