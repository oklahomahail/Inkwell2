// ARIA Live Region for accessibility announcements
// Provides screen reader notifications for drag-and-drop operations and other interactions

import React from 'react';

interface AccessibilityAnnouncerProps {
  message: string;
  assertiveness?: 'polite' | 'assertive';
  clearAfter?: number; // milliseconds
  className?: string;
}

export const AccessibilityAnnouncer: React.FC<AccessibilityAnnouncerProps> = ({
  message,
  _assertiveness = 'assertive',
  _clearAfter = 5000,
  _className = '',
}) => {
  const [announcement, setAnnouncement] = React.useState(message);

  // Update announcement when message changes
  React.useEffect(() => {
    if (message) {
      setAnnouncement(message);

      // Clear after specified time
      const timeout = setTimeout(() => {
        setAnnouncement('');
      }, clearAfter);

      return () => clearTimeout(timeout);
    }
  }, [message, clearAfter]);

  if (!message) {
    return null;
  }

  return (
    <div aria-live={assertiveness} aria-atomic="true" className={`sr-only ${className}`}>
      {announcement}
    </div>
  );
};

/**
 * Container for multiple ARIA live regions with different politeness levels
 */
export const AccessibilityRegion: React.FC<{
  assertiveAnnouncement?: string;
  politeAnnouncement?: string;
}> = ({ assertiveAnnouncement, politeAnnouncement }) => {
  return (
    <div className="sr-only" aria-hidden="true">
      {assertiveAnnouncement && (
        <AccessibilityAnnouncer message={assertiveAnnouncement} assertiveness="assertive" />
      )}

      {politeAnnouncement && (
        <AccessibilityAnnouncer message={politeAnnouncement} assertiveness="polite" />
      )}
    </div>
  );
};
