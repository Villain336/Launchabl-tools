import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // Vendored from the AI Elements registry (npx ai-elements add …). Kept close to
  // upstream so updates stay a re-run away; the React Compiler lint rules that
  // upstream doesn't follow are relaxed here only.
  {
    files: ["src/components/ai-elements/**"],
    rules: {
      "react-hooks/refs": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/static-components": "off",
      "@next/next/no-img-element": "off",
    },
  },
]);

export default eslintConfig;
