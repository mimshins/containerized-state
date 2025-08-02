import { defineConfig } from "tsup";

const config = defineConfig({
  entry: ["./src/index.ts"],
  splitting: false,
  sourcemap: true,
  clean: true,
  format: ["cjs", "esm"],
  outDir: "dist",
  dts: true,
  minify: true,
});

export default config;
