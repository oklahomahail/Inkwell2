# Security Advisory: SECURITY DEFINER Views Bypass RLS

**Date:** 2025-11-13
**Severity:** HIGH
**Status:** FIXED
**Affected Versions:** All versions before migration `20251113000000`

## Summary

Four database views were inadvertently created with `SECURITY DEFINER` instead of `SECURITY INVOKER`, causing them to bypass Row-Level Security (RLS) policies. This could potentially expose user data across permission boundaries.

## Affected Components

- `public.projects_active`
- `public.chapters_active`
- `public.characters_active`
- `public.notes_active`

## Vulnerability Details

### Root Cause

PostgreSQL views default to `SECURITY DEFINER` when no explicit security mode is specified. This means:

- **SECURITY DEFINER**: View executes with the privileges of the view owner (typically a superuser)
  - ❌ Bypasses Row-Level Security policies
  - ❌ Can expose data that the querying user shouldn't access
  - ❌ Runs with elevated privileges

- **SECURITY INVOKER**: View executes with the privileges of the querying user
  - ✅ Respects Row-Level Security policies
  - ✅ Only shows data the user has permission to access
  - ✅ Maintains proper security boundaries

### Original Code (Vulnerable)

```sql
-- From: supabase/migrations/20250128000003_soft_delete_helpers.sql
create or replace view public.projects_active as
  select * from public.projects where deleted_at is null;
-- ❌ Defaults to SECURITY DEFINER - bypasses RLS!
```

### Fixed Code

```sql
-- From: supabase/migrations/20251113000000_fix_security_definer_views.sql
create view public.projects_active
with (security_invoker = true) as
  select * from public.projects where deleted_at is null;
-- ✅ Explicitly SECURITY INVOKER - respects RLS
```

## Impact Assessment

### Potential Data Exposure

Users querying these views could have accessed:

1. **Projects**: Other users' projects (bypassing `projects_read` policy)
2. **Chapters**: Chapters from projects they don't have access to
3. **Characters**: Character data from other users' projects
4. **Notes**: Notes from other users' projects

### Mitigating Factors

- Views only filter by `deleted_at`, they don't add permissions
- Application code primarily uses the base tables directly
- Most queries go through Supabase client which may apply additional filtering
- No evidence of malicious exploitation

### Actual Risk

**Medium-High**: While the vulnerability existed, actual exploitation risk was moderate because:

1. The application doesn't primarily query through these views in client code
2. Supabase client SDK adds some protection
3. Views are mainly used for admin/debugging purposes

However, any direct SQL queries or API calls using these views would have bypassed RLS.

## Fix Implementation

### Migration: `20251113000000_fix_security_definer_views.sql`

```sql
-- Drop and recreate all *_active views with SECURITY INVOKER
drop view if exists public.projects_active;
drop view if exists public.chapters_active;
drop view if exists public.characters_active;
drop view if exists public.notes_active;

create view public.projects_active
with (security_invoker = true) as
  select * from public.projects where deleted_at is null;

-- [Same pattern for other views]
```

### How to Apply

```bash
# Method 1: Supabase CLI (recommended)
supabase db push

# Method 2: Supabase Dashboard
# 1. Go to Database → SQL Editor
# 2. Paste migration content
# 3. Run query

# Method 3: Migration will auto-apply on next deploy
```

## Verification

### Test RLS Enforcement

```sql
-- As authenticated user, should only see your own projects
select count(*) from public.projects_active;

-- Should match base table query (RLS enforced)
select count(*) from public.projects where deleted_at is null;

-- Check view security mode
select
  schemaname,
  viewname,
  viewowner,
  definition
from pg_views
where viewname like '%_active';
```

### Expected Behavior After Fix

✅ Views respect RLS policies
✅ Users only see their own data
✅ `can_access_project()` function is called
✅ Splinter Security Advisor shows 0 SECURITY DEFINER errors

## Prevention Guidelines

### For Future View Creation

**Always explicitly specify SECURITY INVOKER:**

```sql
-- ✅ CORRECT
create view public.my_view
with (security_invoker = true) as
  select * from public.my_table;

-- ❌ WRONG (defaults to SECURITY DEFINER)
create view public.my_view as
  select * from public.my_table;
```

### View Creation Checklist

- [ ] Add `with (security_invoker = true)` to all views
- [ ] Test with multiple users to verify RLS enforcement
- [ ] Check Splinter Security Advisor for warnings
- [ ] Document why SECURITY DEFINER is used (if truly needed)
- [ ] Add comments explaining security model

### When SECURITY DEFINER Is Appropriate

Rarely! Only when you explicitly need to bypass RLS for:

- System-level views (like monitoring)
- Admin-only operations
- Controlled data aggregation

**Always document why and add strict access controls.**

## Timeline

- **2025-01-28**: Vulnerable views created in migration `20250128000003`
- **2025-11-13**: Issue discovered via Splinter Security Advisor
- **2025-11-13**: Fix created in migration `20251113000000`
- **2025-11-13**: Security advisory published

## References

- PostgreSQL Documentation: [CREATE VIEW - Security](https://www.postgresql.org/docs/current/sql-createview.html)
- Supabase Docs: [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- Migration File: `supabase/migrations/20251113000000_fix_security_definer_views.sql`
- Original Migration: `supabase/migrations/20250128000003_soft_delete_helpers.sql`

## Questions?

For security-related questions:

- GitHub Security Advisory: (Create private advisory if needed)
- Email: security@inkwell.app (if you have dedicated email)
- GitHub Issues: https://github.com/oklahomahail/Inkwell2/issues (for non-sensitive questions)
