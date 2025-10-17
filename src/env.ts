/**
 * Environment variables validation
 *
 * This file provides runtime validation for required environment variables
 * and exports a typed env object for use throughout the application.
 */

// Required environment variables - app will not start without these
const required = ['VITE_CLERK_PUBLISHABLE_KEY', 'VITE_BASE_URL'] as const;

// Validate all required environment variables are present
for (const key of required) {
  if (!import.meta.env[key]) {
    throw new Error(
      `Missing ${key} in environment variables. See .env.example for required variables.`,
    );
  }
}

// Export typed environment variables
export const env = { ...import.meta.env };
