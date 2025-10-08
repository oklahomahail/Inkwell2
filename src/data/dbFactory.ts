// src/data/dbFactory.ts - Profile-specific database factory

import { useProfileContext } from '../context/ProfileContext';
import { ProfileId } from '../types/profile';
import { StorageAdapter, StorageOptions } from '../utils/storage';

// Profile-specific storage adapter that prefixes all keys
class ProfileStorageAdapter implements StorageAdapter {
  constructor(
    private baseAdapter: StorageAdapter,
    private profileId: ProfileId,
  ) {}

  private getProfileKey(key: string): string {
    return `profile_${this.profileId}_${key}`;
  }

  async get<T>(key: string): Promise<T | null> {
    return this.baseAdapter.get<T>(this.getProfileKey(key));
  }

  async put<T>(key: string, value: T): Promise<void> {
    return this.baseAdapter.put(this.getProfileKey(key), value);
  }

  async delete(key: string): Promise<void> {
    return this.baseAdapter.delete(this.getProfileKey(key));
  }

  async list(prefix?: string): Promise<string[]> {
    const profilePrefix = `profile_${this.profileId}_`;
    const allKeys = await this.baseAdapter.list(profilePrefix);

    return allKeys
      .map((key) => (key.startsWith(profilePrefix) ? key.slice(profilePrefix.length) : key))
      .filter((key) => !prefix || key.startsWith(prefix));
  }

  async clear(): Promise<void> {
    const profilePrefix = `profile_${this.profileId}_`;
    const keysToDelete = await this.baseAdapter.list(profilePrefix);

    for (const key of keysToDelete) {
      await this.baseAdapter.delete(key);
    }
  }
}

// Custom storage manager that uses profile-specific adapters
class ProfileStorageManager {
  private adapter: ProfileStorageAdapter;

  constructor(baseAdapter: StorageAdapter, profileId: ProfileId) {
    this.adapter = new ProfileStorageAdapter(baseAdapter, profileId);
  }

  async get<T>(key: string, _options: StorageOptions = {}): Promise<T | null> {
    return this.adapter.get<T>(key);
  }

  async put<T>(key: string, value: T, _options: StorageOptions = {}): Promise<void> {
    return this.adapter.put(key, value);
  }

  async delete(key: string): Promise<void> {
    return this.adapter.delete(key);
  }

  async list(prefix?: string): Promise<string[]> {
    return this.adapter.list(prefix);
  }

  async clear(): Promise<void> {
    return this.adapter.clear();
  }

  // Compatibility methods
  async getItem<T>(key: string): Promise<T | null> {
    return this.get<T>(key);
  }

  async setItem<T>(key: string, value: T): Promise<void> {
    return this.put(key, value);
  }

  async removeItem(key: string): Promise<void> {
    return this.delete(key);
  }

  async getAllKeys(): Promise<string[]> {
    return this.list();
  }
}

// Import the main storage instance
import { storage } from '../utils/storage';

// Database instances per profile
const dbInstances = new Map<ProfileId, ProfileStorageManager>();

/**
 * Get a profile-specific database instance
 */
export function getDbForProfile(profileId: ProfileId): ProfileStorageManager {
  if (!dbInstances.has(profileId)) {
    // Get the adapter from the main storage instance
    const baseAdapter = (storage as any).adapter;
    dbInstances.set(profileId, new ProfileStorageManager(baseAdapter, profileId));
  }
  return dbInstances.get(profileId)!;
}

/**
 * Hook to get the current profile's database
 */
export function useDB(): ProfileStorageManager {
  const { activeProfile } = useProfileContext();

  if (!activeProfile) {
    throw new Error(
      'No active profile - cannot access database. Make sure ProfileGate is wrapping your component.',
    );
  }

  return getDbForProfile(activeProfile.id);
}

/**
 * Generate a database name for a profile
 */
export function makeDbName(profileId: ProfileId): string {
  return `inkwell_profile_${profileId}`;
}

/**
 * Define the data stores/tables that each profile should have
 */
export const defineStores = () => {
  return {
    // Projects store
    projects: 'inkwell_enhanced_projects',

    // Writing chapters store (per project)
    writingChapters: (projectId: string) => `inkwell_writing_chapters_${projectId}`,

    // Timeline scenes
    timelineScenes: 'timeline_scenes',

    // Writing content
    writingContent: 'writing_content',

    // User preferences
    preferences: 'user_preferences',

    // Export data
    exports: 'export_data',

    // Analytics data
    analytics: 'analytics_data',
  };
};

/**
 * Legacy compatibility - gradually migrate code to use this factory
 */
export function createLegacyStorageForProfile(profileId: ProfileId) {
  const db = getDbForProfile(profileId);

  return {
    saveWritingContent: async (data: { title: string; content: string }) => {
      await db.put('writing_content', data);
    },

    loadWritingContent: async (): Promise<{ title: string; content: string } | null> => {
      return db.get('writing_content');
    },

    saveTimeline: async (scenes: any[]) => {
      await db.put('timeline_scenes', scenes);
    },

    loadTimeline: async (): Promise<any[]> => {
      const data = await db.get<any[]>('timeline_scenes');
      return data || [];
    },
  };
}
