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

**Status**: ✅ IMPLEMENTED

**New dedicated callback route** ([src/pages/AuthCallback.tsx](src/pages/AuthCallback.tsx)):

```typescript
// Exchanges one-time code for session
const code = params.get('code') || params.get('token_hash');
const next = params.get('next') || '/profiles';

const { error } = await supabase.auth.exchangeCodeForSession(code);
if (!error) {
  navigate(next, { replace: true });
}
```

✅ **Prevents infinite redirect loops** by:

1. Accepting the one-time code from Supabase
2. Exchanging it for a proper session
3. Redirecting to the intended destination

**Route added**: `/auth/callback` (public route, no auth required)

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

## 📋 Updated Summary Status

| Item                           | Status | Action Required                                        |
| ------------------------------ | ------ | ------------------------------------------------------ |
| Auth callback route            | ✅     | None - implemented                                     |
| emailRedirectTo uses callback  | ✅     | None - uses `/auth/callback`                           |
| Loading-aware route protection | ✅     | None - prevents race conditions                        |
| Auth state management          | ✅     | None - proper session handling                         |
| Brand colors in Tailwind       | ✅     | None                                                   |
| Sign-in page branding          | ✅     | None - logo fixed                                      |
| **Database migration created** | ✅     | **Run migration in Supabase**                          |
| **UserProfile types defined**  | ✅     | None                                                   |
| Supabase Site URL              | ⚠️     | **Manual verification in dashboard**                   |
| Supabase Redirect URLs         | ⚠️     | **Manual configuration - MUST include /auth/callback** |
| Service Worker cleanup         | ⚠️     | **Post-deployment browser action**                     |
| Logo assets verification       | ✅     | None - all files exist                                 |
