// The agent layer holds its content once: every tool's adapter is a pointer into
// .ai/, and every agent and skill can be found from the index (ADR-002).

import {
  existsSync,
  lstatSync,
  readdirSync,
  readFileSync,
  readlinkSync,
} from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { root } from "./workspace.ts";

const ADAPTERS: readonly (readonly [string, string])[] = [
  [".agents/skills", "../.ai/skills"],
  [".claude/agents", "../.ai/agents"],
  [".claude/skills", "../.ai/skills"],
  [".opencode/agents", "../.ai/agents"],
  [".opencode/skills", "../.ai/skills"],
];

const read = (path: string): string => readFileSync(join(root, path), "utf8");

const agents = readdirSync(join(root, ".ai/agents"));
const skills = readdirSync(join(root, ".ai/skills"));

/** The single-line frontmatter some tools require, or nothing. */
const frontmatterOf = (text: string): string | undefined =>
  /^---\n(.*?)\n---\n/su.exec(text)?.[1];

describe("the agent layer", () => {
  it.each(ADAPTERS)("%s points at %s", (path, target) => {
    expect(lstatSync(join(root, path)).isSymbolicLink()).toBe(true);
    expect(readlinkSync(join(root, path))).toBe(target);
  });

  it("CLAUDE.md holds only the pointer", () => {
    expect(read("CLAUDE.md")).toBe("@AGENTS.md\n");
  });

  it.each(agents)("agent %s has a name and a description", file => {
    const frontmatter = frontmatterOf(read(`.ai/agents/${file}`));

    expect(frontmatter).toContain(`name: ${file.replace(/\.md$/u, "")}`);
    expect(frontmatter).toMatch(/^description: \S.*$/mu);
  });

  it.each(skills)("skill %s has a name and a description", name => {
    const frontmatter = frontmatterOf(read(`.ai/skills/${name}/SKILL.md`));

    expect(frontmatter).toContain(`name: ${name}`);
    expect(frontmatter).toMatch(/^description: \S.*$/mu);
  });

  it("the index lists every agent and skill", () => {
    const index = read(".ai/README.md");

    for (const file of agents) expect(index).toContain(`./agents/${file}`);
    for (const name of skills)
      expect(index).toContain(`./skills/${name}/SKILL.md`);
  });

  it("every relative link of the layer's entry points resolves", () => {
    const links = (path: string, base: string): string[] =>
      [...read(path).matchAll(/\]\((\.{1,2}\/[^)#\s]+)/gu)].flatMap(match => {
        const target = match[1];

        return target === undefined ? [] : [join(root, base, target)];
      });
    const targets = [
      ...links("AGENTS.md", "."),
      ...links(".ai/README.md", ".ai"),
    ];

    expect(targets.length).toBeGreaterThan(5);
    expect(targets.filter(target => !existsSync(target))).toEqual([]);
  });
});
