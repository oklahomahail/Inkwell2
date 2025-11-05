// src/utils/tutorialLinks.tsx
import React from 'react';

import { useAuth } from '../context/AuthContext';

/**
 * Generate user-aware tutorial links
 */
export function useTutorialLinks() {
  const { user } = useAuth();

  const generateTutorialUrl = (slug: string, step?: number): string => {
    if (!user?.id) {
      console.warn('No active user - cannot generate tutorial URL');
      return '/dashboard';
    }
    const baseUrl = `/dashboard/tutorials/${slug}`;
    return step !== undefined ? `${baseUrl}/${step}` : baseUrl;
  };

  const generateTutorialIndexUrl = (): string => {
    if (!user?.id) {
      return '/dashboard';
    }
    return `/dashboard/tutorials`;
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
    hasActiveUser: !!user?.id,
    activeUserId: user?.id,
  };
}

/**
 * Static utility functions that don't require React hooks
 */
export const TutorialLinks = {
  /**
   * Generate tutorial URL (profileId param kept for backwards compatibility but unused)
   */
  generateUrl: (_profileId: string, slug: string, step?: number): string => {
    const baseUrl = `/dashboard/tutorials/${slug}`;
    return step !== undefined ? `${baseUrl}/${step}` : baseUrl;
  },

  /**
   * Generate tutorial index URL (profileId param kept for backwards compatibility but unused)
   */
  generateIndexUrl: (_profileId: string): string => {
    return `/dashboard/tutorials`;
  },

  /**
   * Check if URL is a tutorial URL
   */
  isTutorialUrl: (url: string): boolean => {
    return /^\/dashboard\/tutorials/.test(url);
  },

  /**
   * Extract profile ID from tutorial URL (deprecated - returns null)
   */
  extractProfileId: (_url: string): string | null => {
    return null; // No longer using profile-based routing
  },

  /**
   * Extract tutorial slug from URL
   */
  extractSlug: (url: string): string | null => {
    const match = url.match(/^\/dashboard\/tutorials\/([^/]+)/);
    return match?.[1] ?? null;
  },

  /**
   * Extract step number from URL
   */
  extractStep: (url: string): number | null => {
    const match = url.match(/^\/dashboard\/tutorials\/[^/]+\/(\d+)/);
    return match?.[1] ? parseInt(match[1], 10) : null;
  },
};

/**
 * HOC to guard tutorial entry points - ensures an active profile exists
 */
export function withTutorialGuard<T extends object>(
  Component: React.ComponentType<T>,
): React.ComponentType<T> {
  return function TutorialGuardWrapper(props: T) {
    const { hasActiveUser } = useTutorialLinks();

    if (!hasActiveUser) {
      // Redirect to dashboard if no active user
      window.location.href = '/dashboard';
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
  const { generateTutorialUrl, hasActiveUser, redirectToTutorial } = useTutorialLinks();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();

    if (!hasActiveUser) {
      console.warn('No active user - redirecting to dashboard');
      window.location.href = '/dashboard';
      return;
    }

    if (onClick) {
      onClick();
    }

    redirectToTutorial(slug, step);
  };

  const href = hasActiveUser ? generateTutorialUrl(slug, step) : '/dashboard';

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
  const { generateTutorialUrl, hasActiveUser } = useTutorialLinks();

  const href = hasActiveUser ? generateTutorialUrl(slug, step) : '/dashboard';

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
