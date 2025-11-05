# Contributing to Inkwell

Thank you for considering contributing to Inkwell! This document provides guidelines and instructions for the development process.

## Development Workflow

### Setup

1. Fork the repository and clone it locally
2. Install dependencies: `pnpm install`
3. Create a branch for your changes: `git checkout -b feature/your-feature-name`
4. Make your changes
5. Run tests: `pnpm test`
6. Update README tree if needed: `pnpm tree:update`

### Branch Naming

Use the following prefixes for branches:

- `feature/` - New features or enhancements
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring without functional changes
- `test/` - Adding or updating tests

Example: `feature/add-character-tagging`

### Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

Types:

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to the build process or auxiliary tools

Examples:

- `feat(editor): add auto-save functionality`
- `fix(timeline): correct date calculation logic`

### Pull Requests

1. Ensure your branch is up to date with the main branch
2. Update the README project tree: `pnpm tree:update`
3. Make sure all tests pass: `pnpm test`
4. Create a pull request with a clear description of the changes
5. Link any related issues
6. Wait for code review and address any feedback

### Code Style and Quality

- Follow TypeScript best practices
- Maintain code consistency with the existing style
- Add meaningful comments for complex logic
- Write tests for new functionality
- Keep bundle size in mind

## Project Tree

The repository includes an auto-generated project tree in the README. If you add or move directories, please update the tree:

```bash
pnpm tree:update
```

This command will automatically update the README.md file with the current project structure.

## Pull Request Checklist

- [ ] Code follows the style guidelines
- [ ] Documentation has been updated (if necessary)
- [ ] Tests have been added or updated
- [ ] README tree has been updated (`pnpm tree:update`)
- [ ] All tests pass
- [ ] All CI checks pass

## Getting Help

If you have questions or need help, please open an issue or reach out to the maintainers.
