# Supabase Setup Guide for Inkwell

This guide will help you integrate Supabase into your VS Code workspace step by step.

## Prerequisites

✅ You already have:

- Supabase client installed (`@supabase/supabase-js` in package.json)
- Client configuration set up (`src/lib/supabaseClient.ts`)
- Migration file ready (`supabase/migrations/20250119000000_auto_create_profiles.sql`)

## Step 1: Get Your Supabase Project Credentials

### Option A: Using Existing Supabase Project

1. Go to https://app.supabase.com
2. Select your project (or create a new one)
3. Go to **Settings** → **API**
4. Copy these values:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **Anon/Public Key** (the `anon public` key)

### Option B: Create New Supabase Project

1. Go to https://app.supabase.com
2. Click **New Project**
3. Choose organization and fill in:
   - Project name: `inkwell` (or your choice)
   - Database password: (save this securely!)
   - Region: Choose closest to your users
4. Wait for project to finish setting up (~2 minutes)
5. Go to **Settings** → **API** and copy credentials

## Step 2: Configure Environment Variables

Create a `.env.local` file in the project root:

```bash
# Create from template
cp .env.local.example .env.local
```

Then edit `.env.local` and add your credentials:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# Keep your existing Clerk key
VITE_CLERK_PUBLISHABLE_KEY=pk_test_
```

⚠️ **Important**: Never commit `.env.local` to git (it's already in `.gitignore`)

## Step 3: Run the Database Migration

You have three options:

### Option A: Via Supabase Dashboard (Easiest - No CLI needed)

1. Go to https://app.supabase.com/project/YOUR_PROJECT/sql
2. Click **New query**
3. Open `supabase/migrations/20250119000000_auto_create_profiles.sql` in VS Code
4. Copy the entire contents
5. Paste into Supabase SQL editor
6. Click **Run** (or press Cmd+Enter)
7. ✅ You should see "Success. No rows returned"

### Option B: Using npx (No global install)

```bash
# Link to your project
npx supabase link --project-ref YOUR_PROJECT_ID

# Push the migration
npx supabase db push
```

### Option C: Using Supabase CLI (if you fix the install issue)

```bash
# Link to your project (one time)
supabase link --project-ref YOUR_PROJECT_ID

# Push migrations
supabase db push
```

## Step 4: Verify the Migration

1. Go to https://app.supabase.com/project/YOUR_PROJECT/editor
2. Look for the `profiles` table in the left sidebar under "Tables"
3. Click on `profiles` table
4. You should see columns: `id`, `email`, `display_name`, `avatar_url`, `timezone`, `onboarding_completed`, `created_at`, `updated_at`

## Step 5: Test the Integration

### Test in VS Code Terminal:

```bash
# Start your dev server
npm run dev
```

### Test Authentication Flow:

1. Open your app in browser (usually http://localhost:5173)
2. Try signing up with a test email
3. Check Supabase Dashboard → Authentication → Users
4. Check Supabase Dashboard → Table Editor → profiles
5. You should see a new profile automatically created!

### Test from Supabase SQL Editor:

```sql
-- View all profiles
SELECT * FROM public.profiles;

-- Test RLS (should only show your profile when authenticated)
SELECT auth.uid(); -- Should show your user ID
```

## Step 6: Configure Supabase Auth Settings

1. Go to https://app.supabase.com/project/YOUR_PROJECT/auth/url-configuration
2. Under **Site URL**, add: `http://localhost:5173` (for development)
3. Under **Redirect URLs**, add:
   ```
   http://localhost:5173/auth/callback
   http://localhost:5173/auth/update-password
   ```
4. For production, also add:
   ```
   https://your-production-domain.com/auth/callback
   https://your-production-domain.com/auth/update-password
   ```

## Step 7: Set Up for Deployment (Vercel/etc)

In your deployment platform (Vercel, Netlify, etc.), add environment variables:

```
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

## Troubleshooting

### Issue: "Missing Supabase environment variables"

- ✅ Make sure `.env.local` exists in project root
- ✅ Restart dev server after creating `.env.local`
- ✅ Check that variable names match exactly: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

### Issue: Migration fails with "permission denied"

- ✅ Make sure you're connected to the correct project
- ✅ Try running via Supabase Dashboard instead (Option A above)

### Issue: Profile not created automatically

- ✅ Check that trigger was created: Go to Database → Triggers in Supabase Dashboard
- ✅ Look for `on_auth_user_created` trigger
- ✅ Try creating a new user to test

### Issue: RLS blocking access

- ✅ Make sure user is authenticated (not anonymous)
- ✅ Run `SELECT auth.uid();` in SQL editor - should return your user ID, not NULL

## Quick Commands Reference

```bash
# Start dev server
npm run dev

# Check Supabase CLI version (if installed)
npx supabase --version

# Link to project
npx supabase link --project-ref YOUR_PROJECT_ID

# Push migrations
npx supabase db push

# Pull latest schema
npx supabase db pull

# View local Supabase status
npx supabase status
```

## Next Steps

After integration is complete:

1. ✅ Test user sign-up flow
2. ✅ Test profile auto-creation
3. ✅ Update application code to use `onboarding_completed` flag
4. ✅ Test password reset flow
5. ✅ Deploy to production with environment variables

## Useful Links

- [Supabase Dashboard](https://app.supabase.com)
- [Supabase Docs](https://supabase.com/docs)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Migration README](./supabase/README.md)
