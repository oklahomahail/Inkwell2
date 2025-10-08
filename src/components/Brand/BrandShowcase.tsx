import React from 'react';

import { InkwellLogo, useBrandTheme, BRAND_CLASSES } from './index';

/**
 * BrandShowcase - Demonstrates the new Inkwell brand system
 * This component shows how to use the brand components, colors, and utilities
 */
export const BrandShowcase: React.FC = () => {
  const { theme, effectiveTheme, setTheme, toggleTheme } = useBrandTheme();

  return (
    <div className="min-h-screen bg-inkwell-white dark:bg-inkwell-navy transition-colors duration-200">
      <div className="max-w-6xl mx-auto p-8">
        {/* Header Section */}
        <header className="text-center mb-12">
          <InkwellLogo variant="full" size="xl" className="mx-auto mb-6" />
          <h1 className={`text-4xl mb-4 ${BRAND_CLASSES.text.brand}`}>Inkwell Brand System</h1>
          <p className={`text-xl ${BRAND_CLASSES.text.body} max-w-2xl mx-auto`}>
            A comprehensive design system showcasing the new Inkwell brand identity with Deep Navy,
            Warm Gold, and sophisticated typography.
          </p>
        </header>

        {/* Theme Controls */}
        <div className="bg-white dark:bg-inkwell-navy/50 rounded-lg p-6 mb-8 border border-gray-200 dark:border-inkwell-gold/20">
          <h2 className={`text-2xl mb-4 ${BRAND_CLASSES.text.heading}`}>Theme Controls</h2>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => setTheme('light')}
              className={`${BRAND_CLASSES.buttons.primary} ${theme === 'light' ? 'ring-2 ring-inkwell-gold' : ''}`}
            >
              Light Theme
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`${BRAND_CLASSES.buttons.secondary} ${theme === 'dark' ? 'ring-2 ring-inkwell-gold' : ''}`}
            >
              Dark Theme
            </button>
            <button
              onClick={() => setTheme('auto')}
              className={`${BRAND_CLASSES.buttons.gold} ${theme === 'auto' ? 'ring-2 ring-inkwell-navy' : ''}`}
            >
              Auto Theme
            </button>
            <button
              onClick={toggleTheme}
              className="px-4 py-2 border border-inkwell-charcoal text-inkwell-charcoal rounded-lg hover:bg-inkwell-charcoal hover:text-white transition-all duration-200"
            >
              Toggle ({effectiveTheme})
            </button>
          </div>
        </div>

        {/* Logo Variants */}
        <div className={`${BRAND_CLASSES.cards.default} mb-8`}>
          <h2 className={`text-2xl mb-6 ${BRAND_CLASSES.text.heading}`}>Logo Variants</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <h3 className={`text-lg mb-4 ${BRAND_CLASSES.text.gold}`}>Full Logo</h3>
              <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-lg">
                <InkwellLogo variant="full" size="lg" />
              </div>
            </div>
            <div className="text-center">
              <h3 className={`text-lg mb-4 ${BRAND_CLASSES.text.gold}`}>Mark Only</h3>
              <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-lg">
                <InkwellLogo variant="mark" size="lg" />
              </div>
            </div>
            <div className="text-center">
              <h3 className={`text-lg mb-4 ${BRAND_CLASSES.text.gold}`}>Wordmark</h3>
              <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-lg">
                <InkwellLogo variant="wordmark" size="lg" />
              </div>
            </div>
          </div>
        </div>

        {/* Color Palette */}
        <div className={`${BRAND_CLASSES.cards.default} mb-8`}>
          <h2 className={`text-2xl mb-6 ${BRAND_CLASSES.text.heading}`}>Brand Colors</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              {
                name: 'Deep Navy',
                class: 'bg-inkwell-navy',
                hex: '#0C5C3D',
                textClass: 'text-white',
              },
              {
                name: 'Warm Gold',
                class: 'bg-inkwell-gold',
                hex: '#D4A537',
                textClass: 'text-inkwell-navy',
              },
              {
                name: 'Charcoal',
                class: 'bg-inkwell-charcoal',
                hex: '#2E2E2E',
                textClass: 'text-white',
              },
              {
                name: 'Soft White',
                class: 'bg-inkwell-white border border-gray-200',
                hex: '#F9F9F9',
                textClass: 'text-inkwell-navy',
              },
            ].map((color) => (
              <div key={color.name} className="text-center">
                <div
                  className={`${color.class} h-24 rounded-lg mb-3 flex items-center justify-center`}
                >
                  <span className={`font-mono text-sm ${color.textClass}`}>{color.hex}</span>
                </div>
                <h3 className={`font-medium ${BRAND_CLASSES.text.body}`}>{color.name}</h3>
              </div>
            ))}
          </div>
        </div>

        {/* Typography */}
        <div className={`${BRAND_CLASSES.cards.default} mb-8`}>
          <h2 className={`text-2xl mb-6 ${BRAND_CLASSES.text.heading}`}>Typography System</h2>
          <div className="space-y-6">
            <div>
              <h3 className={`text-lg mb-3 ${BRAND_CLASSES.text.gold}`}>
                Headings (Source Serif Pro)
              </h3>
              <div className="space-y-2">
                <h1 className="text-4xl font-serif font-semibold text-inkwell-navy dark:text-white">
                  Main Heading - H1
                </h1>
                <h2 className="text-3xl font-serif font-semibold text-inkwell-navy dark:text-white">
                  Section Heading - H2
                </h2>
                <h3 className="text-2xl font-serif font-semibold text-inkwell-navy dark:text-white">
                  Subsection Heading - H3
                </h3>
              </div>
            </div>
            <div>
              <h3 className={`text-lg mb-3 ${BRAND_CLASSES.text.gold}`}>Body Text (Inter)</h3>
              <div className="space-y-2">
                <p className={`text-base ${BRAND_CLASSES.text.body}`}>
                  Regular body text for general content and user interface elements. Inter provides
                  excellent readability across all device sizes.
                </p>
                <p className="text-sm font-medium text-inkwell-charcoal dark:text-gray-300">
                  Medium weight text for emphasis and labels.
                </p>
                <p className="text-xs text-inkwell-charcoal/70 dark:text-gray-400">
                  Small text for captions and secondary information.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Button Examples */}
        <div className={`${BRAND_CLASSES.cards.default} mb-8`}>
          <h2 className={`text-2xl mb-6 ${BRAND_CLASSES.text.heading}`}>Button Styles</h2>
          <div className="flex flex-wrap gap-4">
            <button className={BRAND_CLASSES.buttons.primary}>Primary Action</button>
            <button className={BRAND_CLASSES.buttons.secondary}>Secondary Action</button>
            <button className={BRAND_CLASSES.buttons.gold}>Gold Accent</button>
            <button className="px-4 py-2 text-inkwell-navy dark:text-white border border-current rounded-lg hover:bg-current hover:text-white dark:hover:text-inkwell-navy transition-all duration-200">
              Ghost Button
            </button>
          </div>
        </div>

        {/* Cards and Components */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className={BRAND_CLASSES.cards.default}>
            <h3 className={`text-xl mb-4 ${BRAND_CLASSES.text.heading}`}>Light Card</h3>
            <p className={BRAND_CLASSES.text.body}>
              This is a standard light card with the default Inkwell styling. Perfect for content
              organization and visual hierarchy.
            </p>
          </div>
          <div className={`${BRAND_CLASSES.cards.dark} text-white`}>
            <h3 className="text-xl mb-4 font-serif font-semibold">Dark Card</h3>
            <p className="text-gray-200 font-sans leading-relaxed">
              This is a dark variant card with navy background and gold accents. Ideal for premium
              content or night mode interfaces.
            </p>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center py-8 border-t border-gray-200 dark:border-gray-700">
          <InkwellLogo variant="mark" size="sm" className="mx-auto mb-4 text-inkwell-gold" />
          <p className={`text-sm ${BRAND_CLASSES.text.body}`}>
            Inkwell Brand System &copy; 2024 — Where Writing Flows
          </p>
        </footer>
      </div>
    </div>
  );
};

export default BrandShowcase;
