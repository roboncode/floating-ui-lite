import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: "./src/index.ts",
      name: "anchor",
      fileName: (format) => `anchor.${format}.js`.replace(".iife", ".min"),
      formats: ["es", "iife", "umd"],
    },
    minify: true,
  },
});
