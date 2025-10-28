module.exports = {
  rules: {
    '@typescript-eslint/ban-ts-comment': ['warn', { 'ts-nocheck': true }]
  },
  overrides: [
    {
      files: ["scripts/archive/**"],
      rules: { "no-restricted-imports": ["error", { "patterns": ["**"] }] }
    },
    // Allow console in dev-only scripts
    {
      files: ["src/dev/**/*.{ts,tsx,js,jsx}"],
      rules: { "no-console": "off" }
    },
    // Allow console in logging internals
    {
      files: ["src/utils/devLog.ts", "src/utils/devLogger.ts"],
      rules: { "no-console": "off" }
    },
    // Allow console in archived onboarding prototypes (temporary)
    {
      files: ["src/components/Onboarding/_archive/**/*.{ts,tsx}"],
      rules: { "no-console": "off" }
    },
    // Allow console in storage verification/testing utils
    {
      files: [
        "src/utils/storage/persistenceE2E.ts",
        "src/utils/storage/storageVerification.ts"
      ],
      rules: { "no-console": "off" }
    },
  ],
};