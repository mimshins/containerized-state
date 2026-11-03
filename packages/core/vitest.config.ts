import { defineConfig } from "vitest/config";

import { coverage, include } from "../../vitest.base.ts";

export default defineConfig({
  test: { environment: "node", include, coverage: coverage() },
});
