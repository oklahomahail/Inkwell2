import { X } from 'lucide-react';
import { useEffect, useState } from 'react';

/**
 * DomainMigrationBanner
 *
 * Shows a prominent banner when users visit the legacy domain,
 * informing them about the migration to writewithinkwell.com.
 *
 * Only displays on inkwell.leadwithnexus.com during the transition period.
 */
export function DomainMigrationBanner() {
  const [isDismissed, setIsDismissed] = useState(false);
  const [isLegacyDomain, setIsLegacyDomain] = useState(false);

  useEffect(() => {
    // Check if we're on the legacy domain
    const hostname = window.location.hostname;
    if (hostname === 'inkwell.leadwithnexus.com') {
      setIsLegacyDomain(true);

      // Check if user has already dismissed the banner (expires after 7 days)
      const dismissalKey = 'inkwell_migration_banner_dismissed';
      const dismissalTimestamp = localStorage.getItem(dismissalKey);

      if (dismissalTimestamp) {
        const dismissedAt = parseInt(dismissalTimestamp, 10);
        const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
        const now = Date.now();

        if (now - dismissedAt < sevenDaysInMs) {
          setIsDismissed(true);
        } else {
          // Expired, clear the flag
          localStorage.removeItem(dismissalKey);
        }
      }
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('inkwell_migration_banner_dismissed', Date.now().toString());
  };

  const handleMigrate = () => {
    // Redirect to the new domain, preserving the current path
    const newUrl = window.location.href.replace(
      'inkwell.leadwithnexus.com',
      'writewithinkwell.com',
    );
    window.location.href = newUrl;
  };

  // Don't show banner if:
  // - Not on legacy domain
  // - User has dismissed it
  if (!isLegacyDomain || isDismissed) {
    return null;
  }

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-inkwell-navy to-inkwell-blue text-white shadow-lg"
      role="banner"
      aria-live="polite"
    >
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 flex items-center gap-3">
            <div className="hidden sm:block w-2 h-2 rounded-full bg-inkwell-gold animate-pulse" />
            <div className="flex-1">
              <p className="text-sm sm:text-base font-medium">
                <strong>We've moved!</strong> Inkwell is now at{' '}
                <span className="font-semibold text-inkwell-gold">writewithinkwell.com</span>
              </p>
              <p className="text-xs sm:text-sm opacity-90 mt-1">
                Update your bookmarks. Your data is safe and will migrate automatically.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleMigrate}
              className="px-4 py-2 bg-inkwell-gold text-inkwell-navy font-semibold rounded-md hover:bg-opacity-90 transition-colors text-sm whitespace-nowrap"
              aria-label="Go to new domain"
            >
              Go to New Site
            </button>

            <button
              onClick={handleDismiss}
              className="p-2 hover:bg-white/10 rounded-md transition-colors"
              aria-label="Dismiss migration notice"
              title="Dismiss (shows again in 7 days)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
