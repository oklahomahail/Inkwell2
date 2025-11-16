# Verify RLS Migration Applied Correctly

Run these queries in the Supabase SQL Editor to verify the migration was applied correctly.

## Quick Verification (Run This First)

```sql
-- Should return 8 total policies (4 for projects, 4 for project_members)
SELECT
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('projects', 'project_members')
GROUP BY tablename
ORDER BY tablename;
```

**Expected Output**:

```
tablename         | policy_count
------------------+--------------
project_members   | 4
projects          | 4
```

---

## Detailed Policy Check

```sql
-- See all policies with their operations
SELECT
  tablename,
  policyname,
  cmd as operation
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('projects', 'project_members')
ORDER BY tablename, policyname;
```

**Expected Output** (8 rows):

### projects table (4 policies):

- `projects_delete` - DELETE
- `projects_insert` - INSERT
- `projects_read` - SELECT
- `projects_update` - UPDATE

### project_members table (4 policies):

- `members_delete` - DELETE
- `members_insert` - INSERT
- `members_read` - SELECT
- `members_update` - UPDATE

---

## Verify is_project_owner() Function

```sql
-- Check the helper function exists and is SECURITY DEFINER
SELECT
  proname as function_name,
  prosecdef as is_security_definer,
  CASE provolatile
    WHEN 'i' THEN 'IMMUTABLE'
    WHEN 's' THEN 'STABLE'
    WHEN 'v' THEN 'VOLATILE'
  END as volatility,
  pg_get_function_arguments(oid) as arguments,
  pg_get_function_result(oid) as return_type
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND proname = 'is_project_owner';
```

**Expected Output**:

```
function_name    | is_security_definer | volatility | arguments              | return_type
-----------------+---------------------+------------+------------------------+-------------
is_project_owner | t                   | STABLE     | project_id_param uuid, | boolean
                 |                     |            | user_id_param uuid     |
```

**Critical**: `is_security_definer` MUST be `t` (true). If it's `f`, the recursion fix won't work!

---

## Check for Recursion (Advanced)

```sql
-- Show actual policy definitions for project_members
-- This verifies they use is_project_owner() and NOT direct queries to projects
SELECT
  policyname,
  pg_get_expr(pol.polqual, pol.polrelid) as using_clause,
  pg_get_expr(pol.polwithcheck, pol.polrelid) as with_check_clause
FROM pg_policy pol
JOIN pg_class c ON pol.polrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE c.relname = 'project_members'
  AND n.nspname = 'public'
ORDER BY policyname;
```

**What to Look For**:

- ✅ Policy definitions should contain `is_project_owner(project_id, auth.uid())`
- ❌ Should NOT contain `EXISTS (SELECT ... FROM projects ...)` in project_members policies
- ❌ Should NOT contain `can_access_project()` calls

**Example Expected Output for members_read**:

```
policyname   | using_clause
-------------+-------------------------------------------------------------
members_read | ((user_id = auth.uid()) OR is_project_owner(project_id, auth.uid()))
```

---

## Test the Function Works

```sql
-- Test is_project_owner() function (replace UUIDs with actual values from your DB)
-- First, get a real project and user
SELECT
  id as project_id,
  owner_id
FROM projects
LIMIT 1;

-- Then test the function (replace with actual UUIDs from above)
SELECT is_project_owner(
  'your-project-id-here'::uuid,
  'your-user-id-here'::uuid
);
```

**Expected**: Should return `true` if the user is the owner, `false` otherwise.

---

## ✅ Success Criteria

Your migration is correctly applied if:

1. ✅ 8 total policies exist (4 for `projects`, 4 for `project_members`)
2. ✅ `is_project_owner()` function exists with `is_security_definer = true`
3. ✅ `project_members` policies use `is_project_owner()` (not direct `projects` queries)
4. ✅ Function has STABLE volatility
5. ✅ Function accepts `(uuid, uuid)` and returns `boolean`

---

## ❌ Common Issues

### Issue 1: Function not SECURITY DEFINER

**Symptom**: `prosecdef = f`
**Fix**: Re-run migration, the function must have SECURITY DEFINER

### Issue 2: Wrong number of policies

**Symptom**: Policy count != 4 for either table
**Fix**: Some policies didn't get created. Re-run migration.

### Issue 3: Policies still query projects directly

**Symptom**: `using_clause` contains `EXISTS (SELECT ... FROM projects ...)`
**Fix**: Old policies weren't dropped. Re-run migration.

---

## Quick Copy-Paste Verification

Run all checks at once:

```sql
-- 1. Policy count (should be 4 and 4)
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public' AND tablename IN ('projects', 'project_members')
GROUP BY tablename ORDER BY tablename;

-- 2. Function check (prosecdef should be 't')
SELECT proname, prosecdef, CASE provolatile WHEN 's' THEN 'STABLE' ELSE 'OTHER' END as volatility
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace AND proname = 'is_project_owner';

-- 3. List all policies
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public' AND tablename IN ('projects', 'project_members')
ORDER BY tablename, policyname;
```

If all three queries return expected results, your migration is ✅ **correctly applied**!
