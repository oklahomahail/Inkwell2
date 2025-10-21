// src/lib/resolvePostAuth.ts
import type { Profile } from '../types/profile';

interface ResolveFlags {
  shouldStartTour: boolean;
}

interface ResolveResult {
  path: string;
  profileId: string | null;
}

/**
 * Resolves where to send a user after authentication based on their profiles
 */
export function resolvePostAuthRoute(
  profiles: Profile[],
  rememberedId: string | null,
  flags: ResolveFlags,
): ResolveResult {
  // Check if there are no profiles, which is a special case
  if (profiles.length === 0) {
    return { path: '/profiles', profileId: null };
  }

  // 1) If we can match the remembered profile, use it
  if (rememberedId && profiles.some((p) => p.id === rememberedId)) {
    return {
      path: flags.shouldStartTour ? '/dashboard?tour=start' : '/dashboard',
      profileId: rememberedId,
    };
  }

  // 2) If exactly one profile, auto-select it
  if (profiles.length === 1 && profiles[0]) {
    return {
      path: flags.shouldStartTour ? '/dashboard?tour=start' : '/dashboard',
      profileId: profiles[0].id,
    };
  }

  // 3) Otherwise, send to picker
  return { path: '/profiles', profileId: null };
}
