// eslint.config.hooks.js - Strict React Hooks linting
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

export default [
  {
    ignores: [
      'node_modules/**',
      'build/**',
      'dist/**',
      'src/test/**',
      'bench/**',
      'dev/**',
      '.vercel/**',
      'dev-dist/**',
      'coverage/**',
      'verbose/**',
      'playwright-report/**',
      'pnpm-lock.yaml',
      'src/bench/**',
      'scripts/**',
      '.audit/**',
      '**/_archive/**', // Exclude archived files
    ],
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2023,
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      'react-hooks': reactHooks,
    },
    rules: {
      // Enforce React Hooks rules strictly - treat warnings as errors
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error', // Promote to error for CI gate
    },
  },
];
