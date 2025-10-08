// src/context/ProfileContext.tsx - Profile state management

import React, { createContext, useContext, useEffect, useReducer, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

import { Profile, ProfileId, ProfileState, ProfileContextType } from '../types/profile';

// Local storage keys
const PROFILES_KEY = 'inkwell_profiles';
const ACTIVE_PROFILE_KEY = 'inkwell_active_profile';

// Profile reducer
type ProfileAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_PROFILES'; payload: Profile[] }
  | { type: 'ADD_PROFILE'; payload: Profile }
  | { type: 'UPDATE_PROFILE'; payload: { id: ProfileId; updates: Partial<Profile> } }
  | { type: 'DELETE_PROFILE'; payload: ProfileId }
  | { type: 'SET_ACTIVE_PROFILE'; payload: Profile | null };

function profileReducer(state: ProfileState, action: ProfileAction): ProfileState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_PROFILES':
      return { ...state, profiles: action.payload };
    case 'ADD_PROFILE':
      return { ...state, profiles: [...state.profiles, action.payload] };
    case 'UPDATE_PROFILE':
      return {
        ...state,
        profiles: state.profiles.map((p) =>
          p.id === action.payload.id ? { ...p, ...action.payload.updates } : p,
        ),
        activeProfile:
          state.activeProfile?.id === action.payload.id
            ? { ...state.activeProfile, ...action.payload.updates }
            : state.activeProfile,
      };
    case 'DELETE_PROFILE':
      return {
        ...state,
        profiles: state.profiles.filter((p) => p.id !== action.payload),
        activeProfile: state.activeProfile?.id === action.payload ? null : state.activeProfile,
      };
    case 'SET_ACTIVE_PROFILE':
      return { ...state, activeProfile: action.payload };
    default:
      return state;
  }
}

// Storage utilities
function saveProfilesToStorage(profiles: Profile[]) {
  try {
    localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
  } catch (error) {
    console.error('Failed to save profiles to storage:', error);
  }
}

function loadProfilesFromStorage(): Profile[] {
  try {
    const stored = localStorage.getItem(PROFILES_KEY);
    if (stored) {
      const profiles = JSON.parse(stored);
      return profiles.map((p: any) => ({
        ...p,
        createdAt: new Date(p.createdAt),
        updatedAt: new Date(p.updatedAt),
      }));
    }
  } catch (error) {
    console.error('Failed to load profiles from storage:', error);
  }
  return [];
}

function saveActiveProfileToStorage(profileId: ProfileId | null) {
  try {
    if (profileId) {
      localStorage.setItem(ACTIVE_PROFILE_KEY, profileId);
    } else {
      localStorage.removeItem(ACTIVE_PROFILE_KEY);
    }
  } catch (error) {
    console.error('Failed to save active profile to storage:', error);
  }
}

function loadActiveProfileFromStorage(): ProfileId | null {
  try {
    return localStorage.getItem(ACTIVE_PROFILE_KEY);
  } catch (error) {
    console.error('Failed to load active profile from storage:', error);
    return null;
  }
}

// Context
const ProfileContext = createContext<ProfileContextType | null>(null);

export function useProfileContext(): ProfileContextType {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfileContext must be used within a ProfileProvider');
  }
  return context;
}

// Alias for tutorial storage compatibility
export function useProfile() {
  const context = useProfileContext();
  return {
    active: context.activeProfile,
    activeProfileId: context.activeProfile?.id || null,
    ...context,
  };
}

// Provider component
interface ProfileProviderProps {
  children: React.ReactNode;
}

export function ProfileProvider({ children }: ProfileProviderProps) {
  const [state, dispatch] = useReducer(profileReducer, {
    profiles: [],
    activeProfile: null,
    isLoading: false,
    error: null,
  });

  // Actions
  const createProfile = useCallback(
    async (name: string, options: Partial<Profile> = {}): Promise<Profile> => {
      dispatch({ type: 'SET_ERROR', payload: null });

      const now = new Date();
      const profile: Profile = {
        id: uuidv4(),
        name: name.trim(),
        displayName: options.displayName || name.trim(),
        createdAt: now,
        updatedAt: now,
        color: options.color || `hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)`,
        ...options,
      };

      dispatch({ type: 'ADD_PROFILE', payload: profile });

      const updatedProfiles = [...state.profiles, profile];
      saveProfilesToStorage(updatedProfiles);

      return profile;
    },
    [state.profiles],
  );

  const deleteProfile = useCallback(
    async (profileId: ProfileId): Promise<void> => {
      dispatch({ type: 'SET_ERROR', payload: null });

      if (state.profiles.length <= 1) {
        throw new Error('Cannot delete the last profile');
      }

      dispatch({ type: 'DELETE_PROFILE', payload: profileId });

      const updatedProfiles = state.profiles.filter((p) => p.id !== profileId);
      saveProfilesToStorage(updatedProfiles);

      if (state.activeProfile?.id === profileId) {
        saveActiveProfileToStorage(null);
      }
    },
    [state.profiles, state.activeProfile],
  );

  const updateProfile = useCallback(
    async (profileId: ProfileId, updates: Partial<Profile>): Promise<Profile> => {
      dispatch({ type: 'SET_ERROR', payload: null });

      const profileToUpdate = state.profiles.find((p) => p.id === profileId);
      if (!profileToUpdate) {
        throw new Error('Profile not found');
      }

      const updatedData = { ...updates, updatedAt: new Date() };
      dispatch({ type: 'UPDATE_PROFILE', payload: { id: profileId, updates: updatedData } });

      const updatedProfiles = state.profiles.map((p) =>
        p.id === profileId ? { ...p, ...updatedData } : p,
      );
      saveProfilesToStorage(updatedProfiles);

      return { ...profileToUpdate, ...updatedData };
    },
    [state.profiles],
  );

  const setActiveProfile = useCallback(
    async (profileId: ProfileId): Promise<void> => {
      dispatch({ type: 'SET_ERROR', payload: null });

      const profile = state.profiles.find((p) => p.id === profileId);
      if (!profile) {
        throw new Error('Profile not found');
      }

      dispatch({ type: 'SET_ACTIVE_PROFILE', payload: profile });
      saveActiveProfileToStorage(profileId);
    },
    [state.profiles],
  );

  const loadProfiles = useCallback(async (): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const profiles = loadProfilesFromStorage();
      dispatch({ type: 'SET_PROFILES', payload: profiles });

      // Load active profile
      const activeProfileId = loadActiveProfileFromStorage();
      if (activeProfileId && profiles.length > 0) {
        const activeProfile = profiles.find((p) => p.id === activeProfileId);
        if (activeProfile) {
          dispatch({ type: 'SET_ACTIVE_PROFILE', payload: activeProfile });
        }
      }
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: error instanceof Error ? error.message : 'Failed to load profiles',
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const clearActiveProfile = useCallback(() => {
    dispatch({ type: 'SET_ACTIVE_PROFILE', payload: null });
    saveActiveProfileToStorage(null);
  }, []);

  // Load profiles on mount
  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  const contextValue: ProfileContextType = {
    ...state,
    createProfile,
    deleteProfile,
    updateProfile,
    setActiveProfile,
    loadProfiles,
    clearActiveProfile,
  };

  return <ProfileContext.Provider value={contextValue}>{children}</ProfileContext.Provider>;
}
