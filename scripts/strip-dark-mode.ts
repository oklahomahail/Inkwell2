import fs from 'fs';

import { glob } from 'glob';

(async () => {
  const files = await glob('src/**/*.{ts,tsx,css,scss}', { dot: false });
  const darkPrefix = /(?<=\s|^|["'`])dark:([a-zA-Z0-9-:/\\[\]()]+)(?=\s|$|["'`])/g;
  for (const file of files) {
    const orig = fs.readFileSync(file, 'utf8');
    const replaced = orig
      // remove `dark:` utility tokens
      .replace(darkPrefix, '')
      // collapse double spaces created by removals
      .replace(/\s{2,}/g, ' ');
    if (replaced !== orig) fs.writeFileSync(file, replaced, 'utf8');
  }
  console.log('Dark mode class tokens stripped.');
})();
