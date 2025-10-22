// eslint.config.js (Flat config for ESLint v9)
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import importPlugin from 'eslint-plugin-import';
import unusedImports from 'eslint-plugin-unused-imports';
import globals from 'globals';

export default [
  // Global ignores (still included in the tree, just not linted)
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
    ],
  },

  // TypeScript / React rules
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

    // Make eslint-plugin-import understand TS paths/aliases
    settings: {
      'import/resolver': {
        typescript: {
          project: ['./tsconfig.json'], // respects baseUrl + paths
        },
        node: {
          extensions: ['.ts', '.tsx', '.js', '.jsx'],
        },
      },
    },

    plugins: {
      '@typescript-eslint': tsPlugin,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      import: importPlugin,
      'unused-imports': unusedImports,
    },

    rules: {
      // TS hygiene
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],

      // Auto-remove unused imports; keep TS rule for vars/args
      'unused-imports/no-unused-imports': 'warn',
      'unused-imports/no-unused-vars': 'off',

      // React
      'react-hooks/rules-of-hooks': 'error', // Enforce Rules of Hooks
      'react-hooks/exhaustive-deps': 'warn', // Verify the list of dependencies for Hooks (warn to start with)
      'react-refresh/only-export-components': 'off',

      // Import order (with blank lines between groups; internal '@/**' grouped)
      'import/order': [
        'warn',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'type'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
          pathGroups: [{ pattern: '@/**', group: 'internal', position: 'after' }],
          pathGroupsExcludedImportTypes: ['builtin'],
        },
      ],

      // Guardrails
      'import/no-cycle': ['error', { maxDepth: 1 }],
      'import/no-self-import': 'error',

      // TDZ Prevention: Prevent dynamic imports of core services to avoid initialization order issues
      'no-restricted-syntax': [
        'error',
        {
          selector: 'ImportExpression[source.value=/analyticsService/]',
          message: 'Dynamic import of analyticsService is not allowed. Use static imports to prevent TDZ errors.',
        },
        {
          selector: 'ImportExpression[source.value=/pwaService/]',
          message: 'Dynamic import of pwaService is not allowed. Use static imports to prevent TDZ errors.',
        },
        {
          selector: 'ImportExpression[source.value=/tutorialStorage/]',
          message: 'Dynamic import of tutorialStorage is not allowed. Use static imports to prevent TDZ errors.',
        },
      ],
      
      // Navigation hooks safety: prevent mixing useNavigate and useGo in the same file
      'no-restricted-imports': [
        'error',
        {
          paths: [{
            name: 'react-router-dom',
            importNames: ['useNavigate'],
            message: 'Please use "useGo" from "@/utils/navigate" instead of direct useNavigate to maintain consistency and testability.'
          }]
        }
      ],

      // Prevent typical loops and keep layers clean:
      // target = folder doing the importing; from = folder being imported
      'import/no-restricted-paths': [
        'error',
        {
          zones: [
            // Services must not import UI or hooks (keep services pure)
            { target: './src/services', from: './src/components' },
            { target: './src/services', from: './src/hooks' },

            // Context must not import hooks (avoid context ↔ hook loops)
            { target: './src/context', from: './src/hooks' },

            // Hooks should not import components (keep hooks UI-agnostic)
            { target: './src/hooks', from: './src/components' },
          ],
        },
      ],
    },
  },

  // Relax rules for archived/bench/test code
  {
    files: ['archive/**', 'src/bench/**', 'src/test/**'],
    rules: {
      'import/order': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'off',
    },
  },
];
