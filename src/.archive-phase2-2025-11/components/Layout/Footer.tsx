// src/components/Layout/Footer.tsx
import React from 'react';

import { TAGLINE_SECONDARY } from '@/constants/brand';
import { cn } from '@/utils';

export function _Footer() {
  return (
    <footer
      className={cn(
        'relative mt-16 w-full border-t border-zinc-200 bg-white',
        'px-6 py-8 text-center text-sm text-zinc-600',
      )}
    >
      <div className="mx-auto max-w-6xl flex flex-col items-center justify-between gap-4 md:flex-row">
        {/* Left Section: Brand Mark + Tagline */}
        <div className="flex items-center gap-3">
          <FeatherMark className="h-6 w-6 shrink-0" />
          <div className="text-left">
            <p className="font-medium text-zinc-900">Inkwell by Nexus Partners</p>
            <p className="text-zinc-500">{TAGLINE_SECONDARY}</p>
          </div>
        </div>

        {/* Right Section: Links + Copyright */}
        <div className="flex flex-col items-end gap-3 text-zinc-500 md:text-right">
          <nav className="flex flex-wrap justify-end gap-4">
            <a href="/privacy" className="hover:text-blue-600 transition-colors">
              Privacy
            </a>
            <a href="/terms" className="hover:text-blue-600 transition-colors">
              Terms
            </a>
            <a
              href="https://nexuspartners.com"
              className="hover:text-blue-600 transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              Nexus Partners
            </a>
          </nav>
          <p className="text-sm text-zinc-400">
            © {new Date().getFullYear()} Inkwell by Nexus Partners
          </p>
        </div>
      </div>
    </footer>
  );
}

function FeatherMark(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 64 64" fill="none" {...props}>
      <defs>
        <linearGradient id="inkwell-gold" x1="0" x2="1">
          <stop offset="0" stopColor="#facc15" />
          <stop offset="1" stopColor="#eab308" />
        </linearGradient>
      </defs>
      <path
        d="M50 6c-9 2-18 9-26 18C16 33 9 43 8 50c7-1 17-8 26-16C43 25 50 16 52 8l2-8-4 6z"
        fill="url(#inkwell-gold)"
      />
      <path
        d="M12 52c10-2 22-10 32-20"
        stroke="#a16207"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}
