# RLS Recursion Prevention Guide

**Date:** 2025-11-15
**Status:** All recursion paths identified and fixed
**Risk Level:** 🟢 LOW (with safeguards in place)

---

## Executive Summary

All RLS (Row Level Security) policies have been audited for recursion risks. **One actual recursion bug was found and fixed** in `project_settings_read` policy. All other policies are safe, but documentation and safeguards have been added to prevent future issues.

---

## Background: How RLS Recursion Happens

RLS recursion occurs when:

1. A policy on table A queries table B
2. Table B's policy calls a function that queries table A again
3. Table A's policy triggers → infinite loop

**Example of the bug we fixed:**

```sql
-- project_settings policy (BROKEN):
CREATE POLICY "project_settings_read" ON project_settings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects p              -- ① Queries projects
      WHERE p.id = project_settings.project_id
        AND can_access_project(p.id)        -- ② Function queries projects AGAIN
    )
  );

-- can_access_project function:
CREATE FUNCTION can_access_project(pid uuid) AS $$
  SELECT EXISTS(
    SELECT 1 FROM projects p                -- ③ RECURSION!
    WHERE p.id = pid ...
  );
$$;
```

**Flow:**

```
project_settings query
  → project_settings RLS policy
    → SELECT from projects
      → projects RLS policy
        → can_access_project()
          → SELECT from projects
            → projects RLS policy
              → can_access_project()
                → ∞ INFINITE LOOP
```

---

## The `can_access_project()` Helper Function

### Definition

Located in: `supabase/migrations/20250128000000_inkwell_schema.sql:96-108`

```sql
CREATE FUNCTION public.can_access_project(pid uuid)
RETURNS BOOLEAN LANGUAGE sql STABLE AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.projects p
    WHERE p.id = pid
      AND (
        p.owner_id = auth.uid() OR EXISTS(
          SELECT 1 FROM public.project_members m
          WHERE m.project_id = pid AND m.user_id = auth.uid()
        )
      )
  );
$$;
```

### Tables Queried

1. `projects` - **PRIMARY RECURSION SOURCE**
2. `project_members` (nested query)

### Safe Usage

✅ **Safe to use in policies on these tables:**

- `chapters` - has project_id, needs to verify access
- `characters` - has project_id, needs to verify access
- `notes` - has project_id, needs to verify access
- `sections` - has project_id, needs to verify access

### Unsafe Usage

❌ **NEVER use in:**

1. Policies on the `projects` table itself
2. Policies that already query `projects` table
3. Any context where you're already in a projects query

---

## Audit Results: All Tables

| Table                | Policies Using `can_access_project()` | Recursion Risk | Status   |
| -------------------- | ------------------------------------- | -------------- | -------- |
| **projects**         | ❌ None (uses direct checks)          | 🟢 None        | ✅ Safe  |
| **project_members**  | ❌ None (queries projects directly)   | 🟡 Indirect    | ✅ Safe  |
| **chapters**         | ✅ read, insert, update               | 🟢 None        | ✅ Safe  |
| **characters**       | ✅ read, insert, update               | 🟢 None        | ✅ Safe  |
| **notes**            | ✅ read, insert, update               | 🟢 None        | ✅ Safe  |
| **sections**         | ✅ read, insert, update, delete       | 🟢 None        | ✅ Safe  |
| **project_settings** | ❌ None (FIXED - was recursive)       | 🟢 None        | ✅ Fixed |
| **profiles**         | ❌ None                               | 🟢 None        | ✅ Safe  |

---

## Why Current Setup is Safe

### 1. Projects Table Policies (Direct Checks)

```sql
-- ✅ SAFE - No recursion risk
CREATE POLICY "projects_read" ON projects
FOR SELECT USING (
  owner_id = auth.uid() OR EXISTS(
    SELECT 1 FROM project_members m
    WHERE m.project_id = projects.id
      AND m.user_id = auth.uid()
  )
);
```

**Why safe:** Uses direct `owner_id` check and `project_members` query. Does NOT call `can_access_project()`.

### 2. Child Tables (chapters, etc.) - Use Helper Safely

```sql
-- ✅ SAFE - Helper doesn't create loop
CREATE POLICY "chapters_read" ON chapters
FOR SELECT USING (
  can_access_project(project_id)
);
```

