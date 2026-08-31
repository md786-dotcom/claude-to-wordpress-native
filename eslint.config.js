import js from "@eslint/js";
import sonarjs from "eslint-plugin-sonarjs";
import tseslint from "typescript-eslint";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: { sonarjs },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "sonarjs/cognitive-complexity": ["error", 15],
      "no-restricted-syntax": [
        "error",
        {
          selector: "TSUnknownKeyword",
          message:
            "Avoid unknown except at JSON parse boundaries that immediately call Zod.",
        },
      ],
    },
  },
  {
    files: ["packages/schema/src/package.ts", "packages/generate/src/theme-files.ts"],
    rules: {
      "no-restricted-syntax": "off",
    },
  },
  {
    ignores: ["**/dist/**", "**/coverage/**", "node_modules/**"],
  },
);
