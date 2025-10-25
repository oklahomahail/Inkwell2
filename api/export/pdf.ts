import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).end('Method Not Allowed');
  }

  try {
    const { html, meta } = req.body as { html?: string; meta?: { filename?: string } };

    if (!html || typeof html !== 'string') {
      return res.status(400).json({ error: 'Missing html' });
    }

    // Security: cap HTML size at 10MB
    if (html.length > 10 * 1024 * 1024) {
      return res.status(413).json({ error: 'HTML payload too large' });
    }

    const execPath = await chromium.executablePath();
    const browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: execPath,
      headless: chromium.headless,
      defaultViewport: { width: 1200, height: 800, deviceScaleFactor: 2 },
    });

    const page = await browser.newPage();

    // Security: only load inline content, no external resources
    await page.setContent(html, { waitUntil: 'load' });

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0.6in', right: '0.6in', bottom: '0.6in', left: '0.6in' },
    });

    await browser.close();

    const filename = (meta?.filename || 'export.pdf').replace(/[^a-z0-9_\-\.]+/gi, '_');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).end(Buffer.from(pdf));
  } catch (e: unknown) {
    console.error(e);
    res.status(500).json({ error: 'Failed to render PDF' });
  }
}
