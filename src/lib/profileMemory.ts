// src/lib/profileMemory.ts
import { supabase } from './supabaseClient';

export const LAST_PROFILE_KEY = 'inkwell:lastProfileId';

/**
 * Retrieves the remembered profile ID from localStorage
 */
export function getRememberedProfileId(): string | null {
  try {
    return localStorage.getItem(LAST_PROFILE_KEY);
  } catch {
    return null;
  }
}

/**
 * Remembers a profile ID in localStorage
 */
export function rememberProfileId(profileId: string) {
  try {
    localStorage.setItem(LAST_PROFILE_KEY, profileId);
  } catch (error) {
    console.warn('Failed to save profile ID to localStorage:', error);
  }
}

/**
 * Syncs the last used profile to Supabase user metadata
 */
export async function syncLastProfileToUserMetadata(profileId: string) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.auth.updateUser({
      data: {
        ...user.user_metadata,
        lastProfileId: profileId,
      },
    });
  } catch (error) {
    console.warn('Failed to sync profile ID to user metadata:', error);
  }
}

/**
 * Gets the last profile ID from user metadata (useful for cross-device syncing)
 */
export async function getLastProfileFromUserMetadata(): Promise<string | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || !user.user_metadata) return null;

    return user.user_metadata.lastProfileId || null;
  } catch {
    return null;
  }
}
