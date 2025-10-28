export function assertSupabaseEnv() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.warn(
      '[Inkwell] Missing Supabase env. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
    );
  }
}
