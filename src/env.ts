// env.ts
const required = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY', 'VITE_BASE_URL'] as const;

for (const key of required) {
  if (!import.meta.env[key]) {
    throw new Error(
      `Missing ${key} in environment variables. See .env.example for required variables.`,
    );
  }
}

export const env = {
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL as string,
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
  BASE_URL: import.meta.env.VITE_BASE_URL as string,
} as const;
