import { useState } from 'react';

import { profileService } from '@/services/ProfileService';

export function useProfileActions() {
  const [busy, setBusy] = useState(false);

  const createProfile = async () => {
    setBusy(true);
    try {
      await profileService.createProfile();
    } finally {
      setBusy(false);
    }
  };

  const updateProfile = async () => {
    setBusy(true);
    try {
      await profileService.updateProfile();
    } finally {
      setBusy(false);
    }
  };

  const deleteProfile = async (id: string) => {
    setBusy(true);
    try {
      await profileService.deleteProfile(id);
    } finally {
      setBusy(false);
    }
  };

  const archiveProfile = async (id: string) => {
    setBusy(true);
    try {
      await profileService.archiveProfile(id);
    } finally {
      setBusy(false);
    }
  };

  return {
    busy,
    createProfile,
    updateProfile,
    deleteProfile,
    archiveProfile,
  };
}