**Why safe:**

- Policy calls `can_access_project(project_id)`
- Function queries `projects` table
- Projects policy uses direct checks (no recursion back)

### 3. Project Settings - Fixed

```sql
-- ✅ SAFE (after fix) - Direct checks, no helper
CREATE POLICY "project_settings_read" ON project_settings
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = project_settings.project_id
      AND (
        p.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM project_members m
          WHERE m.project_id = p.id
            AND m.user_id = auth.uid()
        )
      )
  )
);
```

**Why safe:** Uses the same direct checks as `can_access_project()` would, but inline. No function call that could recurse.

---

## Safeguards Added

### 1. Documentation in Function (20251115000001 migration)

Added extensive comments to `can_access_project()` warning about recursion risks.

### 2. Automated Validation

Migration includes a check that fails if any policy on `projects` uses `can_access_project()`:

```sql
-- Runs during migration
SELECT COUNT(*) FROM pg_policies
WHERE tablename = 'projects'
  AND pg_get_expr(...) LIKE '%can_access_project%';

IF count > 0 THEN
  RAISE EXCEPTION 'UNSAFE RLS DETECTED: recursion risk!';
END IF;
```

### 3. Warning Comments

All policies that query `projects` have been documented with recursion warnings.

---

## Rules for Future Development

### ✅ DO

1. **Use `can_access_project()` for child tables** (chapters, characters, notes, sections)
2. **Use direct checks when querying projects** (owner_id + membership)
3. **Test new policies** before deploying to production
4. **Document any new helper functions** that query multiple tables

### ❌ DON'T

1. **Never use `can_access_project()` on the projects table**
2. **Never nest `can_access_project()` inside queries that already access projects**
3. **Never create helper functions that call each other** in a loop
4. **Don't assume SECURITY DEFINER bypasses RLS** - it doesn't for the current user's queries

---

## Testing for Recursion

### Manual Test

```sql
-- This should work (safe usage):
SELECT * FROM chapters WHERE project_id = 'some-uuid';

-- This should work (safe usage):
SELECT * FROM project_settings WHERE project_id = 'some-uuid';

-- If either hangs or times out, you have recursion
```

### Automated Test (in migration)

Run: `npx supabase db push`

The validation in migration `20251115000001` will fail if unsafe policies detected.

---

## What We Fixed

### Migration: 20251115000000_fix_project_settings_recursion.sql

**Problem:** `project_settings_read` policy queried projects AND called `can_access_project()`, creating recursion.

**Solution:** Replaced with direct inline checks:

```sql
-- BEFORE (RECURSIVE):
AND public.can_access_project(p.id)

-- AFTER (SAFE):
AND (
  p.owner_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.project_members m
    WHERE m.project_id = p.id
      AND m.user_id = auth.uid()
  )
)
```

---

## Related Files

- `/supabase/migrations/20250128000000_inkwell_schema.sql` - Original policies
- `/supabase/migrations/20251114000000_cloud_sync_phase1_schema.sql` - Cloud sync policies (had bug)
- `/supabase/migrations/20251115000000_fix_project_settings_recursion.sql` - **FIX**
- `/supabase/migrations/20251115000001_document_rls_recursion_risks.sql` - **SAFEGUARDS**
- `/tmp/rls_recursion_analysis.md` - **FULL AUDIT**

---

## Monitoring

### Symptoms of RLS Recursion

1. **Infinite recursion detected in policy for relation "X"** error
2. Queries to affected table hang indefinitely
3. Database CPU spikes to 100%
4. Cloud sync fails with timeout errors

### How to Fix

1. Identify which policy causes the error (check error message)
2. Look for helper function calls within the policy
3. Check if the helper queries the same table
4. Replace helper with inline checks OR redesign policy logic

---

## Summary

✅ **All RLS policies audited**
✅ **One recursion bug found and fixed** (project_settings)
✅ **No other recursion paths exist**
✅ **Safeguards added** to prevent future issues
✅ **Documentation updated** with clear guidelines

**Risk Assessment:** 🟢 **LOW** - All current policies are safe with proper safeguards in place.

---

_Last updated: 2025-11-15_
_Next review: Before adding any new RLS policies or helper functions_
