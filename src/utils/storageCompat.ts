// Storage key compatibility layer for migration to new key format
import devLog from "@/utils/devLog";

import { getLocalStorage } from './storageAccess';

// Project storage keys
const PROJECTS_KEY_V2 = 'inkwell:projects';
const PROJECTS_KEY_V1 = 'inkwell_projects';
const CURRENT_ID_KEY_V2 = 'inkwell:currentProjectId';
const CURRENT_ID_KEY_V1 = 'inkwell_current_project_id';

// Profile storage keys
const PROFILES_KEY_V2 = 'inkwell:profiles';
const PROFILES_KEY_V1 = 'inkwell_profiles';
const ACTIVE_PROFILE_KEY_V2 = 'inkwell:active_profile';
const ACTIVE_PROFILE_KEY_V1 = 'inkwell_active_profile';

// Project storage functions
export function readProjectsFromStorage(ls: Storage = getLocalStorage()) {
  const raw = ls.getItem(PROJECTS_KEY_V2) ?? ls.getItem(PROJECTS_KEY_V1);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch (e) {
    devLog.error('Failed to parse projects from localStorage:', e);
    return [];
  }
}

export function writeProjectsToStorage(projects: any[], ls: Storage = getLocalStorage()) {
  const serialized = JSON.stringify(projects);
  try {
    ls.setItem(PROJECTS_KEY_V2, serialized);
    ls.setItem(PROJECTS_KEY_V1, serialized); // keep legacy key for tests/back-compat
  } catch (e) {
    devLog.error('Failed to save projects to storage:', e);
  }
}

export function readCurrentProjectId(ls: Storage = getLocalStorage()) {
  return ls.getItem(CURRENT_ID_KEY_V2) ?? ls.getItem(CURRENT_ID_KEY_V1) ?? null;
}

export function writeCurrentProjectId(id: string | null, ls: Storage = getLocalStorage()) {
  try {
    if (id == null) {
      ls.removeItem(CURRENT_ID_KEY_V2);
      ls.removeItem(CURRENT_ID_KEY_V1);
    } else {
      ls.setItem(CURRENT_ID_KEY_V2, id);
      ls.setItem(CURRENT_ID_KEY_V1, id);
    }
  } catch (e) {
    devLog.error('Failed to save current project ID to storage:', e);
  }
}

// Profile storage functions
export function readProfilesFromStorage(ls: Storage = getLocalStorage()) {
  const raw = ls.getItem(PROFILES_KEY_V2) ?? ls.getItem(PROFILES_KEY_V1);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch (e) {
    devLog.error('Failed to load profiles from storage:', e);
    return [];
  }
}

export function writeProfilesToStorage(profiles: any[], ls: Storage = getLocalStorage()) {
  try {
    const s = JSON.stringify(profiles);
    ls.setItem(PROFILES_KEY_V2, s);
    ls.setItem(PROFILES_KEY_V1, s);
  } catch (e) {
    devLog.error('Failed to save profiles to storage:', e);
  }
}

export function readActiveProfileId(ls: Storage = getLocalStorage()) {
  return ls.getItem(ACTIVE_PROFILE_KEY_V2) ?? ls.getItem(ACTIVE_PROFILE_KEY_V1) ?? null;
}

export function writeActiveProfileId(id: string | null, ls: Storage = getLocalStorage()) {
  try {
    if (id == null) {
      ls.removeItem(ACTIVE_PROFILE_KEY_V2);
      ls.removeItem(ACTIVE_PROFILE_KEY_V1);
    } else {
      ls.setItem(ACTIVE_PROFILE_KEY_V2, id);
      ls.setItem(ACTIVE_PROFILE_KEY_V1, id);
    }
  } catch (e) {
    devLog.error('Failed to save active profile ID to storage:', e);
  }
}
