import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { findIndexViolations, isIndexFile } from "./index-files.ts";
import { repositoryFiles, root } from "./workspace.ts";

const ENTRY = "packages/core/src/index.ts";

describe("index files", () => {
  it("accepts an entry that only re-exports", () => {
    const source = [
      "// The public API.",
      'export { a, type B } from "./a.ts";',
      'export type {\n  C,\n} from "./c.ts";',
      'export * from "./e.ts";',
      "",
    ].join("\n");

    expect(findIndexViolations(new Map([[ENTRY, source]]))).toEqual([]);
  });

  it.each([
    ["an import", 'import { a } from "./a.ts";\nexport { a };\n'],
    ["a declaration", "export const a = 1;\n"],
    ["a side-effect import", 'import "./a.ts";\n'],
    ["a block comment", '/** The API. */\nexport { a } from "./a.ts";\n'],
    [
      "a module twice",
      'export { a } from "./a.ts";\nexport * from "./a.ts";\n',
    ],
  ])("flags %s in an entry", (_name, source) => {
    expect(findIndexViolations(new Map([[ENTRY, source]]))).not.toEqual([]);
  });

  it("flags an index file that is not an entry", () => {
    expect(
      findIndexViolations(new Map([["packages/core/src/a/index.ts", ""]])),
    ).toHaveLength(1);
  });

  it("holds for the repository", () => {
    const paths = repositoryFiles().filter(path => isIndexFile(path));

    expect(paths).toHaveLength(3);
    expect(
      findIndexViolations(
        new Map(
          paths.map(path => [path, readFileSync(join(root, path), "utf8")]),
        ),
      ),
    ).toEqual([]);
  });
});
