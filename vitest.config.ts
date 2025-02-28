import { defineConfig } from "vitest/config";

const config = defineConfig({
  test: {
    environment: "node",
    include: ["**/__tests__/**/*.[jt]s?(x)", "**/?(*.)+(spec|test).[jt]s?(x)"],
    coverage: {
      provider: "v8",
      reporter: ["text", "clover", "json-summary"],
      include: ["src/**"],
      exclude: [
        "src/Container.ts",
        "src/index.ts",
        "src/types.ts",
        "coverage/**",
        "dist/**",
        "**\/*.d.ts",
        "test?(s)/**",
        "test?(-*).?(c|m)[jt]s?(x)",
        "**\/*{.,-}{test,spec}?(-d).?(c|m)[jt]s?(x)",
        "**\/__tests__/**",
      ],
    },
  },
});

export default config;
