-- Verification Queries for Security Fixes
-- Run these in Supabase Studio SQL Editor to verify fixes were applied

-- ==============================================================================
-- 1. Verify soft_delete() function has authorization checks
-- ==============================================================================
SELECT prosrc
FROM pg_proc
WHERE proname = 'soft_delete'
AND pronamespace = 'public'::regnamespace;

-- Expected: Should see 'Permission denied' checks in the function body

-- ==============================================================================
-- 2. Verify bulk_upsert functions have authorization checks
-- ==============================================================================
SELECT proname, prosrc
FROM pg_proc
WHERE proname LIKE 'bulk_upsert_%'
AND pronamespace = 'public'::regnamespace
ORDER BY proname;

-- Expected: Should see 'can_write_project' checks in all three functions

-- ==============================================================================
-- 3. Verify all tables have DELETE policies
-- ==============================================================================
SELECT
    tablename,
    COUNT(CASE WHEN cmd = 'SELECT' THEN 1 END) as select_policies,
    COUNT(CASE WHEN cmd = 'INSERT' THEN 1 END) as insert_policies,
    COUNT(CASE WHEN cmd = 'UPDATE' THEN 1 END) as update_policies,
    COUNT(CASE WHEN cmd = 'DELETE' THEN 1 END) as delete_policies,
    COUNT(*) as total_policies
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('projects', 'chapters', 'characters', 'notes', 'profiles', 'project_members')
GROUP BY tablename
ORDER BY tablename;

-- Expected: All tables should have at least 1 DELETE policy

-- ==============================================================================
-- 4. Verify project_members has UPDATE policy
-- ==============================================================================
SELECT policyname, cmd, qual::text as using_clause, with_check::text
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'project_members'
AND cmd = 'UPDATE';

-- Expected: Should see 'members_update' policy

-- ==============================================================================
-- 5. Summary: Check RLS is enabled on all tables
-- ==============================================================================
SELECT
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('projects', 'chapters', 'characters', 'notes', 'profiles', 'project_members')
ORDER BY tablename;

-- Expected: All should have rls_enabled = true

-- ==============================================================================
-- 6. List all policies for review
-- ==============================================================================
SELECT
    tablename,
    policyname,
    cmd,
    CASE
        WHEN cmd IN ('SELECT', 'UPDATE', 'DELETE') THEN 'USING'
        WHEN cmd = 'INSERT' THEN 'WITH CHECK'
        ELSE 'BOTH'
    END as policy_type
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd, policyname;

-- This gives you a complete overview of all policies
