# Inkwell Documentation

Welcome to the Inkwell documentation! This directory contains guides, technical references, and troubleshooting resources for users and developers.

---

## User Guides

### Core Features

- **[Autosave System](./autosave.md)** - How automatic saves work, performance metrics, troubleshooting
- **[Backup & Recovery](./backup.md)** - Shadow copies, manual backups, 3-tier recovery system
- **[Exporting Projects](./exporting.md)** - PDF, DOCX, Markdown, EPUB format guide with options and limitations

### Privacy & Data

- **[Privacy & Telemetry](./privacy.md)** - What data is collected, opt-out instructions, transparency

### Getting Started

- **[Onboarding Guide](./ONBOARDING.md)** - Welcome project, product tours, quick start documentation

---

## Developer Documentation

### Development Workflow

- **[Setup Guide](./dev/setup.md)** - Local development environment setup
- **[Linting & CI Playbook](./engineering/linting-and-ci-playbook.md)** - Code quality, pre-commit hooks, CI workflows

### Architecture

- **[React Hooks Safety](../HOOKS_SAFETY.md)** - Defensive guards, linting rules, MutationObserver patterns
- **[Recovery Service](../src/services/recoveryService.ts)** - Technical implementation of 3-tier recovery

### Operations

- **[Deployment Guide](./ops/01-deploy.md)** - Production deployment checklist
- **[Secrets Management](./ops/03-secrets.md)** - Environment variables, API keys

---

## Implementation Checklists

Internal implementation tracking (for contributors):

- **[EPUB Foundation](../.implementations/EPUB_FOUNDATION_CHECKLIST.md)** - EPUB 3.0 export implementation and QA
- **[Error Boundaries](../.implementations/ERROR_BOUNDARIES_CHECKLIST.md)** - 3-tier recovery system implementation
- **[Onboarding System](../.implementations/ONBOARDING_CHECKLIST.md)** - Welcome project and product tours

---

## Troubleshooting

### Common Issues

**Data Loss / Recovery**

- See [Backup & Recovery](./backup.md#troubleshooting)
- Check shadow copies (automatic snapshots)
- Verify recovery tier activations

**Autosave Problems**

- See [Autosave System](./autosave.md#troubleshooting)
- Check IndexedDB permissions
- Monitor latency metrics

**Export Failures**

- See [Exporting Projects](./exporting.md#troubleshooting)
- Verify feature flags (EPUB)
- Check browser popup blockers (PDF)

**Authentication Issues**

- See [Auth Troubleshooting](../AUTH_TROUBLESHOOTING.md)
- Check Supabase configuration
- Review email delivery settings

---

## Quick Links

- [Main README](../README.md) - Project overview and quickstart
- [Changelog](../CHANGELOG.md) - Version history and release notes
- [Roadmap](./product/roadmap.md) - Future features and timeline
- [Contributing Guidelines](../CONTRIBUTING.md) - How to contribute

---

## External Resources

- **Inkwell Homepage**: [writewithinkwell.com](https://writewithinkwell.com)
- **GitHub Repository**: [github.com/davehail/inkwell](https://github.com/davehail/inkwell)
- **Issue Tracker**: [github.com/davehail/inkwell/issues](https://github.com/davehail/inkwell/issues)
- **Support Email**: [privacy@writewithinkwell.com](mailto:privacy@writewithinkwell.com)

---

## Documentation Standards

All documentation follows these conventions:

- **Markdown format**: CommonMark specification
- **Headings**: ATX-style (`#`, `##`, `###`)
- **Links**: Relative paths from repository root
- **Code blocks**: Syntax-highlighted with language identifiers
- **Last updated**: Date stamp at bottom of each doc

---

**Last updated**: November 2025
**Documentation version**: v0.9.1
