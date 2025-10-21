# Auth Flow Troubleshooting Guide

## Problem: Magic link redirects back to sign-in instead of profiles

This issue occurs when Supabase is not redirecting to the `/auth/callback` route correctly.

---

## Step 1: Check Browser Console Logs

After requesting a magic link, check your browser console. You should see:

```
[Auth] Sending magic link with:
  - Final redirect destination: /profiles
  - Callback URL (emailRedirectTo): http://localhost:5173/auth/callback?next=%2Fprofiles
  - Origin: http://localhost:5173
⚠️  IMPORTANT: This callback URL must be whitelisted in Supabase Dashboard!
  - Go to: Supabase → Authentication → URL Configuration → Redirect URLs
  - Add: http://localhost:5173/auth/callback
[Auth] Magic link sent successfully! Check your email.
```

**Note the callback URL** - this is what Supabase will redirect to.

---

## Step 2: Click the Magic Link and Check Logs Again

After clicking the magic link in your email, check the console again. You should see:

```
[AuthCallback] Starting auth callback with params: {
  hasCode: true,
  codeLength: 43,
  nextParam: "/profiles",
  normalizedNext: "/profiles",
  fullURL: "http://localhost:5173/auth/callback?code=xxx&next=%2Fprofiles",
  ...
}
[AuthCallback] Exchanging code for session
[AuthCallback] Session created, redirecting to: /profiles
```

---

## Common Issues and Solutions

### Issue 1: "No code found in URL"

**Symptoms:**

```
[AuthCallback] No code found in URL
[AuthCallback] Full URL was: http://localhost:5173/
```

**Cause**: Supabase is redirecting to `/` instead of `/auth/callback` because the callback URL is not whitelisted.

**Solution**: Add the callback URL to Supabase redirect URLs:

1. Go to: https://app.supabase.com/project/YOUR_PROJECT/auth/url-configuration
2. Scroll to "Redirect URLs"
3. Add **exactly** these URLs:
   - `http://localhost:5173/auth/callback`
   - `http://localhost:5173/**`
   - `https://inkwell.leadwithnexus.com/auth/callback`
   - `https://inkwell.leadwithnexus.com/**`
4. Click "Save"

**⚠️ Critical**: The URLs must match **exactly** including the protocol (`http://` or `https://`)

---

### Issue 2: "Exchange failed" with error message

**Symptoms:**

```
[AuthCallback] Exchange failed: Error: Invalid code
[AuthCallback] Callback failed: Invalid code
```

**Possible causes:**

1. **Link already used**: Magic links are one-time use only
2. **Link expired**: Magic links expire after a certain time (default: 1 hour)
3. **Code mismatch**: The code in the URL doesn't match Supabase's records

**Solution**: Request a fresh magic link and try again

---

### Issue 3: Redirects to sign-in with no error

**Symptoms:**

- Click magic link
- Briefly see loading spinner
- Immediately redirected back to `/sign-in`

**Cause**: One of two things:

1. The callback URL is not whitelisted (see Issue 1)
2. The session was created but `/profiles` is a protected route and the session check is failing

**Debugging:**

1. Open browser console
2. Request a new magic link
3. Check for the logs described in Step 1 and Step 2 above
4. If you see `[AuthCallback] Session created, redirecting to: /profiles` but still end up at `/sign-in`, check if there's a session:
   ```javascript
   // In browser console:
   const { data } = await supabase.auth.getSession();
   console.log('Current session:', data.session);
   ```

---

### Issue 4: Hash-based redirect (Supabase using implicit flow)

**Symptoms:**

```
[AuthCallback] Starting auth callback with params: {
  hasCode: false,
  hash: "#access_token=xxx&refresh_token=yyy"
}
```

**Cause**: Supabase is configured to use implicit flow instead of PKCE flow.

**Solution**: This is actually handled! The code checks both query params (`?code=`) and hash params (`#access_token=`).

If you see this, the session should still be created. If not, check:

1. Supabase project settings → Authentication → URL Configuration → Flow Type
2. Ensure it's set to "PKCE" (recommended) or "Implicit"

---

## Step 3: Verify Supabase Configuration

### Required Supabase Settings

Go to: https://app.supabase.com/project/YOUR_PROJECT/auth/url-configuration

**Site URL** (must be set):

- Local: `http://localhost:5173`
- Production: `https://inkwell.leadwithnexus.com`

**Redirect URLs** (must include all of these):

- `http://localhost:5173/auth/callback`
- `http://localhost:5173/**`
- `https://inkwell.leadwithnexus.com/auth/callback`
- `https://inkwell.leadwithnexus.com/**`

**Email Templates** (check the magic link URL):

1. Go to: Supabase → Authentication → Email Templates
2. Click "Magic Link"
3. Verify the template contains: `{{ .ConfirmationURL }}`

---

## Step 4: Test the Complete Flow

### Manual Test Checklist

- [ ] 1. **Request magic link**:
  - Go to `/sign-in`
  - Enter email
  - Click "Send magic link"
  - Check console for `[Auth] Sending magic link with:` log

- [ ] 2. **Check email**:
  - Open email
  - Verify the link contains `/auth/callback`
  - If it doesn't, Supabase redirect URLs are not configured

