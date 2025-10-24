// src/routes/shell/ProfilePicker.tsx - Profile creation and selection

import { Plus, User, Palette } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

import {
  getRememberedProfileId,
  rememberProfileId,
  syncLastProfileToUserMetadata,
} from '@/lib/profileMemory';
import { resolvePostAuthRoute } from '@/lib/resolvePostAuth';
import { supabase } from '@/lib/supabaseClient';
import { shouldStartTourForUser } from '@/lib/tourEligibility';
import { cn } from '@/utils';
import { useGo } from '@/utils/navigate';

import { BRAND_NAME, TAGLINE_PRIMARY } from '../../constants/brand';
import { useProfileContext } from '../../context/ProfileContext';
import { Profile } from '../../types/profile';

const PRESET_COLORS = [
  '#3B82F6', // blue
  '#EF4444', // red
  '#10B981', // green
  '#F59E0B', // amber
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#84CC16', // lime
];

function ProfilePicker() {
  const go = useGo();
  const [searchParams] = useSearchParams();
  const { profiles, createProfile, setActiveProfile, isLoading, error, loadProfiles } =
    useProfileContext();
  const [isCreating, setIsCreating] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  // Check for auto-resolution when view=dashboard is in the URL
  useEffect(() => {
    // Only run this logic when view=dashboard is specified
    if (searchParams.get('view') === 'dashboard') {
      const autoResolveProfile = async () => {
        try {
          // Make sure profiles are loaded
          await loadProfiles();

          // Check if there are any profiles to work with
          if (profiles.length === 0) {
            // No profiles, we need to stay on the picker page
            return;
          }

          // Get user session to check tour eligibility
          const {
            data: { user },
          } = await supabase.auth.getUser();
          const shouldStartTour = await shouldStartTourForUser(user?.id || '');

          // Get remembered profile ID
          const rememberedProfileId = getRememberedProfileId();

          // Resolve where to send the user
          const { path, profileId } = resolvePostAuthRoute(profiles, rememberedProfileId, {
            shouldStartTour,
          });

          // If a profile was resolved, remember it and navigate
          if (profileId) {
            rememberProfileId(profileId);
            await syncLastProfileToUserMetadata(profileId);
            await setActiveProfile(profileId);

            // Navigate to dashboard (no longer using profile-based paths)
            console.log(`[ProfilePicker] Auto-resolving to dashboard`);
            go('/dashboard', { replace: true });
          }
        } catch (error) {
          console.error('[ProfilePicker] Error auto-resolving profile:', error);
        }
      };

      autoResolveProfile();
    }
  }, [searchParams, profiles, loadProfiles, go, setActiveProfile]);

  const handleSelectProfile = async (profile: Profile) => {
    try {
      // Save the profile selection for future auto-resolution
      rememberProfileId(profile.id);
      await syncLastProfileToUserMetadata(profile.id);

      await setActiveProfile(profile.id);
      go('/dashboard');
    } catch (error) {
      console.error('Failed to select profile:', error);
      setFormError('Failed to select profile. Please try again.');
    }
  };

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pending) return; // Prevent double submission

    const name = newProfileName.trim();

    if (!name) {
      setFormError('Profile name is required');
      return;
    }

    setPending(true);
    setFormError(null);

    try {
      // Check if profile already exists - if so, use it instead of creating
      const existingProfile = profiles.find((p) => p.name.toLowerCase() === name.toLowerCase());

      let profile: Profile;
      if (existingProfile) {
        profile = existingProfile;
        console.log('Using existing profile:', profile.name);
      } else {
        profile = await createProfile(name, {
          color: selectedColor,
          displayName: name,
        });
      }

      // If create/find succeeded, try to activate. Don't show create error if this fails
      try {
        await setActiveProfile(profile.id);
        go('/dashboard');
      } catch (activationError) {
        console.warn('Profile created/found but failed to set active:', activationError);
        // Still navigate - the profile exists, activation can be retried
        go('/dashboard');
      }
    } catch (error: any) {
      console.error('Failed to create profile:', error);

      // Handle "already exists" as success if we missed it in the check above
      if (error?.code === 'PROFILE_EXISTS' || /exists/i.test(error?.message ?? '')) {
        const existingProfile = profiles.find((p) => p.name.toLowerCase() === name.toLowerCase());
        if (existingProfile) {
          try {
            await setActiveProfile(existingProfile.id);
            go('/dashboard');
            return;
          } catch (activationError) {
            console.warn('Found existing profile but failed to activate:', activationError);
          }
        }
      }

      setFormError('Failed to create profile. Please try again.');
    } finally {
      setPending(false);
    }
  };

  const resetForm = () => {
    setNewProfileName('');
    setSelectedColor(PRESET_COLORS[0]);
    setFormError(null);
    setPending(false);
    setIsCreating(false);
  };

  // Clear form error when profiles list changes (successful creation)
  useEffect(() => {
    if (profiles.length > 0) {
      setFormError(null);
    }
  }, [profiles.length]);

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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Brand header */}
        <section
          className={cn(
            'relative overflow-hidden rounded-2xl border mb-8',
            'border-zinc-200 bg-white',
          )}
        >
          <div
            className="absolute inset-0 pointer-events-none opacity-70"
            aria-hidden="true"
            style={{
              background:
                'radial-gradient(1200px 350px at 10% -10%, rgba(234, 179, 8, 0.08), transparent 60%),' + // gold glow
                'radial-gradient(800px 250px at 90% 0%, rgba(37, 99, 235, 0.08), transparent 60%)', // blue glow
            }}
          />
          <div className="relative z-10 flex flex-col gap-4 p-8 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              {/* Feather mark */}
              <FeatherMark className="h-12 w-12 shrink-0" />
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
                  {BRAND_NAME}
                </h1>
                <p className="text-zinc-600">{TAGLINE_PRIMARY}</p>
              </div>
            </div>
            <div className="mt-4 md:mt-0">
              <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                {TAGLINE_PRIMARY}
              </span>
            </div>
          </div>
        </section>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {formError && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
            <p className="text-red-800 text-sm">{formError}</p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6">
          {/* Existing Profiles */}
          {profiles.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Select Profile</h2>
              <div className="space-y-2">
                {profiles.map((profile) => (
                  <button
                    key={profile.id}
                    onClick={() => handleSelectProfile(profile)}
                    className="w-full flex items-center p-3 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white mr-3"
                      style={{ backgroundColor: profile.color || '#6B7280' }}
                    >
                      {profile.avatar ? (
                        <img src={profile.avatar} alt="" className="w-8 h-8 rounded-full" />
                      ) : (
                        <User size={20} />
                      )}
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">
                        {profile.displayName || profile.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        Created {formatDate(profile.createdAt)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Create New Profile */}
          {!isCreating ? (
            <button
              onClick={() => setIsCreating(true)}
              className="w-full flex items-center justify-center p-3 border-2 border-dashed border-gray-300 rounded-md hover:border-blue-400 hover:bg-blue-50 transition-colors"
            >
              <Plus size={20} className="mr-2 text-gray-400" />
              <span className="text-gray-600">Create New Profile</span>
            </button>
          ) : (
            <form onSubmit={handleCreateProfile} className="space-y-4">
              <div>
                <label
                  htmlFor="profileName"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Profile Name
                </label>
                <input
                  type="text"
                  id="profileName"
                  value={newProfileName}
                  onChange={(e) => setNewProfileName(e.target.value)}
                  placeholder="Enter profile name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Palette size={16} className="inline mr-1" />
                  Profile Color
                </label>
                <div className="flex gap-2">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      className={`w-8 h-8 rounded-full border-2 ${
                        selectedColor === color ? 'border-gray-400' : 'border-gray-200'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={pending}
                  aria-busy={pending}
                  className={`flex-1 py-2 px-4 rounded-md transition-colors ${
                    pending
                      ? 'bg-blue-400 text-blue-100 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {pending ? 'Creating…' : 'Create Profile'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        {profiles.length === 0 && !isCreating && (
          <div className="text-center mt-6">
            <p className="text-gray-500 text-sm">
              You haven't created any profiles yet. Click above to create your first profile.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function FeatherMark(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 64 64" {...props}>
      <defs>
        <linearGradient id="g" x1="0" x2="1">
          <stop offset="0" stopColor="#facc15" />
          <stop offset="1" stopColor="#eab308" />
        </linearGradient>
      </defs>
      <path
        d="M50 6c-9 2-18 9-26 18C16 33 9 43 8 50c7-1 17-8 26-16C43 25 50 16 52 8l2-8-4 6z"
        fill="url(#g)"
      />
      <path
        d="M12 52c10-2 22-10 32-20"
        stroke="#a16207"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

export { ProfilePicker };
