import { defineConfig } from "eslint/config";
import globals from "globals";
import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default defineConfig([
  { ignores: ["**/node_modules/**", "**/dist/**", "**/*.d.ts"] },
  {
    files: ["src/**/*.ts"],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
  {
    files: ["src/**/*.ts"],
    ignores: ["**/*.test.ts"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: { "@typescript-eslint/no-floating-promises": "error" },
  },
  {
    files: ["src/client/**/*.ts"],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ["src/server/**/*.ts"],
    languageOptions: { globals: globals.node },
  },
]);
