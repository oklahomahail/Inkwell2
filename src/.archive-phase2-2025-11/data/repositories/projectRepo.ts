import { supabase } from '@/lib/supabaseClient';
import type { Project } from '@/types/persistence';

export async function createProject(input: Pick<Project, 'title' | 'summary'>): Promise<Project> {
  const { data, error } = await supabase
    .from('projects')
    .insert({ title: input.title, summary: input.summary })
    .select('*')
    .single();
  if (error) throw error;
  return data as Project;
}

export async function listProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from('projects_active') // Use active view
    .select('*')
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Project[];
}

export async function updateProject(id: string, updates: Partial<Project>): Promise<void> {
  const { error } = await supabase.from('projects').update(updates).eq('id', id);
  if (error) throw error;
}

export async function deleteProject(id: string): Promise<void> {
  // Use soft delete RPC
  await supabase.rpc('soft_delete', { _table: 'projects', _id: id });
}
