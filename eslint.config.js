// eslint.config.js
import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default [
  // Ignore build artifacts
  { ignores: ['dist', 'build', 'coverage', 'node_modules'] },

  // Base JS rules
  js.configs.recommended,

  // --- App source: TS + React in the browser ---
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.browser, // gives you `window`, `console`, etc.
    },
    settings: { react: { version: 'detect' } },
    plugins: {
      '@typescript-eslint': tsPlugin,
      react: reactPlugin,
      'react-hooks': reactHooks,
    },
    rules: {
      // TypeScript recommended
      ...tsPlugin.configs.recommended.rules,

      // Style/ergonomics: keep things calm during upgrade
      '@typescript-eslint/no-explicit-any': 'off', // flip to 'warn' later
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],

      // React 17+ (automatic runtime)
      'react/react-in-jsx-scope': 'off',
      'react/jsx-uses-react': 'off',

      // Hooks sanity
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },

  // --- Node scripts/configs (allow require, __dirname, module, console) ---
  {
    files: [
      'scripts/**/*.{js,cjs,mjs,ts}',
      'tailwind.config.js',
      'vite.config.*',
      'eslint.config.*',
    ],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 'latest',
      // Most of these are CJS; if you migrate them to ESM, it's fine too.
      sourceType: 'script',
      globals: globals.node,
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      // Allow CommonJS in Node files
      '@typescript-eslint/no-require-imports': 'off',
      // TS rules on plain JS are noisy; keep it light
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
    },
  },

  // Defer formatting to Prettier
  prettier,
];
