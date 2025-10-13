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
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    mockReset: true,
    restoreMocks: true,
    clearMocks: true,
    testTimeout: 10000,
    retry: 2,
    pool: 'forks',
    deps: {
      inline: [
        '@testing-library/react',
        '@testing-library/react-hooks',
        '@testing-library/user-event',
      ],
    },
    watch: {
      onRerun: () => {
        console.log('\nTests re-running...');
      },
    },

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
        // Gradually increase these thresholds as coverage improves
        lines: 60,
        functions: 60,
        branches: 50,
        statements: 60,
      },
      // Additional coverage settings
      reportOnFailure: true,
      cleanOnRerun: true,
      skipFull: false,
    },
  },
});
