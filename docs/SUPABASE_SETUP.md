# Supabase Authentication Setup Guide

This guide walks you through setting up Supabase authentication for Inkwell.

## Prerequisites

- A Supabase account (free tier works fine)
- Access to your Vercel deployment settings
- Basic understanding of environment variables

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Fill in:
   - **Name**: `inkwell-prod` (or your preferred name)
   - **Database Password**: Generate a strong password (save it securely)
   - **Region**: Choose closest to your users
4. Click "Create new project" and wait 2-3 minutes for provisioning

## Step 2: Configure Email Authentication

1. In your Supabase dashboard, go to **Authentication → Providers**
2. Click on **Email** provider
3. Enable these settings:
   - ✅ Enable email provider
   - ✅ Confirm email (recommended for production)
   - ✅ Secure email change
   - ✅ Enable email OTP (this is what we use for magic links)
4. Click **Save**

### Email Templates (Optional but Recommended)

Go to **Authentication → Email Templates** and customize:

- **Magic Link**: This is the email users receive to sign in
- **Confirmation**: For new user sign-ups (if you enable email confirmation)

Example magic link template:

```html
<h2>Sign in to Inkwell</h2>
<p>Click the link below to sign in:</p>
<p><a href="{{ .ConfirmationURL }}">Sign in to Inkwell</a></p>
<p>This link expires in 1 hour.</p>
<p>If you didn't request this, you can safely ignore this email.</p>
```

## Step 3: Configure Site URL and Redirect URLs

1. Go to **Authentication → URL Configuration**
2. Set **Site URL** to your production domain:

   ```
   https://inkwell.leadwithnexus.com
   ```

3. Add **Redirect URLs** (one per line):

   ```
   http://localhost:5173/profiles
   https://inkwell.leadwithnexus.com/profiles
   https://*.vercel.app/profiles
   ```

   The wildcard `*.vercel.app` allows all Vercel preview deployments to work.

## Step 4: Get API Credentials

