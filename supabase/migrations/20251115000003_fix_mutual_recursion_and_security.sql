-- Fix Mutual Recursion AND Security Vulnerabilities
-- Date: 2025-11-15
-- Purpose: Eliminate projects ↔ project_members recursion while maintaining proper RLS security
--
-- CRITICAL BUGS FIXED:
-- 1. Mutual recursion between projects.projects_read and project_members.members_read
-- 2. Users can add themselves to any project (security vulnerability)
-- 3. Users can see memberships they shouldn't (information leak)
-- 4. Missing DELETE policies allow unauthorized member removal

-- ============================================================================
-- STRATEGY:
-- Break recursion by using different approaches for different policies:
-- - projects: Can safely query project_members (no recursion if members doesn't query back)
-- - project_members: CANNOT query projects (would create loop)
-- - Solution: Use direct auth checks and owner_id lookup via SECURITY DEFINER function
-- ============================================================================

-- ─────────────────────────────────────────────────────────────────────────
-- HELPER FUNCTION: Check if user is project owner (without RLS recursion)
-- ─────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.is_project_owner(project_id_param uuid, user_id_param uuid)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER  -- Runs with elevated privileges, bypasses RLS
STABLE
AS $$
DECLARE
  is_owner BOOLEAN;
BEGIN
  -- Direct query without triggering RLS (because SECURITY DEFINER)
  SELECT (owner_id = user_id_param) INTO is_owner
  FROM public.projects
  WHERE id = project_id_param;

  RETURN COALESCE(is_owner, FALSE);
END;
$$;

COMMENT ON FUNCTION public.is_project_owner(uuid, uuid) IS
'Check if user is project owner. SECURITY DEFINER to avoid RLS recursion.
Only checks owner_id, does not grant access - policies still control that.';

-- ─────────────────────────────────────────────────────────────────────────
-- PROJECTS TABLE POLICIES (unchanged - these are correct)
-- ─────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "projects_read" ON public.projects;
CREATE POLICY "projects_read" ON public.projects
  FOR SELECT
  TO authenticated
  USING (
    owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.project_members m
      WHERE m.project_id = projects.id
        AND m.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "projects_insert" ON public.projects;
CREATE POLICY "projects_insert" ON public.projects
  FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "projects_update" ON public.projects;
CREATE POLICY "projects_update" ON public.projects
  FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "projects_delete" ON public.projects;
CREATE POLICY "projects_delete" ON public.projects
  FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- ─────────────────────────────────────────────────────────────────────────
-- PROJECT_MEMBERS TABLE POLICIES (fixed for security + no recursion)
-- ─────────────────────────────────────────────────────────────────────────

-- READ: Users can see:
--   1. Their own memberships (user_id = auth.uid())
--   2. Memberships in projects they own (using helper function)
--
-- NO RECURSION because we use SECURITY DEFINER function instead of querying projects
DROP POLICY IF EXISTS "members_read" ON public.project_members;
CREATE POLICY "members_read" ON public.project_members
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_project_owner(project_id, auth.uid())
  );

-- INSERT: Only project owners can add members
-- SECURITY FIX: Users can NO LONGER add themselves to arbitrary projects
DROP POLICY IF EXISTS "members_insert" ON public.project_members;
CREATE POLICY "members_insert" ON public.project_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_project_owner(project_id, auth.uid())
  );

-- UPDATE: Only project owners can change member roles
DROP POLICY IF EXISTS "members_update" ON public.project_members;
CREATE POLICY "members_update" ON public.project_members
  FOR UPDATE
  TO authenticated
  USING (public.is_project_owner(project_id, auth.uid()))
  WITH CHECK (public.is_project_owner(project_id, auth.uid()));

-- DELETE: Only project owners can remove members
-- SECURITY FIX: Members cannot remove themselves (owner-controlled membership)
DROP POLICY IF EXISTS "members_delete" ON public.project_members;
CREATE POLICY "members_delete" ON public.project_members
  FOR DELETE
  TO authenticated
  USING (
    public.is_project_owner(project_id, auth.uid())
  );

-- ============================================================================
-- VALIDATION
-- ============================================================================

DO $$
DECLARE
  projects_count INT;
  members_count INT;
  func_exists BOOLEAN;
BEGIN
  -- Verify policies exist
  SELECT COUNT(*) INTO projects_count
  FROM pg_policy pol
  JOIN pg_class c ON pol.polrelid = c.oid
  JOIN pg_namespace n ON c.relnamespace = n.oid
  WHERE c.relname = 'projects' AND n.nspname = 'public';

  SELECT COUNT(*) INTO members_count
  FROM pg_policy pol
  JOIN pg_class c ON pol.polrelid = c.oid
  JOIN pg_namespace n ON c.relnamespace = n.oid
  WHERE c.relname = 'project_members' AND n.nspname = 'public';

  -- Verify helper function exists
  SELECT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.proname = 'is_project_owner'
  ) INTO func_exists;

  RAISE NOTICE '✓ Migration complete:';
  RAISE NOTICE '  - projects policies: %', projects_count;
  RAISE NOTICE '  - project_members policies: %', members_count;
  RAISE NOTICE '  - is_project_owner() function: %', CASE WHEN func_exists THEN 'created' ELSE 'MISSING!' END;
  RAISE NOTICE '';
  RAISE NOTICE '✓ Security fixes applied:';
  RAISE NOTICE '  - Users can no longer add themselves to arbitrary projects';
  RAISE NOTICE '  - Only owners can manage project members (add, update, remove)';
  RAISE NOTICE '  - Members cannot remove themselves (owner-controlled membership)';
  RAISE NOTICE '';
  RAISE NOTICE '✓ Recursion eliminated:';
  RAISE NOTICE '  - project_members uses SECURITY DEFINER helper instead of querying projects';
  RAISE NOTICE '  - No circular dependency between tables';
  RAISE NOTICE '';
  RAISE NOTICE 'Cloud sync should now work without "infinite recursion" errors';
END $$;
