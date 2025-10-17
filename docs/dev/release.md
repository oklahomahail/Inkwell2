# Release Process

This document outlines the release process for Inkwell, including versioning, changelog maintenance, and deployment.

## Versioning

Inkwell follows [Semantic Versioning](https://semver.org/) (SemVer):

- **MAJOR** version for incompatible API changes (x.0.0)
- **MINOR** version for new functionality in a backward compatible manner (0.x.0)
- **PATCH** version for backward compatible bug fixes (0.0.x)

## Conventional Commits

All commits should follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
type(scope): description
```

Common types:

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `chore`: Regular maintenance tasks
- `refactor`: Code changes that neither fix bugs nor add features
- `test`: Adding or updating tests
- `style`: Changes that do not affect the meaning of the code

## Release Checklist

### Pre-Release

1. Ensure all tests pass:

   ```bash
   pnpm test:run
   ```

2. Check TypeScript compilation:

   ```bash
   pnpm typecheck
   ```

3. Verify linting passes:

   ```bash
   pnpm lint
   ```

4. Build the application to ensure it builds successfully:

   ```bash
   pnpm build
   ```

5. Update version number in `package.json`
6. Verify vercel.json redirects are up to date

7. Confirm Clerk "Authorized Origins & Redirects" settings are correct

### Creating a Release

1. Create a new changeset (if not already created):

   ```bash
   pnpm changeset
   ```

2. Choose the appropriate version bump based on the changes
3. Update CHANGELOG.md with the changeset

4. Commit the changeset and CHANGELOG.md updates:

   ```bash
   git add .
   git commit -m "chore: prepare release vX.Y.Z"
   ```

5. Create a version tag:

   ```bash
   git tag vX.Y.Z
   ```

6. Push changes and tag:

   ```bash
   git push origin main
   git push origin vX.Y.Z
   ```

7. GitHub Actions will automatically create a GitHub Release

### Post-Release

1. Verify the deployment on the production URL

2. Run smoke tests to ensure critical functionality works:

   ```bash
   ./scripts/smoke-test.sh
   ```

3. Monitor error tracking for any new errors following deployment

4. Update the documentation site with release notes if necessary

## Hotfix Releases

For urgent fixes that need to be deployed outside the regular release cycle:

1. Create a hotfix branch from the main branch:

   ```bash
   git checkout -b hotfix/description
   ```

2. Make the necessary changes and follow the regular commit conventions

3. Create a changeset for the hotfix:

   ```bash
   pnpm changeset
   ```

4. Select patch version bump

5. Create a pull request to main

6. After merging, follow the normal release process

## Release Artifacts

Each release produces:

1. A GitHub Release with release notes
2. A tagged version in git
3. An updated CHANGELOG.md
4. A production deployment on Vercel
