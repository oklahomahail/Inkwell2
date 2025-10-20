import { createClient } from '@supabase/supabase-js';

const isTest = import.meta.env.MODE === 'test';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ?? (isTest ? 'http://127.0.0.1:54321' : undefined);
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ?? (isTest ? 'test-anon-key' : undefined);

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.',
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
