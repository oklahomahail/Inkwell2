import { selectFrom } from '@/data/supaSelect';
import { supabase } from '@/lib/supabaseClient';
import type { Chapter } from '@/types/persistence';

export async function fetchChapters(projectId: string): Promise<Chapter[]> {
  const { data, error } = await selectFrom('chapters')
    .select('*')
    .eq('project_id', projectId)
    .order('index_in_project', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Chapter[];
}

export async function upsertChapters(rows: Partial<Chapter>[]): Promise<void> {
  if (!rows.length) return;
  const { error } = await supabase.from('chapters').upsert(rows, { onConflict: 'id' });
  if (error) throw error;
}

export async function bulkUpsertChapters(rows: Chapter[]): Promise<void> {
  if (!rows.length) return;
  // Use bulk RPC for efficiency (200-500 rows recommended)
  await supabase.rpc('bulk_upsert_chapters', { rows: JSON.stringify(rows) });
}

export async function deleteChapter(id: string): Promise<void> {
  await supabase.rpc('soft_delete', { _table: 'chapters', _id: id });
}
