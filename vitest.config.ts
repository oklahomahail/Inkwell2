// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      // Only measure files touched by tests
      all: false,
      reporter: ['text', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/__test__/**',
        'src/test/**',
        'src/**/index.ts',
        'src/**/types.ts',
        'src/**/constants.ts',
        'src/**/mocks/**',
        'src/**/fixtures/**',
        'src/**/stories/**',
        'src/**/workers/**',
        'src/**/routes/**',
      ],
      // (optional) set saner thresholds now, raise later
      thresholds: { lines: 30, functions: 30, branches: 25, statements: 30 },
    },
  },
});
