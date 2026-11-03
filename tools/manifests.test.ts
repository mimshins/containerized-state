import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  findPackageProblems,
  findRegistryCopies,
  findRootProblems,
  type Manifest,
} from "./manifests.ts";
import { PACKAGES, root } from "./workspace.ts";

const names: ReadonlySet<string> = new Set(PACKAGES.map(({ name }) => name));

const read = (path: string): Manifest =>
  JSON.parse(readFileSync(join(root, path), "utf8")) as Manifest;

const GOOD: Manifest = {
  sideEffects: false,
  files: ["dist"],
  license: "MIT",
  repository: { directory: "packages/a" },
};

const problems = (manifest: Partial<Manifest>): string =>
  findPackageProblems("a", { ...GOOD, ...manifest }, names).join();

describe("the manifest rules", () => {
  it("accept a manifest that holds them", () => {
    expect(problems({})).toBe("");
  });

  it.each<[string, Partial<Manifest>, string]>([
    ["a private package", { private: true }, "private"],
    ["possible side effects", { sideEffects: true }, "sideEffects"],
    ["wider files", { files: ["dist", "src"] }, "files"],
    ["a lifecycle script", { scripts: { prepare: "x" } }, "prepare"],
    ["an unlisted dependency", { dependencies: { left: "1.0.0" } }, "ADR"],
    [
      "a sibling off the workspace",
      { dependencies: { "containerized-state": "^3" } },
      "workspace",
    ],
    [
      "a sibling peer with no workspace link",
      { peerDependencies: { "containerized-state": "^3" } },
      "peer",
    ],
    ["a floating tool", { devDependencies: { vitest: "^5.0.0" } }, "not exact"],
  ])("refuse %s", (_name, manifest, message) => {
    expect(problems(manifest)).toContain(message);
  });

  it("refuse a sibling the lockfile takes from the registry", () => {
    const lockfile =
      "packages:\n\n  containerized-state@3.2.0:\n    resolution";

    expect(findRegistryCopies(lockfile, names)).toEqual([
      "containerized-state",
    ]);
  });
});

describe("the repository's manifests", () => {
  it("the root's tools are exact", () => {
    expect(findRootProblems(read("package.json"))).toEqual([]);
  });

  it.each(PACKAGES)("$directory holds the rules", ({ directory, name }) => {
    const manifest = read(`packages/${directory}/package.json`);

    expect(manifest.name).toBe(name);
    expect(findPackageProblems(directory, manifest, names)).toEqual([]);
  });

  it("the tests use the workspace's packages, not published copies", () => {
    expect(
      findRegistryCopies(
        readFileSync(join(root, "pnpm-lock.yaml"), "utf8"),
        names,
      ),
    ).toEqual([]);
  });
});
