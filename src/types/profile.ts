// src/types/profile.ts - Profile types and interfaces

export type ProfileId = string;

export interface Profile {
  id: ProfileId;
  name: string;
  displayName?: string;
  createdAt: Date;
  updatedAt: Date;
  color?: string;
  avatar?: string;
  description?: string;
  settings?: {
    theme?: 'light' | 'dark' | 'system';
    defaultProject?: string;
    preferences?: Record<string, any>;
  };
}

export interface ProfileState {
  profiles: Profile[];
  activeProfile: Profile | null;
  isLoading: boolean;
  error: string | null;
}

export interface ProfileActions {
  createProfile: (name: string, options?: Partial<Profile>) => Promise<Profile>;
  deleteProfile: (profileId: ProfileId) => Promise<void>;
  updateProfile: (profileId: ProfileId, updates: Partial<Profile>) => Promise<Profile>;
  setActiveProfile: (profileId: ProfileId) => Promise<void>;
  loadProfiles: () => Promise<void>;
  clearActiveProfile: () => void;
}

export type ProfileContextType = ProfileState & ProfileActions;
