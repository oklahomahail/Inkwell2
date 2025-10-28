-- Index refinements for conflict detection and sync performance
-- These indexes optimize client_rev comparisons during sync

-- Chapters: composite index on project_id and client_rev for conflict scans
create index if not exists idx_chapters_project_rev 
  on public.chapters (project_id, client_rev desc);

-- Characters: composite index on project_id and client_rev for conflict scans
create index if not exists idx_characters_project_rev 
  on public.characters (project_id, client_rev desc);

-- Notes: composite index on project_id and client_rev for conflict scans
create index if not exists idx_notes_project_rev 
  on public.notes (project_id, client_rev desc);

-- Additional index on deleted_at for efficient filtering in views
create index if not exists idx_projects_deleted 
  on public.projects (deleted_at) where deleted_at is null;

create index if not exists idx_chapters_deleted 
  on public.chapters (deleted_at) where deleted_at is null;

create index if not exists idx_characters_deleted 
  on public.characters (deleted_at) where deleted_at is null;

create index if not exists idx_notes_deleted 
  on public.notes (deleted_at) where deleted_at is null;
