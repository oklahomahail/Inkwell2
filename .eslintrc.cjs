module.exports = {
  rules: {
    '@typescript-eslint/ban-ts-comment': ['warn', { 'ts-nocheck': true }]
  },
  overrides: [
    {
      files: ["scripts/archive/**"],
      rules: { "no-restricted-imports": ["error", { "patterns": ["**"] }] }
    },
  ],
};