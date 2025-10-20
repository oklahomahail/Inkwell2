# Supabase Auth Email Troubleshooting Guide

This guide addresses common issues with Supabase email delivery for authentication flows (sign-up confirmations, magic links, and password resets).

## Common Symptoms

1. **Users can't complete sign-up**:
   - User registers but never receives confirmation email
   - Sign-up appears successful but user can't log in

2. **500 Errors during sign-up**:
   - Server returns 500 error when attempting to create a new account

3. **Email confirmations never arrive**:
   - Sign-up emails never reach user's inbox
   - Magic link emails are not delivered
   - Password reset emails are not sent

## Checklist: Supabase Email Settings

### 1. SMTP Configuration

- [ ] **Verify SMTP Settings**: In Supabase dashboard → Authentication → Email Templates
  - Check all SMTP fields are correctly filled:
    - Sender Name
    - SMTP Host
    - Port
    - Username
    - Password

- [ ] **Test SMTP Configuration**: Use the "Send test email" button in Supabase dashboard

### 2. Email Templates

- [ ] **Verify Email Templates**: In Supabase dashboard → Authentication → Email Templates
  - Ensure all templates (Confirmation, Magic Link, Reset Password) contain valid HTML
  - Each template should include `{{ .ConfirmationURL }}` variable
  - Ensure templates aren't empty

### 3. URL Configuration

- [ ] **Check Site URL**: Supabase dashboard → Authentication → URL Configuration
  - Set to exact URL of your app: `https://inkwell.leadwithnexus.com` (no trailing slash)
  - For local dev: `http://localhost:5173` (or your local port)

- [ ] **Verify Redirect URLs**: Must contain ALL callback URLs your app uses
  - Add both of these at minimum:
    - `https://inkwell.leadwithnexus.com/auth/callback`
    - `http://localhost:5173/auth/callback`
  - If using wildcards, also include:
    - `https://inkwell.leadwithnexus.com/**`
    - `http://localhost:5173/**`

### 4. Auth Provider Settings

- [ ] **Confirm Email Provider is Enabled**: Authentication → Providers
  - Email provider should be enabled
  - If using "Password" option, it should be set to "Email and Password"

### 5. Email Domains and Security

- [ ] **Check Email Domains**: Authentication → Email Templates → Email Address
  - If using a custom email domain, ensure it's properly set up with SPF, DKIM, etc.
  - Verify domain ownership if prompted

- [ ] **Rate Limiting**: Check if you've hit any Supabase rate limits
  - Supabase Free tier has lower limits for email sending

## Browser-Side Fixes

### 1. Improve Error Handling in UI

- [ ] Update SignUp component with proper error messaging:
  - Handle 500 errors from Supabase
  - Show user-friendly messages for common errors

### 2. Implement Email Delivery Alternative Flows

- [ ] Add "Resend confirmation email" functionality
- [ ] Suggest checking spam/junk folders
- [ ] Provide alternative login methods (e.g., magic link as backup)

## Testing Email Delivery

To verify email delivery is working:

1. **Use Test Emails**:
   - Create test accounts with common email providers (Gmail, Outlook, Yahoo)
   - Test with your organization's email domain

2. **Check Email Server Logs**:
   - If using your own SMTP server, check logs for delivery errors

3. **Verify the Registration Flow End-to-End**:
   - Register new test account
   - Check email receipt
   - Confirm account using email link
   - Attempt to log in

## Supabase Email Advanced Settings

In the Supabase dashboard, check these additional settings:

- [ ] **Mailer Settings**: Check any advanced mailer settings
- [ ] **From Email Address**: Ensure it's a legitimate address you control
- [ ] **Email Confirmation**: Ensure it's properly enabled (typically ON)
- [ ] **SMTP Security**: If using custom SMTP, verify TLS/SSL settings

## Debugging Tips

### Email Delivery Issues

When emails aren't being delivered:

1. **Check Supabase Logs**: Review logs for email send attempts
2. **Verify Email Format**: Ensure email templates have valid HTML
3. **Test with Different Email Providers**: Try Gmail, Outlook, etc.
4. **Check Spam/Junk Folders**: Ask users to check spam folders

### 500 Errors

When seeing 500 errors during signup:

1. **Review Server Logs**: Check for specific error messages
2. **Inspect Network Requests**: Examine the exact response from Supabase
3. **Verify Rate Limits**: Check if you've hit Supabase rate limits
4. **Test in Incognito Mode**: Rule out browser extensions/cache issues

## Production Checklist

Before deploying to production:

- [ ] Verify SMTP settings work in production environment
- [ ] Add production URLs to Supabase redirect whitelist
- [ ] Test the complete flow in a staging environment
- [ ] Implement proper error handling for all auth flows
- [ ] Document the exact error messages users might encounter

## Need More Help?

If issues persist:

1. Check Supabase Status: https://status.supabase.com/
2. Review Supabase Auth docs: https://supabase.com/docs/guides/auth
3. Search Supabase GitHub issues: https://github.com/supabase/supabase/issues
4. Open a support ticket with Supabase if you're on a paid plan
