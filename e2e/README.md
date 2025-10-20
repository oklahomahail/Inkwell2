# Authentication Flow Smoke Tests

This directory contains automated smoke tests for the Inkwell authentication flow.

## Purpose

These tests validate that:

1. The authentication flow correctly preserves redirect URLs with query parameters
2. The safe redirect protection blocks open redirect attempts
3. The Supabase integration continues to function after SDK updates

## Running Locally

```bash
# Install Playwright
pnpm add -D @playwright/test
pnpm exec playwright install --with-deps chromium

# Run the tests against local dev server
pnpm exec playwright test e2e/auth-smoke.spec.ts
```

## Running in CI

See the example workflow in `.github/workflows/examples/auth-smoke-test.yml` for how to run these tests in CI against:

- Vercel preview deployments
- Production deployments
- Any specified URL (via manual workflow trigger)

## Test Environment Variables

- `PREVIEW_URL`: The base URL to test against (default: http://localhost:5173)
- `TEST_EMAIL`: Email address to use for testing (default: test-user@example.com)
- `MOCK_AUTH`: When "true", tests will simulate magic link clicks (default: undefined)

## Adding New Tests

When adding new authentication-related features, consider adding smoke tests to validate:

1. The feature works end-to-end
2. Security protections are in place
3. The feature continues to work after dependency updates
