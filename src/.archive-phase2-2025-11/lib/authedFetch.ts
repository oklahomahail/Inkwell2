import { supabase } from './supabaseClient';

/**
 * Authenticated fetch wrapper that automatically includes Supabase auth token
 * Use this for all API calls that require authentication
 *
 * @example
 * const response = await authedFetch('/api/projects', {
 *   method: 'POST',
 *   body: JSON.stringify({ name: 'My Project' }),
 * });
 */
export async function authedFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;

  return fetch(input, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: 'include',
  });
}
