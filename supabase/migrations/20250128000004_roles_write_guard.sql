-- Stricter write guards based on project member roles
-- Only owners and editors can write; viewers are read-only

create or replace function public.can_write_project(pid uuid)
returns boolean language sql stable as $$
  select exists(
    select 1 from public.projects p
    where p.id = pid and p.owner_id = auth.uid()
  ) or exists(
    select 1 from public.project_members m
    where m.project_id = pid and m.user_id = auth.uid() and m.role in ('owner','editor')
  );
$$;

-- Update chapters policies to use can_write_project
drop policy if exists "chapters_write" on public.chapters;
create policy "chapters_write" on public.chapters
for insert with check ( public.can_write_project(project_id) );

drop policy if exists "chapters_update" on public.chapters;
create policy "chapters_update" on public.chapters
for update using ( public.can_write_project(project_id) );

-- Update characters policies to use can_write_project
drop policy if exists "characters_write" on public.characters;
create policy "characters_write" on public.characters
for insert with check ( public.can_write_project(project_id) );

drop policy if exists "characters_update" on public.characters;
create policy "characters_update" on public.characters
for update using ( public.can_write_project(project_id) );

-- Update notes policies to use can_write_project
drop policy if exists "notes_write" on public.notes;
create policy "notes_write" on public.notes
for insert with check ( public.can_write_project(project_id) );

drop policy if exists "notes_update" on public.notes;
create policy "notes_update" on public.notes
for update using ( public.can_write_project(project_id) );

-- Comment
comment on function public.can_write_project(uuid) is 'Check if user can write to project (owner or editor role)';
