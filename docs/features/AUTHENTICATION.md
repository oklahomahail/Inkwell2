# Supabase Authentication System

## Overview

Inkwell uses Supabase for secure, password-based and magic-link authentication. This unified flow powers sign-in, sign-up, and password recovery while maintaining offline session persistence.

## Purpose

- Provide secure user authentication with industry-standard practices
- Support password-based and magic-link (email) authentication
- Manage session lifecycle and persistence across devices
- Handle password recovery and account verification flows

## Core Files

- `src/context/AuthContext.tsx` – Centralized session management and state
- `src/pages/auth/SignIn.tsx` – Sign-in page and validation
- `src/pages/auth/SignUp.tsx` – Registration page
- `src/pages/auth/UpdatePassword.tsx` – Password reset completion
- `src/components/auth/AuthForm.tsx` – Shared component for validation and event handling
- `src/lib/supabase.ts` – Supabase client configuration

## Authentication Flows

### 1. Sign In

**Route**: `/sign-in`  
**Process**:

1. User enters email and password
2. `AuthForm` validates input (format, length)
3. Calls `supabase.auth.signInWithPassword()`
4. On success:
   - Session stored in localStorage
   - User redirected to `/dashboard`
5. On error:
   - Display error message (invalid credentials, account not verified, etc.)

**Validation**:

- Email: Must be valid format
- Password: Minimum 8 characters

**Error Handling**:

- Invalid credentials → "Email or password is incorrect"
- Unverified account → "Please verify your email address"
- Network error → "Unable to sign in. Please try again."

### 2. Sign Up

**Route**: `/sign-up`  
**Process**:

1. User provides email, password, display name
2. `AuthForm` validates all fields
3. Calls `supabase.auth.signUp()`
4. Supabase sends verification email
5. User sees confirmation message
6. After email verification, user can sign in

**Validation**:

- Email: Valid format, not already registered
- Password: Minimum 8 characters, optional complexity rules
- Display name: 2-50 characters

**Email Verification**:

- Verification link expires in 24 hours
- Link format: `{SITE_URL}/auth/verify?token={TOKEN}`
- Clicking link marks account as verified

### 3. Password Reset

**Route**: `/auth/forgot-password` → `/auth/update-password`  
**Process**:

**Step 1: Request Reset**

1. User enters email on forgot password page
2. Calls `supabase.auth.resetPasswordForEmail()`
3. Supabase sends reset email with token
4. Confirmation message displayed

**Step 2: Complete Reset**

1. User clicks email link → redirected to `/auth/update-password?token={TOKEN}`
2. `handlePasswordRecovery()` parses token from URL hash
3. Validates token expiration
4. User enters new password
5. Calls `supabase.auth.updateUser({ password: newPassword })`
6. On success → redirect to `/sign-in`

**Token Handling**:

- Tokens expire in 1 hour
- Validated via `PASSWORD_RECOVERY` event
- Stored temporarily in session state

### 4. Session Persistence

**Mechanism**: Supabase Client Auto-Refresh  
**Storage**: localStorage (key: `supabase.auth.token`)

**Behavior**:

- Session refreshed automatically before expiration
- Refresh tokens valid for 30 days (configurable in Supabase)
- On app load, checks for existing session via `supabase.auth.getSession()`
- Expired sessions trigger sign-out and redirect to `/sign-in`

**Offline Support**:

- Session state cached in `AuthContext`
- Offline operations use cached user data
- Sync on reconnection via `onAuthStateChange`

## Event Listeners

### Auth State Change Monitor

Located in `AuthContext.tsx`:

```typescript
useEffect(() => {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((event, session) => {
    switch (event) {
      case 'SIGNED_IN':
        setSession(session);
        navigate('/dashboard');
        break;
      case 'SIGNED_OUT':
        setSession(null);
        navigate('/sign-in');
        break;
      case 'PASSWORD_RECOVERY':
        handlePasswordRecovery(session);
        break;
      case 'TOKEN_REFRESHED':
        setSession(session);
        break;
    }
  });
  return () => subscription.unsubscribe();
}, []);
```

