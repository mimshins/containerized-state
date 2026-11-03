// What every workflow must hold (decisions/ADR-001-toolchain.md). The text is
// read line by line: the rules are about the shape GitHub's own syntax fixes,
// and a YAML parser would be a dependency for one test.

const USES = /^\s*(?:-\s+)?uses:\s*(\S+)(?:\s+#\s*(.*))?$/u;
const PINNED = /^[^@\s]+@[0-9a-f]{40}$/u;
const VERSION = /^v\d+\.\d+\.\d+$/u;
const RUN = /^(\s*)(?:-\s+)?run:\s*(.*)$/u;

const findUsesProblems = (lines: readonly string[]): string[] =>
  lines.flatMap(line => {
    const match = USES.exec(line);
    const value = match?.[1];

    if (value === undefined || value.startsWith("./")) return [];
    if (!PINNED.test(value)) return [`${value} is not pinned by a full SHA`];

    return VERSION.test(match?.[2] ?? "")
      ? []
      : [`${value} has no "# vX.Y.Z" comment`];
  });

/**
 * `${{ }}` in a script is expanded before the shell parses it, so a branch name
 * or a title could run as code. It belongs in `env:`.
 */
const findScriptProblems = (lines: readonly string[]): string[] => {
  const problems: string[] = [];
  let scriptIndent: number | undefined;

  for (const line of lines) {
    const indent = line.length - line.trimStart().length;
    const inScript =
      scriptIndent !== undefined &&
      (line.trim() === "" || indent > scriptIndent);

    if (!inScript) scriptIndent = undefined;

    const run = RUN.exec(line);

    if (run !== null) scriptIndent = line.indexOf("run:");
    if ((inScript || run !== null) && line.includes("${{")) {
      problems.push(`an expression in a script: ${line.trim()}`);
    }
  }

  return problems;
};

/** Each job's lines, keyed by its name. */
const jobsOf = (lines: readonly string[]): Map<string, string[]> => {
  const jobs = new Map<string, string[]>();
  const start = lines.indexOf("jobs:");
  let current: string[] | undefined;

  for (const line of lines.slice(start + 1)) {
    const name = /^ {2}([\w-]+):\s*$/u.exec(line)?.[1];

    if (name === undefined) {
      current?.push(line);
    } else {
      current = [];
      jobs.set(name, current);
    }
  }

  return jobs;
};

const findJobProblems = (lines: readonly string[]): string[] =>
  [...jobsOf(lines)].flatMap(([name, job]) => {
    const has = (key: string): boolean =>
      job.some(line => line.startsWith(`    ${key}:`));
    const problems: string[] = [];

    if (!has("permissions")) problems.push(`job ${name} names no permissions`);
    if (!has("timeout-minutes")) problems.push(`job ${name} has no timeout`);

    job.forEach((line, index) => {
      if (
        USES.exec(line)?.[1]?.startsWith("actions/checkout@") === true &&
        !job
          .slice(index + 1, index + 4)
          .some(next => next.includes("persist-credentials: false"))
      ) {
        problems.push(`job ${name} leaves the git credential on disk`);
      }
    });

    return problems;
  });

/** Every problem of one workflow file. */
export const findWorkflowProblems = (text: string): string[] => {
  const lines = text.split("\n");

  return [
    ...(lines.includes("permissions: {}")
      ? []
      : ["no top-level `permissions: {}`"]),
    ...findUsesProblems(lines),
    ...findScriptProblems(lines),
    ...findJobProblems(lines),
  ];
};

/** Every problem of a composite action: pins and scripts, it has no jobs. */
export const findActionProblems = (text: string): string[] => {
  const lines = text.split("\n");

  return [...findUsesProblems(lines), ...findScriptProblems(lines)];
};

/** The jobs of `ci-ok`'s `needs:` that are missing, so it could pass without. */
export const findAggregateProblems = (text: string): string[] => {
  const jobs = jobsOf(text.split("\n"));
  const aggregate = jobs.get("ci-ok");

  if (aggregate === undefined) return ["no ci-ok job"];

  const needs = new Set(
    aggregate.flatMap(line => /^ {6}- ([\w-]+)$/u.exec(line)?.[1] ?? []),
  );

  return [...jobs.keys()]
    .filter(job => job !== "ci-ok" && !needs.has(job))
    .map(job => `ci-ok does not need ${job}`);
};
