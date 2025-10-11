import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './vitest.setup.ts',
    // keep coverage config you added; also exclude playwright specs
    exclude: [
      'node_modules/**',
      'dist/**',
      'tests/smoke/**', // <-- Playwright
    ],
  },
});
