import type { Config } from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  safelist: ['text-inkwell-charcoal', 'bg-inkwell-charcoal'],
  theme: {
    extend: {
      colors: {
        // Legacy inkwell colors (kept for compatibility)
        inkwell: {
          blue: '#13294B', // brand blue
          gold: '#D4AF37', // accent gold
          charcoal: '#2C3242', // charcoal
        },
        // New semantic brand aliases (read from CSS vars)
        ink: {
          // primary brand blue
          50: 'hsl(var(--ink-50))',
          100: 'hsl(var(--ink-100))',
          200: 'hsl(var(--ink-200))',
          300: 'hsl(var(--ink-300))',
          400: 'hsl(var(--ink-400))',
          500: 'hsl(var(--ink-500))', // main
          600: 'hsl(var(--ink-600))',
          700: 'hsl(var(--ink-700))',
          800: 'hsl(var(--ink-800))',
          900: 'hsl(var(--ink-900))',
        },
        gold: {
          400: 'hsl(var(--gold-400))', // accent feather gold
          500: 'hsl(var(--gold-500))',
        },
        surface: {
          // neutrals for backgrounds
          0: 'hsl(var(--surface-0))', // page bg
          1: 'hsl(var(--surface-1))', // containers
          2: 'hsl(var(--surface-2))', // sidebar/header
          3: 'hsl(var(--surface-3))', // elevated
          inv: 'hsl(var(--surface-inverse))', // text on dark
        },
        text: {
          1: 'hsl(var(--text-1))',
          2: 'hsl(var(--text-2))',
          inv: 'hsl(var(--text-inverse))',
        },
        ring: 'hsl(var(--ring))',
      },
      borderColor: {
        subtle: 'hsl(var(--border-subtle))',
        strong: 'hsl(var(--border-strong))',
      },
      boxShadow: {
        subtle: '0 1px 0 0 hsl(var(--shadow-subtle))',
      },
    },
  },
  plugins: [],
} satisfies Config;
