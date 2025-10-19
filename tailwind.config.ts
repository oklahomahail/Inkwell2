import type { Config } from 'tailwindcss';

export default {
  darkMode: 'class', // Keep dark utilities inert since we never set .dark
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        inkwell: {
          blue: '#13294B', // brand blue
          gold: '#D4AF37', // accent gold
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
