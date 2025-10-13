// src/context/ProfileContext.tsx - Profile state management

import React, {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useCallback,
  useRef,
} from 'react';
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

function _profileReducer(state: ProfileState, action: ProfileAction): ProfileState {
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
function _saveProfilesToStorage(profiles: Profile[]) {
  try {
    const serializedProfiles = JSON.stringify(profiles);
    localStorage.setItem(PROFILES_KEY, serializedProfiles);
    return true;
  } catch (error) {
    console.error('Failed to save profiles to storage:', error);
    return false;
  }
}

function _loadProfilesFromStorage(): Profile[] {
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

function _saveActiveProfileToStorage(profileId: ProfileId | null) {
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

function _loadActiveProfileFromStorage(): ProfileId | null {
  try {
    return localStorage.getItem(ACTIVE_PROFILE_KEY);
  } catch (error) {
    console.error('Failed to load active profile from storage:', error);
    return null;
  }
}

// Context
const ProfileContext = createContext<ProfileContextType | null>(null);

export function _useProfileContext(): ProfileContextType {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfileContext must be used within a ProfileProvider');
  }
  return context;
}

// Alias for tutorial storage compatibility
export function _useProfile() {
  const context = _useProfileContext();
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

export function _ProfileProvider({ children }: ProfileProviderProps) {
  const [state, dispatch] = useReducer(_profileReducer, {
    profiles: [],
    activeProfile: null,
    isLoading: false,
    error: null,
  });

  // Keep a ref to the latest state to avoid stale closures in async callbacks
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Actions
  const createProfile = useCallback(
    async (name: string, options: Partial<Profile> = {}): Promise<Profile> => {
      dispatch({ type: 'SET_ERROR', payload: null });

      const trimmedName = name.trim();
      const currentProfiles = stateRef.current.profiles;

      // Check if profile already exists (idempotent)
      const existingProfile = currentProfiles.find(
        (p) => p.name.toLowerCase() === trimmedName.toLowerCase(),
      );

      if (existingProfile) {
        return existingProfile;
      }

      // Create new profile
      const now = new Date();
      const profile: Profile = {
        id: uuidv4(),
        name: trimmedName,
        displayName: options.displayName || trimmedName,
        createdAt: now,
        updatedAt: now,
        color: options.color || `hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)`,
        ...options,
      };

      // Update state and storage atomically
      const updatedProfiles = [...currentProfiles, profile];
      dispatch({ type: 'SET_PROFILES', payload: updatedProfiles });
      // Keep ref in sync immediately to avoid stale reads in same tick
      stateRef.current = { ...stateRef.current, profiles: updatedProfiles };
      _saveProfilesToStorage(updatedProfiles);

      // Ensure state is flushed before returning
      await Promise.resolve();
      return profile;
    },
    [state.profiles],
  );

  const deleteProfile = useCallback(
    async (profileId: ProfileId): Promise<void> => {
      dispatch({ type: 'SET_ERROR', payload: null });

      const current = stateRef.current;
      if (current.profiles.length <= 1) {
        throw new Error('Cannot delete the last profile');
      }

      const updatedProfiles = current.profiles.filter((p) => p.id !== profileId);
      dispatch({ type: 'DELETE_PROFILE', payload: profileId });
      // Update ref synchronously
      stateRef.current = {
        ...stateRef.current,
        profiles: updatedProfiles,
        activeProfile:
          stateRef.current.activeProfile?.id === profileId ? null : stateRef.current.activeProfile,
      };
      _saveProfilesToStorage(updatedProfiles);

      // Ensure state is flushed
      await Promise.resolve();

      // If we deleted the active profile, automatically switch to the first remaining profile
      const currentActive = stateRef.current.activeProfile;
      if (currentActive?.id === profileId && updatedProfiles.length > 0) {
        const fallbackProfile = updatedProfiles[0];
        dispatch({ type: 'SET_ACTIVE_PROFILE', payload: fallbackProfile });
        _saveActiveProfileToStorage(fallbackProfile.id);
      } else if (currentActive?.id === profileId) {
        // No remaining profiles (shouldn't happen due to guard above, but just in case)
        dispatch({ type: 'SET_ACTIVE_PROFILE', payload: null });
        _saveActiveProfileToStorage(null);
      }
    },
    [state.profiles, state.activeProfile],
  );

  const updateProfile = useCallback(
    async (profileId: ProfileId, updates: Partial<Profile>): Promise<Profile> => {
      dispatch({ type: 'SET_ERROR', payload: null });

      const current = stateRef.current;
      const profileToUpdate = current.profiles.find((p) => p.id === profileId);
      if (!profileToUpdate) {
        throw new Error('Profile not found');
      }

      const updatedData = { ...updates, updatedAt: new Date() };
      const updatedProfiles = current.profiles.map((p) =>
        p.id === profileId ? { ...p, ...updatedData } : p,
      );

      dispatch({ type: 'UPDATE_PROFILE', payload: { id: profileId, updates: updatedData } });
      // Update ref synchronously
      stateRef.current = {
        ...stateRef.current,
        profiles: updatedProfiles,
        activeProfile:
          stateRef.current.activeProfile?.id === profileId
            ? { ...stateRef.current.activeProfile, ...updatedData }
            : stateRef.current.activeProfile,
      };
      _saveProfilesToStorage(updatedProfiles);

      // Ensure state is flushed before returning
      await Promise.resolve();
      return { ...profileToUpdate, ...updatedData };
    },
    [state.profiles],
  );

  const loadProfiles = useCallback(async (): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const profiles = _loadProfilesFromStorage();

      // Only initialize profiles from storage if we don't already have profiles in memory
      if (stateRef.current.profiles.length === 0) {
        dispatch({ type: 'SET_PROFILES', payload: profiles });
      }

      // Load active profile
      const activeProfileId = _loadActiveProfileFromStorage();
      if (activeProfileId && profiles.length > 0) {
        const activeProfile = profiles.find((p) => p.id === activeProfileId);
        if (activeProfile) {
          // Only set if not already set
          if (
            !stateRef.current.activeProfile ||
            stateRef.current.activeProfile.id !== activeProfile.id
          ) {
            dispatch({ type: 'SET_ACTIVE_PROFILE', payload: activeProfile });
          }
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

  const setActiveProfile = useCallback(
    async (profileId: ProfileId): Promise<void> => {
      dispatch({ type: 'SET_ERROR', payload: null });

      // First try to find profile in memory
      let profile = stateRef.current.profiles.find((p) => p.id === profileId);

      // If not in memory, try to load from storage directly
      if (!profile) {
        try {
          const profiles = _loadProfilesFromStorage();
          profile = profiles.find((p) => p.id === profileId);

          // Keep memory in sync
          if (profiles.length > 0) {
            dispatch({ type: 'SET_PROFILES', payload: profiles });
          }
        } catch (error) {
          console.warn('Failed to load profile from storage:', error);
        }
      }

      // If still not found after storage check, try one more reload
      if (!profile) {
        console.warn('Profile not found, reloading and retrying:', profileId);
        await loadProfiles();
        // After reloading, select from latest state by id
        // Note: using functional update via dispatch keeps state in sync
        const refreshed = _loadProfilesFromStorage();
        profile = refreshed.find((p) => p.id === profileId);
      }

      if (profile) {
        dispatch({ type: 'SET_ACTIVE_PROFILE', payload: profile });
        _saveActiveProfileToStorage(profileId);
      } else {
        // As a last resort, don't throw - just log error
        console.error('Profile not found after reload attempts:', profileId);
      }
    },
    [state.profiles, loadProfiles],
  );

  const clearActiveProfile = useCallback(() => {
    dispatch({ type: 'SET_ACTIVE_PROFILE', payload: null });
    _saveActiveProfileToStorage(null);
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

// Public exports
export const ProfileProvider = _ProfileProvider;
export const useProfile = _useProfile;
export const useProfileContext = _useProfileContext;
