import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  findActionProblems,
  findAggregateProblems,
  findWorkflowProblems,
} from "./workflows.ts";
import { repositoryFiles, root } from "./workspace.ts";

const SHA = "a".repeat(40);

const workflow = (job: string): string =>
  `name: T\npermissions: {}\njobs:\n  a:\n    runs-on: x\n${job}\n`;

const GOOD = `    timeout-minutes: 5
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@${SHA} # v7.0.1
        with:
          persist-credentials: false
      - uses: ./.github/actions/setup
      - run: pnpm test
      - env:
          REF: \${{ github.head_ref }}
        run: echo "$REF"`;

describe("the workflow rules", () => {
  it("accept a workflow that holds them", () => {
    expect(findWorkflowProblems(workflow(GOOD))).toEqual([]);
  });

  it.each([
    ["a tag", GOOD.replace(`@${SHA} # v7.0.1`, "@v7"), "not pinned"],
    ["no version comment", GOOD.replace(" # v7.0.1", ""), "no"],
    ["no timeout", GOOD.replace("    timeout-minutes: 5\n", ""), "no timeout"],
    [
      "no permissions",
      GOOD.replace("    permissions:\n      contents: read\n", ""),
      "no permissions",
    ],
    [
      "a kept credential",
      GOOD.replace("          persist-credentials: false", "          a: b"),
      "credential",
    ],
    [
      "an expression in a one-line script",
      `${GOOD}\n      - run: echo \${{ github.head_ref }}`,
      "expression",
    ],
    [
      "an expression in a block script",
      `${GOOD}\n      - run: |\n          echo ok\n          echo \${{ github.head_ref }}`,
      "expression",
    ],
  ])("refuse %s", (_name, job, message) => {
    expect(findWorkflowProblems(workflow(job)).join()).toContain(message);
  });

  it("refuse a workflow without empty top-level permissions", () => {
    expect(
      findWorkflowProblems(
        workflow(GOOD).replace("permissions: {}\n", ""),
      ).join(),
    ).toContain("permissions");
  });

  it("refuse an aggregate that misses a job", () => {
    expect(
      findAggregateProblems(
        "jobs:\n  a:\n    x: y\n  b:\n    x: y\n  ci-ok:\n    needs:\n      - a\n",
      ),
    ).toEqual(["ci-ok does not need b"]);
  });
});

describe("the repository's workflows", () => {
  const read = (path: string): string => readFileSync(join(root, path), "utf8");
  const files = repositoryFiles();
  const workflows = files.filter(path => path.startsWith(".github/workflows/"));
  const actions = files.filter(path => path.startsWith(".github/actions/"));

  it("are found", () => {
    expect(workflows.length).toBeGreaterThan(1);
    expect(actions.length).toBeGreaterThan(0);
  });

  it.each(workflows)("%s holds the rules", path => {
    expect(findWorkflowProblems(read(path))).toEqual([]);
  });

  it.each(actions)("%s holds the rules", path => {
    expect(findActionProblems(read(path))).toEqual([]);
  });

  it("ci-ok needs every other job", () => {
    expect(findAggregateProblems(read(".github/workflows/ci.yml"))).toEqual([]);
  });
});
