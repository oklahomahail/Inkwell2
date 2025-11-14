# Verify Security Fixes

This guide helps you manually verify that the security fixes have been applied correctly and are working as expected.

## ✅ Migrations Applied

All 4 critical security fix migrations have been applied to your remote database:

- ✅ `20251113000001_fix_soft_delete_authorization.sql`
- ✅ `20251113000002_fix_bulk_upsert_authorization.sql`
- ✅ `20251113000003_add_missing_delete_policies.sql`
- ✅ `20251113000004_add_project_members_update_policy.sql`

## 🔍 Verification Steps

### Step 1: Run Database Verification Queries

1. Open Supabase Studio: https://supabase.com/dashboard
2. Navigate to your project → SQL Editor
3. Copy and paste queries from [supabase/verify_security_fixes.sql](../supabase/verify_security_fixes.sql)
4. Run each query and verify the results

**Expected Results:**

#### Query 1: soft_delete() function

- Should contain `Permission denied: not project owner`
- Should contain `can_write_project`

#### Query 2: bulk*upsert*\*() functions

- All three functions should contain `can_write_project`
- Should contain `Permission denied for project`

#### Query 3: DELETE policies

```
tablename         | select_policies | insert_policies | update_policies | delete_policies | total_policies
------------------+-----------------+-----------------+-----------------+-----------------+----------------
chapters          | 1               | 1               | 1               | 1               | 4
characters        | 1               | 1               | 1               | 1               | 4
notes             | 1               | 1               | 1               | 1               | 4
profiles          | 1               | 1               | 1               | 1               | 4
project_members   | 1               | 1               | 1               | 1               | 4+
projects          | 1               | 1               | 1               | 1               | 4
```

#### Query 4: project_members UPDATE policy

- Should see `members_update` policy
- USING clause should check if user is project owner

#### Query 5: RLS enabled

- All 6 tables should have `rls_enabled = true`

---

### Step 2: Manual Security Testing (Optional)

If you want to test the fixes manually in your application:

#### Test 1: Verify Users Cannot Delete Others' Projects

```javascript
// In your browser console or app:

// 1. Create a project as User A
const { data: project } = await supabase
  .from('projects')
  .insert({ title: 'Test Project' })
  .select()
  .single();

console.log('Project ID:', project.id);

// 2. Try to soft-delete as User A (should succeed)
const { error: deleteError } = await supabase.rpc('soft_delete', {
  _table: 'projects',
  _id: project.id,
});

console.log('Delete own project:', deleteError); // Should be null (success)

// 3. Sign out and sign in as different user

// 4. Try to soft-delete User A's project (should FAIL)
const { error: unauthorizedError } = await supabase.rpc('soft_delete', {
  _table: 'projects',
  _id: project.id, // User A's project
});

console.log('Delete others project:', unauthorizedError);
// Expected: "Permission denied: not project owner"
```

#### Test 2: Verify Users Cannot Bulk Upsert to Others' Projects

```javascript
// As User B, try to bulk insert into User A's project

const { error } = await supabase.rpc('bulk_upsert_chapters', {
  rows: [
    {
      id: crypto.randomUUID(),
      project_id: 'user-a-project-id', // Someone else's project
      title: 'Unauthorized Chapter',
      body: 'Should fail',
      index_in_project: 0,
      order_index: 0,
      content: 'Should fail',
      client_rev: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
});

console.log('Bulk upsert to others project:', error);
// Expected: "Permission denied for project <id>"
```

#### Test 3: Verify DELETE Policies Work

```javascript
// Try to hard delete a chapter in someone else's project

const { error } = await supabase.from('chapters').delete().eq('id', 'someone-elses-chapter-id');

console.log('Hard delete error:', error);
// Expected: Error (RLS policy violation)
```

#### Test 4: Verify Project Owners Can Update Member Roles

