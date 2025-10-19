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

**Status**: ⚠️ NEEDS VERIFICATION IN SUPABASE DASHBOARD

- [ ] **Add Additional Redirect URLs** in Supabase Dashboard
  - Production: `https://inkwell.leadwithnexus.com/**`
  - Development: `http://localhost:5173/**`
  - Location: Supabase Dashboard → Authentication → URL Configuration → Redirect URLs

**Action Required**: Manually add both URLs to Supabase dashboard if not already present

### 3. Code Implementation - emailRedirectTo

**Status**: ✅ CORRECT

**Current Implementation** ([src/context/AuthContext.tsx:58](src/context/AuthContext.tsx#L58)):

```typescript
const redirectUrl = new URL(finalRedirect, window.location.origin).toString();

const { error } = await supabase.auth.signInWithOtp({
  email,
  options: {
    emailRedirectTo: redirectUrl,
    shouldCreateUser: true,
  },
});
```

✅ **Correctly using fully qualified URLs** - Uses `window.location.origin` which resolves to:

- Production: `https://inkwell.leadwithnexus.com`
- Development: `http://localhost:5173`

**No action required** - Implementation is correct

### 4. Auth Callback Handling

**Status**: ✅ CORRECT

**Current Implementation** ([src/context/AuthContext.tsx:34-44](src/context/AuthContext.tsx#L34-L44)):

```typescript
const {
  data: { subscription },
} = supabase.auth.onAuthStateChange((_event, session) => {
  setUser(session?.user ?? null);
  setLoading(false);

  // Fire dashboard view trigger on successful sign-in
  if (_event === 'SIGNED_IN' && session?.user) {
    triggerDashboardView();
  }
});
```

✅ **Properly handles auth state changes** including hash/code from magic link
✅ **Routes to appropriate location** after authentication

**No action required** - Callback handling is correct

### 5. Service Worker Management

**Status**: ⚠️ ACTION RECOMMENDED

**Current Status**:

- Service worker is conditionally registered via `pwaService.ts`
- Only registers in production mode
- Located at: [src/services/pwaService.ts](src/services/pwaService.ts)

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
- ✅ Logo: `/logo-dark.png` displayed
- ✅ Tagline: "find your story, weave it well"
- ✅ Button hover: `hover:bg-inkwell-gold`
- ✅ Input focus: `focus:border-inkwell-blue`

**No action required** - Branding is consistent

### 3. Other Pages Using Brand Colors

**Files using Inkwell branding** (verified via grep):

- ✅ [src/pages/SignIn.tsx](src/pages/SignIn.tsx)
- ✅ [src/pages/Login.tsx](src/pages/Login.tsx)
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

**Status**: ✅ ASSETS EXIST

**Required Logo Files**:

- ✅ `/logo-dark.png` - Used in Sign-In page
- ✅ `/brand/` directory - Contains brand assets

**Verification Needed**:

- [ ] Verify `/logo-dark.png` exists in `public/` directory
- [ ] Verify logo displays correctly on all pages

---

## 🚀 Deployment Actions

### Pre-Deployment Checklist

- [x] Code uses fully qualified URLs for auth redirects
- [x] Brand colors defined in Tailwind config
- [x] Sign-in page uses correct branding
- [ ] Supabase Site URL configured
- [ ] Supabase Redirect URLs configured

### Post-Deployment Actions

1. **Verify Supabase Configuration**:

   ```bash
   # Navigate to: https://app.supabase.com/project/YOUR_PROJECT/auth/url-configuration
   # Verify:
   # - Site URL: https://inkwell.leadwithnexus.com
   # - Redirect URLs include:
   #   - https://inkwell.leadwithnexus.com/**
   #   - http://localhost:5173/**
   ```

2. **Clear Service Worker & Cache**:

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

3. **Test Auth Flow**:
   - [ ] Visit https://inkwell.leadwithnexus.com/sign-in
   - [ ] Enter email and click "Send magic link"
   - [ ] Check email for magic link
   - [ ] Click magic link in email
   - [ ] Verify redirect to https://inkwell.leadwithnexus.com/profiles
   - [ ] Verify user is signed in

4. **Verify Branding**:
   - [ ] Check logo displays on sign-in page
   - [ ] Verify Inkwell blue background (#13294B)
   - [ ] Verify gold hover state (#D4AF37)
   - [ ] Check tagline: "find your story, weave it well"

---

## 📋 Summary Status

| Item                                      | Status | Action Required                  |
| ----------------------------------------- | ------ | -------------------------------- |
| emailRedirectTo uses fully qualified URLs | ✅     | None                             |
| Auth callback handling                    | ✅     | None                             |
| Brand colors in Tailwind                  | ✅     | None                             |
| Sign-in page branding                     | ✅     | None                             |
| Supabase Site URL                         | ⚠️     | Manual verification in dashboard |
| Supabase Redirect URLs                    | ⚠️     | Manual verification in dashboard |
| Service Worker cleanup                    | ⚠️     | Post-deployment browser action   |
| Logo assets verification                  | ⚠️     | Verify files exist               |

---

## 🔗 Quick Links

- **Supabase Dashboard**: https://app.supabase.com/project/YOUR_PROJECT/auth/url-configuration
- **Production Site**: https://inkwell.leadwithnexus.com
- **Sign-In Page**: https://inkwell.leadwithnexus.com/sign-in
- **GitHub Repository**: https://github.com/your-org/inkwell

---

## 📝 Notes

1. **Why fully qualified URLs matter**: Supabase requires absolute URLs for `emailRedirectTo` to prevent phishing attacks. The code correctly uses `window.location.origin` which dynamically resolves to the correct domain in both dev and production.

2. **Service Worker considerations**: Even though PWA is only enabled in production, any previously registered service workers might cache stale auth state. Clearing them ensures fresh authentication flow.

3. **Redirect URL wildcards**: Using `/**` in Supabase redirect URLs allows any path on the domain, which is necessary for deep linking (e.g., redirecting to `/p/project-123` after auth).

4. **Brand consistency**: All interactive elements use Inkwell blue for primary actions and gold for hover/accent states, maintaining visual consistency across the platform.
