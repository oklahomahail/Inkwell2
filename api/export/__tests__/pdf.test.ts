/**
 * E2E test for PDF export API
 * Tests the /api/export/pdf endpoint with fixture HTML
 */

import { describe, it, expect } from 'vitest';

describe('PDF Export API', () => {
  const API_URL = process.env.VITE_API_URL || 'http://localhost:3000';
  const ENDPOINT = `${API_URL}/api/export/pdf`;

  // Small fixture HTML for testing
  const FIXTURE_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Test Document</title>
  <style>
    body { font-family: Georgia, serif; font-size: 12pt; line-height: 1.5; }
    h1 { font-size: 20pt; margin-bottom: 12pt; }
    p { margin-bottom: 10pt; }
  </style>
</head>
<body>
  <h1>Test Chapter</h1>
  <p>This is a test paragraph for PDF generation.</p>
  <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
</body>
</html>
  `.trim();

  it('should return PDF with correct Content-Type', async () => {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        html: FIXTURE_HTML,
        meta: { filename: 'test-export.pdf' },
      }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('application/pdf');
  });

  it('should return PDF with Content-Length > 1000 bytes', async () => {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        html: FIXTURE_HTML,
        meta: { filename: 'test-export.pdf' },
      }),
    });

    const contentLength = response.headers.get('content-length');
    expect(contentLength).toBeTruthy();
    expect(parseInt(contentLength || '0', 10)).toBeGreaterThan(1000);
  });

  it('should return valid PDF buffer', async () => {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        html: FIXTURE_HTML,
        meta: { filename: 'test-export.pdf' },
      }),
    });

    const buffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(buffer);

    // Check PDF magic number (%PDF-)
    expect(uint8Array[0]).toBe(0x25); // %
    expect(uint8Array[1]).toBe(0x50); // P
    expect(uint8Array[2]).toBe(0x44); // D
    expect(uint8Array[3]).toBe(0x46); // F
  });

  it('should handle missing HTML with 400 error', async () => {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ meta: { filename: 'test.pdf' } }),
    });

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toContain('Missing html');
  });

  it('should reject non-POST methods', async () => {
    const response = await fetch(ENDPOINT, {
      method: 'GET',
    });

    expect(response.status).toBe(405);
  });

  it('should handle large HTML payload rejection', async () => {
    const largeHTML = FIXTURE_HTML.repeat(10000); // > 10MB

    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        html: largeHTML,
        meta: { filename: 'large-test.pdf' },
      }),
    });

    expect(response.status).toBe(413);
    const json = await response.json();
    expect(json.error).toContain('too large');
  });

  it('should set Content-Disposition with filename', async () => {
    const filename = 'custom-export.pdf';
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        html: FIXTURE_HTML,
        meta: { filename },
      }),
    });

    const disposition = response.headers.get('content-disposition');
    expect(disposition).toContain('attachment');
    expect(disposition).toContain(filename);
  });
});
