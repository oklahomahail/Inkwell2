/**
 * Preview Banner Component
 * Displays a persistent banner for users in preview mode
 * encouraging them to sign up to save their work
 */

import { AlertCircle } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';

export interface PreviewBannerProps {
  onCTAClick?: () => void;
}

export function PreviewBanner({ onCTAClick }: PreviewBannerProps) {
  const handleClick = () => {
    // Track CTA click
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'preview_cta_click', {
        type: 'signup',
        location: 'banner',
      });
    }

    onCTAClick?.();
  };

  return (
    <div
      className="w-full bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800"
      role="alert"
      aria-live="polite"
      data-tour-id="preview-banner"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-sm text-yellow-900 dark:text-yellow-100">
            <AlertCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            <span className="font-medium">You're exploring Inkwell Preview</span>
            <span className="text-yellow-700 dark:text-yellow-300">— Changes are not saved.</span>
          </div>
          <Link
            to="/signup?from=preview"
            onClick={handleClick}
            className="inline-flex items-center px-4 py-1.5 bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-700 dark:hover:bg-yellow-600 text-white text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
          >
            Create free account to save
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * Compact version of the banner for smaller viewports
 */
export function PreviewBannerCompact({ onCTAClick }: PreviewBannerProps) {
  const handleClick = () => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'preview_cta_click', {
        type: 'signup',
        location: 'banner_compact',
      });
    }

    onCTAClick?.();
  };

  return (
    <div
      className="w-full bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800 px-3 py-2"
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs text-yellow-900 dark:text-yellow-100">
          <AlertCircle className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
          <span className="font-medium">Preview Mode</span>
        </div>
        <Link
          to="/signup?from=preview"
          onClick={handleClick}
          className="text-xs px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white font-medium rounded transition-colors"
        >
          Sign up
        </Link>
      </div>
    </div>
  );
}

export default PreviewBanner;
