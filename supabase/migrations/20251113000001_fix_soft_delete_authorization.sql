-- Fix Soft Delete Authorization
--
-- SECURITY FIX: The soft_delete() function uses SECURITY DEFINER without authorization checks,
-- allowing ANY authenticated user to soft-delete ANY row in projects, chapters, characters, or notes.
--
-- This migration adds proper authorization checks to ensure users can only soft-delete
-- resources they have permission to modify.

-- Drop the existing unsafe function
drop function if exists public.soft_delete(text, uuid);

-- Recreate with proper authorization checks
create or replace function public.soft_delete(_table text, _id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_project_id uuid;
begin
  -- Validate table name to prevent SQL injection
  if _table not in ('projects', 'chapters', 'characters', 'notes') then
    raise exception 'Invalid table name: %', _table;
  end if;

  -- Authorization checks based on table type
  if _table = 'projects' then
    -- Only project owner can soft-delete projects
    if not exists(
      select 1 from public.projects
      where id = _id
      and owner_id = auth.uid()
    ) then
      raise exception 'Permission denied: not project owner';
    end if;
  else
    -- For chapters, characters, notes: check write permission via project
    execute format(
      'select project_id from public.%I where id = $1',
      _table
    ) into target_project_id using _id;

    if target_project_id is null then
      raise exception 'Resource not found';
    end if;

    if not public.can_write_project(target_project_id) then
      raise exception 'Permission denied: cannot write to project';
    end if;
  end if;

  -- Perform soft delete
  execute format(
    'update public.%I set deleted_at = now() where id = $1',
    _table
  ) using _id;
end;
$$;

-- Update comment
comment on function public.soft_delete(text, uuid) is
  'Soft-delete a row by setting deleted_at to now() (with authorization checks)';

-- Grant execute to authenticated users (authorization is checked within function)
grant execute on function public.soft_delete(text, uuid) to authenticated;
