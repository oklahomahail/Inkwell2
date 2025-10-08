import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'jsdom',
    globals: true, // ← enables test/expect/vi globals
    setupFiles: ['./vitest.setup.ts', './tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      all: true,
      thresholds: {
        lines: 85,
        functions: 85,
        statements: 85,
        branches: 80,
      },
      exclude: [
        'node_modules/**',
        'tests/**',
        '**/*.d.ts',
        '**/*.config.{js,ts}',
        '**/coverage/**',
        '**/dist/**',
      ],
    },
    include: ['src/**/*.{test,spec}.ts?(x)'],
  },
});
