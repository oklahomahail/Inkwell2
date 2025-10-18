# Clerk Environment Guard

## Overview

This guard prevents Clerk development/test keys from being deployed to production. It runs in two places:

1. **CI/CD Pipeline** - Blocks merges to `main` if dev keys are detected
2. **Runtime** (optional) - Warns developers locally if keys are misconfigured

## How It Works

### CI Guard (`scripts/verify-clerk-env.mjs`)

Runs automatically in GitHub Actions before build step.

**Behavior:**

- **On `main` branch:** Requires `pk_live_*` and `sk_live_*` keys (fails otherwise)
- **On PRs:** Allows `pk_test_*` and `sk_test_*` keys (warns but doesn't fail)
- **Missing keys:** Always fails

**Example output:**

```
✓ Clerk env check passed.
```

Or on failure:

```
✖ Invalid Clerk keys for main. Expected pk_live_/sk_live_. Got:
PUBLISHABLE=pk_test_abcd…
SECRET=sk_test_xy…
```

### Runtime Guard (`src/lib/guardClerkEnv.ts`)

Optional guard that runs in the browser during app initialization.

**Behavior:**

- Throws if `VITE_CLERK_PUBLISHABLE_KEY` is missing
- Warns if using test keys (expected locally/on previews)
- Logs success if using production keys

## Setup

### 1. GitHub Secrets

Add these secrets in **GitHub → Settings → Secrets and variables → Actions**:

```
VITE_CLERK_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxx
CLERK_SECRET_KEY=sk_live_xxxxxxxxxxxxx
```

### 2. Vercel Environment Variables

Set the same variables in **Vercel Dashboard → Settings → Environment Variables**:

**Production:**

- `VITE_CLERK_PUBLISHABLE_KEY` = `pk_live_xxxxx`
- `CLERK_SECRET_KEY` = `sk_live_xxxxx`

**Preview (optional - can use test keys):**

- `VITE_CLERK_PUBLISHABLE_KEY` = `pk_test_xxxxx`
- `CLERK_SECRET_KEY` = `sk_test_xxxxx`

### 3. Local Development

Create `.env.local` (git-ignored):

```bash
# .env.local - for local development
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxx
```

### 4. Enable Runtime Guard (Optional)

In your AppProviders or main entry point, add:

```typescript
// src/AppProviders.tsx
import { guardClerkEnv } from '@/lib/guardClerkEnv';

// Call once before ClerkProvider renders
guardClerkEnv();

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}>
      {children}
    </ClerkProvider>
  );
}
```

## Testing

### Test Locally

```bash
# Should pass with test keys
VITE_CLERK_PUBLISHABLE_KEY=pk_test_123 \
CLERK_SECRET_KEY=sk_test_456 \
pnpm run check:clerk-env
```

### Test CI Behavior

```bash
# Simulate main branch (should fail with test keys)
GITHUB_REF=refs/heads/main \
VITE_CLERK_PUBLISHABLE_KEY=pk_test_123 \
CLERK_SECRET_KEY=sk_test_456 \
pnpm run check:clerk-env
# ✖ Invalid Clerk keys for main...

# Simulate PR (should warn but pass)
GITHUB_EVENT_NAME=pull_request \
VITE_CLERK_PUBLISHABLE_KEY=pk_test_123 \
CLERK_SECRET_KEY=sk_test_456 \
pnpm run check:clerk-env
# ⚠ Using Clerk test keys on PR (okay for previews).
# ✓ Clerk env check passed.
```

## Troubleshooting

### CI failing with "Missing Clerk env vars"

**Solution:** Add the secrets to GitHub Actions:

1. Go to GitHub → Settings → Secrets and variables → Actions
2. Add `VITE_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`

### CI failing with "Invalid Clerk keys for main"

**Solution:** Ensure GitHub secrets use `pk_live_*` and `sk_live_*` prefixes, not test keys.

### Local app throws "Missing VITE_CLERK_PUBLISHABLE_KEY"

**Solution:** Create `.env.local` with your Clerk test keys:

```bash
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
```

### Vercel preview deploys failing

**Solution:** Add Clerk env vars to Vercel preview environment:

1. Vercel Dashboard → Settings → Environment Variables
2. Add both keys scoped to "Preview"
3. Use `pk_test_*` keys for previews (production keys for Production scope)

## Key Prefixes

| Prefix      | Environment         | Usage                            |
| ----------- | ------------------- | -------------------------------- |
| `pk_live_*` | Production          | Required for main branch deploys |
| `sk_live_*` | Production          | Required for main branch deploys |
| `pk_test_*` | Development/Preview | Allowed on PRs, local dev        |
| `sk_test_*` | Development/Preview | Allowed on PRs, local dev        |

## Related Files

- **CI Script:** [`scripts/verify-clerk-env.mjs`](../../scripts/verify-clerk-env.mjs)
- **Runtime Guard:** [`src/lib/guardClerkEnv.ts`](../../src/lib/guardClerkEnv.ts)
- **CI Workflow:** [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml)
- **Package Script:** `check:clerk-env` in [`package.json`](../../package.json)

## Security Best Practices

1. ✅ Never commit `.env` or `.env.local` to git
2. ✅ Use test keys for local development and PR previews
3. ✅ Use live keys only in production
4. ✅ Rotate keys if accidentally exposed
5. ✅ Keep secrets in GitHub Secrets and Vercel Environment Variables only
