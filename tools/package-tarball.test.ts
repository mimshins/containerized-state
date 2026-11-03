import { describe, expect, it } from "vitest";

import { findTarballProblems, type Unpacked } from "./package-tarball.ts";

const GOOD: Unpacked = {
  files: [
    "LICENSE",
    "README.md",
    "package.json",
    "dist/index.d.ts",
    "dist/index.js",
    "dist/index.js.map",
  ],
  manifest: { exports: { ".": { default: "./dist/index.js" } } },
  declarations: "export declare const a: number;",
  declaresContainer: false,
};

const problems = (change: Partial<Unpacked>): string =>
  findTarballProblems({ ...GOOD, ...change }).join();

describe("the tarball check", () => {
  it("accepts a package that holds it", () => {
    expect(problems({})).toBe("");
  });

  it.each<[string, Partial<Unpacked>, string]>([
    ["a stray file", { files: [...GOOD.files, "src/a.ts"] }, "publishes src"],
    ["a missing file", { files: GOOD.files.slice(1) }, "does not publish"],
    [
      "a missing export target",
      { manifest: { exports: { ".": "./dist/other.js" } } },
      "not in the tarball",
    ],
    [
      "an unresolved workspace specifier",
      { manifest: { dependencies: { a: "workspace:^" } } },
      "workspace:^",
    ],
    [
      "a lifecycle script",
      { manifest: { scripts: { postinstall: "x" } } },
      "postinstall",
    ],
    [
      "a dangling declaration map",
      { declarations: "//# sourceMappingURL=index.d.ts.map" },
      "map",
    ],
    [
      "a copied Container",
      { declarations: "declare class Container<T> {}" },
      "copies",
    ],
    ["a lost Container", { declaresContainer: true }, "does not declare"],
  ])("refuses %s", (_name, change, message) => {
    expect(problems(change)).toContain(message);
  });
});
