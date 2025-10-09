// src/components/Layout/Footer.tsx
import React from 'react';

// Import Inkwell brand assets
import InkwellFeather from '@/assets/brand/inkwell-feather-gold.svg';

export function Footer() {
  return (
    <footer
      className="
        w-full border-t border-white/10
        bg-inkwell-navy text-inkwell-white
        dark:bg-slate-900 dark:border-white/5
      "
      aria-label="Site footer"
    >
      <div className="mx-auto max-w-7xl px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <img src={InkwellFeather} alt="Inkwell logo" className="h-5 w-5 shrink-0" />
          <span className="font-serif font-semibold text-lg tracking-wide text-inkwell-gold">
            Inkwell
          </span>
        </div>

        {/* Right section */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          {/* Navigation links */}
          <nav className="flex items-center gap-4 text-sm">
            <a
              href="/privacy"
              className="underline-offset-4 hover:underline hover:text-inkwell-gold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inkwell-gold/70 rounded px-1"
            >
              Privacy
            </a>
            <a
              href="/terms"
              className="underline-offset-4 hover:underline hover:text-inkwell-gold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inkwell-gold/70 rounded px-1"
            >
              Terms
            </a>
            <a
              href="https://nexuspartners.com"
              className="underline-offset-4 hover:underline hover:text-inkwell-gold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inkwell-gold/70 rounded px-1"
              target="_blank"
              rel="noopener noreferrer"
            >
              Nexus Partners
            </a>
          </nav>

          {/* Copyright */}
          <p className="text-sm font-sans opacity-90 whitespace-nowrap">
            © {new Date().getFullYear()} Inkwell by Nexus Partners
          </p>
        </div>
      </div>
    </footer>
  );
}
