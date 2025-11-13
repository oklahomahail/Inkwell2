# Database Views - Security Guide

## TL;DR - Always Use SECURITY INVOKER

```sql
-- ✅ ALWAYS DO THIS
create view public.my_view
with (security_invoker = true) as
  select * from public.my_table where some_condition;

-- ❌ NEVER DO THIS (defaults to SECURITY DEFINER)
create view public.my_view as
  select * from public.my_table where some_condition;
```

## Why This Matters

PostgreSQL views default to `SECURITY DEFINER`, which means:

- **Runs with owner's privileges** (typically postgres superuser)
- **Bypasses Row-Level Security (RLS) policies**
- **Can expose data across permission boundaries**

For Inkwell, this is **critical** because:

- We rely heavily on RLS for multi-tenant data isolation
- All tables have RLS policies using `can_access_project()`
- Views without `SECURITY INVOKER` expose data to unauthorized users

## Security Modes Explained

### SECURITY INVOKER (✅ Use This)

```sql
create view public.projects_active
with (security_invoker = true) as
  select * from public.projects where deleted_at is null;
```

**Behavior:**

- View runs with **querying user's** privileges
- Respects all RLS policies on underlying tables
- Only shows data user has permission to access

**Use for:**

- All views in multi-tenant applications
- Any view that filters user-specific data
- Views that should respect RLS (99% of cases)

### SECURITY DEFINER (⚠️ Rarely Needed)

```sql
create view public.admin_stats
with (security_definer = true) as
  select count(*) as total_users from auth.users;
```

**Behavior:**

- View runs with **view owner's** privileges
- **Bypasses** RLS policies
- Can access data user normally couldn't

**Use ONLY for:**

- Admin-only aggregations
- System monitoring views
- Cross-tenant statistics
- When explicitly documented and reviewed

**Requirements:**

- Document why SECURITY DEFINER is needed
- Add strict access controls (revoke public access)
- Security review required
- Add comment explaining bypass

## Inkwell View Patterns

### Pattern 1: Active Records (Soft Delete Filter)

```sql
-- Filter out soft-deleted records
create view public.chapters_active
with (security_invoker = true) as
  select * from public.chapters where deleted_at is null;

-- RLS policies on base table are automatically enforced
grant select on public.chapters_active to authenticated;
```

### Pattern 2: Filtered by Project

```sql
-- View with explicit project filter
create view public.recent_chapters
with (security_invoker = true) as
  select
    id,
    project_id,
    title,
    created_at
  from public.chapters
  where
    deleted_at is null
    and created_at > now() - interval '30 days';

-- RLS policy can_access_project() is enforced automatically
grant select on public.recent_chapters to authenticated;
```

### Pattern 3: Aggregated Data (with RLS)

```sql
-- Aggregation respecting user permissions
create view public.project_stats
with (security_invoker = true) as
  select
    project_id,
    count(*) as chapter_count,
    sum(word_count) as total_words
  from public.chapters
  where deleted_at is null
  group by project_id;

-- Only aggregates data user can access
grant select on public.project_stats to authenticated;
```

## Migration Template

```sql
-- Migration: 2025XXXX_add_my_view.sql

-- Create view with explicit SECURITY INVOKER
create view public.my_view_name
with (security_invoker = true) as
  select
    column1,
    column2
  from public.base_table
  where some_filter;

-- Grant access to authenticated users
grant select on public.my_view_name to authenticated;

-- Document purpose and security model
comment on view public.my_view_name is
  'Description of view purpose (SECURITY INVOKER - respects RLS)';
```

## Verification Checklist

Before deploying a new view:

- [ ] View uses `with (security_invoker = true)`
- [ ] Grants are explicit (not `grant all`)
- [ ] Comment documents purpose and security mode
- [ ] Tested with multiple users to verify RLS enforcement
- [ ] Checked Splinter Security Advisor (no warnings)

### Test RLS Enforcement

```sql
-- As user A, insert test data
insert into projects (id, owner_id, name)
values ('test-a', auth.uid(), 'Project A');

-- As user B, try to access via view
select * from projects_active where id = 'test-a';
-- Should return 0 rows (RLS blocks access)

-- As user A, should see own data
select * from projects_active where id = 'test-a';
-- Should return 1 row (RLS allows access)
```

## Common Mistakes

### ❌ Mistake 1: Forgetting security_invoker

```sql
-- WRONG - defaults to SECURITY DEFINER
create view public.my_view as
  select * from public.my_table;
```

**Fix:**

```sql
-- CORRECT
create view public.my_view
with (security_invoker = true) as
  select * from public.my_table;
```

### ❌ Mistake 2: Assuming Views Inherit RLS

**Wrong Assumption:**
"The base table has RLS, so the view is secure automatically."

**Reality:**
Views with SECURITY DEFINER **bypass** all RLS policies on base tables.

**Fix:**
Always add `with (security_invoker = true)`.

### ❌ Mistake 3: Over-Granting Permissions

```sql
-- WRONG - too permissive
grant all on public.my_view to public;
```

**Fix:**

```sql
-- CORRECT - grant only what's needed
grant select on public.my_view to authenticated;
```

## Checking Existing Views

### Find All Views

```sql
select
  schemaname,
  viewname,
  viewowner
from pg_views
where schemaname = 'public'
order by viewname;
```

### Check Security Mode

```sql
-- This query checks view options
-- SECURITY INVOKER views will show in security_barrier or view options
select
  schemaname,
  viewname,
  definition
from pg_views
where schemaname = 'public'
and viewname like '%_active';
```

### Splinter Security Advisor

Supabase includes Splinter, a Postgres linter:

1. Go to Dashboard → Database → Advisors
2. Check for "Security Definer View" warnings
3. Fix any flagged views immediately

## References

- PostgreSQL Docs: [CREATE VIEW - Security](https://www.postgresql.org/docs/current/sql-createview.html)
- Supabase Docs: [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)
- Security Advisory: [docs/SECURITY_ADVISORY_2025-11-13.md](../SECURITY_ADVISORY_2025-11-13.md)
- Migration: `supabase/migrations/20251113000000_fix_security_definer_views.sql`

## Questions?

- Team Lead: Review required for any SECURITY DEFINER views
- Security: Document in security advisory if needed
- CI/CD: Splinter checks run on every migration
