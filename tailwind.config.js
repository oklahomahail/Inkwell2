/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class', // Enable class-based dark mode (optional)
theme: {
    extend: {
      colors: {
        // Inkwell Brand Color System
        ink: {
          primary: '#5B8CFF',
          accent: '#FFD580',
          bg: '#0B0E13',
          surface: '#1A1E2B',
          text: '#E6E8EE',
          muted: '#9EA4B8',
          border: '#2C3242',
          success: '#52E19F',
          error: '#FF5C7A',
        },
        // Legacy colors (for compatibility)
        primary: {
          DEFAULT: '#5B8CFF', // Updated to Inkwell primary
          dark: '#4338ca',
        },
        gray: {
          50: '#f9fafb',
          900: '#111827',
        },
      },
      fontFamily: {
        // Inkwell brand fonts
        'display': ['Inter Tight', 'ui-sans-serif', 'system-ui'],
        'body': ['Inter', 'ui-sans-serif', 'system-ui'], 
        'mono': ['JetBrains Mono', 'ui-monospace', 'monospace'],
        // Legacy font (updated to Inkwell standard)
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
      },
      animation: {
        // Custom slow spin animation (for logo, etc.)
        'spin-slow': 'spin 20s linear infinite',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'), // For consistent form elements
    require('@tailwindcss/typography'), // For prose/content styling
    require('@tailwindcss/aspect-ratio'), // For responsive media
  ],
};