- [ ] 3. **Click magic link**:
  - Click link in email
  - Should see "Signing you in..." loading screen
  - Check console for `[AuthCallback] Starting auth callback` log

- [ ] 4. **Verify redirect**:
  - Should land on `/profiles`
  - If you land on `/sign-in`, check console for errors

- [ ] 5. **Verify session**:
  ```javascript
  // In browser console:
  const { data } = await supabase.auth.getSession();
  console.log('Session:', data.session ? 'EXISTS' : 'MISSING');
  console.log('User:', data.session?.user?.email);
  ```

---

## Quick Fixes

### If you keep getting redirected to sign-in:

1. **Clear your browser cache and cookies**
2. **Disable any browser extensions** (especially ad blockers)
3. **Try in incognito/private mode**
4. **Check Supabase dashboard** → Authentication → Users to see if user was created
5. **Request a fresh magic link** (don't reuse old links)

---

## Still Not Working?

Check these logs and provide them for debugging:

1. **Sign-in console logs**:

   ```
   [Auth] Sending magic link with:
   ...
   ```

2. **Callback console logs**:

   ```
   [AuthCallback] Starting auth callback with params:
   ...
   ```

3. **Supabase configuration screenshot**:
   - Screenshot of Supabase → Authentication → URL Configuration

4. **Email magic link URL** (sanitized):
   - Copy the URL from the magic link email
   - Replace the actual code with `[REDACTED]`
   - Example: `http://localhost:5173/auth/callback?code=[REDACTED]&next=%2Fprofiles`

---

## Next Steps After Fixing

Once magic links work correctly:

1. [ ] **Run the database migration** to create profiles table:
   - See: `supabase/migrations/20250119000000_auto_create_profiles.sql`
   - Or: [SUPABASE_AUTH_CHECKLIST.md](SUPABASE_AUTH_CHECKLIST.md#database-setup)

2. [ ] **Test profile creation**:
   - Sign in with magic link
   - Should land on `/profiles`
   - Verify profile was auto-created in Supabase

3. [ ] **Tighten redirect URLs** (after stabilization):
   - Remove wildcard `/**` URLs
   - Keep only explicit callback URLs

---

## Useful Commands

### Check current session in console:

```javascript
const { data } = await supabase.auth.getSession();
console.log('Session:', data.session);
```

### Sign out in console:

```javascript
await supabase.auth.signOut();
console.log('Signed out');
```

### Check current user in console:

```javascript
const {
  data: { user },
} = await supabase.auth.getUser();
console.log('User:', user);
```

---

## Authentication Flow Enhancements (October 2025)

The authentication flow has been significantly enhanced to improve reliability and handle edge cases:

### Multiple Authentication Flow Support

Inkwell's AuthCallback.tsx now handles all Supabase authentication flow formats:

1. **Code flow** (`?code=...`) - Modern Supabase auth
2. **Token hash flow** (`?token_hash=...&type=signup`) - Legacy/OTP verification
3. **Type-only flow** (`?type=signup`) - Email confirmation without tokens
4. **Hash fragment flow** (`#access_token=...`) - JWT in hash fragment

### Silent Session Check for type=signup

For signup confirmations without token_hash (which can happen when email providers strip URL parameters):

```typescript
// Double session check for type=signup with no token/hash
if (type === 'signup') {
  console.log('[AuthCallback] Signup confirmation detected, skipping OTP verification');

  // Check for existing session one more time before sending to sign-in
  console.log('[AuthCallback] Double-checking for existing session before redirecting');
  const { data: finalSessionCheck } = await supabase.auth.getSession();

  if (finalSessionCheck?.session) {
    console.log('[AuthCallback] Found existing session on second check, proceeding to dashboard');
    go(redirectTo, { replace: true });
    return;
  }

  // For signup confirmations, we should show a success message and redirect to sign-in
  go(`/sign-in?notice=confirmed&redirect=${encodeURIComponent(redirectTo)}`, {
    replace: true,
  });
  return;
}
```

### User-Friendly Confirmation Banner

The sign-in page now displays a friendly confirmation banner when redirected with `?notice=confirmed`, providing better UX for email verification:

```typescript
// In AuthPage.tsx
const [searchParams] = useSearchParams();
const notice = searchParams.get('notice');

// Display user-friendly banner for confirmed email
{notice === 'confirmed' && (
  <div className="mb-6 rounded-md bg-green-50 p-4 text-sm text-green-800">
    <div className="flex">
      <div className="flex-shrink-0">
        <CheckCircleIcon className="h-5 w-5 text-green-400" />
      </div>
      <div className="ml-3">
        <p>Your email has been confirmed! You can now sign in.</p>
      </div>
    </div>
  </div>
)}
```

### Additional Safeguards

1. **Multiple session checks** - Checks for existing sessions at several points
2. **Robust parameter handling** - Extracts parameters from both search params and hash fragments
3. **Safe redirect validation** - Prevents open redirects with path normalization
4. **Anti-loop protection** - Adds sentinel parameters to prevent redirect loops
5. **Comprehensive logging** - Detailed console logs for troubleshooting
