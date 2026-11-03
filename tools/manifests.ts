// What every package.json must hold (decisions/ADR-001-toolchain.md).

export type Manifest = {
  readonly name?: string;
  readonly private?: boolean;
  readonly sideEffects?: unknown;
  readonly files?: readonly string[];
  readonly exports?: unknown;
  readonly license?: string;
  readonly repository?: { readonly directory?: string };
  readonly scripts?: Readonly<Record<string, string>>;
  readonly dependencies?: Readonly<Record<string, string>>;
  readonly peerDependencies?: Readonly<Record<string, string>>;
  readonly devDependencies?: Readonly<Record<string, string>>;
};

/** Published packages' run-time dependencies. A new one needs an ADR. */
const ALLOWED_RUNTIME: ReadonlySet<string> = new Set([
  "use-sync-external-store",
]);

/** A consumer's or a publish job's install would run these. */
export const LIFECYCLE_SCRIPTS: readonly string[] = [
  "preinstall",
  "install",
  "postinstall",
  "prepare",
  "prepublish",
  "prepublishOnly",
  "prepack",
  "postpack",
  "publish",
  "postpublish",
];

const EXACT = /^\d+\.\d+\.\d+$/u;

/** A development dependency is exact, or the workspace's own package. */
const findDevProblems = (
  label: string,
  devDependencies: Readonly<Record<string, string>>,
): string[] =>
  Object.entries(devDependencies)
    .filter(
      ([, version]) =>
        !EXACT.test(version) && !version.startsWith("workspace:"),
    )
    .map(([name, version]) => `${label}: ${name}@${version} is not exact`);

export const findRootProblems = (manifest: Manifest): string[] =>
  findDevProblems("package.json", manifest.devDependencies ?? {});

/** Every problem of one published package's manifest. */
export const findPackageProblems = (
  directory: string,
  manifest: Manifest,
  workspaceNames: ReadonlySet<string>,
): string[] => {
  const label = `packages/${directory}`;
  const problems = findDevProblems(label, manifest.devDependencies ?? {});
  const dependencies = manifest.dependencies ?? {};
  const peers = manifest.peerDependencies ?? {};
  const dev = manifest.devDependencies ?? {};

  if (manifest.private === true) problems.push(`${label}: is private`);
  if (manifest.sideEffects !== false) {
    problems.push(`${label}: must declare "sideEffects": false`);
  }
  if (manifest.files?.join() !== "dist") {
    problems.push(`${label}: "files" must be exactly ["dist"]`);
  }
  if (manifest.repository?.directory !== label) {
    problems.push(`${label}: repository.directory must be ${label}`);
  }
  if (manifest.license !== "MIT") problems.push(`${label}: must be MIT`);

  for (const script of LIFECYCLE_SCRIPTS) {
    if (manifest.scripts?.[script] !== undefined) {
      problems.push(`${label}: has the lifecycle script ${script}`);
    }
  }

  for (const [name, version] of Object.entries(dependencies)) {
    if (workspaceNames.has(name)) {
      if (version !== "workspace:^") {
        problems.push(`${label}: ${name} must be workspace:^`);
      }
    } else if (!ALLOWED_RUNTIME.has(name)) {
      problems.push(`${label}: runtime dependency ${name} needs an ADR`);
    }
  }

  // A peer on a sibling, with no workspace link, is auto-installed from the
  // registry: the tests would then run against a published copy.
  for (const name of Object.keys(peers)) {
    if (
      workspaceNames.has(name) &&
      dev[name]?.startsWith("workspace:") !== true
    ) {
      problems.push(`${label}: peer ${name} needs a workspace: devDependency`);
    }
  }

  return problems;
};

/** Sibling packages the lockfile resolves from the registry. */
export const findRegistryCopies = (
  lockfile: string,
  workspaceNames: ReadonlySet<string>,
): string[] =>
  [...workspaceNames].filter(name =>
    new RegExp(`^ {2}'?${name}@\\d`, "mu").test(lockfile),
  );
