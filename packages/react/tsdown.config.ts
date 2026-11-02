import { defineConfig } from "tsdown";

export default defineConfig({
  entry: "./src/index.ts",
  tsconfig: "./tsconfig.json",
  clean: true,
  format: "esm",
  outDir: "dist",
  minify: true,
  sourcemap: true,
  platform: "neutral",
  dts: true,
  // The root tsconfig maps this package to its source, which would otherwise
  // copy `Container` into this package's declarations. Each copy is a separate
  // type, because of its protected members, so they could not be mixed.
  external: ["containerized-state"],
});
