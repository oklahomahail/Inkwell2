# Supabase Authentication & Branding Checklist

This checklist covers all required Supabase configuration and branding consistency checks for the Inkwell platform.

## ✅ Supabase Configuration Checklist

### 1. Site URL Configuration

**Status**: ⚠️ NEEDS VERIFICATION IN SUPABASE DASHBOARD

- [ ] **Set Site URL** in Supabase Dashboard → Authentication → URL Configuration
  - Should be: `https://inkwell.leadwithnexus.com` (with protocol)
  - Location: Supabase Dashboard → Authentication → URL Configuration → Site URL

**Action Required**: Manually verify in Supabase dashboard

### 2. Redirect URLs Configuration

**Status**: ⚠️ CRITICAL - MUST BE CONFIGURED

- [ ] **Add Additional Redirect URLs** in Supabase Dashboard:
  - **Production callback**: `https://inkwell.leadwithnexus.com/auth/callback`
  - **Production wildcard**: `https://inkwell.leadwithnexus.com/**`
  - **Development callback**: `http://localhost:5173/auth/callback`
  - **Development wildcard**: `http://localhost:5173/**`
  - Location: Supabase Dashboard → Authentication → URL Configuration → Redirect URLs

**⚠️ CRITICAL**: The callback URL `/auth/callback` MUST be whitelisted or Supabase will drop the `redirect_to` parameter and you'll get infinite redirect loops!

**Action Required**: Manually add all four URLs to Supabase dashboard

### 3. Code Implementation - Auth Callback Route

**Status**: ✅ IMPLEMENTED & HARDENED (Oct 2025)

**Robust callback route** ([src/pages/AuthCallback.tsx](src/pages/AuthCallback.tsx)):

```typescript
// Supports multiple Supabase auth flows:
// 1. Modern code flow: ?code=...
// 2. Legacy OTP flow: ?token_hash=...&type=signup
// 3. Implicit flow: #access_token=...&refresh_token=...
// 4. Type-only flow: ?type=signup (email confirmation only)

// Multi-format parameter extraction
const code = getParam(url, 'code');
const tokenHash = getParam(url, 'token_hash');
const type = getParam(url, 'type');

// Comprehensive flow handling with fallbacks
if (code) {
  // Modern flow with PKCE
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  // ...
} else if (tokenHash) {
  // Legacy/verify-OTP flow
  const { data, error } = await supabase.auth.verifyOtp({
    type: verifyType,
    token_hash: tokenHash,
  });
  // ...
} else if (type && !code && !tokenHash) {
  // Type-only flow (email confirmation)
  // First check for existing session
  const { data: sessionData } = await supabase.auth.getSession();

  if (sessionData?.session) {
    // Use existing session
    go(redirectTo, { replace: true });
    return;
  }

  // For signup type with no token/hash, perform double session check
  if (type === 'signup') {
    // Double-check for session before redirecting
    const { data: finalSessionCheck } = await supabase.auth.getSession();

    if (finalSessionCheck?.session) {
      // Session found on second check
      go(redirectTo, { replace: true });
      return;
    }

    // Show confirmation message
    go(`/sign-in?notice=confirmed&redirect=${encodeURIComponent(redirectTo)}`, {
      replace: true,
    });
    return;
  }
}

// Final fallback for edge cases
const { data: lastResortSession } = await supabase.auth.getSession();
if (lastResortSession?.session) {
  // Use existing session if available
  // ...
}
```

✅ **Enhanced security & UX features**:

1. **Multi-format support** for all Supabase auth flows
2. **Session recovery** for stripped parameters
3. **User-friendly notices** for email confirmation
4. **Robust error handling** with detailed logging
5. **Anti-loop protection** with sentinel parameters
6. **Safe redirect validation** to prevent open redirects
7. **Double session check** for type=signup with no token/hash
8. **Hash fragment support** for access_token/refresh_token extraction

**No action required** - Implementation is hardened against edge cases

### 4. Code Implementation - emailRedirectTo

