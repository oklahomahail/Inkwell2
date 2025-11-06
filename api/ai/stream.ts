// api/ai/stream.ts - Streaming Claude endpoint for AI Suggestion System
export const config = { runtime: 'edge' };

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// Simple rate limiting - in production, use Upstash Redis or similar
const requestCounts = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const limit = 20; // 20 requests per minute
  const window = 60 * 1000; // 1 minute

  const entry = requestCounts.get(ip);
  if (!entry || now > entry.resetAt) {
    requestCounts.set(ip, { count: 1, resetAt: now + window });
    return true;
  }

  if (entry.count >= limit) {
    return false;
  }

  entry.count++;
  return true;
}

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    // Basic rate limiting by IP
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    if (!checkRateLimit(ip)) {
      return new Response('Rate limit exceeded. Try again in a minute.', { status: 429 });
    }

    const { prompt, temperature, maxTokens } = await req.json();

    if (!prompt || typeof prompt !== 'string' || prompt.length > 10000) {
      return new Response('Invalid prompt', { status: 400 });
    }

    if (!ANTHROPIC_API_KEY) {
      return new Response('Claude API not configured on server', { status: 500 });
    }

    const body = {
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: Math.min(maxTokens ?? 800, 2000),
      temperature: temperature ?? 0.8,
      messages: [{ role: 'user', content: prompt }],
      stream: true,
    };

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Claude streaming error:', error);
      return new Response('Claude API error', { status: response.status });
    }

    // Return the streaming response with proper headers
    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (e: any) {
    console.error('Streaming error:', e);
    return new Response(`Streaming error: ${e?.message || 'unknown'}`, { status: 500 });
  }
}
