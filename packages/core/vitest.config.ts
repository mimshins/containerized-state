import { coverageConfigDefaults, defineConfig } from "vitest/config";

const config = defineConfig({
  test: {
    environment: "node",
    include: [
      "src/**/__tests__/**/*.[jt]s?(x)",
      "src/**/?(*.)+(spec|test).[jt]s?(x)",
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "clover", "json-summary"],
      include: ["src/**"],
      exclude: [
        ...coverageConfigDefaults.exclude,
        "src/Container.ts",
        "src/index.ts",
        "src/types.ts",
      ],
    },
  },
});

export default config;
