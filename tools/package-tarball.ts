// The content check of an unpacked tarball: what npm would serve, not the
// working tree.

import { LIFECYCLE_SCRIPTS, type Manifest } from "./manifests.ts";

/** Everything a package may publish. */
const ALLOWED_FILES: ReadonlySet<string> = new Set([
  "LICENSE",
  "README.md",
  "package.json",
  "dist/index.d.ts",
  "dist/index.js",
  "dist/index.js.map",
]);

const targetsOf = (value: unknown): string[] => {
  if (typeof value === "string") return [value];
  if (typeof value === "object" && value !== null) {
    return Object.values(value).flatMap(entry => targetsOf(entry));
  }

  return [];
};

export type Unpacked = {
  /** Paths relative to the package, every file. */
  readonly files: readonly string[];
  readonly manifest: Manifest;
  readonly declarations: string;
  readonly code: string;
  readonly declaresContainer: boolean;
};

/** Every problem of one unpacked package. */
export const findTarballProblems = (unpacked: Unpacked): string[] => {
  const { files, manifest, declarations, code, declaresContainer } = unpacked;
  const problems: string[] = [];
  const present = new Set(files);

  for (const file of files) {
    if (!ALLOWED_FILES.has(file)) problems.push(`publishes ${file}`);
  }

  for (const file of ALLOWED_FILES) {
    if (!present.has(file)) problems.push(`does not publish ${file}`);
  }

  for (const target of targetsOf(manifest.exports)) {
    if (!present.has(target.replace(/^\.\//u, ""))) {
      problems.push(`exports ${target}, which is not in the tarball`);
    }
  }

  for (const [name, version] of Object.entries({
    ...manifest.dependencies,
    ...manifest.peerDependencies,
  })) {
    if (/^(?:workspace|catalog):/u.test(version)) {
      problems.push(`leaves ${name}@${version} in its manifest`);
    }
  }

  for (const script of LIFECYCLE_SCRIPTS) {
    if (manifest.scripts?.[script] !== undefined) {
      problems.push(`has the lifecycle script ${script}`);
    }
  }

  if (declarations.includes("sourceMappingURL")) {
    problems.push("points its declarations at a map it does not ship");
  }

  // React's peer range starts before this entry existed.
  if (code.includes("react/jsx-runtime")) {
    problems.push("imports react/jsx-runtime, outside its peer range");
  }

  // A copied declaration is a second, incompatible type: Container has
  // protected members, so TypeScript compares it nominally.
  const declares = /\bclass Container\b/u.test(declarations);

  if (declares !== declaresContainer) {
    problems.push(
      declaresContainer
        ? "does not declare Container"
        : "copies Container's declaration",
    );
  }

  return problems;
};
