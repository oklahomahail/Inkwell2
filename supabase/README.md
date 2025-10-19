# Supabase Database Migrations

This directory contains SQL migrations for the Inkwell Supabase database.

## Running Migrations

### Option 1: Supabase CLI (Recommended)

```bash
# Install Supabase CLI if you haven't already
npm install -g supabase

# Link to your project (one-time setup)
supabase link --project-ref YOUR_PROJECT_ID

# Run all pending migrations
supabase db push
```

### Option 2: Supabase Dashboard (Manual)

1. Go to https://app.supabase.com/project/YOUR_PROJECT/sql
2. Click "New query"
3. Copy the contents of the migration file
4. Paste into the SQL editor
5. Click "Run" to execute

### Option 3: Supabase Studio (Local Development)

```bash
# Start local Supabase
supabase start

# Apply migration
supabase migration up

# Stop local Supabase
supabase stop
```

## Migration Files

### `20250119000000_auto_create_profiles.sql`

**Purpose**: Automatically create user profiles on sign-up

**What it does**:

- Creates `public.profiles` table with user metadata
- Sets up Row Level Security (RLS) policies
- Creates PostgreSQL trigger to auto-create profile on `auth.users` INSERT
- Backfills profiles for existing users
- Adds `onboarding_completed` flag for onboarding flow

**Schema**:

```sql
profiles (
  id UUID PRIMARY KEY,           -- References auth.users(id)
  email TEXT,                    -- User's email
  display_name TEXT,             -- Display name (set during onboarding)
  avatar_url TEXT,               -- Avatar URL (optional)
  timezone TEXT DEFAULT 'UTC',   -- User timezone
  onboarding_completed BOOLEAN,  -- Has user completed onboarding?
  created_at TIMESTAMPTZ,        -- When profile was created
  updated_at TIMESTAMPTZ         -- Auto-updated on changes
)
```

**RLS Policies**:

- Users can SELECT their own profile (`auth.uid() = id`)
- Users can UPDATE their own profile (`auth.uid() = id`)
- Users can INSERT their own profile (`auth.uid() = id`)

**Testing the migration**:

```sql
-- 1. Create a test user (via Supabase Auth dashboard or magic link)
-- 2. Verify profile was auto-created:
SELECT * FROM public.profiles WHERE email = 'test@example.com';

-- 3. Verify RLS works (should only see your own profile):
SELECT * FROM public.profiles;

-- 4. Update onboarding status:
UPDATE public.profiles
SET display_name = 'Test User', onboarding_completed = true
WHERE id = auth.uid();
```

## Post-Migration Checklist

After running the migration:

- [ ] Verify `public.profiles` table exists
- [ ] Check RLS is enabled: `SELECT * FROM pg_tables WHERE tablename = 'profiles';`
- [ ] Test profile auto-creation by signing up a new user
- [ ] Verify existing users have profiles backfilled
- [ ] Test RLS by trying to query other users' profiles (should fail)
- [ ] Update application code to use `onboarding_completed` flag

## Rollback

If you need to rollback this migration:

```sql
-- Drop trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_profile_updated ON public.profiles;

-- Drop function
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.handle_updated_at();

-- Drop policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Drop table (WARNING: This deletes all profile data!)
DROP TABLE IF EXISTS public.profiles;
```

## Environment Variables

Make sure your `.env` file has the correct Supabase credentials:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

## Troubleshooting

**Issue**: Migration fails with "permission denied"

- **Solution**: Make sure you're connected to the correct project and have admin privileges

**Issue**: Trigger doesn't fire

- **Solution**: Check that the trigger exists:
  ```sql
  SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
  ```

**Issue**: Profile not created automatically

- **Solution**: Manually insert and check logs:
  ```sql
  INSERT INTO public.profiles (id, email)
  VALUES (auth.uid(), 'test@example.com');
  ```

**Issue**: RLS blocking legitimate access

- **Solution**: Verify user is authenticated:
  ```sql
  SELECT auth.uid(); -- Should return your user ID, not NULL
  ```

## Additional Resources

- [Supabase Database Migrations Docs](https://supabase.com/docs/guides/database/migrations)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Triggers](https://www.postgresql.org/docs/current/triggers.html)
