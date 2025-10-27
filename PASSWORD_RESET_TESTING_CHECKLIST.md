# Password Reset Testing Checklist

## Pre-Testing Setup

- [ ] Supabase redirect URLs configured
  - [ ] `http://localhost:5173/auth/update-password` added
  - [ ] Production URL(s) added (if deploying)
- [ ] Site URL configured in Supabase
- [ ] Email templates verified (optional)

---

## Test 1: Basic Password Reset Flow

### Steps:

1. [ ] Navigate to `http://localhost:5173/auth/forgot-password`
2. [ ] Enter a valid user email address
3. [ ] Click "Send reset link"
4. [ ] Verify success message appears
5. [ ] Check email inbox for reset email
6. [ ] Verify email contains reset link
7. [ ] Click the reset link in email

### Expected Results:

- [ ] Reset link URL format: `http://localhost:5173/auth/update-password?...#access_token=...`
- [ ] Browser navigates to `/auth/update-password`
- [ ] Page displays "Set new password" form
- [ ] No redirect to `/sign-in` occurs
- [ ] No console errors in browser DevTools

---

## Test 2: Password Update Success

### Prerequisites:

- On the `/auth/update-password` page from Test 1

### Steps:

1. [ ] Enter a new password (min 6 characters)
2. [ ] Enter the same password in "Confirm new password"
3. [ ] Click "Update password"
4. [ ] Wait for success message

### Expected Results:

- [ ] "Password updated!" success message displays
- [ ] Green checkmark icon appears
- [ ] After 1.5 seconds, auto-redirect to `/dashboard` (or preserved redirect)
- [ ] User is authenticated (can access protected routes)
- [ ] No console errors

---

## Test 3: Password Validation

### Prerequisites:

- On the `/auth/update-password` page with a fresh reset token

### Steps:

1. [ ] **Test: Password too short**
   - Enter password: `123` (less than 6 chars)
   - Confirm password: `123`
   - Click "Update password"
   - Expected: Error message "Password must be at least 6 characters"

2. [ ] **Test: Passwords don't match**
   - Enter password: `newpassword123`
   - Confirm password: `different456`
   - Click "Update password"
   - Expected: Error message "Passwords do not match"

3. [ ] **Test: Empty password**
   - Leave password field empty
   - Click "Update password"
   - Expected: HTML5 validation (browser prevents submit)

---

## Test 4: Invalid/Expired Token

### Steps:

1. [ ] Navigate directly to `http://localhost:5173/auth/update-password` (without token)
2. [ ] Observe behavior

### Expected Results:

- [ ] Immediately redirects to `/sign-in`
- [ ] No error messages shown to user
- [ ] Console shows validation check

---

## Test 5: Token Already Used

### Steps:

1. [ ] Complete a successful password reset (Test 2)
2. [ ] Click the same reset link again from email
3. [ ] Observe behavior

### Expected Results:

- [ ] Either redirects to `/sign-in` (invalid token)
- [ ] Or shows error message about expired/used token

---

## Test 6: Redirect Preservation

### Steps:

1. [ ] Navigate to `http://localhost:5173/auth/forgot-password?redirect=/brand`
2. [ ] Enter email and send reset link
3. [ ] Click reset link from email
4. [ ] Update password successfully

### Expected Results:

- [ ] URL includes `?redirect=/brand` parameter
- [ ] After password update, redirects to `/brand` (not `/dashboard`)

---

## Test 7: Password Reset from Sign-In Page

### Steps:

1. [ ] Navigate to `/sign-in`
2. [ ] Click "Forgot password?" link
3. [ ] Verify navigates to `/auth/forgot-password`
4. [ ] Complete reset flow

### Expected Results:

- [ ] Link properly navigates to forgot password page
- [ ] Full flow works as expected

---

## Test 8: Mobile/Responsive Testing

### Steps:

1. [ ] Open DevTools → Toggle device toolbar
2. [ ] Test on mobile viewport (375px width)
3. [ ] Navigate through password reset flow

### Expected Results:

- [ ] Form is readable and usable on mobile
- [ ] Buttons are tappable
- [ ] Text inputs work correctly
- [ ] Logo displays properly

---

## Test 9: Email Client Testing

### Test in different email clients:

- [ ] Gmail (web)
- [ ] Gmail (mobile app)
- [ ] Outlook
- [ ] Apple Mail
- [ ] Other email clients used by your users

### Expected Results:

- [ ] Email displays correctly
- [ ] Reset link is clickable
- [ ] Link opens in browser correctly

---

## Test 10: Network Error Handling

### Steps:

1. [ ] Open DevTools → Network tab
2. [ ] Navigate to `/auth/update-password` with valid token
3. [ ] Throttle network to "Offline"
4. [ ] Try to update password
5. [ ] Observe error handling

### Expected Results:

- [ ] Appropriate error message displays
- [ ] UI doesn't break
- [ ] Can retry after reconnecting

---

## Test 11: Browser Console Verification

### During all tests, verify:

- [ ] No unhandled JavaScript errors
- [ ] Auth events logged correctly
- [ ] Password update events logged
- [ ] No sensitive data (passwords) logged

---

## Test 12: Cross-Browser Testing

### Test in:

- [ ] Chrome/Chromium
- [ ] Firefox
- [ ] Safari
- [ ] Edge

### Expected Results:

- [ ] Flow works consistently across browsers
- [ ] UI displays correctly
- [ ] No browser-specific errors

---

## Production Testing Checklist

Before deploying to production:

- [ ] Production URLs added to Supabase redirect list
- [ ] Site URL updated to production domain
- [ ] Test full flow in production environment
- [ ] Verify email links use production domain
- [ ] Test on real mobile devices (iOS/Android)
- [ ] Monitor Supabase logs for errors
- [ ] Set up error tracking (Sentry, etc.)

---

## Common Issues & Solutions

### Issue: Reset link redirects to `/sign-in`

**Solution:** Verify URL is whitelisted in Supabase Dashboard

### Issue: "Invalid token" error

**Solution:**

- Token may be expired (1 hour default)
- Request new reset link
- Check for token tampering

### Issue: Email not received

**Solution:**

- Check spam folder
- Verify email service is configured in Supabase
- Check Supabase logs for delivery errors

### Issue: Password updates but user not authenticated

**Solution:**

- Verify `supabase.auth.updateUser()` is called correctly
- Check auth state change listener
- Verify session is properly set

---

## Test Summary

Total tests: 12

- [ ] All tests passed
- [ ] Issues found: ****\_\_\_****
- [ ] Issues resolved: ****\_\_\_****

**Tester:** ****\_\_\_****
**Date:** ****\_\_\_****
**Environment:** ☐ Local ☐ Staging ☐ Production
**Notes:**

---

---

---
