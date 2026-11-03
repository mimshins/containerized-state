import { fileURLToPath } from "node:url";

import { coverageConfigDefaults } from "vitest/config";

/**
 * Tests run against core's source, never a built copy or a registry version.
 */
export const coreSource = {
  "containerized-state": fileURLToPath(
    new URL("packages/core/src/index.ts", import.meta.url),
  ),
};

/** Every package holds 100% coverage; only pure re-exports and types are out. */
export const coverage = (exclude: string[] = []) => ({
  enabled: true,
  provider: "v8" as const,
  reporter: ["text"],
  include: ["src/**"],
  exclude: [
    ...coverageConfigDefaults.exclude,
    "src/index.ts",
    "src/types.ts",
    ...exclude,
  ],
  thresholds: { "100": true },
});

export const include = ["src/**/*.test.{ts,tsx}"];
