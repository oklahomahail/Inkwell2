// src/utils/tutorialLinks.ts
import React from 'react';

import { useProfile } from '../context/ProfileContext';

/**
 * Generate profile-aware tutorial links
 */
export function useTutorialLinks() {
  const { active: activeProfile } = useProfile();

  const generateTutorialUrl = (slug: string, step?: number): string => {
    if (!activeProfile?.id) {
      console.warn('No active profile - cannot generate tutorial URL');
      return '/profiles';
    }

    const baseUrl = `/p/${activeProfile.id}/tutorials/${slug}`;
    return step !== undefined ? `${baseUrl}/${step}` : baseUrl;
  };

  const generateTutorialIndexUrl = (): string => {
    if (!activeProfile?.id) {
      return '/profiles';
    }
    return `/p/${activeProfile.id}/tutorials`;
  };

  const redirectToTutorial = (slug: string, step?: number) => {
    const url = generateTutorialUrl(slug, step);
    window.location.href = url;
  };

  const redirectToTutorialIndex = () => {
    const url = generateTutorialIndexUrl();
    window.location.href = url;
  };

  return {
    generateTutorialUrl,
    generateTutorialIndexUrl,
    redirectToTutorial,
    redirectToTutorialIndex,
    hasActiveProfile: !!activeProfile?.id,
    activeProfileId: activeProfile?.id,
  };
}

/**
 * Static utility functions that don't require React hooks
 */
export const TutorialLinks = {
  /**
   * Generate tutorial URL with profile ID
   */
  generateUrl: (profileId: string, slug: string, step?: number): string => {
    const baseUrl = `/p/${profileId}/tutorials/${slug}`;
    return step !== undefined ? `${baseUrl}/${step}` : baseUrl;
  },

  /**
   * Generate tutorial index URL with profile ID
   */
  generateIndexUrl: (profileId: string): string => {
    return `/p/${profileId}/tutorials`;
  },

  /**
   * Check if URL is a profile-aware tutorial URL
   */
  isTutorialUrl: (url: string): boolean => {
    return /^\/p\/[^/]+\/tutorials/.test(url);
  },

  /**
   * Extract profile ID from tutorial URL
   */
  extractProfileId: (url: string): string | null => {
    const match = url.match(/^\/p\/([^/]+)\/tutorials/);
    return match ? match[1] : null;
  },

  /**
   * Extract tutorial slug from URL
   */
  extractSlug: (url: string): string | null => {
    const match = url.match(/^\/p\/[^/]+\/tutorials\/([^/]+)/);
    return match ? match[1] : null;
  },

  /**
   * Extract step number from URL
   */
  extractStep: (url: string): number | null => {
    const match = url.match(/^\/p\/[^/]+\/tutorials\/[^/]+\/(\d+)/);
    return match ? parseInt(match[1], 10) : null;
  },
};

/**
 * HOC to guard tutorial entry points - ensures an active profile exists
 */
export function withTutorialGuard<T extends object>(
  Component: React.ComponentType<T>,
): React.ComponentType<T> {
  return function TutorialGuardWrapper(props: T) {
    const { hasActiveProfile } = useTutorialLinks();

    if (!hasActiveProfile) {
      // Redirect to profile picker if no active profile
      window.location.href = '/profiles';
      return null;
    }

    return <Component {...props} />;
  };
}

/**
 * Tutorial button component that automatically includes profile in URLs
 */
interface TutorialButtonProps {
  slug: string;
  step?: number;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}

export function TutorialButton({
  slug,
  step,
  className = '',
  children,
  onClick,
}: TutorialButtonProps) {
  const { generateTutorialUrl, hasActiveProfile, redirectToTutorial } = useTutorialLinks();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();

    if (!hasActiveProfile) {
      console.warn('No active profile - redirecting to profile picker');
      window.location.href = '/profiles';
      return;
    }

    if (onClick) {
      onClick();
    }

    redirectToTutorial(slug, step);
  };

  const href = hasActiveProfile ? generateTutorialUrl(slug, step) : '/profiles';

  return (
    <a
      href={href}
      onClick={handleClick}
      className={className}
      aria-label={`Start tutorial: ${slug}`}
    >
      {children}
    </a>
  );
}

/**
 * Tutorial link component for simple text links
 */
interface TutorialLinkProps {
  slug: string;
  step?: number;
  className?: string;
  children: React.ReactNode;
}

export function TutorialLink({ slug, step, className = '', children }: TutorialLinkProps) {
  const { generateTutorialUrl, hasActiveProfile } = useTutorialLinks();

  const href = hasActiveProfile ? generateTutorialUrl(slug, step) : '/profiles';

  return (
    <a
      href={href}
      className={className}
      aria-label={`Go to tutorial: ${slug}${step !== undefined ? ` step ${step}` : ''}`}
    >
      {children}
    </a>
  );
}

export default TutorialLinks;
