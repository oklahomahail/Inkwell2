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

// Profile storage utilities
function saveProfilesToStorage(profiles: Profile[]) {
  try {
    localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
  } catch (error) {
    console.error('Failed to save profiles to storage:', error);
  }
}

function loadProfilesFromStorage(): Profile[] {
  try {
    const data = localStorage.getItem(PROFILES_KEY);
    if (data) {
      return JSON.parse(data);
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

      // Validate
      const trimmedName = name.trim();
      if (!trimmedName) {
        const error = 'Profile name cannot be empty';
        dispatch({ type: 'SET_ERROR', payload: error });
        throw new Error(error);
      }

      // Check for duplicate names
      const existingProfile = state.profiles.find(
        (p) => p.name.toLowerCase() === trimmedName.toLowerCase(),
      );

      if (existingProfile) {
        console.log('Profile already exists, returning existing:', existingProfile.name);
        return existingProfile;
      }

      // Create profile
      const newProfile: Profile = {
        id: uuidv4(),
        name: trimmedName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        preferences: {
          theme: 'system',
          defaultView: 'dashboard',
          ...options.preferences,
        },
        ...options,
      };

      // Update state & storage
      dispatch({ type: 'ADD_PROFILE', payload: newProfile });
      saveProfilesToStorage([...state.profiles, newProfile]);

      return newProfile;
    },
    [state.profiles],
  );

  const deleteProfile = useCallback(
    async (profileId: ProfileId): Promise<void> => {
      const updatedProfiles = state.profiles.filter((p) => p.id !== profileId);
      dispatch({ type: 'SET_PROFILES', payload: updatedProfiles });
      saveProfilesToStorage(updatedProfiles);

      // If deleting active profile, choose another one or clear
      if (state.activeProfile?.id === profileId && updatedProfiles.length > 0) {
        // Set first available profile as active
        const fallbackProfile = updatedProfiles[0];
        if (fallbackProfile) {
          dispatch({ type: 'SET_ACTIVE_PROFILE', payload: fallbackProfile });
          saveActiveProfileToStorage(fallbackProfile.id);
        }
      } else if (state.activeProfile?.id === profileId) {
        // No remaining profiles (shouldn't happen due to guard above, but just in case)
        dispatch({ type: 'SET_ACTIVE_PROFILE', payload: null });
        saveActiveProfileToStorage(null);
      }
    },
    [state.profiles, state.activeProfile],
  );

  const updateProfile = useCallback(
    async (profileId: ProfileId, updates: Partial<Profile>): Promise<Profile> => {
      const profileToUpdate = state.profiles.find((p) => p.id === profileId);
      if (!profileToUpdate) {
        const error = `Profile with ID ${profileId} not found`;
        dispatch({ type: 'SET_ERROR', payload: error });
        throw new Error(error);
      }

      const updatedData = {
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      const updatedProfiles = state.profiles.map((p) =>
        p.id === profileId ? { ...p, ...updatedData } : p,
      );

      dispatch({ type: 'SET_PROFILES', payload: updatedProfiles });
      dispatch({
        type: 'UPDATE_PROFILE',
        payload: { id: profileId, updates: updatedData },
      });

      saveProfilesToStorage(updatedProfiles);
      return { ...profileToUpdate, ...updatedData };
    },
    [state.profiles],
  );

  const loadProfiles = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    const profiles = loadProfilesFromStorage();

    if (profiles.length > 0) {
      dispatch({ type: 'SET_PROFILES', payload: profiles });
      const activeProfileId = loadActiveProfileFromStorage();

      // Set active profile if one exists and is still valid
      if (activeProfileId) {
        let profile = state.profiles.find((p) => p.id === profileId);

        // Check saved profile storage if not in current state
        if (!profile) {
          try {
            profile = profiles.find((p) => p.id === profileId);
          } catch {
            // Unable to set active profile
            dispatch({ type: 'SET_ACTIVE_PROFILE', payload: null });
          }
        }

        if (profile) {
          dispatch({ type: 'SET_ACTIVE_PROFILE', payload: profile });
        } else {
          // If active profile no longer exists, pick the first available one
          const refreshed = loadProfilesFromStorage();
          if (refreshed.length > 0) {
            profile = refreshed.find((p) => p.id === profileId);
            if (!profile) {
              const fallback = refreshed[0];
              dispatch({ type: 'SET_ACTIVE_PROFILE', payload: fallback });
            }
          }
        }
      }
    }
    dispatch({ type: 'SET_LOADING', payload: false });
  }, [state.profiles]);

  const setActiveProfile = useCallback(
    (profileId: ProfileId) => {
      // Find profile by ID
      const profile = state.profiles.find((p) => p.id === profileId);

      if (profile) {
        dispatch({ type: 'SET_ACTIVE_PROFILE', payload: profile });
        saveActiveProfileToStorage(profileId);
        return profile;
      }

      console.error(`Profile with id ${profileId} not found`);
      return null;
    },
    [state.profiles],
  );

  const clearActiveProfile = useCallback(() => {
    dispatch({ type: 'SET_ACTIVE_PROFILE', payload: null });
    saveActiveProfileToStorage(null);
  }, []);

  // Load initial profiles
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

// Public exports already defined above
