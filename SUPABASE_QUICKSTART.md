# Quick Start: Supabase Integration in VS Code

## TL;DR - Get Started in 5 Minutes

### 1. Get Your Credentials (2 min)

- Go to https://app.supabase.com
- Select/create your project
- Navigate to **Settings** → **API**
- Copy **Project URL** and **anon public** key

### 2. Configure Environment (30 sec)

Create `.env.local` in project root:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### 3. Run Migration (2 min)

**Easiest Method** - Via Dashboard (No CLI needed):

1. Go to https://app.supabase.com/project/YOUR_PROJECT/sql
2. Click **New query**
3. Copy contents of `supabase/migrations/20250119000000_auto_create_profiles.sql`
4. Paste and click **Run**

**OR** via VS Code Terminal:

```bash
# Link your project (one-time)
npx supabase link --project-ref YOUR_PROJECT_ID

# Push migration
npx supabase db push
```

### 4. Configure Auth URLs (1 min)

Go to https://app.supabase.com/project/YOUR_PROJECT/auth/url-configuration

Add to **Redirect URLs**:

```
http://localhost:5173/auth/callback
http://localhost:5173/auth/update-password
```

### 5. Test It! (30 sec)

```bash
npm run dev
```

Visit your app and try signing up - a profile should auto-create!

---

## VS Code Tasks Available

Press `Cmd+Shift+P` and type "Run Task", then choose:

- **Supabase: Link Project** - Connect to your Supabase project
- **Supabase: Push Migrations** - Deploy database changes
- **Supabase: Pull Schema** - Sync schema from Supabase
- **Supabase: Status** - Check local Supabase status
- **Supabase: Start Local** - Run Supabase locally
- **Supabase: Stop Local** - Stop local Supabase

---

## What's Already Set Up

✅ **Client Integration** - `src/lib/supabaseClient.ts`
✅ **Auth Context** - `src/context/AuthContext.tsx`
✅ **Auth Components** - Login, Signup, Password Reset
✅ **Database Migration** - `supabase/migrations/20250119000000_auto_create_profiles.sql`
✅ **Package Installed** - `@supabase/supabase-js@^2.75.1`

## What the Migration Does

The migration creates:

- **`profiles` table** - User profile data
- **Auto-creation trigger** - Profile created on signup
- **RLS policies** - Users can only access their own data
- **Indexes** - For fast queries
- **Backfill** - Creates profiles for existing users

## Verify Everything Works

1. **Check migration applied:**
   - Supabase Dashboard → Table Editor
   - Look for `profiles` table

2. **Test auth flow:**

   ```bash
   npm run dev
   ```

   - Sign up with test email
   - Check profiles table for new entry

3. **Check RLS is working:**
   - SQL Editor: `SELECT * FROM profiles;`
   - Should only see your own profile

## Need More Help?

See [`SUPABASE_SETUP_GUIDE.md`](./SUPABASE_SETUP_GUIDE.md) for detailed instructions and troubleshooting.

## Common Issues

❌ **"Missing Supabase environment variables"**

- Create `.env.local` with your credentials
- Restart dev server

❌ **Migration fails**

- Use Dashboard method (easiest)
- Check you're on correct project

❌ **Can't see profiles**

- Check RLS policies are enabled
- Make sure you're authenticated

---

**Next Step:** Copy `.env.local.example` to `.env.local` and add your credentials!
