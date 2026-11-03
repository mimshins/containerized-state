import { defineConfig } from "vitest/config";

import { coreSource, coverage, include } from "../../vitest.base.ts";

export default defineConfig({
  resolve: { alias: coreSource },
  test: { environment: "node", include, coverage: coverage() },
});