### Events

- **SIGNED_IN**: Successful authentication, session created
- **SIGNED_OUT**: User logged out, session cleared
- **PASSWORD_RECOVERY**: Password reset link clicked
- **TOKEN_REFRESHED**: Session token auto-renewed
- **USER_UPDATED**: User profile changed (display name, email)

### Password Recovery Handler

```typescript
function handlePasswordRecovery(session: Session | null) {
  if (!session) return;

  // Parse token from URL hash
  const hashParams = new URLSearchParams(window.location.hash.substring(1));
  const token = hashParams.get('access_token');

  if (token) {
    // Check expiration
    const expiresAt = hashParams.get('expires_at');
    if (expiresAt && Date.now() < parseInt(expiresAt) * 1000) {
      navigate('/auth/update-password');
    } else {
      showError('Password reset link expired');
    }
  }
}
```

## Redirects

### Protected Routes

Configured in `App.tsx` with route guards:

```typescript
<Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  }
/>
```

**Logic**:

- Checks `AuthContext` for active session
- If no session → redirect to `/sign-in`
- Preserves intended destination in `returnUrl` param

### Post-Authentication

- **Sign In Success** → `/dashboard` (or `returnUrl` if present)
- **Sign Up Success** → Verification message page
- **Password Reset Success** → `/sign-in` with success toast

### Error Fallback

Handled by `AuthBoundary.tsx`:

- Catches auth errors globally
- Displays user-friendly error page
- Provides "Sign In" and "Contact Support" CTAs

## Configuration

### Environment Variables

Located in `.env`:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Site URL (for email redirects)
VITE_SITE_URL=http://localhost:5173  # Development
# VITE_SITE_URL=https://inkwell.app  # Production
```

### Supabase Dashboard Settings

Navigate to: **Authentication → URL Configuration**

**Redirect URLs** (whitelist):

- `http://localhost:5173/**` (development)
- `https://inkwell.app/**` (production)
- `https://*.vercel.app/**` (preview deploys)

**Email Templates**:

- Path: **Authentication → Email Templates**
- Customize: Verification, Password Reset, Magic Link
- Variables: `{{ .ConfirmationURL }}`, `{{ .SiteURL }}`, `{{ .Token }}`

**Email Settings**:

- SMTP: Configured in Supabase or use default
- Rate Limits: 3 emails per hour per user (anti-spam)

## Troubleshooting

### Email Not Received

**Symptoms**: User doesn't receive verification or reset email

**Checklist**:

1. Check spam/junk folder
2. Verify domain whitelisting in Supabase project
   - Navigate: **Project Settings → Auth → Email Auth**
   - Ensure sender domain is verified
3. Check Supabase logs (**Logs → Auth Logs**)
4. Verify email rate limits not exceeded

**Common Causes**:

- Corporate firewall blocking Supabase emails
- Email provider marking as spam
- Typo in email address

**Resolution**:

- Add `noreply@supabase.io` to contacts
- Use magic link as fallback
- Manually verify user in Supabase dashboard (development only)

### Redirect Loop

**Symptoms**: Browser repeatedly redirects between `/sign-in` and `/dashboard`

**Cause**: Route protection logic checking session incorrectly

**Fix**:

1. Check `AuthContext.tsx` for proper session initialization
2. Ensure `getSession()` awaited before rendering routes
3. Verify no conflicting route guards

**Debug**:

```typescript
console.log('Session:', session);
console.log('Is Loading:', isLoading);
```

**Resolution**:

- Wait for `isLoading` to be `false` before rendering protected routes
- Use suspense boundary if needed

### Session Loss After Reload

**Symptoms**: User logged out when refreshing page

**Cause**: localStorage persistence disabled or cleared

**Checklist**:

