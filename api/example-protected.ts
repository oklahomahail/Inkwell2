import { verifyAuth } from './auth/verifySupabaseJwt';

import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Example protected API endpoint
 *
 * To test:
 * ```bash
 * curl https://your-domain.com/api/example-protected \
 *   -H "Authorization: Bearer <your-supabase-token>"
 * ```
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Verify authentication
  const user = await verifyAuth(req.headers.authorization as string | undefined);

  if (!user) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Valid authentication token required',
    });
  }

  // User is authenticated - safe to proceed
  return res.status(200).json({
    ok: true,
    message: 'Successfully authenticated',
    user: {
      id: user.sub,
      email: user.email,
      emailVerified: user.email_verified,
    },
  });
}
