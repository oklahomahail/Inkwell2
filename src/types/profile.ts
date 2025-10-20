// src/types/profile.ts - Profile types and interfaces

export type ProfileId = string;

export interface Profile {
  id: ProfileId;
  name: string;
  ownerId?: string;
  displayName?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  color?: string;
  avatar?: string;
  description?: string;
  settings?: {
    theme?: 'light' | 'dark' | 'system';
    defaultProject?: string;
    preferences?: Record<string, any>;
  };
  archivedAt?: string;
  deleted?: boolean;
  deletedAt?: string;
}

export interface ProfileState {
  profiles: Profile[];
  activeProfile: Profile | null;
  isLoading: boolean;
  error: string | null;
}

export interface ProfileActions {
  createProfile: (_name: string, _options?: Partial<Profile>) => Promise<Profile>;
  deleteProfile: (_profileId: ProfileId) => Promise<void>;
  updateProfile: (_profileId: ProfileId, _updates: Partial<Profile>) => Promise<Profile>;
  setActiveProfile: (_profileId: ProfileId) => Promise<void>;
  loadProfiles: () => Promise<void>;
  clearActiveProfile: () => void;
}

export type ProfileContextType = ProfileState & ProfileActions;