1. Go to **Settings → API**
2. Copy these values (you'll need them in Step 5):
   - **Project URL** (looks like `https://your-project.supabase.co`)
   - **anon/public** key (the `anon public` key, NOT the `service_role` key)

⚠️ **Important**: Never expose the `service_role` key in your frontend code!

## Step 5: Set Environment Variables

### Local Development

Create a `.env` file in your project root:

```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Base URL (for local development)
VITE_BASE_URL=http://localhost:5173
```

### Vercel Production

1. Go to your Vercel project → **Settings → Environment Variables**
2. Add these variables for **Production** and **Preview**:

   | Name                     | Value                               | Environments        |
   | ------------------------ | ----------------------------------- | ------------------- |
   | `VITE_SUPABASE_URL`      | `https://your-project.supabase.co`  | Production, Preview |
   | `VITE_SUPABASE_ANON_KEY` | Your anon key                       | Production, Preview |
   | `VITE_BASE_URL`          | `https://inkwell.leadwithnexus.com` | Production only     |
   | `VITE_BASE_URL`          | Leave empty for Preview             | Preview only        |

3. **Remove old Clerk variables**:
   - Delete `VITE_CLERK_PUBLISHABLE_KEY`
   - Delete `CLERK_SECRET_KEY`
   - Delete `VITE_CLERK_FRONTEND_API`

### GitHub Secrets (if using GitHub Actions)

Go to your repo → **Settings → Secrets and variables → Actions** and add:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Step 6: Optional - Set Up User Profiles Table

If you want to store additional user data (recommended):

1. Go to **SQL Editor** in Supabase
2. Create a new query and paste this:

```sql
-- Create profiles table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable Row Level Security
alter table public.profiles enable row level security;

-- Allow users to view their own profile
create policy "Users can view own profile"
on public.profiles for select
using (auth.uid() = id);

-- Allow users to insert their own profile
create policy "Users can insert own profile"
on public.profiles for insert
with check (auth.uid() = id);

-- Allow users to update their own profile
create policy "Users can update own profile"
on public.profiles for update
using (auth.uid() = id);

-- Create a trigger to auto-update updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_profile_updated
  before update on public.profiles
  for each row
  execute procedure public.handle_updated_at();
```

3. Run the query

## Step 7: Test Authentication Flow

### Local Testing

1. Start your dev server:

   ```bash
   pnpm dev
   ```

2. Navigate to `http://localhost:5173`
3. Try signing in with your email
4. Check your email for the magic link
5. Click the link - you should be redirected to `/profiles` and authenticated

### Common Issues

**Magic link not arriving?**

- Check spam folder
- Verify Email provider is enabled in Supabase
- Check Supabase logs: **Authentication → Logs**

**Redirect not working?**

- Verify `/profiles` is in your Redirect URLs list
- Check browser console for errors
- Ensure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set correctly

**"Invalid API key" error?**

- Make sure you're using the `anon` key, not `service_role`
- Check for typos in environment variables
- Restart dev server after changing `.env`

## Step 8: Deploy to Production

1. Commit your changes:

   ```bash
   git add .
   git commit -m "feat: complete Supabase authentication setup"
   git push
   ```

2. Vercel will automatically deploy

3. Test on production:
   - Visit `https://inkwell.leadwithnexus.com`
   - Sign in with your email
   - Verify magic link works
   - Check that you're redirected to `/profiles`

## Step 9: QA Checklist

Run through this checklist to ensure everything works:

- [ ] Fresh browser → Sign in → lands on `/profiles` authenticated
- [ ] Hard refresh (Cmd+Shift+R) → still authenticated
- [ ] Open new tab on `/profiles` → authenticated without flicker
- [ ] Sign out → redirect to `/sign-in`
- [ ] Try signing in with invalid email → see error message
- [ ] Request magic link twice in 30s → see rate limit message
- [ ] Magic link from Gmail works
- [ ] Magic link from mobile email client works
- [ ] Vercel preview deployment auth works
- [ ] Cross-tab: sign out in one tab → other tab updates

## Step 10: Production Hardening

### Rate Limiting

The app has client-side rate limiting (30s between requests). For additional protection:

1. In Supabase go to **Authentication → Rate Limits**
2. Configure:
   - Email sign-ins: 3 per hour per IP
   - Token refresh: 50 per hour per user

### Email Security

Consider enabling CAPTCHA:

1. Go to **Authentication → Settings**
2. Enable "Enable Captcha protection"
3. Follow instructions to add reCAPTCHA

### Monitoring

Set up alerts in Supabase:

1. Go to **Settings → Alerts**
2. Configure alerts for:
   - Failed login attempts
   - Database errors
   - API rate limit hits

## Optional Enhancements

### Add Google OAuth

Want to offer Google sign-in as well?

1. Go to **Authentication → Providers**
2. Enable **Google**
3. Follow Supabase's guide to get OAuth credentials
4. Update your sign-in page to include:

```tsx
const signInWithGoogle = async () => {
  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/profiles`,
    },
  });
};
```

### Invite-Only Mode

Want to restrict who can sign up?

1. Go to **Authentication → Settings**
2. Disable "Enable email signups"
3. Manually invite users via **Authentication → Users → Invite User**

### Custom Email Domain

Want emails to come from `noreply@leadwithnexus.com` instead of Supabase?

1. Upgrade to Supabase Pro ($25/month)
2. Follow their [Custom SMTP guide](https://supabase.com/docs/guides/auth/auth-smtp)

## Support

If you run into issues:

1. Check Supabase [Auth documentation](https://supabase.com/docs/guides/auth)
2. Review [Common Auth Errors](https://supabase.com/docs/guides/auth/troubleshooting)
3. Check Supabase logs in your dashboard
4. Join [Supabase Discord](https://discord.supabase.com) for help

---

**Migration complete!** 🎉 You've successfully replaced Clerk with Supabase authentication.
