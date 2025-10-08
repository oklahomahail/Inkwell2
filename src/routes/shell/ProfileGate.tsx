// src/routes/shell/ProfileGate.tsx - Guards app shell to ensure valid profile

import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { useProfileContext } from '../../context/ProfileContext';

interface ProfileGateProps {
  children: React.ReactNode;
}

/**
 * ProfileGate ensures that:
 * 1. A valid profile ID is present in the URL
 * 2. The profile exists in the system
 * 3. The profile is set as active
 *
 * If any condition fails, redirects to profile picker
 */
export function ProfileGate({ children }: ProfileGateProps) {
  const { profileId } = useParams<{ profileId: string }>();
  const navigate = useNavigate();
  const { profiles, activeProfile, isLoading, setActiveProfile } = useProfileContext();

  useEffect(() => {
    if (isLoading) return;

    // No profile ID in URL - redirect to profile picker
    if (!profileId) {
      navigate('/profiles', { replace: true });
      return;
    }

    // Check if profile exists
    const profile = profiles.find((p) => p.id === profileId);
    if (!profile) {
      console.warn(`Profile ${profileId} not found, redirecting to profile picker`);
      navigate('/profiles', { replace: true });
      return;
    }

    // Profile exists but is not active - set it as active
    if (!activeProfile || activeProfile.id !== profileId) {
      setActiveProfile(profileId).catch((error) => {
        console.error('Failed to set active profile:', error);
        navigate('/profiles', { replace: true });
      });
    }
  }, [profileId, profiles, activeProfile, isLoading, setActiveProfile, navigate]);

  // Show loading while profiles are being loaded
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profiles...</p>
        </div>
      </div>
    );
  }

  // Show loading while setting active profile
  if (!activeProfile || activeProfile.id !== profileId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Switching to profile...</p>
        </div>
      </div>
    );
  }

  // All checks passed - render children
  return <>{children}</>;
}
