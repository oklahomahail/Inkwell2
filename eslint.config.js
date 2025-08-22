// @ts-check
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import importPlugin from 'eslint-plugin-import';
import unusedImports from 'eslint-plugin-unused-imports';
import globals from 'globals';

let reactRefresh = null;
try {
  reactRefresh = (await import('eslint-plugin-react-refresh')).default;
} catch {
  /* noop */
}

export default [
  // Ignore build artifacts & snapshots
  { ignores: ['node_modules/**','dist/**','build/**','.vite/**','coverage/**','archive/**'] },

  // Base language options for all source files
  {
    files: ['src/**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: globals.browser,
    },
  },

  // JS/JSX recommended
  {
    files: ['src/**/*.{js,jsx}'],
    ...js.configs.recommended,
  },

  // TS/TSX recommended (NON type-checked)
  ...tseslint.configs.recommended,

  // React + imports + hygiene for src
  {
    files: ['src/**/*.{js,jsx,ts,tsx}'],
    plugins: {
      react,
      'react-hooks': reactHooks,
      import: importPlugin,
      'unused-imports': unusedImports,
      ...(reactRefresh ? { 'react-refresh': reactRefresh } : {}),
    },
    settings: { react: { version: 'detect' } },
    rules: {
      // Unused imports/vars
      // ⬇ make non-blocking to avoid hard errors from refactors
      'unused-imports/no-unused-imports': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', {
        args: 'after-used',
        vars: 'all',
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        ignoreRestSiblings: true,
      }],

      // React ergonomics
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'import/order': ['warn', {
        groups: ['builtin','external','internal','parent','sibling','index'],
        'newlines-between': 'always'
      }],
      'react-refresh/only-export-components': reactRefresh ? 'warn' : 'off',

      // Turn OFF typed-only rules (no project/tsconfig required)
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/await-thenable': 'off',

      // Reasonable TS hygiene
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },

  // Node/CJS & tool files — relax rules so they don't error
  {
    files: [
      'eslint.config.js',
      'tailwind.config.js',
      'vite.config.ts',
      'scripts/**/*.{js,cjs,ts}',
      'fix.eslint.js',
    ],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'commonjs',
      globals: { ...globals.node },
    },
    rules: {
      // Allow empty catch in configs
      'no-empty': ['warn', { allowEmptyCatch: true }],
      // Allow require() in CJS/tooling
      '@typescript-eslint/no-require-imports': 'off',
      // Avoid false positives in tool files
      'no-undef': 'off',
      'import/order': 'off',
      'unused-imports/no-unused-imports': 'off',
    },
  },
];
