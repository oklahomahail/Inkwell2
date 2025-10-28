# Supabase Integration Checklist

Use this checklist to ensure your Supabase integration is complete and working.

## ✅ Pre-Integration (Already Done!)

- [x] Install `@supabase/supabase-js` package
- [x] Create Supabase client (`src/lib/supabaseClient.ts`)
- [x] Set up Auth context (`src/context/AuthContext.tsx`)
- [x] Create migration file (`supabase/migrations/20250119000000_auto_create_profiles.sql`)
- [x] Configure auth components (Login, Signup, Password Reset)

## 🚀 Getting Started

### 1. Environment Configuration

- [ ] Go to https://app.supabase.com and create/select project
- [ ] Copy Project URL from Settings → API
- [ ] Copy Anon Key from Settings → API
- [ ] Create `.env.local` file in project root
- [ ] Add `VITE_SUPABASE_URL` to `.env.local`
- [ ] Add `VITE_SUPABASE_ANON_KEY` to `.env.local`
- [ ] Verify `.env.local` is in `.gitignore` ✅ (already configured)

**Quick Setup:**

```bash
./scripts/setup-supabase.sh
```

### 2. Database Migration

Choose ONE method:

#### Method A: Supabase Dashboard (Recommended - Easiest)

- [ ] Go to https://app.supabase.com/project/YOUR_PROJECT/sql
- [ ] Click "New query"
- [ ] Copy contents of `supabase/migrations/20250119000000_auto_create_profiles.sql`
- [ ] Paste into SQL editor
- [ ] Click "Run" or press Cmd+Enter
- [ ] Verify "Success. No rows returned" message

#### Method B: VS Code Tasks

- [ ] Press `Cmd+Shift+P`
- [ ] Type "Run Task"
- [ ] Select "Supabase: Link Project"
- [ ] Enter your project reference ID
- [ ] Run "Supabase: Push Migrations"

#### Method C: Terminal Commands

```bash
npx supabase link --project-ref YOUR_PROJECT_ID
npx supabase db push
```

### 3. Verify Migration

- [ ] Open Supabase Dashboard → Table Editor
- [ ] Verify `profiles` table exists
- [ ] Check table has columns: `id`, `email`, `display_name`, `avatar_url`, `timezone`, `onboarding_completed`, `created_at`, `updated_at`
- [ ] Go to Database → Triggers
- [ ] Verify `on_auth_user_created` trigger exists
- [ ] Verify `trg_profiles_touch` trigger exists

### 4. Configure Authentication

- [ ] Go to https://app.supabase.com/project/YOUR_PROJECT/auth/url-configuration
- [ ] Set **Site URL** to `http://localhost:5173` (development)
- [ ] Add to **Redirect URLs**:
  - [ ] `http://localhost:5173/auth/callback`
  - [ ] `http://localhost:5173/auth/update-password`
- [ ] (Later) Add production URLs when deploying

### 5. Test in Development

- [ ] Restart dev server: `npm run dev`
- [ ] Open app in browser
- [ ] Try signing up with test email
- [ ] Check Supabase Dashboard → Authentication → Users
- [ ] Verify new user appears
- [ ] Check Supabase Dashboard → Table Editor → profiles
- [ ] Verify profile was auto-created for new user
- [ ] Verify `onboarding_completed` is `false` for new user

### 6. Test Row Level Security

- [ ] Go to Supabase SQL Editor
- [ ] Run: `SELECT * FROM public.profiles;`
- [ ] Should only see your own profile (when authenticated)
- [ ] Run: `SELECT auth.uid();`
- [ ] Should return your user ID (not null)

### 7. Test Authentication Features

#### Magic Link Login

- [ ] Go to login page
- [ ] Enter email
- [ ] Check email for magic link
- [ ] Click link and verify login works
- [ ] Verify redirect works correctly

#### Password Login

- [ ] Sign up with email/password
- [ ] Sign out
- [ ] Sign in with same credentials
- [ ] Verify login successful

#### Password Reset

- [ ] Go to "Forgot Password" page
- [ ] Enter email
- [ ] Check email for reset link
- [ ] Click link
- [ ] Enter new password
- [ ] Verify password update works
- [ ] Sign in with new password

### 8. Production Setup

When ready to deploy:

#### Vercel/Netlify/Other Platform

- [ ] Add environment variable: `VITE_SUPABASE_URL`
- [ ] Add environment variable: `VITE_SUPABASE_ANON_KEY`
- [ ] Deploy application

#### Supabase Dashboard

- [ ] Go to Auth → URL Configuration
- [ ] Update **Site URL** to production domain
- [ ] Add production redirect URLs:
  - [ ] `https://your-domain.com/auth/callback`
  - [ ] `https://your-domain.com/auth/update-password`

#### Test Production

- [ ] Sign up on production
- [ ] Verify profile created
- [ ] Test magic link
- [ ] Test password reset

## 🔍 Verification Commands

```bash
# Check environment variables loaded
npm run dev
# Look for no errors about missing Supabase vars

# Check Supabase CLI working
npx supabase --version

# Check migration status
npx supabase db pull

# View local project status (if using local Supabase)
npx supabase status
```

## 🐛 Troubleshooting

### Issue: "Missing Supabase environment variables"

- [ ] Verify `.env.local` exists in project root
- [ ] Check variable names exactly: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- [ ] Restart dev server after creating `.env.local`

### Issue: Migration fails

- [ ] Use Dashboard method instead (Method A)
- [ ] Verify you're connected to correct project
- [ ] Check database permissions in project settings

### Issue: Profile not auto-created

- [ ] Check trigger exists in Database → Triggers
- [ ] Look for `on_auth_user_created` trigger
- [ ] Try manually creating profile:
  ```sql
  INSERT INTO public.profiles (id, email)
  VALUES (auth.uid(), 'test@example.com');
  ```

### Issue: RLS blocking access

- [ ] Verify you're authenticated (not anonymous)
- [ ] Run: `SELECT auth.uid();` - should return UUID, not null
- [ ] Check RLS policies exist in Table Editor

### Issue: Redirect not working

- [ ] Verify redirect URL is whitelisted in Auth → URL Configuration
- [ ] Check URL exactly matches (including protocol)
- [ ] Clear browser cache/cookies

## 📚 Resources

- [Supabase Dashboard](https://app.supabase.com)
- [Quick Start Guide](./SUPABASE_QUICKSTART.md)
- [Detailed Setup Guide](./SUPABASE_SETUP_GUIDE.md)
- [Migration README](./supabase/README.md)
- [Supabase Docs](https://supabase.com/docs)

## 🎯 Success Criteria

Your integration is complete when:

- ✅ Dev server starts without environment variable errors
- ✅ Users can sign up and sign in
- ✅ Profiles are automatically created on signup
- ✅ Users can only see their own profile data
- ✅ Password reset flow works end-to-end
- ✅ Production deployment works with environment variables set

## Next Steps After Integration

1. Update onboarding flow to set `onboarding_completed = true`
2. Add profile editing functionality
3. Implement additional user preferences
4. Add user avatar upload
5. Consider adding more user metadata fields

---

**Current Status:** Ready to integrate! Follow the checklist above. 🚀
