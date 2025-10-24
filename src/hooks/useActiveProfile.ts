// src/hooks/useActiveProfile.ts - Backwards compatibility shim
// Replaces ProfileContext with auth user for apps that don't need multi-profile support

import { useAuth } from '../context/AuthContext';

/**
 * Backwards-compatible shim that maps auth user to "active profile"
 * This allows existing code to work without ProfileContext
 */
export function useActiveProfile() {
  const { user } = useAuth();

  // Minimal shape to satisfy old callers
  return {
    activeProfile: user
      ? {
          id: user.id,
          displayName: user.email || 'User',
          email: user.email,
        }
      : null,
    loading: false,
  };
}

/**
 * Simplified hook for callers that only need the profile/user ID
 */
export function useActiveProfileId() {
  const { user } = useAuth();
  return user?.id ?? null;
}

/**
 * Alias for consistency with existing code
 */
export const useScopedId = useActiveProfileId;
