// vitest.config.ts
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
    globals: true, // enables test/expect/vi globals
    setupFiles: ['./src/setupTests.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],

    coverage: {
      enabled: true,
      provider: 'v8',
      reportsDirectory: './coverage',
      reporter: ['text', 'json-summary', 'html', 'lcov'],

      // Only measure files touched by tests
      all: false,
      include: ['src/**/*.{ts,tsx}'],

      // Realistic exclusions
      exclude: [
        'node_modules/**',
        'dist/**',
        'coverage/**',
        'tests/**',
        '**/*.d.ts',
        '**/*.config.{js,ts}',
        'scripts/**',
        'api/**',
        'src/bench/**',
        'tools/bench/**',
        '**/*.bench.*',
        'src/test-utils/**',
        'src/pages/**',
        'src/workers/**',
        'src/**/index.ts',
        'src/**/types.ts',
        'src/**/constants.ts',
        'src/**/__test__/**',
        'src/test/**',
        'src/**/mocks/**',
        'src/**/fixtures/**',
        'src/**/stories/**',
        'src/**/routes/**',
      ],

      // Set reasonable thresholds
      thresholds: {
        lines: 30,
        functions: 30,
        branches: 25,
        statements: 30,
      },
    },
  },
});
