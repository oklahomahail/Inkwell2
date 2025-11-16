# How to Apply the RLS Security Migration

## Status

✅ **Migration file created**: `supabase/migrations/20251115000003_fix_mutual_recursion_and_security.sql`
✅ **Code committed and pushed**: commit `898e049`
⏳ **Migration not yet applied to Supabase database**

## Why This Migration is Critical

This migration fixes:

1. **Infinite recursion** causing cloud sync to fail with "infinite recursion detected in policy for relation 'projects'"
2. **Security vulnerability** allowing users to add themselves to any project
3. **Information leak** allowing users to see memberships they shouldn't
4. **Missing access controls** on member deletion

## Option 1: Apply via CLI (Recommended)

### Prerequisites

- Ensure no other Supabase CLI processes are running
- Close any terminals with `supabase start` or migrations running

### Steps

```bash
# Kill any stuck processes
pkill -f supabase

# Wait a moment
sleep 2

# Apply migration
npx supabase db push
```

If you see connection errors like "max clients reached", wait 30-60 seconds and retry.

## Option 2: Apply via Supabase Dashboard (Fallback)

If CLI continues to fail due to connection pool exhaustion, use the SQL Editor:

### Steps

1. Open **Supabase Dashboard**: https://supabase.com/dashboard/project/lzurjjorjzeubepnhkgg

2. Navigate to **SQL Editor** (left sidebar)

3. Click **New Query**

4. Copy the entire contents of the migration file:

   ```
   supabase/migrations/20251115000003_fix_mutual_recursion_and_security.sql
   ```

5. Paste into the SQL Editor

6. Click **Run** (or press Cmd/Ctrl + Enter)

7. Verify success - you should see:

   ```
   ✓ Migration complete:
     - projects policies: 4
     - project_members policies: 4
     - is_project_owner() function: created

   ✓ Security fixes applied:
     - Users can no longer add themselves to arbitrary projects
     - Only owners can manage project members (add, update, remove)
     - Members cannot remove themselves (owner-controlled membership)

   ✓ Recursion eliminated:
     - project_members uses SECURITY DEFINER helper instead of querying projects
     - No circular dependency between tables

   Cloud sync should now work without "infinite recursion" errors
   ```

## Verification After Migration

### 1. Check Policies Applied

Run in SQL Editor:

```sql
SELECT policyname, tablename
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('projects', 'project_members')
ORDER BY tablename, policyname;
```

**Expected output**: 8 policies total (4 for projects, 4 for project_members)

### 2. Verify Helper Function

Run in SQL Editor:

```sql
SELECT proname, prosecdef
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND proname = 'is_project_owner';
```

**Expected output**:

- `proname`: `is_project_owner`
- `prosecdef`: `t` (true - indicating SECURITY DEFINER)

### 3. Test Cloud Sync

Try syncing from the app:

1. Open Inkwell
2. Create or modify content
3. Trigger cloud sync
4. Verify no "infinite recursion" errors appear
5. Check that content syncs successfully

### 4. Run Security Tests (Optional)

```bash
pnpm vitest run supabase/tests/rls-bypass-detection.test.ts
```

**Expected**: All tests pass, especially:

- "should prevent User B from adding themselves to User A project"
- "should prevent non-owners from removing members"

## What Will Happen After Migration

✅ **Immediate fixes**:

- Cloud sync will work without recursion errors
- `ensureProjectExists()` will succeed
- All queued sync operations will process
- "Parent not found" errors will resolve

✅ **Security improvements**:

- Only project owners can add/remove members
- Members cannot escalate their privileges
- Clear access control boundaries enforced

✅ **UI improvements**:

- Writing Panel will stop freezing
- Duplicate chapter issues will disappear
- Section reordering will work correctly
- E2EE content will sync normally

## Troubleshooting

### "max clients reached" error persists

**Solution**: Use Option 2 (Dashboard SQL Editor) - it bypasses the CLI connection pool

### Migration appears to succeed but no NOTICE messages

**Check**: Run verification queries above to confirm policies and function were created

### Still seeing recursion errors after migration

**Verify**:

1. Check that `is_project_owner()` function exists with `SECURITY DEFINER`
2. Confirm `project_members` policies don't query `projects` table directly
3. Run: `SELECT * FROM pg_policies WHERE tablename = 'project_members'` and verify policies match migration

## Related Documentation

- [RLS Security Fixes](./RLS_SECURITY_FIXES_2025-11-15.md) - Comprehensive security fix documentation
- [RLS Recursion Prevention](./RLS_RECURSION_PREVENTION.md) - Prevention guide for future development
- Migration file: [20251115000003_fix_mutual_recursion_and_security.sql](../supabase/migrations/20251115000003_fix_mutual_recursion_and_security.sql)

---

**Created**: 2025-11-15
**Status**: Ready to apply
