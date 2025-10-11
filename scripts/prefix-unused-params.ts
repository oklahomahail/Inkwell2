import fs from 'fs';

import { glob } from 'glob';

(async () => {
  const files = await glob('src/**/*.{ts,tsx}', { dot: false });
  // ESLint config ignores args starting with "_" — we just help apply it
  const PATTERNS: RegExp[] = [
    // function foo(arg, unused) → function foo(arg, _unused)
    /\bfunction\s+([A-Za-z0-9_$]+)\s*\(([^)]*)\)/g,
    // const foo = (unused) => …  OR  (a, unused: T) => …
    /\(([^)]*)\)\s*=>/g,
  ];
  for (const file of files) {
    const src = fs.readFileSync(file, 'utf8');
    let out = src;
    for (const re of PATTERNS) {
      out = out.replace(re, (full, ...rest) => {
        const args = (rest[0] as string)
          .split(',')
          .map((s) => {
            const t = s.trim();
            if (!t) return s;
            // leave already-ignored args alone
            if (/^_/.test(t)) return s;
            // only rename if it's a simple identifier or identifier: type
            const m = t.match(/^([A-Za-z_$][A-Za-z0-9_$]*)(\??\s*:\s*[^=]+)?(\s*=\s*.+)?$/);
            if (!m) return s;
            return t.replace(m[1], `_${m[1]}`);
          })
          .join(', ');
        return full.replace(rest[0], args);
      });
    }
    if (out !== src) fs.writeFileSync(file, out, 'utf8');
  }
  console.log('Prefixed unused params where safe.');
})();
