import { jwtVerify, createRemoteJWKSet } from 'jose';

const SUPABASE_URL = process.env.SUPABASE_URL;

if (!SUPABASE_URL) {
  throw new Error('SUPABASE_URL environment variable is required for JWT verification');
}

// Create JWKS endpoint for token verification
const JWKS = createRemoteJWKSet(new URL(`${SUPABASE_URL}/auth/v1/keys`));

export interface SupabaseUser {
  sub: string; // User ID (UUID)
  email?: string;
  email_verified?: boolean;
  phone?: string;
  role?: string;
  aal?: string;
  session_id?: string;
  [key: string]: unknown;
}

/**
 * Verify Supabase JWT token from Authorization header
 *
 * @param authorization - The Authorization header value (e.g., "Bearer <token>")
 * @returns User payload if valid, null if invalid or missing
 *
 * @example
 * ```ts
 * import { verifyAuth } from './auth/verifySupabaseJwt';
 *
 * export default async function handler(req: VercelRequest, res: VercelResponse) {
 *   const user = await verifyAuth(req.headers.authorization);
 *   if (!user) return res.status(401).json({ error: 'Unauthorized' });
 *
 *   // Safe to use user.sub (UUID) and user.email
 *   return res.json({ userId: user.sub, email: user.email });
 * }
 * ```
 */
export async function verifyAuth(authorization?: string): Promise<SupabaseUser | null> {
  if (!authorization?.startsWith('Bearer ')) {
    return null;
  }

  const token = authorization.slice(7); // Remove "Bearer " prefix

  try {
    const { payload } = await jwtVerify(token, JWKS, {
      // Optional: Add audience/issuer checks for additional security
      // audience: 'authenticated',
      // issuer: `${SUPABASE_URL}/auth/v1`,
    });

    return payload as SupabaseUser;
  } catch (error) {
    // Token is invalid, expired, or malformed
    console.warn(
      '[Auth] JWT verification failed:',
      error instanceof Error ? error.message : 'Unknown error',
    );
    return null;
  }
}

/**
 * Verify token and throw error if invalid (useful for required auth)
 *
 * @throws {Error} If token is missing or invalid
 */
export async function requireAuth(authorization?: string): Promise<SupabaseUser> {
  const user = await verifyAuth(authorization);
  if (!user) {
    throw new Error('Authentication required');
  }
  return user;
}
