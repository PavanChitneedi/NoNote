import js from "@eslint/js";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";

export default [
  { ignores: ["dist/**", "node_modules/**"] },
  js.configs.recommended,
  {
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: { ...globals.browser, ...globals.node },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      react,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...react.configs.recommended.rules,
      ...react.configs["jsx-runtime"].rules,
      ...reactHooks.configs.recommended.rules,
      // Non-inline-component convention (see CLAUDE.md): defining components
      // inside another component's render/body has caused remount bugs
      // (canvas/panel state loss) in this codebase.
      "react/no-unstable-nested-components": "error",
      // Several files (NodeCanvas.jsx, components/canvas/*.jsx) deliberately
      // export plain helper functions alongside components — keep this a
      // warning, not an error, and allow constant exports (e.g. default
      // prop objects, config maps) so it doesn't create noise.
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      // React 18 + JSX runtime: no need to import React in every file.
      "react/react-in-jsx-scope": "off",
      // PropTypes aren't used anywhere in this codebase.
      "react/prop-types": "off",
      "no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // Same convention as the backend: best-effort paths (auto-save retries,
      // optional JSON parsing, cleanup) deliberately swallow errors via
      // `catch {}` throughout this codebase — not an oversight.
      "no-empty": ["error", { allowEmptyCatch: true }],
    },
    settings: {
      react: { version: "18.3" },
    },
  },
];
