/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class', // Enable class-based dark mode (optional)
theme: {
    extend: {
      colors: {
        // New Inkwell Brand Color System (2024) - Blue & Gold
        inkwell: {
          navy: '#0C5C3D',    // Deep Navy Blue (primary brand) 
          gold: '#D4A537',    // Warm Gold (accent)
          charcoal: '#22E22E', // Rich Charcoal (neutral)
          // New accessible color variations for navy-blue theme
          'navy-50': '#f1f5f9',   // Very light navy-blue for backgrounds
          'navy-100': '#e2e8f0',  // Light navy-blue for subtle accents  
          'navy-200': '#cbd5e1',  // Medium light navy-blue
          'navy-500': '#334155',  // Medium navy for text on light backgrounds
          'navy-600': '#0C5C3D',  // Primary navy (your brand color)
          'navy-700': '#1e293b',  // Darker navy with blue undertones
          'navy-800': '#0f172a',  // Very dark navy-blue
          'navy-900': '#020617',  // Almost black navy-blue
          
          'gold-50': '#fef7e0',   // Very light gold for backgrounds
          'gold-100': '#fde68a',  // Light gold
          'gold-200': '#fcd34d',  // Medium gold
          'gold-400': '#f59e0b',  // Bright gold
          'gold-500': '#D4A537',  // Primary gold
          'gold-600': '#b8941f',  // Darker gold
          'gold-700': '#92750f',  // Deep gold
          
          white: '#F9F9F9',       // Soft White
          paper: '#FFFFFF'        // Pure White
        },
        // Legacy ink colors (maintained for compatibility)
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
          DEFAULT: '#0C1C3D', // Updated to new Inkwell navy
          dark: '#0A1631',
        },
        gray: {
          50: '#f9fafb',
          900: '#111827',
        },
      },
      fontFamily: {
        // New Inkwell brand fonts (Source Serif Pro + Inter)
        'serif': ['Source Serif Pro', 'ui-serif', 'Georgia', 'serif'],
        'display': ['Source Serif Pro', 'ui-serif', 'Georgia', 'serif'],
        'body': ['Inter', 'ui-sans-serif', 'system-ui'], 
        'mono': ['JetBrains Mono', 'ui-monospace', 'monospace'],
        // Legacy font (updated to new Inkwell standard)
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
