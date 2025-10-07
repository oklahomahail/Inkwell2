// api/login.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { code } = req.body || {};
  if (!code || typeof code !== 'string') {
    return res.status(400).json({ ok: false, error: 'Missing code' });
  }

  if (!process.env.ACCESS_CODE) {
    return res.status(500).json({ ok: false, error: 'Server not configured' });
  }

  if (code !== process.env.ACCESS_CODE) {
    return res.status(401).json({ ok: false, error: 'Invalid code' });
  }

  const cookie = [
    'inkwell_auth=ok',
    'Path=/',
    'HttpOnly',
    'Secure',
    'SameSite=Strict',
    `Max-Age=${60 * 60 * 24 * 7}`, // 7 days
  ].join('; ');

  res.setHeader('Set-Cookie', cookie);
  return res.status(200).json({ ok: true });
}
