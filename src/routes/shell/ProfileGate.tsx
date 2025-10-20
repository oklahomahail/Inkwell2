// src/routes/shell/ProfileGate.tsx - Guards app shell to ensure valid profile

import React, { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';

import { useProfile } from '../../context/ProfileContext';

interface ProfileGateProps {
  children: React.ReactNode;
}

/**
 * ProfileGate ensures that:
 * 1. A valid profile ID is present in the URL
 * 2. The profile exists in the system
 * 3. The profile is set as active
 * 4. Forces remount when profile changes to prevent stale DB connections
 *
 * If any condition fails, redirects to profile picker
 */
function ProfileGate({ children }: ProfileGateProps) {
  const { profileId } = useParams<{ profileId: string }>();
  const { profiles, activeProfile, setActiveProfile } = useProfile();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Wait for profiles to load from localStorage (one tick)
    // This prevents accessing services before the profile system is ready
    const timer = setTimeout(() => {
      try {
        setReady(true);
      } catch (error) {
        console.error('Error during ProfileGate initialization:', error);
        setReady(true); // Still proceed to avoid blocking
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!profileId || !ready) return;

    const foundProfile = profiles.find((p) => p.id === profileId);
    if (foundProfile && (!activeProfile || activeProfile.id !== foundProfile.id)) {
      setActiveProfile(profileId).catch((error) => {
        console.error('Failed to set active profile:', error);
      });
    }
  }, [profileId, profiles, activeProfile?.id, setActiveProfile, ready]);

  // Still resolving profile list / active profile
  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing...</p>
        </div>
      </div>
    );
  }

  // No profile ID in URL
  if (!profileId) {
    return <Navigate to="/profiles" replace />;
  }

  // Profile doesn't exist
  const profileExists = profiles.some((p) => p.id === profileId);
  if (!profileExists) {
    console.warn(`Profile ${profileId} not found, redirecting to profile picker`);
    return <Navigate to="/profiles" replace />;
  }

  // Profile not yet active
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

  // Key children so the app fully remounts when profile changes
  return <div key={activeProfile.id}>{children}</div>;
}

export { ProfileGate };
