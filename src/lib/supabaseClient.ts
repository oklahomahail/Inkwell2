import { createClient } from '@supabase/supabase-js';

const isTest = import.meta.env.MODE === 'test';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ?? (isTest ? 'http://127.0.0.1:54321' : undefined);
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ?? (isTest ? 'test-anon-key' : undefined);

if (!isTest && (!supabaseUrl || !supabaseAnonKey)) {
  throw new Error(
    'Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.',
  );
}

// Use safe defaults for testing environment
const finalSupabaseUrl = supabaseUrl || 'http://localhost:54321';
const finalSupabaseAnonKey = supabaseAnonKey || 'test-anon-key';

export const supabase = createClient(finalSupabaseUrl, finalSupabaseAnonKey);
