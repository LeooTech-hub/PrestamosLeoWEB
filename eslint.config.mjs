import { defineConfig } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

export default defineConfig([
  ...nextVitals,
  {
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "frontend/dist/**",
      "next-env.d.ts",
      "node_modules/**"
    ]
  }
]);
