import type { InlineConfig } from "vitest";
import type { UserConfig } from "vite";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

interface VitestConfigExport extends UserConfig {
  test: InlineConfig;
}

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/__tests__/setup.ts"],
    include: [
      "./src/__tests__/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
    ],
    plugins: [tailwindcss()],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
    },
  },
} as VitestConfigExport);
