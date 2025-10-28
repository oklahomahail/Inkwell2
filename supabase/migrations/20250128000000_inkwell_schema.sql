-- Inkwell Schema Migration
-- Creates tables for local-first cloud sync with RLS
-- Safe to run multiple times (idempotent)

-- Extensions
create extension if not exists pgcrypto;  -- for gen_random_uuid()

-- 1) Profiles
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2) Projects
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  summary text,
  schema_version int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- 3) Memberships
create table if not exists public.project_members (
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','editor','viewer')),
  created_at timestamptz default now(),
  primary key (project_id, user_id)
);

-- 4) Core entities
create table if not exists public.chapters (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  index_in_project int not null,
  title text not null,
  body text not null default '',
  client_rev bigint not null default 0,
  client_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.characters (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  bio text not null default '',
  traits jsonb not null default '{}'::jsonb,
  client_rev bigint not null default 0,
  client_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  kind text not null default 'note',
  content text not null default '',
  tags text[] not null default '{}',
  client_rev bigint not null default 0,
  client_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- Indexes
create index if not exists idx_projects_owner_updated on public.projects (owner_id, updated_at desc);
create index if not exists idx_chapters_project_updated on public.chapters (project_id, updated_at desc);
create index if not exists idx_characters_project_updated on public.characters (project_id, updated_at desc);
create index if not exists idx_notes_project_updated on public.notes (project_id, updated_at desc);

-- RLS
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.chapters enable row level security;
alter table public.characters enable row level security;
alter table public.notes enable row level security;

-- Access helper
create or replace function public.can_access_project(pid uuid)
returns boolean language sql stable as $$
  select exists(
    select 1 from public.projects p
    where p.id = pid
      and (
        p.owner_id = auth.uid() or exists(
          select 1 from public.project_members m
          where m.project_id = pid and m.user_id = auth.uid()
        )
      )
  );
$$;

-- Policies: Projects
create policy if not exists "projects_read" on public.projects
for select using (
  owner_id = auth.uid() or exists(
    select 1 from public.project_members m where m.project_id = projects.id and m.user_id = auth.uid()
  )
);

create policy if not exists "projects_insert" on public.projects
for insert with check ( owner_id = auth.uid() );

create policy if not exists "projects_update" on public.projects
for update using ( owner_id = auth.uid() );

-- Policies: Profiles
create policy if not exists "profiles_read" on public.profiles
for select using ( user_id = auth.uid() );

create policy if not exists "profiles_update" on public.profiles
for update using ( user_id = auth.uid() );

create policy if not exists "profiles_insert" on public.profiles
for insert with check ( user_id = auth.uid() );

-- Policies: Members
create policy if not exists "members_read" on public.project_members
for select using (
  user_id = auth.uid() or exists(
    select 1 from public.projects p where p.id = project_members.project_id and p.owner_id = auth.uid()
  )
);

create policy if not exists "members_insert" on public.project_members
for insert with check ( user_id = auth.uid() );

create policy if not exists "members_delete" on public.project_members
for delete using (
  exists(select 1 from public.projects p where p.id = project_members.project_id and p.owner_id = auth.uid())
);

-- Policies: Chapters
create policy if not exists "chapters_read" on public.chapters
for select using ( public.can_access_project(project_id) );

create policy if not exists "chapters_insert" on public.chapters
for insert with check ( public.can_access_project(project_id) );

create policy if not exists "chapters_update" on public.chapters
for update using ( public.can_access_project(project_id) );

-- Policies: Characters
create policy if not exists "characters_read" on public.characters
for select using ( public.can_access_project(project_id) );

create policy if not exists "characters_insert" on public.characters
for insert with check ( public.can_access_project(project_id) );

create policy if not exists "characters_update" on public.characters
for update using ( public.can_access_project(project_id) );

-- Policies: Notes
create policy if not exists "notes_read" on public.notes
for select using ( public.can_access_project(project_id) );

create policy if not exists "notes_insert" on public.notes
for insert with check ( public.can_access_project(project_id) );

create policy if not exists "notes_update" on public.notes
for update using ( public.can_access_project(project_id) );

-- Trigger: auto-create profiles on user signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (user_id, display_name)
  values (new.id, new.email)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Comments
comment on table public.profiles is 'User profiles - automatically created on sign-up';
comment on table public.projects is 'Writing projects with local-first sync support';
comment on table public.chapters is 'Book chapters with revision tracking';
comment on table public.characters is 'Character profiles with traits';
comment on table public.notes is 'Project notes and worldbuilding content';
