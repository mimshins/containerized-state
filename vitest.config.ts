import { defineConfig } from "vitest/config";

// Root tests cover the repository tooling in tools/. Each package runs its own
// tests through its own `test` script.
export default defineConfig({
  test: {
    include: ["tools/**/*.test.ts"],
    environment: "node",
  },
});
