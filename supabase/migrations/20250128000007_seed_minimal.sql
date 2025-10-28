-- Minimal seed data for QA and testing
-- Run this in SQL Editor as an authenticated user

-- Note: This migration is optional and can be run manually when needed
-- It creates a demo project for the authenticated user

-- Create a demo project for testing
insert into public.projects (id, owner_id, title, summary)
values (
  gen_random_uuid(), 
  auth.uid(), 
  'Demo Project - QA', 
  'Seeded project for testing Supabase integration and RLS policies'
)
on conflict (id) do nothing
returning id, title, owner_id;

-- Optional: Create a demo chapter
insert into public.chapters (id, project_id, index_in_project, title, body)
select 
  gen_random_uuid(),
  p.id,
  1,
  'Chapter 1 - Introduction',
  'This is a demo chapter created for testing purposes.'
from public.projects p
where p.title = 'Demo Project - QA' and p.owner_id = auth.uid()
limit 1
on conflict (id) do nothing;

-- Optional: Create a demo character
insert into public.characters (id, project_id, name, bio, traits)
select 
  gen_random_uuid(),
  p.id,
  'Demo Character',
  'A test character for QA validation.',
  '{"role": "protagonist", "age": 30}'::jsonb
from public.projects p
where p.title = 'Demo Project - QA' and p.owner_id = auth.uid()
limit 1
on conflict (id) do nothing;

-- Optional: Create a demo note
insert into public.notes (id, project_id, kind, content, tags)
select 
  gen_random_uuid(),
  p.id,
  'worldbuilding',
  'Demo note for testing sync functionality.',
  array['test', 'qa', 'demo']
from public.projects p
where p.title = 'Demo Project - QA' and p.owner_id = auth.uid()
limit 1
on conflict (id) do nothing;
