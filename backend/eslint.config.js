import js from "@eslint/js";
import globals from "globals";

export default [
  { ignores: ["node_modules/**"] },
  js.configs.recommended,
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: { ...globals.node },
    },
    rules: {
      "no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // This codebase deliberately swallows errors in a lot of best-effort
      // paths (logging, cleanup, non-critical probes) via `catch {}` —
      // that's an intentional pattern here, not an oversight.
      "no-empty": ["error", { allowEmptyCatch: true }],
    },
  },
];
