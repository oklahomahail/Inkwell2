# Developer Documentation Index

## Getting Started

- [Setup Guide](./setup.md) - Installation, environment setup, and first run
- [Release Process](./release.md) - Versioning and deployment workflow

## Code Quality & Standards

### React & Hooks

- [Hooks Safety Guidelines](../HOOKS_SAFETY.md) - Comprehensive safety patterns

**Run hooks linting locally:**

```bash
pnpm lint:hooks
```

### Linting & CI

- [Engineering Playbook](../engineering/linting-and-ci-playbook.md) - Full CI/CD workflow
- [**Branch Protection Setup**](./BRANCH_PROTECTION_SETUP.md) - Require hooks checks in GitHub branch protection

### Pre-commit Checks

Before committing, the following will run automatically via Husky:

1. `pnpm lint-staged` - Format, lint, and hooks check on staged files
2. `pnpm lint:ci` - Enforce zero warnings
3. File corruption detection
4. Backup file detection
5. Test suite

## Architecture

- [AI Services](./ai-services.md) - AI integration architecture
- [Storage](./storage.md) - IndexedDB and data persistence
- [Onboarding](./onboarding.md) - User onboarding flows

## Performance

<!-- - [Performance Guidelines](./performance/) - Optimization strategies and monitoring -->

- [Performance Guardrails](../PERFORMANCE_GUARDRAILS.md) - Critical performance patterns
- [**Performance Validation Guide**](./PERFORMANCE_VALIDATION.md) - Validate memoization changes with React DevTools

## Additional Resources

- [CONTRIBUTING.md](../../CONTRIBUTING.md) - Contribution guidelines
- [Workflow Guide](../engineering/linting-and-ci-playbook.md) - Full development workflow
