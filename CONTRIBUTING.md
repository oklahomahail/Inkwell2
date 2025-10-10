# Contributing to Inkwell

Welcome! We're excited you're interested in contributing to Inkwell. This guide will help you get started and understand our development workflow.

## Quick Start

```bash
# Clone and setup
git clone <repository-url>
cd inkwell
pnpm install

# Development
pnpm dev        # Start dev server
pnpm build      # Build for production
pnpm typecheck  # TypeScript validation
pnpm test       # Run tests
pnpm test:smoke # Run smoke tests
```

## Development Workflow

1. **Fork** the repository and create a feature branch
2. **Make your changes** following our coding standards
3. **Test thoroughly** - our pre-commit hooks will help catch issues
4. **Submit a pull request** with a clear description

## 🛡️ Maintenance Playbook

### File Corruption Prevention

Our codebase has comprehensive safeguards against file corruption. **Please read**: [docs/FILE_CORRUPTION_PREVENTION.md](docs/FILE_CORRUPTION_PREVENTION.md)

#### Quick Reference

- **Pre-commit hooks**: Automatically detect corruption before commits
- **Manual check**: Run `pnpm check:corruption` anytime
- **Emergency recovery**: `git checkout origin/main -- <corrupted-file>`
- **Weekly monitoring**: Automated integrity checks via GitHub Actions

### Bundle Size Monitoring

Track and compare bundle sizes to prevent bloat:

```bash
pnpm bundle:analyze  # Analyze current build
pnpm bundle:compare  # Compare with v1.0.3-cleanup-2025-10-10 baseline
pnpm bundle:baseline # Save new baseline (after major changes)
```

### Testing Strategy

#### Smoke Tests

Minimal end-to-end tests covering critical user journeys:

```bash
pnpm test:smoke  # Run Playwright smoke tests
```

#### Unit Tests

Component and utility testing:

```bash
pnpm test        # Run all tests
pnpm test:run    # Single run (no watch)
```

## 🚨 Emergency Procedures

### File Corruption Recovery

If you encounter corrupted/minified files:

1. **Don't panic** - our pre-commit hooks should catch most issues
2. **Run diagnostics**: `pnpm check:corruption`
3. **Restore files**: `git checkout origin/main -- path/to/corrupted/file.tsx`
4. **Batch restore**: For many files, use the corruption detection script's output
5. **Commit fixes**: Document the recovery in your commit message

### Build Failures

If builds suddenly fail after formatting/linting operations:

1. Check for file corruption: `pnpm check:corruption`
2. Verify TypeScript: `pnpm typecheck`
3. Check for missing dependencies: `pnpm install`
4. Compare bundle sizes: `pnpm bundle:compare`

### Large Cleanup Operations

For major refactoring or cleanup work:

1. **Create a feature branch** with descriptive name
2. **Save bundle baseline**: `pnpm bundle:baseline`
3. **Make incremental commits** - avoid massive single commits
4. **Test frequently**: Run corruption checks and builds
5. **Document changes** in commit messages and PR description

## 📋 Code Standards

### TypeScript

- Use strict TypeScript settings
- Prefer type guards over type assertions
- Prefix unused parameters with underscore: `_param`
- Handle undefined/null appropriately using optional chaining

### React/Components

- Follow existing patterns in the codebase
- Use proper TypeScript interfaces for props
- Implement error boundaries for complex components
- Follow the established directory structure

### Styling

- Use Tailwind CSS classes
- Follow the brand system:
  - Deep Navy: `#0C5C3D`
  - Warm Gold: `#D4A537`
  - Charcoal: `#22E22E`
- Use existing design tokens and components

### Git Workflow

- **Branch naming**: `feature/description`, `fix/issue-name`, `chore/cleanup-task`
- **Commit messages**: Clear, descriptive messages following conventional commits
- **Pre-commit hooks**: Never bypass with `--no-verify` unless absolutely necessary
- **Small PRs**: Prefer smaller, focused changes over large PRs

## 🔧 Development Tools

### Required Setup

1. **Node.js 22.x**: Use the specified version
2. **pnpm 9+**: Package manager
3. **Git hooks**: Automatically configured via Husky
4. **VS Code** (recommended): Use workspace settings

### Recommended Extensions

- TypeScript and JavaScript Language Features
- Tailwind CSS IntelliSense
- ESLint
- Prettier
- GitLens

### Environment Configuration

The project includes all necessary configuration files:

- `.eslintrc.*` - Linting rules
- `.prettierrc` - Code formatting
- `tsconfig.json` - TypeScript configuration
- `tailwind.config.js` - Styling framework
- `vite.config.ts` - Build tool configuration

## 🎯 Areas for Contribution

### High Priority

- **Performance optimizations**: Bundle size, runtime performance
- **Accessibility improvements**: ARIA compliance, keyboard navigation
- **Test coverage**: Unit tests, integration tests
- **Documentation**: User guides, API documentation

### Medium Priority

- **UI/UX enhancements**: Following established brand guidelines
- **Feature additions**: New writing tools, export formats
- **Developer experience**: Better tooling, documentation

### Ongoing Maintenance

- **Dependency updates**: Keep packages current and secure
- **Bug fixes**: Address issues in the bug tracker
- **Code cleanup**: Refactoring, removing technical debt
- **Monitoring**: Bundle size tracking, performance metrics

## 📚 Architecture Overview

### Key Directories

- `src/components/` - React components organized by feature
- `src/features/` - Major feature modules (plotboards, export, etc.)
- `src/services/` - Business logic and API services
- `src/stores/` - State management (Zustand)
- `src/utils/` - Utility functions and helpers
- `scripts/` - Development and maintenance scripts
- `docs/` - Project documentation

### Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS
- **Build**: Vite, TypeScript
- **Testing**: Vitest, Playwright
- **State**: Zustand, React Context
- **Routing**: React Router
- **Linting**: ESLint, Prettier
- **Git Hooks**: Husky, lint-staged

## 🤝 Getting Help

- **Issues**: Check existing issues or create a new one
- **Discussions**: Use GitHub discussions for questions
- **Documentation**: Check `/docs` directory for detailed guides
- **Code**: Look at existing implementations for patterns

## 📖 Additional Resources

- [File Corruption Prevention Guide](docs/FILE_CORRUPTION_PREVENTION.md)
- [Bundle Analysis Reports](reports/) (generated locally)
- [Development Scripts](scripts/) (automation tools)

---

**Thank you for contributing to Inkwell!** 🙏

Every contribution, no matter how small, helps make Inkwell better for writers everywhere.
