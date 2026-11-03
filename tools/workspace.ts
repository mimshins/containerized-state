import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

export const root: string = join(import.meta.dirname, "..");

/** Every path git tracks or would track, relative to the repository's root. */
export const repositoryFiles = (): string[] =>
  execFileSync(
    "git",
    ["ls-files", "--cached", "--others", "--exclude-standard", "--deduplicate"],
    { cwd: root, encoding: "utf8" },
  )
    .split("\n")
    .filter(path => path !== "" && existsSync(join(root, path)));

/** The published packages, leaf first, by directory under `packages/`. */
export const PACKAGES = [
  { directory: "core", name: "containerized-state" },
  { directory: "react", name: "react-containerized-state" },
  {
    directory: "with-persistence",
    name: "containerized-state-plugin-persistence",
  },
] as const;
