/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Example custom palette additions (optional)
        primary: {
          DEFAULT: '#4f46e5',
          dark: '#4338ca',
        },
        gray: {
          50: '#f9fafb',
          900: '#111827',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
      },
    },
  },
  plugins: [
    // Add official or custom plugins here
    require('@tailwindcss/forms'), // Optional: Better form defaults
    require('@tailwindcss/typography'), // Optional: Prose formatting
    require('@tailwindcss/aspect-ratio'), // Optional: Responsive media
  ],
};
