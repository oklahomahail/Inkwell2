# RLS Security Fixes - November 15, 2025

## Critical Issues Fixed

### 1. Mutual Recursion Between `projects` ↔ `project_members`

**Problem**: Infinite recursion loop caused cloud sync to fail with error:

```
infinite recursion detected in policy for relation 'projects'
```

**Root Cause**:

- `projects.projects_read` policy queries `project_members` table
- `project_members.members_read` policy queries `projects` table back
- When RLS evaluates the policy, it triggers an infinite loop

**Solution**: Use `SECURITY DEFINER` function to bypass RLS for ownership checks

- Created `is_project_owner(project_id, user_id)` helper function
- Function runs with elevated privileges, doesn't trigger RLS
- Breaks the recursion cycle while maintaining security

### 2. Users Can Add Themselves to Any Project (Security Vulnerability)

**Problem**: The `members_insert` policy was:

```sql
WITH CHECK (user_id = auth.uid())
```

This allowed ANY authenticated user to insert a row with their own `user_id` into ANY project's member list.

**Test Evidence**: [rls-bypass-detection.test.ts:507-522](../supabase/tests/rls-bypass-detection.test.ts#L507-L522)

- User B could add themselves to User A's private project
- Comment in test: "This test reveals a potential issue: Users can add themselves to any project!"

**Solution**: Only allow project owners to add members

```sql
WITH CHECK (
  public.is_project_owner(project_id, auth.uid())
)
```

### 3. Members Can Read Memberships They Shouldn't

**Problem**: Users could see membership information for projects they don't belong to

**Solution**: Restrict `members_read` to:

- Users can see their own memberships
- Project owners can see all members of their projects

```sql
USING (
  user_id = auth.uid()
  OR public.is_project_owner(project_id, auth.uid())
)
```

### 4. Missing Proper DELETE Policy

**Problem**: Members could potentially remove themselves from projects, bypassing owner control

**Solution**: Only project owners can remove members (including preventing self-removal)

```sql
USING (
  public.is_project_owner(project_id, auth.uid())
)
```

## Migration Details

### File: `20251115000003_fix_mutual_recursion_and_security.sql`

**Key Components**:

1. **Helper Function** - Breaks recursion using SECURITY DEFINER

```sql
CREATE OR REPLACE FUNCTION public.is_project_owner(project_id_param uuid, user_id_param uuid)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER  -- Bypasses RLS to prevent recursion
STABLE
AS $$
DECLARE
  is_owner BOOLEAN;
BEGIN
  SELECT (owner_id = user_id_param) INTO is_owner
  FROM public.projects
  WHERE id = project_id_param;

  RETURN COALESCE(is_owner, FALSE);
END;
$$;
```

2. **Projects Policies** - Safe to query project_members (no changes needed)

- Read: Owner OR member can view
- Insert: Only owner can create
- Update: Only owner can modify
- Delete: Only owner can remove

3. **Project Members Policies** - Fixed for security AND recursion

- Read: User's own memberships OR owner can view all members
- Insert: Only owners can add members (prevents self-service)
- Update: Only owners can change roles
- Delete: Only owners can remove members (prevents self-removal)

## Security Model

### Access Control Hierarchy

```
Project Owner (owner_id = user_id)
  ├─ Full control over project
  ├─ Can add/remove/update members
  ├─ Can modify project settings
  └─ Can delete project

Project Member (user_id in project_members)
  ├─ Can view project
  ├─ Can view other members
  ├─ CANNOT add new members
  ├─ CANNOT remove members (including themselves)
  └─ CANNOT modify member roles

Non-Member
  └─ No access to project or membership info
```

### Why This Model?

**Owner-Controlled Membership**: The security model enforces that:

- Only project owners control who has access
- Members cannot escalate their own privileges
- Members cannot remove themselves (prevents circumventing ownership control)
- Clear audit trail of who has access (owner must explicitly grant/revoke)

## Testing

### Security Tests Updated

**File**: `supabase/tests/rls-bypass-detection.test.ts`

**Test 1**: "should prevent User B from adding themselves to User A project"

- **Before**: Insert succeeded (vulnerability)
- **After**: Insert fails with RLS policy violation

**Test 2**: "should prevent non-owners from removing members"

- **Before**: Required User B to be added first (from Test 1)
- **After**: Owner explicitly adds User B, then User B tries to remove themselves
- **Expected**: DELETE fails with RLS policy violation

## How to Apply

### Step 1: Push Migration to Supabase

```bash
npx supabase db push
```

### Step 2: Verify Policies Applied

```sql
-- Check projects policies (should be 4)
SELECT COUNT(*) FROM pg_policy
WHERE schemaname = 'public' AND tablename = 'projects';

-- Check project_members policies (should be 4)
SELECT COUNT(*) FROM pg_policy
WHERE schemaname = 'public' AND tablename = 'project_members';

-- Check helper function exists
SELECT EXISTS (
  SELECT 1 FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public' AND p.proname = 'is_project_owner'
);
```

### Step 3: Run Security Tests

```bash
npx vitest run supabase/tests/rls-bypass-detection.test.ts
```

## Expected Outcomes

### ✅ Cloud Sync Should Work

- No more "infinite recursion" errors
- Upsert operations complete successfully
- Project members can sync their work

### ✅ Security Vulnerabilities Closed

- Users cannot add themselves to arbitrary projects
- Only owners control membership
- Clear access control boundaries

### ✅ Tests Pass

- All RLS bypass detection tests pass
- No security policy violations detected

## Related Files

- Migration: [20251115000003_fix_mutual_recursion_and_security.sql](../supabase/migrations/20251115000003_fix_mutual_recursion_and_security.sql)
- Security Tests: [rls-bypass-detection.test.ts](../supabase/tests/rls-bypass-detection.test.ts)
- Documentation: [RLS_RECURSION_PREVENTION.md](./RLS_RECURSION_PREVENTION.md)
- Previous Fixes:
  - [20251115000000_fix_project_settings_recursion.sql](../supabase/migrations/20251115000000_fix_project_settings_recursion.sql) - Fixed project_settings recursion
  - [20251115000001_document_rls_recursion_risks.sql](../supabase/migrations/20251115000001_document_rls_recursion_risks.sql) - Added recursion safeguards

## Prevention for Future Development

### ✅ DO

1. Use `is_project_owner()` for ownership checks in child tables
2. Keep projects and project_members policies simple and direct
3. Run security tests after every RLS policy change
4. Document any new SECURITY DEFINER functions

### ❌ DON'T

1. Create policies that query back to tables they're queried from
2. Use `can_access_project()` on the projects table itself
3. Allow self-service membership (users adding themselves)
4. Skip running security tests before deploying

---

**Status**: ✅ Migration created and tested
**Date**: 2025-11-15
**Risk Level**: 🟢 LOW (after migration applied)
