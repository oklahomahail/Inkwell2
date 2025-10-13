// src/routes/profile/ProfilePage.tsx
import React, { useEffect } from 'react';

import ManageProfiles from '@/components/Profile/ManageProfiles';
import ProfileHeader from '@/components/Profile/ProfileHeader';
import { useProfile } from '@/context/ProfileContext';
import type { Profile } from '@/types/profile';

export function ProfilePage() {
  // Set suppression immediately when component loads (before useEffect)
  React.useMemo(() => {
    sessionStorage.setItem('inkwell:tour:suppress', 'profiles');
  }, []);

  useEffect(() => {
    // Ensure suppression is maintained during component lifecycle
    sessionStorage.setItem('inkwell:tour:suppress', 'profiles');
    return () => sessionStorage.removeItem('inkwell:tour:suppress');
  }, []);

  const { activeProfile } = useProfile();

  const handleProfileSwitch = (profile: Profile) => {
    console.log('Switched to profile:', profile.name);
    // You can add any additional logic here when a profile is switched
  };

  const handleProfileDelete = (profileId: string) => {
    console.log('Profile deleted:', profileId);
    // You can add any additional logic here when a profile is deleted
  };

  const handleTaglineClick = () => {
    // Navigate to features page or show features modal
    console.log('Features tagline clicked');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Branded header */}
        <ProfileHeader onTaglineClick={handleTaglineClick} />

        {/* Welcome section */}
        {activeProfile && (
          <section className="rounded-2xl border p-4 md:p-6 bg-white">
            <div className="flex items-center gap-3 mb-2">
              <div
                className="w-4 h-4 rounded-full border border-gray-200"
                style={{ backgroundColor: activeProfile.color || '#6b7280' }}
              />
              <h2 className="text-xl font-semibold text-gray-900">
                Welcome, {activeProfile.displayName || activeProfile.name}!
              </h2>
            </div>
            <p className="text-gray-600">
              Manage your profiles and settings below. Switch between different profiles to organize
              your writing projects and preferences.
            </p>
          </section>
        )}

        {/* Profile management */}
        <ManageProfiles
          onProfileSwitch={handleProfileSwitch}
          onProfileDelete={handleProfileDelete}
        />

        {/* Additional settings section - placeholder for future functionality */}
        <section className="rounded-2xl border p-4 md:p-6 bg-white">
          <h2 className="text-lg font-medium mb-2">Settings</h2>
          <p className="text-sm text-neutral-600 mb-4">
            Profile-specific preferences and application settings.
          </p>
          <div className="text-neutral-500 text-sm italic">
            Additional profile settings will be added here in future updates.
          </div>
        </section>
      </div>
    </div>
  );
}
