-- Add Project Members UPDATE Policy
--
-- SECURITY FIX: Missing UPDATE policy prevents project owners from changing member roles
-- (e.g., promoting viewer to editor, or downgrading editor to viewer).
--
-- This migration adds an UPDATE policy that allows project owners to modify member roles.

-- ==============================================================================
-- 1. Add UPDATE policy for project_members
-- ==============================================================================

drop policy if exists "members_update" on public.project_members;

create policy "members_update" on public.project_members
for update using (
  -- Only project owner can update member roles
  exists(
    select 1 from public.projects p
    where p.id = project_members.project_id
    and p.owner_id = auth.uid()
  )
) with check (
  -- Prevent members from promoting themselves to owner
  -- (only the actual project owner can assign 'owner' role)
  role in ('editor', 'viewer')
  or exists(
    select 1 from public.projects p
    where p.id = project_members.project_id
    and p.owner_id = auth.uid()
  )
);

comment on policy "members_update" on public.project_members is
  'Only project owner can update member roles';

-- ==============================================================================
-- Verification Query (for local testing)
-- ==============================================================================

-- Uncomment to verify policy exists:
-- select policyname, cmd, qual, with_check
-- from pg_policies
-- where schemaname = 'public'
-- and tablename = 'project_members'
-- and policyname = 'members_update';
