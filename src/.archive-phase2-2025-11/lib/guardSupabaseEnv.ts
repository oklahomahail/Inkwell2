import devLog from "@/utils/devLog";
// src/lib/guardSupabaseEnv.ts

/**
 * Runtime guard for Supabase environment variables.
 * Throws if VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing.
 *
 * @throws Error if required variables are missing
 * @returns void
 * Call once in AppProviders before rendering Supabase providers.
 */
export function guardSupabaseEnv(): void {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

  if (!url || url === '') {
    throw new Error('Missing VITE_SUPABASE_URL - check your .env file');
  }

  if (!anonKey || anonKey === '') {
    throw new Error('Missing VITE_SUPABASE_ANON_KEY - check your .env file');
  }

  if (url.includes('localhost') || url.includes('127.0.0.1')) {
    console.warn('⚠ Supabase running with local URL (expected for local development)');
  } else if (url.includes('supabase.co')) {
    devLog.debug('✓ Supabase running with valid project URL');
  } else {
    console.warn(
      `⚠ Unexpected Supabase URL format: ${url.slice(0, 20)}... (expected https://*.supabase.co)`,
    );
  }
}
