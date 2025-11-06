import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Telemetry endpoint for tracking client-side events
 * Handles session starts, autosave metrics, export events, etc.
 *
 * Events are logged to Vercel's stdout and can be viewed in deployment logs.
 * Future enhancement: integrate with analytics platform (PostHog, Mixpanel, etc.)
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const body = req.body;

    // Basic validation
    if (!body || typeof body !== 'object') {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    // Validate required fields
    const { event, ts, sessionId } = body;
    if (!event || typeof event !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid event field' });
    }

    // Log telemetry event (visible in Vercel logs)
    // Note: Using console.warn for ESLint compliance (only warn/error allowed)
    console.warn(
      '[Telemetry]',
      JSON.stringify({
        event,
        ts,
        sessionId,
        timestamp: new Date().toISOString(),
        // Include other payload fields
        ...body,
      }),
    );

    // Return success
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('[Telemetry] Error processing event:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
