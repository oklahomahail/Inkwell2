/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // Keep dark utilities inert since we never set .dark
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
theme: {
    extend: {
      colors: {
        // Direct color access for convenience
        inkwellGold: '#D4AF37',
        inkwellNavy: '#13294B',
        inkwellGray: '#4E5666',
        inkwellWhite: '#FAFAFA',
        // Nested colors
        // Inkwell Brand Color System (2025) - Updated Blue & Gold
        inkwell: {
          navy: '#13294B',    // Deep Navy Blue (primary brand) 
          gold: '#D4AF37',    // Warm Gold (accent)
          gray: '#4E5666',    // Neutral Gray
          white: '#FAFAFA',   // Soft White
          // Accessible color variations for navy theme
          'navy-50': '#f1f5f9',   // Very light navy-blue for backgrounds
          'navy-100': '#e2e8f0',  // Light navy-blue for subtle accents  
          'navy-200': '#cbd5e1',  // Medium light navy-blue
          'navy-500': '#334155',  // Medium navy for text on light backgrounds
          'navy-600': '#13294B',  // Primary navy (updated brand color)
          'navy-700': '#0e1e38',  // Darker navy with blue undertones
          'navy-800': '#0a1525',  // Very dark navy-blue
          'navy-900': '#050b12',  // Almost black navy-blue
          
          'gold-50': '#fef9e7',   // Very light gold for backgrounds
          'gold-100': '#fcf0c3',  // Light gold
          'gold-200': '#f8e59b',  // Medium gold
          'gold-400': '#e3be4b',  // Bright gold
          'gold-500': '#D4AF37',  // Primary gold (updated brand color)
          'gold-600': '#b38d22',  // Darker gold
          'gold-700': '#8c6b12',  // Deep gold
          
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
