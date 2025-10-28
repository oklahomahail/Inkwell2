import { supabase } from '@/lib/supabaseClient';

import { viewFor } from './dbViews';

/**
 * Select helper that automatically targets the `*_active` view if available.
 * Usage: selectFrom('chapters').eq('project_id', id)
 */
export function selectFrom(table: string) {
  return supabase.from(viewFor(table));
}
