const expoConfig = require("eslint-config-expo/flat");

module.exports = [
  ...expoConfig,
  {
    rules: {
      "react-hooks/immutability": "off",
      "react-hooks/set-state-in-effect": "off",
      "react/no-unescaped-entities": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }]
    },
    ignores: ["dist/*", "node_modules/*", ".expo/*", "android/*", "ios/*"],
  },
];
