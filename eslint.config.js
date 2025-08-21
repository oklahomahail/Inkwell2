// eslint.config.js
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import importPlugin from 'eslint-plugin-import';
import unusedImports from 'eslint-plugin-unused-imports';

let reactRefresh = null;
try {
  reactRefresh = (await import('eslint-plugin-react-refresh')).default;
} catch {}

export default [
  { ignores: ['node_modules/**','dist/**','build/**','.vite/**','coverage/**'] },

  // Global rules (apply everywhere)
  {
    plugins: { 'unused-imports': unusedImports },
    rules: {
      // Remove unused imports automatically
      'unused-imports/no-unused-imports': 'error',

      // Turn OFF this rule so we can use @typescript-eslint/no-unused-vars instead
      'unused-imports/no-unused-vars': 'off',
    },
  },

  // TS + React config
  ...tseslint.config(
    js.configs.recommended,
    ...tseslint.configs.recommendedTypeChecked,

    {
      files: ['src/**/*.{ts,tsx}'],
      languageOptions: {
        parserOptions: {
          project: ['./tsconfig.json'],
          tsconfigRootDir: process.cwd(),
        },
      },
      plugins: {
        react,
        'react-hooks': reactHooks,
        import: importPlugin,
        ...(reactRefresh ? { 'react-refresh': reactRefresh } : {}),
      },
      settings: {
        react: { version: 'detect' },
        'import/parsers': { '@typescript-eslint/parser': ['.ts', '.tsx'] },
        'import/resolver': { typescript: true },
      },
      rules: {
        // React ergonomics
        'react/react-in-jsx-scope': 'off',
        'react/prop-types': 'off',
        'react-hooks/rules-of-hooks': 'error',
        'react-hooks/exhaustive-deps': 'warn',
        'import/order': ['warn', { groups: ['builtin','external','internal','parent','sibling','index'], 'newlines-between': 'always' }],
        'react-refresh/only-export-components': reactRefresh ? 'warn' : 'off',

        // Promise rules tuned for React apps
        '@typescript-eslint/no-misused-promises': ['warn', { checksVoidReturn: { arguments: true, attributes: false } }],
        '@typescript-eslint/no-floating-promises': ['warn', { ignoreVoid: true, ignoreIIFE: true }],
        '@typescript-eslint/require-await': 'off',
        '@typescript-eslint/await-thenable': 'off',
        '@typescript-eslint/prefer-promise-reject-errors': 'off',

        // Use THIS rule for unused vars; underscores are ignored (including caught errors)
        '@typescript-eslint/no-unused-vars': ['warn', {
          vars: 'all',
          args: 'after-used',
          varsIgnorePattern: '^_',
          argsIgnorePattern: '^_',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        }],

        // Turn the heavy TS “unsafe/any” family down to warnings
        '@typescript-eslint/no-explicit-any': 'warn',
        '@typescript-eslint/no-unsafe-assignment': 'warn',
        '@typescript-eslint/no-unsafe-member-access': 'warn',
        '@typescript-eslint/no-unsafe-call': 'warn',
        '@typescript-eslint/no-unsafe-return': 'warn',
        '@typescript-eslint/no-unsafe-argument': 'warn',
        '@typescript-eslint/restrict-template-expressions': 'warn',
        '@typescript-eslint/no-unsafe-enum-comparison': 'warn',
      },
    },

    // Optional quieter zones
    {
      files: [
        'src/services/**/*.{ts,tsx}',
        'src/utils/**/*.{ts,tsx}',
        'src/validation/**/*.{ts,tsx}',
      ],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
        '@typescript-eslint/no-unsafe-return': 'off',
        '@typescript-eslint/no-unsafe-argument': 'off',
        '@typescript-eslint/restrict-template-expressions': 'off',
      },
    }
  ),
];
