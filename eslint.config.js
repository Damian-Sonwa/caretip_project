import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import unusedImports from "eslint-plugin-unused-imports";
import globals from "globals";
import { fileURLToPath } from "node:url";
import path from "node:path";

const tsconfigRootDir = path.dirname(fileURLToPath(import.meta.url));

export default tseslint.config(
  {
    ignores: [
      "dist",
      "node_modules",
      "scripts/**",
      "backend",
      "docs/**",
      "e2e/**",
      "playwright.config.ts",
      "eslint.config.js",
      "src/imports/pasted_text/**",
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      globals: { ...globals.browser, ...globals.es2021 },
      parserOptions: {
        projectService: true,
        tsconfigRootDir,
      },
    },
    plugins: {
      "react-hooks": reactHooks,
      "unused-imports": unusedImports,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "@typescript-eslint/no-unused-vars": "off",
      "unused-imports/no-unused-imports": "warn",
      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
        },
      ],
    },
  }
);
