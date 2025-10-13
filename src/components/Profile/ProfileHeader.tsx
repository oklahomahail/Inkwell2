// src/components/Profile/ProfileHeader.tsx
import React from 'react';

interface ProfileHeaderProps {
  /** Whether to make the alternate tagline clickable */
  onTaglineClick?: () => void;
  /** Custom href for tagline link */
  taglineHref?: string;
}

export default function ProfileHeader({ onTaglineClick, taglineHref }: ProfileHeaderProps) {
  const TaglineComponent = taglineHref ? 'a' : onTaglineClick ? 'button' : 'span';

  const taglineProps = taglineHref
    ? { href: taglineHref, target: '_blank', rel: 'noopener noreferrer' }
    : onTaglineClick
      ? { onClick: onTaglineClick, type: 'button' as const, role: 'button' }
      : {};

  return (
    <header className="rounded-2xl border bg-white/60 p-4 md:p-6 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Inkwell by Nexus Partners</h1>
          <p className="mt-1 text-sm text-neutral-600">Find your story. Write it well.</p>
        </div>

        {/* Alt tagline on the right */}
        <div className="sm:shrink-0">
          <TaglineComponent
            className={`inline-flex items-center rounded-full border px-3 py-1 text-sm text-blue-700/90 hover:bg-blue-50 transition-colors ${
              onTaglineClick || taglineHref ? 'cursor-pointer' : ''
            }`}
            aria-label="Alternate tagline"
            {...taglineProps}
          >
            Because great stories deserve great tools.
          </TaglineComponent>
        </div>
      </div>
    </header>
  );
}
