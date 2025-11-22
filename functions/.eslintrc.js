// /functions/.eslintrc.js
module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:import/errors",
    "plugin:import/warnings",
    "plugin:import/typescript",
    "google",
    "plugin:@typescript-eslint/recommended",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: ["tsconfig.json", "tsconfig.dev.json"],
    sourceType: "module",
  },
  ignorePatterns: [
    "/lib/**/*",        // built files
    "/generated/**/*",  // generated files
  ],
  plugins: [
    "@typescript-eslint",
    "import",
  ],
  rules: {
    quotes: ["error", "double"],
    indent: ["error", 2],
    "import/no-unresolved": 0,

    // Optional: stop Google style from forcing JSDoc everywhere
    "require-jsdoc": "off",
    "valid-jsdoc": "off",
  },
};
