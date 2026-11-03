// Proof that the lint rules of AGENTS.md fail on a violation. Each case writes
// a small file into a scratch tree, runs the repository's real oxlint with its
// real .oxlintrc.json over that tree, and reads the diagnostics back. The
// expectations are written from AGENTS.md, not derived from the configuration,
// so a weakened rule fails here.

import { spawnSync } from "node:child_process";
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { root } from "./workspace.ts";

type Case = {
  readonly name: string;
  readonly file: string;
  readonly source: string;
  readonly rule: string;
  readonly fails: boolean;
};

const CORE = "packages/core/src/a.ts";
const REACT = "packages/react/src/a.ts";
const PERSISTENCE = "packages/with-persistence/src/a.ts";
const RESTRICTED = "eslint(no-restricted-imports)";

const direction = (
  name: string,
  file: string,
  specifier: string,
  fails: boolean,
): Case => ({
  name,
  file,
  source: `export { a } from "${specifier}";\n`,
  rule: RESTRICTED,
  fails,
});

const cases: readonly Case[] = [
  direction(
    "core importing react's package",
    CORE,
    "react-containerized-state",
    true,
  ),
  direction(
    "core importing the plugin",
    CORE,
    "containerized-state-plugin-persistence",
    true,
  ),
  direction("core importing react itself", CORE, "react", true),
  direction(
    "react's package importing the plugin",
    REACT,
    "containerized-state-plugin-persistence",
    true,
  ),
  direction(
    "the plugin importing react's package",
    PERSISTENCE,
    "react-containerized-state",
    true,
  ),
  direction("the plugin importing react itself", PERSISTENCE, "react", true),
  direction(
    "a deep import of core",
    REACT,
    "containerized-state/dist/index.js",
    true,
  ),
  direction(
    "a relative import of another package",
    REACT,
    "../../core/src/index.ts",
    true,
  ),
  direction(
    "react's package importing core",
    REACT,
    "containerized-state",
    false,
  ),
  direction(
    "the plugin importing core",
    PERSISTENCE,
    "containerized-state",
    false,
  ),
  {
    name: "an explicit any",
    file: CORE,
    source: "export const f = (value: any): unknown => value;\n",
    rule: "typescript(no-explicit-any)",
    fails: true,
  },
  {
    name: "@ts-ignore",
    file: CORE,
    source: "// @ts-ignore\nexport const a: number = 1;\n",
    rule: "typescript(ban-ts-comment)",
    fails: true,
  },
  {
    name: "a default export",
    file: CORE,
    source: "export default 1;\n",
    rule: "import(no-default-export)",
    fails: true,
  },
  {
    name: "console in a package",
    file: CORE,
    source: 'console.log("a");\n',
    rule: "eslint(no-console)",
    fails: true,
  },
  {
    name: "a function declaration",
    file: CORE,
    source: "export function f(): number {\n  return 1;\n}\n",
    rule: "eslint(func-style)",
    fails: true,
  },
  {
    name: "an interface",
    file: CORE,
    source: "export interface A {\n  a: number;\n}\n",
    rule: "typescript(consistent-type-definitions)",
    fails: true,
  },
  {
    name: "a focused test",
    file: "packages/core/src/a.test.ts",
    source: 'import { it } from "vitest";\n\nit.only("a", () => {});\n',
    rule: "vitest(no-focused-tests)",
    fails: true,
  },
  {
    name: "a skipped test",
    file: "packages/core/src/a.test.ts",
    source: 'import { it } from "vitest";\n\nit.skip("a", () => {});\n',
    rule: "vitest(no-disabled-tests)",
    fails: true,
  },
  {
    name: "a disable comment that suppresses nothing",
    file: CORE,
    source: "// oxlint-disable-next-line no-alert\nexport const a = 1;\n",
    rule: "unused-disable-directive",
    fails: true,
  },
];

type Diagnostic = {
  readonly code?: string;
  readonly filename: string;
  readonly message: string;
};

const codeOf = ({ code, message }: Diagnostic): string =>
  message.startsWith("Unused") ? "unused-disable-directive" : (code ?? "");

const fileOf = (index: number, { file }: Case): string =>
  file.replace(/([^/]+)$/u, `case-${String(index)}-$1`);

let scratch = "";
const reported = new Map<string, Set<string>>();

beforeAll(() => {
  scratch = mkdtempSync(join(tmpdir(), "containerized-state-lint-"));
  copyFileSync(join(root, ".oxlintrc.json"), join(scratch, ".oxlintrc.json"));

  cases.forEach((testCase, index) => {
    const path = join(scratch, fileOf(index, testCase));

    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, testCase.source);
  });

  const { stdout } = spawnSync(
    join(root, "node_modules/.bin/oxlint"),
    ["-c", ".oxlintrc.json", "--format", "json", "."],
    { cwd: scratch, encoding: "utf8" },
  );
  const { diagnostics } = JSON.parse(stdout) as {
    diagnostics: Diagnostic[];
  };

  for (const diagnostic of diagnostics) {
    const rules = reported.get(diagnostic.filename) ?? new Set();

    rules.add(codeOf(diagnostic));
    reported.set(diagnostic.filename, rules);
  }
});

afterAll(() => {
  rmSync(scratch, { recursive: true, force: true });
});

describe("the lint rules", () => {
  it.each(cases)("$name: fails = $fails", testCase => {
    const rules = reported.get(fileOf(cases.indexOf(testCase), testCase));

    expect(rules?.has(testCase.rule) ?? false).toBe(testCase.fails);
  });
});