1. Check browser's localStorage settings (not disabled)
2. Verify `supabase.auth.token` key exists in localStorage
3. Check for Private/Incognito mode (may block localStorage)
4. Ensure Supabase client initialized with `persistSession: true`

**Resolution**:

```typescript
const supabase = createClient(url, key, {
  auth: {
    persistSession: true,
    storage: window.localStorage,
  },
});
```

### Invalid Credentials (But Password is Correct)

**Symptoms**: Sign in fails despite correct password

**Possible Causes**:

1. Account not verified (check email)
2. Account disabled in Supabase dashboard
3. Password contains special characters not encoded properly

**Debug**:

- Check Supabase **Authentication → Users** table
- Look for user's `email_confirmed_at` timestamp
- Verify `banned_until` is null

### Token Expired Errors

**Symptoms**: "JWT expired" or similar errors

**Cause**: Refresh token failed or expired

**Resolution**:

- Sign out and sign in again
- Check Supabase project settings for token expiration times
- Verify system clock is correct (JWT validation is time-sensitive)

## Deployment Checklist

### Pre-Deployment

- [ ] Update `VITE_SUPABASE_URL` in production env vars
- [ ] Update `VITE_SUPABASE_ANON_KEY` in production env vars
- [ ] Set `VITE_SITE_URL` to production domain
- [ ] Verify Supabase redirect URLs include production domain
- [ ] Test email sending in production (send test verification email)
- [ ] Confirm SMTP configured in Supabase (or using default)
- [ ] Update email templates with production branding

### Post-Deployment

- [ ] Test sign-up flow end-to-end
- [ ] Test sign-in with existing account
- [ ] Test password reset flow
- [ ] Verify email delivery (check spam folder)
- [ ] Test session persistence across browser refresh
- [ ] Test sign-out functionality
- [ ] Monitor Supabase logs for auth errors

### Rollback Procedure

If auth issues in production:

1. Check Supabase logs for errors
2. Verify environment variables match expected values
3. Test in preview deploy before rolling back
4. If needed, revert to previous working deployment
5. Contact Supabase support if infrastructure issue

## Testing Reference

### Automated Tests

Located in `src/context/__tests__/AuthContext.test.tsx`:

- Sign in validation
- Sign up validation
- Session persistence
- Error handling
- Redirect logic

### Manual Testing Checklist

See `PASSWORD_RESET_TESTING_CHECKLIST.md` in `.archive/checklists/`

**Key Scenarios**:

1. **Happy Path Sign Up**
   - Register new account
   - Receive verification email
   - Click link, verify account
   - Sign in successfully

2. **Happy Path Password Reset**
   - Request password reset
   - Receive email
   - Click link within 1 hour
   - Set new password
   - Sign in with new password

3. **Error Cases**
   - Invalid email format
   - Weak password
   - Duplicate account registration
   - Expired reset token
   - Wrong password attempt

### Integration Testing

Use Playwright tests for E2E auth flows:

```bash
pnpm test:e2e auth
```

Test coverage:

- Full sign-up journey
- Password reset flow
- Session persistence
- Multi-device sign-out

## Security Considerations

### Password Requirements

- Minimum 8 characters
- Encourage (but don't require) complexity: uppercase, numbers, symbols
- Check against common password lists (optional)

### Rate Limiting

Supabase enforces:

- 10 sign-in attempts per minute per IP
- 3 password reset emails per hour per user
- 5 sign-up attempts per hour per IP

### Email Verification

- Required before full account access
- Prevents spam account creation
- Validates email ownership

### Token Security

- JWT tokens signed with Supabase secret key
- Refresh tokens stored securely in httpOnly cookies (if configured)
- Short access token lifetime (1 hour default)

---

**Last updated:** October 2025
**Maintainer:** Inkwell Core Team
**Related Docs:**

- [Deployment Guide](../dev/BRANCH_PROTECTION_SETUP.md)
- [User Guide](../../ONBOARDING.md)
