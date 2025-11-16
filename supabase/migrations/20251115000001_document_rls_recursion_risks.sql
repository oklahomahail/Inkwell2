-- Document RLS Recursion Risks
-- Date: 2025-11-15
-- Purpose: Add documentation and safeguards to prevent future RLS recursion issues

-- ============================================================================
-- Add Documentation to can_access_project Function
-- ============================================================================

-- Re-create the function with detailed recursion warning comments
CREATE OR REPLACE FUNCTION public.can_access_project(pid uuid)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  -- ⚠️ RECURSION WARNING ⚠️
  -- This function queries the 'projects' table, which has its own RLS policies.
  --
  -- DO NOT USE this function in:
  -- 1. Policies on the 'projects' table itself (creates immediate recursion)
  -- 2. Policies that already SELECT from 'projects' (creates nested recursion)
  -- 3. Any context where projects table is being queried with RLS enabled
  --
  -- SAFE to use in:
  -- - Policies on tables that reference projects (chapters, characters, notes, sections)
  -- - Policies where you only have a project_id and need to verify access
  --
  -- If you need to check project access while already querying projects,
  -- use direct checks instead:
  --   owner_id = auth.uid() OR EXISTS(
  --     SELECT 1 FROM project_members m
  --     WHERE m.project_id = <id> AND m.user_id = auth.uid()
  --   )
  --
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

-- Add comment to the function
COMMENT ON FUNCTION public.can_access_project(uuid) IS
'Check if current user can access a project (owner or member).
WARNING: Do not use in projects table policies or when already querying projects - causes recursion.
Use direct owner_id/membership checks instead in those contexts.';

-- ============================================================================
-- Verify Current Policy Safety
-- ============================================================================

DO $$
DECLARE
  unsafe_count INTEGER;
  policy_record RECORD;
BEGIN
  -- Check for policies on 'projects' table that use can_access_project
  -- Using pg_policy system catalog directly instead of pg_policies view
  SELECT COUNT(*) INTO unsafe_count
  FROM pg_policy pol
  JOIN pg_class c ON pol.polrelid = c.oid
  JOIN pg_namespace n ON c.relnamespace = n.oid
  WHERE c.relname = 'projects'
    AND n.nspname = 'public'
    AND (
      pg_get_expr(pol.polqual, pol.polrelid) LIKE '%can_access_project%'
      OR pg_get_expr(pol.polwithcheck, pol.polrelid) LIKE '%can_access_project%'
    );

  IF unsafe_count > 0 THEN
    RAISE EXCEPTION 'UNSAFE RLS DETECTED: % policies on projects table use can_access_project(), which causes recursion!', unsafe_count;
  END IF;

  -- Check for policies that query projects AND use can_access_project
  FOR policy_record IN
    SELECT
      c.relname as tablename,
      pol.polname as policyname
    FROM pg_policy pol
    JOIN pg_class c ON pol.polrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'public'
      AND c.relname != 'projects'
      AND (
        (pg_get_expr(pol.polqual, pol.polrelid) LIKE '%can_access_project%'
         AND pg_get_expr(pol.polqual, pol.polrelid) LIKE '%projects%')
        OR
        (pg_get_expr(pol.polwithcheck, pol.polrelid) LIKE '%can_access_project%'
         AND pg_get_expr(pol.polwithcheck, pol.polrelid) LIKE '%projects%')
      )
  LOOP
    RAISE WARNING 'Potential recursion in %.% - queries projects AND uses can_access_project()',
      policy_record.tablename, policy_record.policyname;
  END LOOP;

  RAISE NOTICE 'RLS recursion safety check complete ✓';
  RAISE NOTICE 'No policies on projects table use can_access_project()';
END $$;
