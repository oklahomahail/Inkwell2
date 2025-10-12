import type { Config } from 'tailwindcss';

export default {
  darkMode: 'class', // Keep dark utilities inert since we never set .dark
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: { extend: {} },
  plugins: [],
} satisfies Config;
