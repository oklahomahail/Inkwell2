import { db } from '../db';
import { Profile } from '../types/profile';

// Import your database layer here
const getCurrentUser = () => {
  return Promise.resolve({ id: 'test-user' });
};

class ProfileService {
  // Helper function to ensure date fields are proper Date objects
  private static ensureDates(profile: Profile): any {
    const result = { ...profile };
    if (typeof result.createdAt === 'string') {
      result.createdAt = new Date(result.createdAt);
    }
    if (typeof result.updatedAt === 'string') {
      result.updatedAt = new Date(result.updatedAt);
    }
    return result;
  }

  static async createProfile(name: string, options?: Partial<Profile>): Promise<Profile> {
    const user = await getCurrentUser();
    const now = new Date();

    const profile = {
      id: crypto.randomUUID(),
      name,
      ownerId: user.id,
      createdAt: now,
      updatedAt: now,
      ...options,
    } as Profile;

    await db.profiles.put(ProfileService.ensureDates(profile));
    return profile;
  }

  static async listProfiles(includeArchived: boolean = false): Promise<Profile[]> {
    const user = await getCurrentUser();
    if (!user?.id) throw new Error('Not authenticated');

    const profiles = (await db.profiles.where('ownerId').equals(user.id).toArray()) as Profile[];
    return includeArchived ? profiles : profiles.filter((p: any) => !p.archivedAt);
  }

  static async archiveProfile(profileId: string): Promise<void> {
    const user = await getCurrentUser();
    const profile = await db.profiles.get(profileId);

    if (!profile || profile.ownerId !== user?.id) {
      throw new Error('Profile not found or access denied');
    }

    await db.profiles.update(profileId, {
      archivedAt: new Date().toISOString(),
      updatedAt: new Date(),
    });
  }

  static async deleteProfile(profileId: string): Promise<void> {
    const user = await getCurrentUser();
    const profile = await db.profiles.get(profileId);

    if (!profile || profile.ownerId !== user?.id) {
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
      db.projects
        .where('profileId')
        .equals(profileId)
        .filter(() => true)
        .delete(),
      db.chapters
        .where('profileId')
        .equals(profileId)
        .filter(() => true)
        .delete(),
      db.timelineItems
        .where('profileId')
        .equals(profileId)
        .filter(() => true)
        .delete(),
      db.snapshots
        .where('profileId')
        .equals(profileId)
        .filter(() => true)
        .delete(),
      db.analytics
        .where('profileId')
        .equals(profileId)
        .filter(() => true)
        .delete(),
    ]);

    await db.profiles.delete(profileId);
  }

  static async updateProfile(profileId: string, updates: Partial<Profile>): Promise<Profile> {
    const user = await getCurrentUser();
    const profile = await db.profiles.get(profileId);

    if (!profile || profile.ownerId !== user?.id) {
      throw new Error('Profile not found or access denied');
    }

    const updatedProfile = {
      ...profile,
      ...updates,
      updatedAt: new Date(),
    } as Profile;

    await db.profiles.put(ProfileService.ensureDates(updatedProfile));
    return updatedProfile;
  }

  static async getDependencyCounts(profileId: string): Promise<{
    projects: number;
    chapters: number;
    timelineItems: number;
    snapshots: number;
  }> {
    const [projects, chapters, timelineItems, snapshots] = await Promise.all([
      db.projects
        .where('profileId')
        .equals(profileId)
        .filter(() => true)
        .count(),
      db.chapters
        .where('profileId')
        .equals(profileId)
        .filter(() => true)
        .count(),
      db.timelineItems
        .where('profileId')
        .equals(profileId)
        .filter(() => true)
        .count(),
      db.snapshots
        .where('profileId')
        .equals(profileId)
        .filter(() => true)
        .count(),
    ]);

    return { projects, chapters, timelineItems, snapshots };
  }
}

export const profileService = new ProfileService();
