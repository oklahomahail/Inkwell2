# Apply Critical Security Fixes

This document guides you through applying the critical security fixes identified in the security audit.

## ⚠️ CRITICAL: Apply These Fixes ASAP

These migrations fix **critical vulnerabilities** that allow any authenticated user to:

- ❌ Soft-delete ANY project, chapter, character, or note
- ❌ Bulk insert/update data in ANY project

## 📋 Migrations to Apply

Apply these migrations in order:

1. ✅ **[APPLIED]** `20251113000000_fix_security_definer_views.sql` - Fix views to respect RLS
2. 🔴 **[CRITICAL]** `20251113000001_fix_soft_delete_authorization.sql` - Add auth checks to soft_delete()
3. 🔴 **[CRITICAL]** `20251113000002_fix_bulk_upsert_authorization.sql` - Add auth checks to bulk*upsert*\*()
4. 🟠 **[HIGH]** `20251113000003_add_missing_delete_policies.sql` - Add DELETE policies
5. 🟠 **[HIGH]** `20251113000004_add_project_members_update_policy.sql` - Add UPDATE policy for members

## 🧪 Test Locally First

**IMPORTANT:** Always test migrations locally before pushing to production!

```bash
# 1. Start Supabase locally (if not already running)
supabase start

# 2. Apply all migrations locally
supabase db reset

# 3. Run security tests
pnpm test:security

# 4. Verify no errors
# Expected: All 26 tests should pass
```

### Expected Test Results

Before fixes:

