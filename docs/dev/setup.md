# Developer Setup Guide

This guide will help you set up Inkwell for local development.

## Prerequisites

- Node.js 20.x or later
- pnpm 9.x or later
- Git

## Getting the Code

```bash
# Clone the repository
git clone https://github.com/oklahomahail/Inkwell2.git
cd Inkwell2
```

## Environment Setup

1. Create a local environment file:

```bash
cp .env.example .env
```

2. Fill in the required environment variables in `.env`:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_BASE_URL=http://localhost:5173
```

### Supabase Configuration

To use authentication features:

1. Create a project at [Supabase](https://supabase.com)
2. Go to Project Settings → API
3. Copy your project URL and anon key
4. Add redirect URLs in Authentication → URL Configuration:
   - `http://localhost:5173/auth/callback`
   - `http://localhost:5173` (site URL)

> Note: For development, you can use mock AI mode by setting `VITE_AI_MOCK_MODE=true` to avoid needing real AI API keys.

## Installing Dependencies

```bash
pnpm install
```

## Starting the Development Server

```bash
pnpm dev
```

The application will be available at `http://localhost:5173`.

## Running Tests

```bash
# Run tests in watch mode
pnpm test

# Run tests once
pnpm test:run

# Run tests with coverage
pnpm test:coverage
```

## Type Checking

```bash
pnpm typecheck
```

## Linting

```bash
# Check code style
pnpm lint

# Fix automatic issues
pnpm lint:fix

# Run with more relaxed rules (warnings only)
pnpm lint:relaxed
```

## Building for Production

```bash
# Create a production build
pnpm build

# Preview the production build locally
pnpm preview
```

## Project Structure

- `src/` - Application source code
  - `components/` - React components
  - `services/` - Business logic and external integrations
  - `features/` - Self-contained feature modules
  - `utils/` - Shared utilities
  - `hooks/` - Custom React hooks
  - `types/` - TypeScript definitions
- `public/` - Static assets
- `tests/` - Test suites
- `scripts/` - Build and utility scripts

## First-Time Setup

When you first run the application:

1. You'll be prompted to create a profile
2. You can choose between Beginner and Pro modes
3. Optional tour will guide you through the UI

For development, you can clear local storage to reset the first-run experience:

```javascript
// In browser console
localStorage.clear();
```

## Common Issues

### Missing Environment Variables

If you see errors about missing environment variables, make sure your `.env` file includes all required variables from `.env.example`.

### TypeScript Errors

Run `pnpm typecheck` to see detailed type errors. Most common issues can be fixed by following the error messages.

### Tests Failing

Ensure you're using the correct Node.js version and that all dependencies are installed. Try running `pnpm install` again if needed.

## Repository Protection

To set up branch protection rules for the main branch, run the provided script:

```bash
./scripts/setup-branch-protection.sh
```

This script configures GitHub branch protection with the following settings:

1. Requires pull requests before merging
2. Requires 1 approval review
3. Enforces linear history
4. Blocks force pushes
5. Prevents branch deletion
6. Requires status checks to pass (lint, typecheck, test, build)

Note: To require deployments to succeed, you'll need to set this up manually in the GitHub UI, as the environment name must match your Vercel environment label exactly.
