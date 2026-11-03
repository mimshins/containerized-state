import reactPlugin from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

import { coreSource, coverage, include } from "../../vitest.base.ts";

export default defineConfig({
  plugins: [reactPlugin()],
  resolve: { alias: coreSource },
  test: {
    environment: "jsdom",
    include,
    coverage: coverage(["src/use-sync-external-store.ts"]),
  },
});
