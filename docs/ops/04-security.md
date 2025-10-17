# Repository Security

This document outlines the security measures implemented for the Inkwell repository.

## Branch Protection

The `main` branch is protected with the following rules:

1. **Pull Request Requirements**
   - All changes must go through a pull request
   - At least one approval is required
   - Stale reviews are automatically dismissed when new commits are pushed

2. **Status Checks**
   - Required checks: lint, typecheck, test, build
   - All checks must pass before merging
   - Strict status checks (must be up-to-date with base branch)

3. **Branch Rules**
   - Linear history is required (no merge commits)
   - Force pushes are blocked
   - Branch deletion is prohibited
   - These rules apply to administrators as well

4. **Deployment Requirements**
   - Vercel deployment must succeed before merging
   - This ensures all changes deploy successfully to the preview environment

## Secret Scanning

The repository is configured with GitHub secret scanning to automatically detect leaked secrets:

- API keys
- Authentication tokens
- Private keys
- Other sensitive credentials

If a secret is detected, GitHub will notify the repository administrators and, in some cases, the service provider that issued the secret.

## Setting Up Branch Protection

To set up or update branch protection rules, a script is provided:

```bash
./scripts/setup-branch-protection.sh
```

This script uses the GitHub CLI to configure all the protection rules for the main branch.

### Manual Configuration

If you prefer to set up branch protection manually:

1. Go to the repository on GitHub
2. Navigate to Settings > Branches
3. Click "Add rule" next to "Branch protection rules"
4. Enter "main" as the branch name pattern
5. Configure the required settings
6. Click "Create" or "Save changes"

## Code Scanning

The repository uses GitHub Actions workflows to perform code scanning:

1. Secret scanning for accidental credential leaks
2. Check for stale TODOs (older than 30 days)
3. Validate environment variables against .env.example

## Dependency Management

Renovate is configured to automatically update dependencies with:

- Weekly update schedule (weekends)
- Automatic merging of minor and patch updates
- Dependency dashboard for major updates requiring manual review
