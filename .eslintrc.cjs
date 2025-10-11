module.exports = {
  overrides: [
    {
      files: ["scripts/archive/**"],
      rules: { "no-restricted-imports": ["error", { "patterns": ["**"] }] }
    },
  ],
};