// env.ts
type Env = {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  BASE_URL: string;
  ENABLE_PWA?: boolean;
};

const fromImportMeta = typeof import.meta !== 'undefined' ? ((import.meta as any).env ?? {}) : {};
const fromProcess = typeof process !== 'undefined' ? (process.env ?? {}) : {};

// Prefer Vite's compile-time vars; fall back to process.env for tooling/scripts
const raw = {
  SUPABASE_URL: fromImportMeta.VITE_SUPABASE_URL ?? fromProcess.VITE_SUPABASE_URL,
  SUPABASE_ANON_KEY: fromImportMeta.VITE_SUPABASE_ANON_KEY ?? fromProcess.VITE_SUPABASE_ANON_KEY,
  BASE_URL: fromImportMeta.VITE_BASE_URL ?? fromProcess.VITE_BASE_URL,
  ENABLE_PWA: (fromImportMeta.VITE_ENABLE_PWA ?? fromProcess.VITE_ENABLE_PWA) === 'true',
};

// Only warn in the **browser** (runtime), not during node-based build steps
if (typeof window !== 'undefined') {
  if (!raw.SUPABASE_URL || !raw.SUPABASE_ANON_KEY) {
    console.warn(
      'Warning: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is not set. Authentication will fail at runtime.',
    );
  }
}

export const env = raw as Env;
