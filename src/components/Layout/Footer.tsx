// src/components/Layout/Footer.tsx
import React from 'react';

// Import brand lockup
import LockupDark from '@/assets/brand/inkwell-lockup-dark.svg';

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-inkwell-navy text-white">
      <div className="mx-auto max-w-7xl px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <img src={LockupDark} alt="Inkwell" className="h-6 w-auto" />
        <p className="text-sm opacity-80">© {new Date().getFullYear()} Inkwell by Track15</p>
        <nav className="flex gap-4 text-sm">
          <a href="/privacy" className="hover:text-inkwell-gold transition-colors">
            Privacy
          </a>
          <a href="/terms" className="hover:text-inkwell-gold transition-colors">
            Terms
          </a>
          <a
            href="https://track15.com"
            className="hover:text-inkwell-gold transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            track15.com
          </a>
        </nav>
      </div>
    </footer>
  );
}
