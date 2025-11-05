/**
 * Privacy Notice
 *
 * Displays a short summary of Inkwell's telemetry practices with a link
 * to the full privacy documentation and Settings.
 */

import { LearnMoreLink } from './LearnMoreLink';

interface PrivacyNoticeProps {
  className?: string;
  showLearnMore?: boolean;
}

export function PrivacyNotice({ className, showLearnMore = true }: PrivacyNoticeProps) {
  return (
    <div className={`text-xs text-gray-500 mt-3 max-w-prose leading-snug ${className || ''}`}>
      <p>
        Inkwell collects anonymous performance data (like save speed and cache efficiency) to
        improve reliability. No content or personal data is ever transmitted.
      </p>
      {showLearnMore && (
        <p className="mt-2">
          You can disable telemetry anytime in <strong>Settings → Privacy</strong>.{' '}
          <LearnMoreLink className="text-xs">Read our privacy policy</LearnMoreLink>
        </p>
      )}
    </div>
  );
}

export default PrivacyNotice;