- ❌ Tests for `soft_delete()` will FAIL (users can delete others' data)
- ❌ Tests for `bulk_upsert_*()` will FAIL (users can insert into others' projects)

After fixes:

- ✅ All 26 security tests should PASS

## 🚀 Apply to Production

Once local tests pass:

```bash
# Push migrations to production
supabase db push
```

You'll see:

```
Do you want to push these migrations to the remote database?
 • 20251113000001_fix_soft_delete_authorization.sql
 • 20251113000002_fix_bulk_upsert_authorization.sql
 • 20251113000003_add_missing_delete_policies.sql
 • 20251113000004_add_project_members_update_policy.sql

 [Y/n]
```

Type `y` and press Enter.

## ✅ Verify Production

After applying to production:

### 1. Check Database Logs

```bash
supabase db logs
```

Look for any errors or warnings.

### 2. Verify Functions Updated

In Supabase Studio SQL Editor:

```sql
-- Check soft_delete function has authorization checks
select prosrc from pg_proc
where proname = 'soft_delete'
and pronamespace = 'public'::regnamespace;

-- Should contain: 'Permission denied' checks
```

### 3. Verify Policies Exist

```sql
-- Check all tables have DELETE policies
select tablename, count(*) as policy_count
from pg_policies
where schemaname = 'public'
and tablename in ('projects', 'chapters', 'characters', 'notes', 'profiles', 'project_members')
group by tablename
order by tablename;

-- Expected: Each table should have 4 policies (SELECT, INSERT, UPDATE, DELETE)
-- Note: project_members might have 5 if you have custom policies
```

## 🔍 Monitor for Issues

After deploying:

1. **Watch error logs** for 24 hours
2. **Check for user reports** of access issues
3. **Monitor database performance** (policies add slight overhead)

## 🆘 Rollback (If Needed)

If something goes wrong:

```bash
# Create rollback migration
supabase migration new rollback_security_fixes

# Add rollback SQL (see below)
```

### Rollback SQL (Emergency Use Only)

```sql
-- WARNING: Only use if fixes cause production issues
-- This restores the UNSAFE versions (with vulnerabilities)

-- Rollback soft_delete (UNSAFE)
create or replace function public.soft_delete(_table text, _id uuid)
returns void language plpgsql security definer as $$
begin
  if _table not in ('projects', 'chapters', 'characters', 'notes') then
    raise exception 'Invalid table name: %', _table;
  end if;
  execute format('update public.%I set deleted_at = now() where id = $1', _table) using _id;
end;
$$;

-- Drop new DELETE policies
drop policy if exists "projects_delete" on public.projects;
drop policy if exists "chapters_delete" on public.chapters;
drop policy if exists "characters_delete" on public.characters;
drop policy if exists "notes_delete" on public.notes;
drop policy if exists "profiles_delete" on public.profiles;
drop policy if exists "members_update" on public.project_members;
```

**Note:** If you rollback, you're restoring the vulnerabilities. Fix and redeploy ASAP.

## 📊 What These Fixes Do

### Migration 1: `fix_soft_delete_authorization.sql`

**Before (VULNERABLE):**

```javascript
// ANY user can soft-delete ANY project
await supabase.rpc('soft_delete', {
  _table: 'projects',
  _id: 'someone-elses-project-id',
}); // ❌ Would succeed!
```

**After (SECURE):**

```javascript
// Users can only soft-delete their own resources
await supabase.rpc('soft_delete', {
  _table: 'projects',
  _id: 'someone-elses-project-id',
}); // ✅ Fails with "Permission denied: not project owner"
```

### Migration 2: `fix_bulk_upsert_authorization.sql`

**Before (VULNERABLE):**

```javascript
// ANY user can bulk insert into ANY project
await supabase.rpc('bulk_upsert_chapters', {
  rows: [
    {
      id: uuid(),
      project_id: 'someone-elses-project',
      title: 'Hacked!',
      body: 'Malicious content',
    },
  ],
}); // ❌ Would succeed!
```

**After (SECURE):**

```javascript
// Users can only bulk upsert to projects they can write to
await supabase.rpc('bulk_upsert_chapters', {
  rows: [
    {
      id: uuid(),
      project_id: 'someone-elses-project',
      title: 'Hacked!',
      body: 'Malicious content',
    },
  ],
}); // ✅ Fails with "Permission denied for project <id>"
```

### Migration 3: `add_missing_delete_policies.sql`

**What it does:**

- Adds DELETE policies to all tables
- Prevents unauthorized hard deletes
- Completes RLS policy coverage

**Note:** Soft delete (via RPC) is still recommended, but hard DELETE is now also protected.

### Migration 4: `add_project_members_update_policy.sql`

**What it enables:**

```javascript
// Project owner can now change member roles
await supabase
  .from('project_members')
  .update({ role: 'editor' })
  .eq('project_id', myProjectId)
  .eq('user_id', memberUserId);
// ✅ Now works for project owners
```

## 📚 Additional Resources

- [Security Audit Report](../../docs/SECURITY_AUDIT.md)
- [Security Hardening Checklist](../../docs/SECURITY_HARDENING_CHECKLIST.md)
- [Security Testing Guide](../../docs/SECURITY_TESTING.md)
- [Security Quick Reference](../../docs/SECURITY_QUICK_REFERENCE.md)

## ✅ Checklist

- [ ] Read this document completely
- [ ] Applied migrations locally via `supabase db reset`
- [ ] Ran security tests via `pnpm test:security`
- [ ] All 26 tests pass locally
- [ ] Reviewed migration SQL files
- [ ] Pushed to production via `supabase db push`
- [ ] Verified in production (checked logs, policies, functions)
- [ ] Monitoring for issues for 24 hours
- [ ] Updated team on deployment
- [ ] Marked as complete in security checklist

## 🎉 After Completion

Once applied and verified:

1. Update [SECURITY_HARDENING_CHECKLIST.md](../../docs/SECURITY_HARDENING_CHECKLIST.md):
   - Mark "Fix soft_delete() function" as complete
   - Mark "Fix bulk*upsert*\*() functions" as complete
   - Mark "Add DELETE policies" as complete
   - Mark "Add UPDATE policy to project_members" as complete

2. Run security tests in CI/CD:
   - Enable [.github/workflows/security-tests.yml](../../.github/workflows/security-tests.yml)
   - Configure to run on all PRs touching migrations

3. Celebrate! 🎉 You've fixed critical security vulnerabilities.

---

**Questions?** Review the [Security Documentation](../../docs/SECURITY_README.md)
