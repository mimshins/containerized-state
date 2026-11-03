---
name: add-a-package
description: Use when adding a package under packages/. Lists what a new package must have to pass the repository's checks.
---

# add-a-package

## Prerequisites

An ADR if the package brings a new runtime dependency.

## Workflow

1. Copy the shape of `packages/with-persistence`: `package.json`, `tsconfig.json`,
   `tsdown.config.ts`, `vitest.config.ts`, `README.md`, `LICENSE`, and
   `src/index.ts`, which holds only re-exports.
2. In `package.json`: `"sideEffects": false`, `"files": ["dist"]`,
   `repository.directory`, and no lifecycle script. A sibling it needs is a
   `workspace:` dependency, or a peer plus a `workspace:` development dependency.
3. Add it to `PACKAGES` in `tools/workspace.ts` and `EXPECTED_EXPORTS` in
   `tools/check-packages.ts`.
4. Add its `no-restricted-imports` override to `.oxlintrc.json`, and its cases to
   `tools/lint-rules.test.ts`, written from the direction you want.
5. Add it to the root README, to `.changeset/config.json` if it is linked, and to
   the direction in `AGENTS.md` and `.ai/memories/architecture.md`.
6. After the first publish, configure its npm trusted publisher
   ([runbook](../../../runbook/release.md)).

## Constraints

The dependency direction stays one way, and core stays dependency-free.

## Useful commands

`pnpm check`

## Expected output

A package that passes `pnpm check`, with `check:packages` covering its tarball.
