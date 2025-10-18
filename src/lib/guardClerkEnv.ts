// src/lib/guardClerkEnv.ts
/**
 * Runtime guard for Clerk environment variables.
 * Throws if VITE_CLERK_PUBLISHABLE_KEY is missing.
 * Warns if using test keys (expected on local/PR previews).
 *
 * Call once in AppProviders before rendering ClerkProvider.
 */
export function guardClerkEnv(): void {
  const pub = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined;

  if (!pub) {
    // Throw to fail loud in dev
    throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY - check your .env file');
  }

  if (pub.startsWith('pk_test_')) {
    console.warn('⚠ Clerk running with test keys (expected on local/PR previews).');
  } else if (pub.startsWith('pk_live_')) {
    console.log('✓ Clerk running with production keys');
  } else {
    console.warn(
      `⚠ Unexpected Clerk key format: ${pub.slice(0, 12)}... (expected pk_test_* or pk_live_*)`,
    );
  }
}
