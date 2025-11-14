-- Add Missing DELETE Policies
--
-- SECURITY FIX: While the application uses soft delete (setting deleted_at),
-- hard DELETE policies should still exist to prevent unauthorized hard deletes.
--
-- This migration adds DELETE policies to all tables that were missing them.

-- ==============================================================================
-- 1. Projects - Only owner can hard delete
-- ==============================================================================

drop policy if exists "projects_delete" on public.projects;

create policy "projects_delete" on public.projects
for delete using (
  owner_id = auth.uid()
);

comment on policy "projects_delete" on public.projects is
  'Only project owner can hard delete (soft delete via RPC is recommended)';

-- ==============================================================================
-- 2. Chapters - Require write access
-- ==============================================================================

drop policy if exists "chapters_delete" on public.chapters;

create policy "chapters_delete" on public.chapters
for delete using (
  public.can_write_project(project_id)
);

comment on policy "chapters_delete" on public.chapters is
  'Requires write access to project (soft delete via RPC is recommended)';

-- ==============================================================================
-- 3. Characters - Require write access
-- ==============================================================================

drop policy if exists "characters_delete" on public.characters;

create policy "characters_delete" on public.characters
for delete using (
  public.can_write_project(project_id)
);

comment on policy "characters_delete" on public.characters is
  'Requires write access to project (soft delete via RPC is recommended)';

-- ==============================================================================
-- 4. Notes - Require write access
-- ==============================================================================

drop policy if exists "notes_delete" on public.notes;

create policy "notes_delete" on public.notes
for delete using (
  public.can_write_project(project_id)
);

comment on policy "notes_delete" on public.notes is
  'Requires write access to project (soft delete via RPC is recommended)';

-- ==============================================================================
-- 5. Profiles - Users can delete their own profile
-- ==============================================================================

drop policy if exists "profiles_delete" on public.profiles;

create policy "profiles_delete" on public.profiles
for delete using (
  id = auth.uid()
);

comment on policy "profiles_delete" on public.profiles is
  'Users can delete their own profile (cascade deletes projects and memberships)';

-- ==============================================================================
-- Verification Query (for local testing)
-- ==============================================================================

-- Uncomment to verify all policies exist:
-- select tablename, policyname, cmd
-- from pg_policies
-- where schemaname = 'public'
-- and tablename in ('projects', 'chapters', 'characters', 'notes', 'profiles', 'project_members')
-- order by tablename, cmd;
--
-- Expected: Each table should have SELECT, INSERT, UPDATE, DELETE policies
