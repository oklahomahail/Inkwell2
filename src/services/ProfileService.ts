import { useUser } from '@clerk/clerk-react';

import { db } from '../db';
import { Profile, ProfileId } from '../types/profile';

// Import your database layer here

class ProfileService {
  async createProfile(name: string, options?: Partial<Profile>): Promise<Profile> {
    const { user } = useUser();
    const now = new Date();

    const profile: Profile = {
      id: crypto.randomUUID(),
      name,
      ownerId: user.id,
      createdAt: now,
      updatedAt: now,
      ...options,
    };

    await db.profiles.add(profile);
    return profile;
  }

  async listProfiles(includeArchived: boolean = false): Promise<Profile[]> {
    const { user } = useUser();
    if (!user?.id) throw new Error('Not authenticated');

    const profiles = await db.profiles.where('ownerId').equals(user.id).toArray();
    return includeArchived ? profiles : profiles.filter((p) => !p.archivedAt);
  }

  async archiveProfile(profileId: ProfileId): Promise<void> {
    const { user } = useUser();
    const profile = await db.profiles.get(profileId);

    if (!profile || profile.ownerId !== user.id) {
      throw new Error('Profile not found or access denied');
    }

    await db.profiles.update(profileId, {
      archivedAt: new Date(),
      updatedAt: new Date(),
    });
  }

  async deleteProfile(profileId: ProfileId): Promise<void> {
    const { user } = useUser();
    const profile = await db.profiles.get(profileId);

    if (!profile || profile.ownerId !== user.id) {
      throw new Error('Profile not found or access denied');
    }

    // Prevent deleting last profile
    const userProfiles = await db.profiles
      .where('ownerId')
      .equals(user.id)
      .filter((p) => !p.archivedAt)
      .toArray();

    if (userProfiles.length <= 1) {
      throw new Error('You must keep at least one active profile');
    }

    // Cascade delete related data
    await Promise.all([
      db.projects.where('profileId').equals(profileId).delete(),
      db.chapters.where('profileId').equals(profileId).delete(),
      db.timelineItems.where('profileId').equals(profileId).delete(),
      db.snapshots.where('profileId').equals(profileId).delete(),
      db.analytics.where('profileId').equals(profileId).delete(),
    ]);

    await db.profiles.delete(profileId);
  }

  async updateProfile(profileId: ProfileId, updates: Partial<Profile>): Promise<Profile> {
    const { user } = useUser();
    const profile = await db.profiles.get(profileId);

    if (!profile || profile.ownerId !== user.id) {
      throw new Error('Profile not found or access denied');
    }

    const updatedProfile = {
      ...profile,
      ...updates,
      updatedAt: new Date(),
    };

    await db.profiles.put(updatedProfile);
    return updatedProfile;
  }

  async getDependencyCounts(profileId: ProfileId): Promise<{
    projects: number;
    chapters: number;
    timelineItems: number;
    snapshots: number;
  }> {
    const [projects, chapters, timelineItems, snapshots] = await Promise.all([
      db.projects.where('profileId').equals(profileId).count(),
      db.chapters.where('profileId').equals(profileId).count(),
      db.timelineItems.where('profileId').equals(profileId).count(),
      db.snapshots.where('profileId').equals(profileId).count(),
    ]);

    return { projects, chapters, timelineItems, snapshots };
  }
}

export const profileService = new ProfileService();
