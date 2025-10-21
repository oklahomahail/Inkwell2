// src/lib/tourEligibility.ts
import { supabase } from './supabaseClient';

/**
 * Determines if a user should start the tour
 *
 * This is based on the user's tour completion status
 * and any other eligibility criteria
 */
export async function shouldStartTourForUser(userId: string): Promise<boolean> {
  if (!userId) return false;

  try {
    // First check local storage to avoid querying Supabase unnecessarily
    const localTourCompleted = localStorage.getItem('inkwell:tourCompleted');
    if (localTourCompleted === 'true') return false;

    // Then check user metadata
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    // Check if tour has been completed already in user metadata
    if (user.user_metadata?.tourCompleted) {
      // Update local storage to match
      localStorage.setItem('inkwell:tourCompleted', 'true');
      return false;
    }

    // If this is a new user, they're eligible for the tour
    // You can add additional conditions here based on your requirements
    return true;
  } catch (error) {
    console.error('Error checking tour eligibility:', error);
    return false;
  }
}