**Status**: ✅ UPDATED - Now uses callback route

**Current Implementation** ([src/context/AuthContext.tsx:61](src/context/AuthContext.tsx#L61)):

```typescript
const finalRedirect = redirectPath ?? '/profiles';
const origin = window.location.origin;

// Build callback URL with the intended destination as a query param
const callbackUrl = `${origin}/auth/callback?next=${encodeURIComponent(finalRedirect)}`;

const { error } = await supabase.auth.signInWithOtp({
  email,
  options: {
    emailRedirectTo: callbackUrl,
    shouldCreateUser: true,
  },
});
```

✅ **How the flow works**:

1. User clicks magic link in email
2. Supabase redirects to: `https://inkwell.leadwithnexus.com/auth/callback?code=xxx&next=/profiles`
3. AuthCallback page exchanges code for session
4. User is redirected to their intended destination (e.g., `/profiles` or `/p/project-123`)

**No action required** - Implementation is correct

### 5. Auth State Management

**Status**: ✅ LOADING-AWARE

**ProtectedRoute** ([src/components/ProtectedRoute.tsx](src/components/ProtectedRoute.tsx)):

```typescript
const { user, loading } = useAuth();

// Show spinner while checking auth status (prevents false redirects)
if (loading) {
  return <LoadingSpinner />;
}

// Only redirect if truly unauthenticated
if (!user) {
  return <Navigate to={`/sign-in?redirect=${location.pathname}`} replace />;
}
```

✅ **Prevents race conditions** by waiting for initial session check to complete before redirecting

**No action required** - Implementation is correct

### 6. Service Worker Management

**Status**: ⚠️ ACTION RECOMMENDED POST-DEPLOYMENT

**Current Status**:

- Service worker is conditionally registered via `pwaService.ts`
- Only registers in production mode

**Recommended Actions**:

1. **Unregister any existing service workers**:

   ```javascript
   // Open browser console on production site and run:
   navigator.serviceWorker.getRegistrations().then((registrations) => {
     registrations.forEach((registration) => registration.unregister());
   });
   ```

2. **Clear site data**:
   - Chrome: DevTools → Application → Clear storage → Clear site data
   - Firefox: DevTools → Storage → Clear All
   - Safari: Develop → Empty Caches

3. **Hard reload**:
   - Chrome/Firefox: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
   - Safari: Cmd+Option+R

**Action Required**: Run these steps on production after deploy

---

## ✅ Branding Consistency Checklist

### 1. Brand Colors - Tailwind Configuration

**Status**: ✅ CORRECT

**Defined in** [tailwind.config.ts:9-12](tailwind.config.ts#L9-L12):

```typescript
colors: {
  inkwell: {
    blue: '#13294B',  // brand blue
    gold: '#D4AF37',  // accent gold
  },
}
```

✅ Colors correctly defined and available as:

- `bg-inkwell-blue` / `text-inkwell-blue`
- `bg-inkwell-gold` / `text-inkwell-gold`

### 2. Sign-In Page Branding

**Status**: ✅ CORRECT

**Current Implementation** ([src/pages/SignIn.tsx](src/pages/SignIn.tsx)):

- ✅ Background: `bg-inkwell-blue` (#13294B)
- ✅ Logo: `/brand/inkwell-lockup-dark.svg` (fixed from broken `/logo-dark.png`)
- ✅ Tagline: "find your story, weave it well"
- ✅ Button hover: `hover:bg-inkwell-gold`
- ✅ Input focus: `focus:border-inkwell-blue`

**No action required** - Branding is consistent

### 3. Other Pages Using Brand Colors

**Files using Inkwell branding** (verified via grep):

- ✅ [src/pages/SignIn.tsx](src/pages/SignIn.tsx)
- ✅ [src/pages/Login.tsx](src/pages/Login.tsx)
- ✅ [src/pages/AuthCallback.tsx](src/pages/AuthCallback.tsx) - NEW
- ✅ [src/components/ProtectedRoute.tsx](src/components/ProtectedRoute.tsx) - UPDATED
- ✅ [src/components/Layout/Footer.tsx](src/components/Layout/Footer.tsx)
- ✅ [src/components/Layout/FooterLight.tsx](src/components/Layout/FooterLight.tsx)
- ✅ [src/components/Brand/InkwellLogo.tsx](src/components/Brand/InkwellLogo.tsx)
- ✅ [src/components/Brand/InkwellSplash.tsx](src/components/Brand/InkwellSplash.tsx)
- ✅ [src/components/Brand/BrandShowcase.tsx](src/components/Brand/BrandShowcase.tsx)
- ✅ [src/components/ui/LoadingComponents.tsx](src/components/ui/LoadingComponents.tsx)
- ✅ [src/components/ui/EmptyStates.tsx](src/components/ui/EmptyStates.tsx)
- ✅ [src/components/ui/BrandedEmptyState.tsx](src/components/ui/BrandedEmptyState.tsx)
- ✅ [src/components/ErrorBoundary/AppErrorBoundary.tsx](src/components/ErrorBoundary/AppErrorBoundary.tsx)

**Branding Documentation**:

- ✅ [docs/BRANDING_GUIDE.md](docs/BRANDING_GUIDE.md)
- ✅ [docs/BRAND_ACCESSIBILITY_GUIDE.md](docs/BRAND_ACCESSIBILITY_GUIDE.md)
- ✅ [docs/COLORS.md](docs/COLORS.md)

### 4. Logo Assets

**Status**: ✅ ASSETS VERIFIED

**Logo Files** (all exist in `/public/brand/`):

- ✅ `inkwell-lockup-dark.svg` - Used in Sign-In page
- ✅ `inkwell-lockup-horizontal.svg`
- ✅ `inkwell-feather-navy.svg`
- ✅ `inkwell-feather-gold.svg`
- ✅ `inkwell-wordmark-navy.svg`
- ✅ `inkwell-wordmark-gold.svg`
- ✅ `inkwell-icon-square.svg`

---

## 🚀 Deployment Actions

### Pre-Deployment Checklist

- [x] Code uses callback route for auth redirects
- [x] Callback route exchanges code for session
- [x] ProtectedRoute is loading-aware
- [x] Brand colors defined in Tailwind config
- [x] Sign-in page uses correct branding and logo
- [ ] Supabase Site URL configured
- [ ] Supabase Redirect URLs configured (including /auth/callback!)

### Post-Deployment Actions

**1. Verify Supabase Configuration**:

```bash
# Navigate to: https://app.supabase.com/project/YOUR_PROJECT/auth/url-configuration

# Verify Site URL:
https://inkwell.leadwithnexus.com

# Verify Redirect URLs include ALL of these:
https://inkwell.leadwithnexus.com/auth/callback
https://inkwell.leadwithnexus.com/**
http://localhost:5173/auth/callback
http://localhost:5173/**
```

**2. Clear Service Worker & Cache**:

```javascript
// In browser console on https://inkwell.leadwithnexus.com:

// 1. Unregister all service workers
navigator.serviceWorker.getRegistrations().then((registrations) => {
  console.log(`Found ${registrations.length} service workers`);
  registrations.forEach((registration) => {
    registration.unregister();
    console.log('Unregistered:', registration.scope);
  });
});

// 2. Clear all caches
caches.keys().then((names) => {
  names.forEach((name) => caches.delete(name));
  console.log('Cleared all caches');
});

// 3. Hard reload (Cmd+Shift+R or Ctrl+Shift+R)
```

**3. Test Full Auth Flow**:

- [ ] Visit https://inkwell.leadwithnexus.com/sign-in
- [ ] Enter email and click "Send magic link"
- [ ] Check email for magic link
- [ ] Click magic link in email
- [ ] **Verify redirect to `/auth/callback` with code parameter**
- [ ] **Verify immediate redirect to intended destination** (e.g., `/profiles`)
- [ ] Verify user is signed in (check for session)
- [ ] Try accessing protected route (should stay authenticated)
- [ ] Test deep linking: go to protected page while logged out, sign in, verify redirect back

**4. Verify Branding**:

- [ ] Check logo displays on sign-in page
- [ ] Verify Inkwell blue background (#13294B)
- [ ] Verify gold hover state (#D4AF37)
- [ ] Check tagline: "find your story, weave it well"
- [ ] Verify loading spinner uses Inkwell blue

---

## 📋 Summary Status

| Item                           | Status | Action Required                                        |
| ------------------------------ | ------ | ------------------------------------------------------ |
| Auth callback route            | ✅     | None - implemented                                     |
| emailRedirectTo uses callback  | ✅     | None - uses `/auth/callback`                           |
| Loading-aware route protection | ✅     | None - prevents race conditions                        |
| Auth state management          | ✅     | None - proper session handling                         |
| Brand colors in Tailwind       | ✅     | None                                                   |
| Sign-in page branding          | ✅     | None - logo fixed                                      |
| Supabase Site URL              | ⚠️     | **Manual verification in dashboard**                   |
| Supabase Redirect URLs         | ⚠️     | **Manual configuration - MUST include /auth/callback** |
| Service Worker cleanup         | ⚠️     | **Post-deployment browser action**                     |
| Logo assets verification       | ✅     | None - all files exist                                 |

---

## 🔗 Quick Links

- **Supabase Dashboard**: https://app.supabase.com/project/YOUR_PROJECT/auth/url-configuration
- **Production Site**: https://inkwell.leadwithnexus.com
- **Sign-In Page**: https://inkwell.leadwithnexus.com/sign-in
- **Auth Callback**: https://inkwell.leadwithnexus.com/auth/callback
- **GitHub Repository**: https://github.com/your-org/inkwell

---

## 📝 Notes

1. **Why the callback route is critical**: Supabase sends users back with a one-time code that MUST be exchanged for a session. Without this exchange, there's no session, and the ProtectedRoute redirects to sign-in, creating an infinite loop.

2. **Why loading state matters**: The initial session check takes ~50-200ms. Without a loading state, the guard thinks the user is unauthenticated during this window and redirects them, even if they just signed in.

3. **Redirect URL wildcards**: Using `/**` in Supabase redirect URLs allows any path on the domain. The specific `/auth/callback` URL must also be listed explicitly for Supabase to accept it.

4. **Deep linking support**: The `redirect` query parameter preserves the user's intended destination across the entire auth flow: protected page → sign-in → magic link → callback → original destination.

5. **Brand consistency**: All interactive elements use Inkwell blue for primary actions and gold for hover/accent states, maintaining visual consistency across the platform.

---

## 🔄 Auth Flow Diagram

```
User tries to access /p/project-123
           ↓
Not authenticated → ProtectedRoute redirects to /sign-in?redirect=%2Fp%2Fproject-123
           ↓
User enters email, clicks "Send magic link"
           ↓
signInWithEmail() sends emailRedirectTo: /auth/callback?next=%2Fp%2Fproject-123
           ↓
User clicks magic link in email
           ↓
Supabase redirects to: /auth/callback?code=ONE_TIME_CODE&next=%2Fp%2Fproject-123
           ↓
AuthCallback page:
  1. Extracts code and next params
  2. Calls supabase.auth.exchangeCodeForSession(code)
  3. Creates session
  4. Redirects to /p/project-123
           ↓
ProtectedRoute sees user is authenticated
           ↓
User lands on /p/project-123 ✅
```

---

## 🗄️ Database Setup - Auto-Create Profiles

### Overview

To prevent race conditions and ensure smooth onboarding, user profiles are automatically created via a PostgreSQL trigger when a user signs up.

### Migration File

Location: [`supabase/migrations/20250119000000_auto_create_profiles.sql`](supabase/migrations/20250119000000_auto_create_profiles.sql)

**What it does**:

1. Creates `public.profiles` table
2. Sets up Row Level Security (RLS) policies
3. Creates PostgreSQL trigger to auto-create profile on sign-up
4. Backfills profiles for existing users
5. Adds `onboarding_completed` flag for onboarding flow

### Running the Migration

**Option 1: Supabase Dashboard** (Easiest)

```
1. Go to https://app.supabase.com/project/YOUR_PROJECT/sql
2. Click "New query"
3. Copy contents of supabase/migrations/20250119000000_auto_create_profiles.sql
4. Paste and click "Run"
```

**Option 2: Supabase CLI**

```bash
supabase link --project-ref YOUR_PROJECT_ID
supabase db push
```

See [`supabase/README.md`](supabase/README.md) for detailed instructions.

### Profile Schema

```typescript
interface UserProfile {
  id: string; // UUID - references auth.users(id)
  email: string | null;
  display_name: string | null; // Set during onboarding
  avatar_url: string | null;
  timezone: string; // Defaults to 'UTC'
  onboarding_completed: boolean; // Controls onboarding flow
  created_at: string;
  updated_at: string;
}
```

### RLS Policies

- ✅ Users can SELECT their own profile (`auth.uid() = id`)
- ✅ Users can UPDATE their own profile (`auth.uid() = id`)
- ✅ Users can INSERT their own profile (`auth.uid() = id`)

### Testing the Migration

After running the migration, test it:

```sql
-- 1. Sign up a new user via magic link
-- 2. Verify profile was auto-created:
SELECT * FROM public.profiles WHERE id = auth.uid();

-- Expected result:
-- - Profile exists immediately
-- - email is populated
-- - display_name is NULL (set during onboarding)
-- - onboarding_completed is FALSE
```

### Onboarding Flow

With this migration in place, the onboarding flow is:

```
1. User signs up → Magic link sent
2. User clicks link → /auth/callback exchanges code
3. Database trigger auto-creates profile row
4. Callback redirects to /profiles
5. ProfilePicker checks: profile.onboarding_completed === false
6. If false → Show onboarding modal/wizard
7. User fills in display_name, timezone, etc.
8. Update profile, set onboarding_completed = true
9. Redirect to dashboard ✅
```

**Idempotent**: If user already completed onboarding, skip to dashboard.

### Post-Migration Checklist

- [ ] Run migration in Supabase dashboard
- [ ] Verify `public.profiles` table exists
- [ ] Check RLS is enabled
- [ ] Test profile auto-creation by signing up a new user
- [ ] Verify existing users have profiles backfilled
- [ ] Test that users can only access their own profile

---

## 🔒 Security Hardening Checklist

### 1. Open Redirect Protection

**Status**: ✅ IMPLEMENTED & ENHANCED

**Protection in place**:

Logic has been centralized in [`src/utils/safeRedirect.ts`](src/utils/safeRedirect.ts) to provide consistent behavior across components:

```typescript
// Centralize logic so tests are consistent everywhere.
export function normalizeSafeRedirect(
  raw: string | null | undefined,
  warn: (msg: string, value?: unknown) => void = console.warn,
  fallback = '/dashboard',
): string {
  if (!raw) return fallback;

  // Allow only root-relative paths like "/foo" (with optional ?query and #hash)
  const isRootRelative = raw.startsWith('/') && !raw.startsWith('//');

  if (isRootRelative) {
    try {
      const u = new URL(raw, 'http://local.test'); // dummy base
      // Preserve path + query + hash
      const normalized = `${u.pathname}${u.search}${u.hash}`;
      return normalized || fallback;
    } catch {
      warn('Blocked unsafe redirect', raw);
      return fallback;
    }
  }

  // Absolute/protocol-relative/anything else → warn + fallback
  warn('Blocked unsafe redirect', raw);
  return fallback;
}
```

**Key improvements**:

1. **Query string preservation**: Now correctly preserves query parameters and hash fragments
2. **Explicit warning function**: Takes `console.warn` as a parameter, enabling proper test spying
3. **Centralized implementation**: Single source of truth used by both `SignIn.tsx` and `AuthCallback.tsx`
4. **Better pattern matching**: Uses URL parsing for more robust validation

### 2. Tighten Redirect URLs (Post-Stabilization)

**Status**: ⚠️ TODO AFTER TESTING STABILIZES

**Current Configuration** (permissive for development):

```

https://inkwell.leadwithnexus.com/auth/callback
https://inkwell.leadwithnexus.com/**
http://localhost:5173/auth/callback
http://localhost:5173/**

```

**Recommended Final Configuration** (production-hardened):

```

https://inkwell.leadwithnexus.com
https://inkwell.leadwithnexus.com/auth/callback
http://localhost:5173
http://localhost:5173/auth/callback

```

**Action Required**: Once stable, remove wildcard `/**` URLs to reduce attack surface

### 3. OAuth Provider Support (Future)

**Status**: 📋 READY FOR FUTURE IMPLEMENTATION

When enabling Google/Apple sign-in, use the same callback flow:

```typescript
await supabase.auth.signInWithOAuth({
  provider: 'google', // or 'apple'
  options: {
    redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
  },
});
```

**Supabase Dashboard Configuration**:

- **Google**: Add authorized redirect URIs in Google Cloud Console
  - `https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback`
  - `https://inkwell.leadwithnexus.com/auth/callback`
- **Apple**: Configure return URLs and Services ID
  - `https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback`

### 4. Enhanced Error Handling

**Status**: ✅ IMPLEMENTED

**Error cases now handled**:

1. **Missing code**: Redirects to `/sign-in?error=missing_code`
2. **Exchange failure**: Shows user-friendly error page with retry button
3. **Expired/used link**: Detects and shows specific error message
4. **Stale magic link**: Prompts user to request a new link

Example from [AuthCallback.tsx:56-62](src/pages/AuthCallback.tsx#L56-L62):

```typescript
if (exchangeError) {
  console.error('[AuthCallback] Exchange failed:', exchangeError);
  if (exchangeError.message?.includes('expired') || exchangeError.message?.includes('used')) {
    throw new Error('This link has expired or been used. Please request a new one.');
  }
  throw exchangeError;
}
```

### 5. Auth Event Logging

**Status**: ✅ BASIC LOGGING IN PLACE

**Current logging points**:

- ✅ `[Auth] Sending magic link with redirect to: <path>`
- ✅ `[Auth] Sign-in failed: <error>`
- ✅ `[AuthCallback] Exchanging code for session`
- ✅ `[AuthCallback] Session created, redirecting to: <path>`
- ✅ `[AuthCallback] No code found in URL`
- ✅ `[AuthCallback] Exchange failed: <error>`
- ✅ `[AuthCallback] Rejected absolute URL redirect: <path>`

**Future enhancement**: Consider adding Sentry breadcrumbs:

```typescript
import * as Sentry from '@sentry/react';

// In exchangeCodeForSession error handler:
Sentry.addBreadcrumb({
  category: 'auth',
  message: 'Code exchange failed',
  level: 'error',
  data: { error: exchangeError.message },
});
```

### 6. Manual Edge Case Testing Checklist

**Status**: ⚠️ MANUAL TESTING REQUIRED

- [ ] **Stale magic link**: Use a link twice → expect graceful error
- [ ] **Missing code param**: Navigate to `/auth/callback` without code → redirect to `/sign-in?error=missing_code`
- [ ] **Complex deep link**: Try `/p/abc?tab=2&draft=1` → preserved through auth flow
- [ ] **Open redirect attempt**: Try `next=https://evil.com` → should redirect to `/profiles` with warning
- [ ] **Protocol-relative URL**: Try `next=//evil.com` → should redirect to `/profiles` with warning
- [ ] **Invalid path**: Try `next=<script>alert(1)</script>` → should redirect to `/profiles`

### 7. Preview/Development Environment URLs

**Status**: ⚠️ TODO WHEN USING VERCEL PREVIEW

**For Vercel preview deployments**:

Add preview domain temporarily to Redirect URLs:

```
https://inkwell-<COMMIT_HASH>.vercel.app/auth/callback
```

**Security note**: Prune preview URLs when done to minimize attack surface

### 8. CI Authentication Smoke Test

**Status**: 🆕 RECOMMENDED IMPLEMENTATION

**Suggested Approach**:

Add a smoke test in the CI pipeline that runs against your Vercel preview deployment to catch regressions in the authentication flow, especially after Supabase SDK upgrades:

```yaml
# In .github/workflows/ci.yml
jobs:
  # ... existing jobs

  e2e-auth-smoke-test:
    name: Auth Flow Smoke Test
    needs: [deploy-preview] # Run after preview deployment
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'

      - name: Install Playwright
        run: npm init playwright@latest --yes

      - name: Run Auth Smoke Test
        run: npx playwright test auth-smoke.spec.ts
        env:
          PREVIEW_URL: ${{ needs.deploy-preview.outputs.preview_url }}
          TEST_EMAIL: 'test-user@example.com' # Use a Supabase test account
```

**Example Test** (tests/auth-smoke.spec.ts):

```typescript
import { test, expect } from '@playwright/test';

test('Authentication flow preserves redirect URL with query parameters', async ({ page }) => {
  // Test complex path with query params
  const targetPath = '/p/test-123?tab=characters&view=grid';

  // 1. Visit sign-in page with redirect
  await page.goto(`${process.env.PREVIEW_URL}/sign-in?redirect=${encodeURIComponent(targetPath)}`);

  // 2. Fill in email (using mock mode if available)
  await page.fill('input[type="email"]', process.env.TEST_EMAIL);
  await page.click('button[type="submit"]');

  // 3. Verify success message shown
  await expect(page.locator('text=Check your email')).toBeVisible();

  // 4. In mock mode: simulate OTP flow by directly calling the callback URL
  if (process.env.MOCK_AUTH === 'true') {
    // This would depend on your mock implementation
    await page.goto(
      `${process.env.PREVIEW_URL}/auth/callback?code=mock-code&redirect=${encodeURIComponent(targetPath)}`,
    );

    // 5. Verify redirected to original page with query params preserved
    expect(page.url()).toContain(targetPath);
  }
});
```

**Benefits**:

1. Catches breaking changes in Supabase SDK upgrades
2. Validates that query parameters are preserved through redirect flow
3. Ensures auth callback works correctly in production environments
4. Can be extended to test error paths and security protections

---

## 📋 Complete Summary Status

| Item                           | Status | Action Required                                        |
| ------------------------------ | ------ | ------------------------------------------------------ |
| Auth callback route            | ✅     | None - implemented                                     |
| emailRedirectTo uses callback  | ✅     | None - uses `/auth/callback`                           |
| Loading-aware route protection | ✅     | None - prevents race conditions                        |
| Auth state management          | ✅     | None - proper session handling                         |
| **Open redirect protection**   | ✅     | None - safe path validation in place                   |
| **Enhanced error handling**    | ✅     | None - expired/used links handled gracefully           |
| **Auth event logging**         | ✅     | Optional: Add Sentry breadcrumbs                       |
| Brand colors in Tailwind       | ✅     | None                                                   |
| Sign-in page branding          | ✅     | None - logo fixed                                      |
| **Database migration created** | ✅     | **Run migration in Supabase**                          |
| **UserProfile types defined**  | ✅     | None                                                   |
| Supabase Site URL              | ⚠️     | **Manual verification in dashboard**                   |
| Supabase Redirect URLs         | ⚠️     | **Manual configuration - MUST include /auth/callback** |
| **Tighten redirect URLs**      | ⚠️     | **Remove wildcards after testing stabilizes**          |
| Service Worker cleanup         | ⚠️     | **Post-deployment browser action**                     |
| **Manual edge case testing**   | ⚠️     | **Test stale links, open redirects, deep linking**     |
| Logo assets verification       | ✅     | None - all files exist                                 |
| **OAuth providers**            | 📋     | Future: Add Google/Apple configuration                 |
