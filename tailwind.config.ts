import type { Config } from 'tailwindcss';

export default {
  // darkMode removed: we ship light-only to simplify UI & payload
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: { extend: {} },
  plugins: [],
} satisfies Config;
