# Supabase Auth Deployment Checklist

This checklist guides you through the process of configuring and deploying Supabase authentication for Inkwell, particularly focusing on email/password authentication.

## Pre-Deployment Tasks

### Environment Setup

- [ ] **Configure Environment Variables**:
  - Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env.local` for local development
  - Add these same variables to Vercel project settings for production deployments
  - (Optional) Set up different keys for preview/staging environments

### Supabase Dashboard Configuration

- [ ] **Configure URL Settings**:
  - Go to: Authentication → URL Configuration
  - Set Site URL to your production URL (e.g., `https://inkwell.leadwithnexus.com`)
  - Add Redirect URLs:
    - `https://inkwell.leadwithnexus.com/auth/callback`
    - `https://inkwell.leadwithnexus.com/**`
    - Add development URLs if needed: `http://localhost:5173/auth/callback`, etc.

- [ ] **Configure Auth Providers**:
  - Go to: Authentication → Providers
  - Enable "Email" provider
  - Select "Email and Password" option
  - (Optional) If using only password auth, consider disabling magic links

- [ ] **Configure Email Templates**:
  - Go to: Authentication → Email Templates
  - Update the following templates:
    1. **Confirmation Template** (signup emails)
    2. **Magic Link Template** (passwordless login)
    3. **Reset Password Template** (password recovery)
  - Ensure each template has:
    - Inkwell branding
    - Clear instructions
    - Working `{{ .ConfirmationURL }}` placement
    - Mobile-friendly layout

- [ ] **Configure SMTP Settings**:
  - Go to: Authentication → Email Templates → SMTP Settings
  - Fill in all required SMTP fields:
    - Sender Name: "Inkwell"
    - SMTP Host: Your SMTP server
    - Port: Typically 587 or 465
    - Username & Password: Your SMTP credentials
  - Send a test email to verify configuration

## Application Code Verification

- [ ] **Verify Auth Pages**:
  - Sign In (`/src/pages/AuthPage.tsx?mode=signin`)
  - Sign Up (`/src/pages/AuthPage.tsx?mode=signup`)
  - Password Reset (`/src/pages/AuthPage.tsx?mode=reset`)
  - AuthCallback (`/src/pages/AuthCallback.tsx`)
    - **Enhanced (Oct 2025)**: Now handles multiple Supabase auth flows with robust fallbacks
    - Supports code, token_hash, access_token hash, and type-only params
    - Includes additional session checks and user-friendly notices
    - See implementation details in the main file for all supported scenarios
    - **New features**:
      - Multi-format parameter extraction from both search params and hash fragments
      - Double session check for type=signup with no token/hash
      - User-friendly confirmation banners with redirect preservation
      - Comprehensive logging for troubleshooting
      - Anti-loop protection with sentinel parameters
      - Safe redirect validation to prevent open redirects

- [ ] **Check Auth Context**:
  - Verify AuthContext (`/src/context/AuthContext.tsx`) implements all needed methods
  - Test session persistence across page loads

- [ ] **Error Handling**:
  - Ensure all auth pages handle common error cases
  - Implement user-friendly error messages for email issues
  - Add proper logging for debugging

## Testing

- [ ] **Test Authentication Flows**:
  - [ ] New user signup
  - [ ] Email confirmation
  - [ ] Password login
  - [ ] Magic link login (if enabled)
  - [ ] Password reset
  - [ ] Logout

- [ ] **Test Edge Cases**:
  - [ ] Invalid credentials
  - [ ] Already registered email
  - [ ] Network errors
  - [ ] Server errors (500)
  - [ ] Expired links
  - [ ] Cross-device login

## Deployment Process

1. **Initial Deployment**:
   - [ ] Deploy to preview environment first
   - [ ] Verify all auth flows work in preview
   - [ ] Check for any console errors or warnings

2. **Production Deployment**:
   - [ ] Deploy to production
   - [ ] Test all auth flows again in production
   - [ ] Monitor error logs after deployment

3. **Post-Deployment Verification**:
   - [ ] Test on multiple browsers (Chrome, Firefox, Safari)
   - [ ] Test on mobile devices
   - [ ] Verify proper redirect handling

## Supabase SQL Setup

Ensure these tables and triggers exist in your Supabase database:

- [ ] **profiles Table**:

  ```sql
  CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    email TEXT UNIQUE NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    -- Add any additional user profile fields here
  );
  ```

- [ ] **Profile Creation Trigger**:

  ```sql
  CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS TRIGGER AS $$
  BEGIN
    INSERT INTO public.profiles (id, email)
    VALUES (NEW.id, NEW.email);
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;

  CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  ```

## Monitoring & Troubleshooting

- [ ] **Set Up Logging**:
  - Implement client-side error logging
  - Configure server-side logging in Supabase

- [ ] **Create Support Documentation**:
  - Document common auth issues
  - Create troubleshooting guide for the team
  - Add user-facing FAQ for auth issues

## Final Checklist

- [ ] All authentication flows tested and working
- [ ] Email templates configured and tested
- [ ] Redirect URLs properly set in Supabase dashboard
- [ ] Error handling implemented for all edge cases
- [ ] User profile database setup complete
- [ ] Documentation updated
- [ ] Logging in place for troubleshooting

## Rollback Plan

In case of critical issues:

1. Identify the specific problem (client code, Supabase settings, etc.)
2. For client issues: roll back to previous version in Vercel
3. For Supabase issues: restore previous configuration
4. Communicate status to team and users if necessary
