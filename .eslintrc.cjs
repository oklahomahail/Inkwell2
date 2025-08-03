// .eslintrc.cjs

/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
    ecmaFeatures: {
      jsx: true,
    },
    extraFileExtensions: ['.json'],
  },
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  plugins: ['@typescript-eslint', 'react', 'react-hooks', 'prettier'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:prettier/recommended',
  ],
  settings: {
    react: {
      version: 'detect',
    },
  },
  rules: {
    // General JS/TS rules
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['warn'],
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',

    // React-specific
    'react/react-in-jsx-scope': 'off', // Not needed in React 17+

    // Formatting
    'prettier/prettier': [
      'error',
      {
        singleQuote: false,
        jsxSingleQuote: false,
        trailingComma: 'es5',
        printWidth: 100,
        semi: true,
      },
    ],

    // Enforce consistent double quotes
    quotes: ['error', 'double', { avoidEscape: true }],
  },
};
