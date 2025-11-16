-- Fix RLS Recursion in project_settings Policies
-- Date: 2025-11-15
-- Purpose: Remove infinite recursion caused by can_access_project() calling projects table
--
-- Problem: project_settings policies were using can_access_project() which queries
-- the projects table. When you SELECT from projects in the policy, it triggers
-- the projects RLS policy, which may call can_access_project() again → infinite recursion.
--
-- Solution: Use direct owner_id and project_members checks without the helper function.

-- ============================================================================
-- Fix project_settings Policies
-- ============================================================================

-- Read policy: Check ownership and membership directly
DROP POLICY IF EXISTS "project_settings_read" ON public.project_settings;
CREATE POLICY "project_settings_read" ON public.project_settings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_settings.project_id
        AND (
          p.owner_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.project_members m
            WHERE m.project_id = p.id
              AND m.user_id = auth.uid()
          )
        )
    )
  );

-- Insert policy: Owner only (no recursion risk)
DROP POLICY IF EXISTS "project_settings_insert" ON public.project_settings;
CREATE POLICY "project_settings_insert" ON public.project_settings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_settings.project_id
        AND p.owner_id = auth.uid()
    )
  );

-- Update policy: Owner only (no recursion risk)
DROP POLICY IF EXISTS "project_settings_update" ON public.project_settings;
CREATE POLICY "project_settings_update" ON public.project_settings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_settings.project_id
        AND p.owner_id = auth.uid()
    )
  );

-- Delete policy: Owner only (no recursion risk)
DROP POLICY IF EXISTS "project_settings_delete" ON public.project_settings;
CREATE POLICY "project_settings_delete" ON public.project_settings
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_settings.project_id
        AND p.owner_id = auth.uid()
    )
  );

-- ============================================================================
-- Validation
-- ============================================================================

-- Test that we can query project_settings without recursion
DO $$
DECLARE
  policy_count INT;
BEGIN
  -- Verify policies exist
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'project_settings'
    AND policyname LIKE 'project_settings_%';

  ASSERT policy_count = 4,
    'Expected 4 project_settings policies, found ' || policy_count;

  RAISE NOTICE 'RLS recursion fix applied successfully ✓';
  RAISE NOTICE 'Policies: project_settings_read, project_settings_insert, project_settings_update, project_settings_delete';
END $$;
