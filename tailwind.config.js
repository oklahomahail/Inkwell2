/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class', // Enable class-based dark mode (optional)
  theme: {
    extend: {
      colors: {
        // Custom color palette
        primary: {
          DEFAULT: '#4f46e5', // Indigo-600
          dark: '#4338ca', // Indigo-700
        },
        gray: {
          50: '#f9fafb',
          900: '#111827',
        },
      },
      fontFamily: {
        // Custom font stack
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
