/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // Keep dark utilities inert since we never set .dark
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  safelist: [
    'text-inkwell-charcoal',
    'bg-inkwell-charcoal',
  ],
theme: {
    extend: {
      colors: {
        // Direct color access for convenience
        inkwellGold: '#D4AF37',
        inkwellNavy: '#13294B',
        inkwellGray: '#4E5666',
        inkwellCharcoal: '#2C3242',
        inkwellWhite: '#FAFAFA',
        // Nested colors
        // Inkwell Design Language (2025) - "Sophisticated Simplicity"
        inkwell: {
          // Primary Brand Colors
          navy: '#13294B',      // Deep Navy Blue (primary brand)
          gold: '#D4AF37',      // Warm Gold (accent - craft/progress)
          'gold-dark': '#B8860B', // Darker gold for dark mode
          'gold-light': '#E6C766', // Brighter gold for dark backgrounds

          // Semantic Colors - Literary & Refined
          ink: '#1C1C1C',       // Warm black - primary text
          canvas: '#FDFBF7',    // Gentle ivory white - main background
          panel: '#F3F2EF',     // Neutral grey - cards/sidebars
          parchment: '#FAF9F6', // Subtle warmth for elevated surfaces

          // Interaction Colors
          focus: '#2C5F8D',     // Ink blue - links/active states
          success: '#3BA87C',   // Natural green - confirmations
          error: '#D35F5F',     // Muted red - elegant warnings

          // Navy Scale (for depth)
          'navy-50': '#f1f5f9',
          'navy-100': '#e2e8f0',
          'navy-200': '#cbd5e1',
          'navy-500': '#334155',
          'navy-600': '#13294B',
          'navy-700': '#0e1e38',
          'navy-800': '#0a1525',
          'navy-900': '#050b12',

          // Gold Scale (for accents)
          'gold-50': '#fef9e7',
          'gold-100': '#fcf0c3',
          'gold-200': '#f8e59b',
          'gold-400': '#e3be4b',
          'gold-500': '#D4AF37',
          'gold-600': '#b38d22',
          'gold-700': '#8c6b12',

          // Dark Mode Palette
          'dark-bg': '#121212',
          'dark-surface': '#1B1B1B',
          'dark-elevated': '#242424',
          'dark-text': '#E6E8EE',
          'dark-muted': '#9EA4B8',

          paper: '#FFFFFF'
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
        // Inkwell Typography System - "Literary Elegance"
        'display': ['Source Serif Pro', 'Georgia', 'ui-serif', 'serif'], // Hero titles, onboarding
        'serif': ['Source Serif Pro', 'Georgia', 'ui-serif', 'serif'],   // Quotes, emphasis
        'sans': ['Inter', 'system-ui', 'ui-sans-serif', 'sans-serif'],   // Primary UI text
        'body': ['Inter', 'system-ui', 'ui-sans-serif', 'sans-serif'],   // Paragraph text
        'mono': ['JetBrains Mono', 'ui-monospace', 'monospace'],         // Code/technical
      },
      fontSize: {
        // Refined type scale for literary hierarchy - Enhanced spaciousness (v2)
        'display': ['3rem', { lineHeight: '1.7', letterSpacing: '-0.02em', fontWeight: '600' }],
        'heading-xl': ['2.25rem', { lineHeight: '1.65', letterSpacing: '-0.01em', fontWeight: '600' }],
        'heading-lg': ['1.875rem', { lineHeight: '1.65', letterSpacing: '-0.01em', fontWeight: '600' }],
        'heading-md': ['1.5rem', { lineHeight: '1.6', fontWeight: '500' }],
        'heading-sm': ['1.25rem', { lineHeight: '1.6', fontWeight: '500' }],
        'body-lg': ['1.125rem', { lineHeight: '1.7', fontWeight: '400' }],
        'body': ['1rem', { lineHeight: '1.7', fontWeight: '400' }],
        'body-sm': ['0.875rem', { lineHeight: '1.65', fontWeight: '400' }],
        'label': ['0.875rem', { lineHeight: '1.5', fontWeight: '500' }],
        'caption': ['0.75rem', { lineHeight: '1.5', fontWeight: '400' }],
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
        'card': '1rem',
        'button': '0.75rem',
      },
      boxShadow: {
        // Refined shadow system - subtle and elegant
        'soft': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'card': '0 2px 8px 0 rgba(0, 0, 0, 0.06), 0 1px 3px 0 rgba(0, 0, 0, 0.04)',
        'elevated': '0 4px 16px 0 rgba(0, 0, 0, 0.08), 0 2px 6px 0 rgba(0, 0, 0, 0.05)',
        'focus': '0 0 0 3px rgba(212, 175, 55, 0.15)', // Gold focus ring
        'gold': '0 0 12px rgba(212, 175, 55, 0.3)',    // Gentle gold glow
      },
      transitionDuration: {
        // Refined timing for "fluid, not playful" motion
        '150': '150ms',
        '200': '200ms',
      },
      transitionTimingFunction: {
        'ease-elegant': 'cubic-bezier(0.4, 0.0, 0.2, 1)', // Smooth, confident
      },
      animation: {
        // Custom animations - restrained and purposeful
        'spin-slow': 'spin 20s linear infinite',
        'fade-in': 'fadeIn 150ms ease-elegant',
        'slide-up': 'slideUp 200ms ease-elegant',
        'pulse-gold': 'pulseGold 600ms ease-elegant',

        // Micro-motion library - Ink-themed animations v2
        'ink-ripple': 'inkRipple 800ms ease-out',
        'ink-shimmer': 'inkShimmer 2000ms ease-in-out',
        'ink-flow': 'inkFlow 1500ms ease-in-out',
        'gold-glow': 'goldGlow 1200ms ease-in-out infinite',
        'subtle-bounce': 'subtleBounce 400ms ease-elegant',
        'save-pulse': 'savePulse 600ms ease-elegant',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGold: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },

        // Micro-motion library keyframes
        inkRipple: {
          '0%': {
            transform: 'scale(0.95)',
            boxShadow: '0 0 0 0 rgba(212, 175, 55, 0.4)',
          },
          '50%': {
            transform: 'scale(1)',
            boxShadow: '0 0 0 8px rgba(212, 175, 55, 0)',
          },
          '100%': {
            transform: 'scale(1)',
            boxShadow: '0 0 0 0 rgba(212, 175, 55, 0)',
          },
        },
        inkShimmer: {
          '0%': {
            backgroundPosition: '-200% center',
          },
          '100%': {
            backgroundPosition: '200% center',
          },
        },
        inkFlow: {
          '0%': {
            backgroundPosition: '0% 50%',
          },
          '50%': {
            backgroundPosition: '100% 50%',
          },
          '100%': {
            backgroundPosition: '0% 50%',
          },
        },
        goldGlow: {
          '0%, 100%': {
            boxShadow: '0 0 12px rgba(212, 175, 55, 0.2)',
          },
          '50%': {
            boxShadow: '0 0 20px rgba(212, 175, 55, 0.4)',
          },
        },
        subtleBounce: {
          '0%, 100%': {
            transform: 'translateY(0)',
          },
          '50%': {
            transform: 'translateY(-4px)',
          },
        },
        savePulse: {
          '0%': {
            opacity: '0.8',
            transform: 'scale(0.98)',
          },
          '50%': {
            opacity: '1',
            transform: 'scale(1)',
          },
          '100%': {
            opacity: '0.8',
            transform: 'scale(0.98)',
          },
        },
      },
      zIndex: {
        // Base layers (0-999)
        'base': '0',
        'dropdown': '1000',
        'sticky': '1020',
        'fixed': '1030',

        // Overlay layers (1000-1999)
        'modal-backdrop': '1040',
        'modal': '1050',
        'popover': '1060',

        // Tour/Onboarding layers (9000-9029) - Highest priority for user guidance
        'tour-backdrop': '9000',
        'tour-spotlight': '9010',
        'tour-tooltip': '9020',

        // Notifications and toasts (9030+)
        'toast': '9030',

        // Debugging/Development (9999) - Always on top
        'debug': '9999',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'), // For consistent form elements
    require('@tailwindcss/typography'), // For prose/content styling
    require('@tailwindcss/aspect-ratio'), // For responsive media
  ],
};
