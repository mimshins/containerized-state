// CLI: `pnpm check:packages`. Packs each package, unpacks the tarballs into a
// scratch node_modules, and checks them the way a consumer meets them: their
// contents, their real `exports` under Node's ESM loader, and their
// declarations under `tsc` with no path mapping. It publishes nothing and needs
// a build first (the script runs one).

import { execFileSync } from "node:child_process";
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  symlinkSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative } from "node:path";

import type { Manifest } from "./manifests.ts";
import { findTarballProblems } from "./package-tarball.ts";
import { PACKAGES, root } from "./workspace.ts";

/** The public API, as a consumer's `import *` sees it. */
const EXPECTED_EXPORTS: Readonly<Record<string, readonly string[]>> = {
  "containerized-state": ["Container"],
  "react-containerized-state": [
    "Container",
    "Subscribe",
    "useComputedValue",
    "useUpdate",
    "useValue",
  ],
  "containerized-state-plugin-persistence": [
    "PersistentContainer",
    "withPersistence",
  ],
};

/** Third-party packages a consumer installs, taken from the react package. */
const THIRD_PARTY = ["react", "use-sync-external-store", "@types/react"];

const scratch = mkdtempSync(join(tmpdir(), "containerized-state-packages-"));
const modules = join(scratch, "node_modules");
const problems: string[] = [];

const walk = (directory: string): string[] =>
  readdirSync(directory, { withFileTypes: true }).flatMap(entry =>
    entry.isDirectory()
      ? walk(join(directory, entry.name))
      : [join(directory, entry.name)],
  );

try {
  for (const { directory, name } of PACKAGES) {
    const destination = join(scratch, "tarballs", directory);
    const unpacked = join(modules, name);

    mkdirSync(destination, { recursive: true });
    mkdirSync(unpacked, { recursive: true });
    execFileSync("pnpm", ["pack", "--pack-destination", destination], {
      cwd: join(root, "packages", directory),
      stdio: "ignore",
    });

    const [tarball] = readdirSync(destination);

    if (tarball === undefined) throw new Error(`${name}: no tarball`);

    execFileSync("tar", [
      "-xzf",
      join(destination, tarball),
      "-C",
      unpacked,
      "--strip-components=1",
    ]);

    const issues = findTarballProblems({
      files: walk(unpacked).map(path => relative(unpacked, path)),
      manifest: JSON.parse(
        readFileSync(join(unpacked, "package.json"), "utf8"),
      ) as Manifest,
      declarations: readFileSync(join(unpacked, "dist/index.d.ts"), "utf8"),
      declaresContainer: directory === "core",
    });

    problems.push(...issues.map(issue => `${name}: ${issue}`));
  }

  for (const name of THIRD_PARTY) {
    const link = join(modules, name);

    mkdirSync(dirname(link), { recursive: true });
    symlinkSync(
      realpathSync(join(root, "packages/react/node_modules", name)),
      link,
    );
  }

  for (const [name, expected] of Object.entries(EXPECTED_EXPORTS)) {
    const script = `import(${JSON.stringify(name)}).then(m => console.log(JSON.stringify(Object.keys(m).sort())))`;

    try {
      const actual = execFileSync(
        process.execPath,
        ["--input-type=module", "-e", script],
        { cwd: scratch, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
      ).trim();

      if (actual !== JSON.stringify(expected)) {
        problems.push(
          `${name}: exports ${actual}, expected ${expected.join()}`,
        );
      }
    } catch (error) {
      problems.push(`${name}: does not import: ${String(error)}`);
    }
  }

  cpSync(join(root, "tools/published-types"), scratch, { recursive: true });

  try {
    execFileSync(
      join(root, "node_modules/.bin/tsc"),
      ["-p", join(scratch, "tsconfig.json")],
      { cwd: scratch, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
    );
  } catch (error) {
    const { stdout } = error as { stdout: string };

    problems.push(`the consumer does not compile:\n${stdout}`);
  }
} finally {
  rmSync(scratch, { recursive: true, force: true });
}

if (problems.length > 0) {
  console.error(problems.join("\n"));
  process.exit(1);
}

console.log(`${String(PACKAGES.length)} packages hold their tarball checks.`);