```javascript
// As project owner, update a member's role

const { data, error } = await supabase
  .from('project_members')
  .update({ role: 'editor' })
  .eq('project_id', 'my-project-id')
  .eq('user_id', 'member-user-id')
  .select();

console.log('Update member role:', data, error);
// Expected: Success (no error)
```

---

### Step 3: Monitor Application Logs

After deploying, monitor your application for any errors:

1. **Supabase Dashboard** → Project → Logs
2. Look for any errors related to:
   - `soft_delete` function calls
   - `bulk_upsert_*` function calls
   - Permission denied errors
   - RLS policy violations

**What to Look For:**

✅ **Good Signs:**

- Users can access their own data
- Users can soft-delete their own resources
- Users can bulk upsert to their own projects
- Project owners can update member roles

❌ **Red Flags:**

- "Permission denied" errors for legitimate operations
- Users unable to access their own data
- Unexpected RLS policy violations

---

### Step 4: Verify No Breaking Changes

Test these user flows to ensure nothing broke:

#### User Flow 1: Create and Edit Project

1. Create a new project ✅
2. Add chapters ✅
3. Edit chapters ✅
4. Delete chapters (soft delete) ✅

#### User Flow 2: Project Collaboration

1. Create project as Owner ✅
2. Invite member as Viewer ✅
3. Member can read but not write ✅
4. Upgrade member to Editor ✅ (NEW - should now work!)
5. Editor can write ✅

#### User Flow 3: Bulk Sync

1. Create multiple chapters locally ✅
2. Bulk sync to server ✅
3. Verify all chapters synced ✅

---

## 🎉 Success Criteria

Your security fixes are working correctly if:

- [x] All database verification queries return expected results
- [ ] Users can only delete their own resources
- [ ] Users can only bulk upsert to their own projects
- [ ] DELETE policies prevent unauthorized hard deletes
- [ ] Project owners can update member roles
- [ ] No breaking changes in user flows
- [ ] No unexpected errors in application logs

---

## 🆘 If Something Goes Wrong

### Issue: "Permission denied" for legitimate operations

**Possible Causes:**

1. User is not properly authenticated
2. Policy logic has edge case
3. Function is not checking the right conditions

**Debug Steps:**

```sql
-- Check user's auth context
SELECT auth.uid(), auth.jwt();

-- Check user's project access
SELECT * FROM project_members WHERE user_id = auth.uid();

-- Check if can_write_project works
SELECT can_write_project('project-id-here');
```

### Issue: Users CAN access resources they shouldn't

**Immediate Action:**

1. Check if RLS is enabled: `SELECT rowsecurity FROM pg_tables WHERE tablename = 'table_name';`
2. Review policies: `SELECT * FROM pg_policies WHERE tablename = 'table_name';`
3. If confirmed bypass, contact security team immediately

---

## 📊 Security Status Dashboard

After verification, update this checklist:

### Critical Fixes

- [x] soft_delete() has authorization checks
- [x] bulk_upsert_chapters() has authorization checks
- [x] bulk_upsert_characters() has authorization checks
- [x] bulk_upsert_notes() has authorization checks

### Policy Coverage

- [x] All tables have RLS enabled (6/6)
- [x] All tables have SELECT policies (6/6)
- [x] All tables have INSERT policies (6/6)
- [x] All tables have UPDATE policies (6/6)
- [x] All tables have DELETE policies (6/6)

### Testing

- [ ] Manual security tests completed
- [ ] User flows verified
- [ ] Application logs checked
- [ ] No breaking changes detected

### Next Steps

- [ ] Enable automated security tests in CI/CD
- [ ] Schedule quarterly security review
- [ ] Train team on secure coding practices

---

## 📚 Additional Resources

- [Security Audit Report](./SECURITY_AUDIT.md)
- [Security Hardening Checklist](./SECURITY_HARDENING_CHECKLIST.md)
- [Security Testing Guide](./SECURITY_TESTING.md)
- [Verification SQL Queries](../supabase/verify_security_fixes.sql)

---

**Last Updated:** 2025-11-13
**Status:** ✅ Migrations Applied - Verification In Progress
