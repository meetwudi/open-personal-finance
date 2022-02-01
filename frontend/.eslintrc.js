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
      "react-app",
      "react-app/jest"
    ],
    parser: "@typescript-eslint/parser",
    parserOptions: {
      project: ["tsconfig.json", "tsconfig.dev.json"],
      sourceType: "module",
    },
    ignorePatterns: [
      "/lib/**/*", // Ignore built files.
    ],
    plugins: [
      "@typescript-eslint",
      "import",
    ],
    rules: {
      "quotes": ["error", "double"],
      "import/no-unresolved": 0,
      "require-jsdoc": 0,
      "indent": ["error", 2],
      "max-len": 0,
      "object-curly-spacing": 0,
      "comma-dangle": 0,
    },
  };
  