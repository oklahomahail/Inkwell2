export const config = { runtime: 'edge' };

const PROVIDER = process.env.AI_SIMPLE_PROVIDER || 'anthropic';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

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
  // Only allow POST
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    // Basic rate limiting by IP
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    if (!checkRateLimit(ip)) {
      return new Response('Rate limit exceeded. Try again in a minute.', { status: 429 });
    }

    const { provider, model, system, prompt, temperature, maxTokens } = await req.json();

    if (!prompt || typeof prompt !== 'string' || prompt.length > 5000) {
      return new Response('Invalid prompt', { status: 400 });
    }

    const useProvider = provider || PROVIDER;

    if (useProvider === 'anthropic') {
      if (!ANTHROPIC_API_KEY) {
        return new Response('Anthropic not configured on server', { status: 500 });
      }
      const body = {
        model: model || 'claude-3-5-sonnet-20241022',
        system: system || undefined,
        max_tokens: Math.min(maxTokens ?? 500, 1000), // Cap tokens in simple mode
        temperature: temperature ?? 0.6,
        messages: [{ role: 'user', content: prompt }],
      };
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        const error = await r.text();
        console.error('Anthropic upstream error:', error);
        return new Response('Anthropic upstream error', { status: r.status });
      }
      const j = await r.json();
      const text = j.content?.[0]?.text ?? '';
      return Response.json({ text });
    }

    if (useProvider === 'openai') {
      if (!OPENAI_API_KEY) {
        return new Response('OpenAI not configured on server', { status: 500 });
      }
      const body = {
        model: model || 'gpt-4o-mini',
        messages: [
          system ? { role: 'system', content: system } : null,
          { role: 'user', content: prompt },
        ].filter(Boolean),
        temperature: temperature ?? 0.6,
        max_tokens: Math.min(maxTokens ?? 500, 1000),
      };
      const r = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        const error = await r.text();
        console.error('OpenAI upstream error:', error);
        return new Response('OpenAI upstream error', { status: r.status });
      }
      const j = await r.json();
      const text = j.choices?.[0]?.message?.content ?? '';
      return Response.json({ text });
    }

    if (useProvider === 'google') {
      if (!GOOGLE_API_KEY) {
        return new Response('Google not configured on server', { status: 500 });
      }
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model || 'gemini-1.5-flash'}:generateContent?key=${GOOGLE_API_KEY}`;
      const body = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: temperature ?? 0.6,
          maxOutputTokens: Math.min(maxTokens ?? 500, 1000),
        },
        systemInstruction: system ? { parts: [{ text: system }] } : undefined,
      };
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        const error = await r.text();
        console.error('Google upstream error:', error);
        return new Response('Google upstream error', { status: r.status });
      }
      const j = await r.json();
      const text = j.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('') ?? '';
      return Response.json({ text });
    }

    return new Response('Invalid provider', { status: 400 });
  } catch (e: any) {
    console.error('AI proxy error:', e);
    return new Response(`AI proxy error: ${e?.message || 'unknown'}`, { status: 500 });
  }
}
