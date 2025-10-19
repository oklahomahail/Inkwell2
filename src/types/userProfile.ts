/**
 * Supabase User Profile Types
 *
 * These types mirror the public.profiles table in Supabase.
 * Profiles are automatically created via database trigger when a user signs up.
 *
 * NOTE: This is different from src/types/profile.ts which represents
 * local app "profiles" (like Firefox profiles for different writing projects).
 * This file represents the authenticated user's account profile.
 */

export interface UserProfile {
  id: string; // UUID - references auth.users(id)
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  timezone: string; // Defaults to 'UTC'
  onboarding_completed: boolean; // Whether user has completed initial onboarding
  created_at: string; // ISO 8601 timestamp
  updated_at: string; // ISO 8601 timestamp
}

export interface UserProfileUpdate {
  display_name?: string;
  avatar_url?: string;
  timezone?: string;
  onboarding_completed?: boolean;
}

export interface OnboardingFormData {
  display_name: string;
  timezone?: string;
}
