// src/components/ProfileSwitcher.tsx - Profile switching component

import { ChevronDown, User, Plus, Settings } from 'lucide-react';
import React, { useState } from 'react';

import {} from 'react-router-dom';
import { useGo } from '@/utils/navigate';

import { useProfileContext } from '../context/ProfileContext';
import { Profile } from '../types/profile';

interface ProfileSwitcherProps {
  className?: string;
}

// Export a properly-named React component
function ProfileSwitcher({ className = '' }: ProfileSwitcherProps) {
  const go = useGo();
  const { profiles, activeProfile, setActiveProfile } = useProfileContext();
  const [isOpen, setIsOpen] = useState(false);

  const handleProfileSwitch = async (profile: Profile) => {
    try {
      await setActiveProfile(profile.id);
      go(`/p/${profile.id}/dashboard`);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to switch profile:', error);
      // Could show a toast notification here
    }
  };

  const handleCreateProfile = () => {
    go('/profiles');
    setIsOpen(false);
  };

  const handleManageProfiles = () => {
    // Could navigate to a profile management page in the future
    go('/profiles');
    setIsOpen(false);
  };

  // Helper to format dates that might be strings or Date objects
  const formatDate = (date: string | Date): string => {
    try {
      if (typeof date === 'string') {
        return new Date(date).toLocaleDateString();
      }
      return date.toLocaleDateString();
    } catch (error) {
      return 'Invalid date';
    }
  };

  if (!activeProfile) {
    return null;
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
          style={{ backgroundColor: activeProfile.color || '#6B7280' }}
        >
          {activeProfile.avatar ? (
            <img src={activeProfile.avatar} alt="" className="w-6 h-6 rounded-full" />
          ) : (
            activeProfile.displayName?.[0]?.toUpperCase() ||
            activeProfile.name[0]?.toUpperCase() ||
            '?'
          )}
        </div>
        <span className="font-medium text-gray-900 max-w-32 truncate">
          {activeProfile.displayName || activeProfile.name}
        </span>
        <ChevronDown
          size={16}
          className={`text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />

          {/* Dropdown */}
          <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
            <div className="p-2">
              {/* Current Profile Info */}
              <div className="px-3 py-2 border-b border-gray-100 mb-2">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                    style={{ backgroundColor: activeProfile.color || '#6B7280' }}
                  >
                    {activeProfile.avatar ? (
                      <img src={activeProfile.avatar} alt="" className="w-8 h-8 rounded-full" />
                    ) : (
                      <User size={20} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 truncate">
                      {activeProfile.displayName || activeProfile.name}
                    </p>
                    <p className="text-sm text-gray-500">Current profile</p>
                  </div>
                </div>
              </div>

              {/* Other Profiles */}
              {profiles.length > 1 && (
                <div className="mb-2">
                  <p className="px-3 py-1 text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Switch to
                  </p>
                  {profiles
                    .filter((p) => p.id !== activeProfile.id)
                    .map((profile) => (
                      <button
                        key={profile.id}
                        onClick={() => handleProfileSwitch(profile)}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-50 transition-colors text-left"
                      >
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm"
                          style={{ backgroundColor: profile.color || '#6B7280' }}
                        >
                          {profile.avatar ? (
                            <img src={profile.avatar} alt="" className="w-6 h-6 rounded-full" />
                          ) : (
                            profile.displayName?.[0]?.toUpperCase() ||
                            profile.name[0]?.toUpperCase() ||
                            '?'
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900 truncate">
                            {profile.displayName || profile.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            Created {formatDate(profile.createdAt)}
                          </p>
                        </div>
                      </button>
                    ))}
                </div>
              )}

              {/* Actions */}
              <div className="border-t border-gray-100 pt-2">
                <button
                  onClick={handleCreateProfile}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-50 transition-colors text-left"
                >
                  <Plus size={16} className="text-gray-500" />
                  <span className="text-sm text-gray-700">Create new profile</span>
                </button>

                <button
                  onClick={handleManageProfiles}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-50 transition-colors text-left"
                >
                  <Settings size={16} className="text-gray-500" />
                  <span className="text-sm text-gray-700">Manage profiles</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Export the component
export { ProfileSwitcher };
