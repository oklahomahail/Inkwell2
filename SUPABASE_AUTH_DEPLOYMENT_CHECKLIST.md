# Supabase Auth Deployment Checklist

## Environment Setup

- [x] Create `.env.local` file with proper Supabase credentials
- [x] Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Vercel environment variables
- [ ] Configure Supabase Authentication settings in the Supabase dashboard:
  - [ ] Enable Email/Password sign-in
  - [ ] Configure SMTP settings for password reset emails
  - [ ] Set up email templates for password reset
  - [ ] Whitelist redirect URLs in Supabase Dashboard → Authentication → URL Configuration:
    - [ ] `https://inkwell-app.vercel.app/auth/callback`
    - [ ] `https://*-inkwell-app.vercel.app/auth/callback` (for preview deployments)
    - [ ] `http://localhost:5173/auth/callback` (for local development)

## Code Implementation

- [x] Create password-based authentication components:
  - [x] SignIn.tsx with tabbed UI for magic link and password login
  - [x] SignUp.tsx for email/password registration
  - [x] ForgotPassword.tsx for password reset requests
  - [x] UpdatePassword.tsx for password reset completion
- [x] Update AuthContext.tsx with password authentication methods:
  - [x] signInWithPassword
  - [x] signUpWithPassword
  - [x] Handle PASSWORD_RECOVERY event

- [x] Update routing:
  - [x] Add routes in App.tsx
  - [x] Update isPublicRoute in auth.ts

- [x] Fix UI issues:
  - [x] Logo rendering in auth pages
  - [x] Fallback wordmark
  - [x] Hide topbar on auth routes
  - [x] Ensure consistent branding across all pages

## Testing

- [ ] Test all auth flows:
  - [ ] Password sign-in
  - [ ] Magic link sign-in
  - [ ] Sign-up with email verification
  - [ ] Password reset flow (request → email → update)
  - [ ] Redirect query parameter handling across all flows

- [ ] Test in different environments:
  - [ ] Local development
  - [ ] Vercel preview deployment
  - [ ] Production deployment

## Deployment

- [ ] Run preflight checks:
  - [x] `pnpm typecheck`
  - [x] `pnpm build`
  - [ ] `pnpm test`
  - [x] `pnpm preview` for local testing

- [ ] Git operations:
  - [ ] `git add .`
  - [ ] `git commit -m "feat(auth): implement email/password authentication"`
  - [ ] `git push origin main`

- [ ] Vercel deployment:
  - [ ] Verify environment variables in Vercel project settings
  - [ ] Deploy to Vercel
  - [ ] Test in preview environment before promoting to production

## Post-Deployment

- [ ] Monitor for any authentication issues
- [ ] Clear service worker caches if needed
- [ ] Verify email flows (password reset, verification)
- [ ] Check analytics for authentication success rates

## Rollback Plan

If critical issues are discovered after deployment:

1. Revert to the previous commit:

   ```
   git revert [commit-hash]
   git push origin main
   ```

2. If necessary, manually roll back in Vercel dashboard to a previous deployment

3. If only specific settings need to be reverted, adjust Supabase authentication settings as needed
