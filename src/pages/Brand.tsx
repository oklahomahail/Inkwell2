// src/pages/Brand.tsx — Live design system reference page
import React from 'react';
import { Link } from 'react-router-dom';

import { BrandShowcase } from '@/components/Brand';

export default function _BrandPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-serif font-bold text-slate-900 dark:text-white">
                Inkwell Brand System
              </h1>
              <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
                Live design system reference and component showcase
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Link
                to="/brand-guide"
                className="text-sm text-inkwell-gold hover:text-inkwell-gold/80 font-medium"
                target="_blank"
                rel="noopener noreferrer"
              >
                View Guide
              </Link>
              <Link
                to="../"
                className="px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-md text-slate-700 dark:text-slate-300 transition-colors"
              >
                ← Back to App
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Introduction */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 mb-8 border border-slate-200 dark:border-slate-700">
          <div className="prose dark:prose-invert max-w-none">
            <h2 className="text-xl font-serif font-bold mb-4">About This System</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              The Inkwell brand system provides a cohesive visual identity combining warm gold
              accents with deep navy foundations. This page serves as a live reference for
              developers, designers, and contributors.
            </p>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-inkwell-navy rounded-full"></div>
                <span>Primary: Deep Navy (#1e3a5f)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-inkwell-gold rounded-full"></div>
                <span>Accent: Warm Gold (#d4af37)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-inkwell-charcoal rounded-full"></div>
                <span>Secondary: Charcoal (#2d3748)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Brand Showcase Component */}
        <BrandShowcase />

        {/* Developer Resources */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 mt-8 border border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-serif font-bold mb-4">Developer Resources</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-2 text-slate-900 dark:text-white">Quick Usage</h3>
              <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 text-sm font-mono">
                <div className="text-slate-600 dark:text-slate-400">// Import brand components</div>
                <div>import {'{ InkwellLogo, useBrandTheme }'} from '@/components/Brand';</div>
                <br />
                <div className="text-slate-600 dark:text-slate-400">// Use brand colors</div>
                <div>className="text-inkwell-gold bg-inkwell-navy"</div>
              </div>
            </div>
            <div>
              <h3 className="font-medium mb-2 text-slate-900 dark:text-white">Documentation</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="text-inkwell-gold hover:text-inkwell-gold/80">
                    Brand Deployment Guide
                  </a>
                  <span className="text-slate-500 ml-2">Complete implementation guide</span>
                </li>
                <li>
                  <a href="#" className="text-inkwell-gold hover:text-inkwell-gold/80">
                    Component API Reference
                  </a>
                  <span className="text-slate-500 ml-2">Props and usage examples</span>
                </li>
                <li>
                  <a href="#" className="text-inkwell-gold hover:text-inkwell-gold/80">
                    Accessibility Guidelines
                  </a>
                  <span className="text-slate-500 ml-2">WCAG compliance notes</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
