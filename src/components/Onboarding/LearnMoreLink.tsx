/**
 * Learn More Link
 *
 * Opens the onboarding documentation in a new tab.
 * Emits telemetry event when clicked.
 */

import { useCallback } from 'react';

import { track } from '@/services/telemetry';

interface LearnMoreLinkProps {
  className?: string;
  children?: React.ReactNode;
}

export function LearnMoreLink({ className, children }: LearnMoreLinkProps) {
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();

    // Emit telemetry
    track('onboarding.learn_more.clicked', { sample: 1 });

    // Open documentation in new tab
    window.open('/docs/ONBOARDING.md', '_blank', 'noopener,noreferrer');
  }, []);

  return (
    <a
      href="/docs/ONBOARDING.md"
      onClick={handleClick}
      className={`text-sm underline text-blue-500 hover:text-blue-600 transition-colors ${className || ''}`}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children || 'Learn More'}
    </a>
  );
}

export default LearnMoreLink;
