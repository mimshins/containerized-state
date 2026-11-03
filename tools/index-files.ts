// An `index.ts` is a package's entry point and nothing else (AGENTS.md): it
// lives only at `packages/<name>/src/index.ts` and holds only re-exports, so no
// logic, declaration, or import hides behind it, and the public API can be read
// from one file.

const ENTRY_PATH = /^packages\/[^/]+\/src\/index\.ts$/u;

/** `export [type] { a, ... } from "...";` or `export * from "...";`. */
const RE_EXPORT =
  /^export\s+(?:type\s+)?(?:\{\s*[^}\s][^}]*\}|\*)\s+from\s+"([^"]+)";$/u;

const stripLineComments = (text: string): string =>
  text.replaceAll(/^\s*\/\/.*$/gmu, "");

const statementsOf = (text: string): string[] =>
  stripLineComments(text)
    .split(";")
    .map(statement => statement.replaceAll(/\s+/gu, " ").trim())
    .filter(statement => statement !== "")
    .map(statement => `${statement};`);

export const isIndexFile = (path: string): boolean =>
  /(?:^|\/)index\.[cm]?[jt]sx?$/u.test(path);

/** One message per `index` file that breaks the rule. */
export const findIndexViolations = (
  files: ReadonlyMap<string, string>,
): string[] => {
  const violations: string[] = [];

  for (const [path, text] of files) {
    if (!isIndexFile(path)) continue;

    if (!ENTRY_PATH.test(path)) {
      violations.push(`${path}: an index file is only a package's entry`);
      continue;
    }

    if (stripLineComments(text).includes("/*")) {
      violations.push(`${path}: a block comment can hide a statement`);
      continue;
    }

    const modules = new Set<string>();

    for (const statement of statementsOf(text)) {
      const module = RE_EXPORT.exec(statement)?.[1];

      if (module === undefined) {
        violations.push(`${path}: holds only re-exports: \`${statement}\``);
      } else if (modules.has(module)) {
        violations.push(`${path}: "${module}" is re-exported twice`);
      } else {
        modules.add(module);
      }
    }
  }

  return violations.toSorted();
};
