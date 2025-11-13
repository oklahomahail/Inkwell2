# Apply Security Fix Migration

## ⚠️ CRITICAL SECURITY FIX REQUIRED

This migration fixes SECURITY DEFINER views that bypass Row-Level Security (RLS) policies.

**Migration:** `20251113000000_fix_security_definer_views.sql`

## Quick Apply (Recommended)

### Method 1: Supabase Dashboard (Easiest)

1. Go to your Supabase project: https://supabase.com/dashboard/project/_
2. Navigate to: **SQL Editor** (left sidebar)
3. Click **+ New Query**
4. Copy and paste the contents of `20251113000000_fix_security_definer_views.sql`
5. Click **Run** (or press `Ctrl/Cmd + Enter`)
6. Verify success message appears

### Method 2: Supabase CLI

If you have Supabase CLI installed:

```bash
# Apply all pending migrations
supabase db push

# Or apply just this migration
supabase migration up --version 20251113000000
```

## Verification

After applying the migration, verify the fix:

### 1. Check Splinter Security Advisor

1. Go to Dashboard → **Database** → **Advisors**
2. Verify "Security Definer View" errors are **gone** (should show 0)
3. All four views should no longer appear in errors:
   - `public.projects_active`
   - `public.chapters_active`
   - `public.characters_active`
   - `public.notes_active`

### 2. Test RLS Enforcement

Run this SQL in SQL Editor:

```sql
-- Test 1: Verify view security mode
select
  schemaname,
  viewname,
  viewowner,
  substring(definition, 1, 100) as definition_preview
from pg_views
where schemaname = 'public'
and viewname like '%_active';

-- Expected: Should see all four views

-- Test 2: Verify RLS is enforced
-- (As authenticated user, should only see your own projects)
select count(*) as my_projects_count
from public.projects_active;

-- Expected: Should only count projects you own
-- If you see ALL projects in database = RLS is NOT working!

-- Test 3: Compare counts
select
  (select count(*) from public.projects where deleted_at is null) as base_table_count,
  (select count(*) from public.projects_active) as view_count;

-- Expected: Counts should be EQUAL (RLS applied to both)
```

### 3. Test with Multiple Users

**As User A:**

```sql
-- Create test project
insert into projects (id, owner_id, name)
values ('test-security-fix', auth.uid(), 'Security Test Project');

-- Should see it
select count(*) from projects_active where id = 'test-security-fix';
-- Expected: 1
```

**As User B (different user):**

```sql
-- Try to access User A's project
select count(*) from projects_active where id = 'test-security-fix';
-- Expected: 0 (RLS blocks access)
```

**Cleanup (as User A):**

```sql
-- Remove test project
update projects set deleted_at = now() where id = 'test-security-fix';
```

## What This Migration Does

1. **Drops existing views** with SECURITY DEFINER:
   - `public.projects_active`
   - `public.chapters_active`
   - `public.characters_active`
   - `public.notes_active`

2. **Recreates views** with `SECURITY INVOKER`:
   - Adds `with (security_invoker = true)` to all views
   - Ensures views respect RLS policies on base tables

3. **Restores permissions**:
   - Grants SELECT to authenticated users
   - Adds explanatory comments

## Impact

**Before:**

- ❌ Views ran with owner's privileges (postgres superuser)
- ❌ RLS policies were bypassed
- ❌ Users could potentially see other users' data

**After:**

- ✅ Views run with querying user's privileges
- ✅ RLS policies are enforced via `can_access_project()`
- ✅ Users only see their own data

## Rollback (Emergency Only)

If you need to rollback (NOT recommended - security issue!):

```sql
-- WARNING: This restores the security vulnerability!
-- Only use if migration causes production issues

drop view if exists public.projects_active;
drop view if exists public.chapters_active;
drop view if exists public.characters_active;
drop view if exists public.notes_active;

-- Recreate with old (insecure) method
create or replace view public.projects_active as
  select * from public.projects where deleted_at is null;

create or replace view public.chapters_active as
  select * from public.chapters where deleted_at is null;

create or replace view public.characters_active as
  select * from public.characters where deleted_at is null;

create or replace view public.notes_active as
  select * from public.notes where deleted_at is null;

grant select on public.projects_active to authenticated;
grant select on public.chapters_active to authenticated;
grant select on public.characters_active to authenticated;
grant select on public.notes_active to authenticated;
```

## Troubleshooting

### Error: "permission denied for view"

**Cause:** View permissions not granted correctly

**Fix:**

```sql
grant select on public.projects_active to authenticated;
grant select on public.chapters_active to authenticated;
grant select on public.characters_active to authenticated;
grant select on public.notes_active to authenticated;
```

### Error: "view does not exist"

**Cause:** Views were dropped but not recreated

**Fix:** Re-run the entire migration file

### Still seeing SECURITY DEFINER errors in Splinter

**Cause:** Migration didn't apply or cache issue

**Fix:**

1. Verify migration ran successfully (check migration history)
2. Refresh Splinter Advisor page
3. Check views with: `select * from pg_views where viewname like '%_active';`

## Questions?

See:

- Security Advisory: `docs/SECURITY_ADVISORY_2025-11-13.md`
- Database Views Guide: `docs/ops/05-database-views.md`
- GitHub Issues: https://github.com/oklahomahail/Inkwell2/issues
