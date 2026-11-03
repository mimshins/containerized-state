# AGENTS.md

`containerized-state` is a public TypeScript monorepo: a small
framework-agnostic state container and two packages built on it. See
[README.md](./README.md).

AI knowledge layer: [.ai/README.md](./.ai/README.md).

**This repository is public.** Everything committed here, including issues, pull
requests, and agent output, is world-readable. Never add credentials, tokens,
internal URLs, personal data, or an unreleased security finding (use
[SECURITY.md](./SECURITY.md)).

## Approvals: never stage or commit on your own

**Do not run `git add`, `git commit`, or `git push` without approvals.** A
change is eligible only after:

1. a **human** has reviewed and approved it, and then
2. the **reviewer agent** ([`.ai/agents/reviewer.md`](./.ai/agents/reviewer.md))
   has approved it.

Even then, stage and commit only when a human asks, and open a pull request only
after a human confirms it. An approval covers the reviewed diff only; any
further edit needs review again
([ADR-002](./decisions/ADR-002-agent-workflow.md)).

## Agent workflow

Role agents live in [`.ai/agents/`](./.ai/agents/); how to invoke them per tool:
[CONTRIBUTING.md](./CONTRIBUTING.md#using-the-role-agents).

1. **implementer**: code and tests; `pnpm check`; then **stops**.
2. **Human review** of the diff.
3. **reviewer**: package-boundary, behavior, and definition-of-done gate on the
   approved diff.
4. Stage and commit, only on a human's request after steps 2 and 3.

## Asking the human

When you are blocked on an open question or a decision: **ask, do not guess.**
Use your host's structured-question tool, with concrete options and a
recommended one when the code or an ADR favors it. With no such tool, put the
same questions in your report and stop at the blocker. An answer is not an
approval. Procedure: [`ask-the-human`](./.ai/skills/ask-the-human/SKILL.md).

## Commands

Node and pnpm are pinned in `.node-version` and `packageManager`. Use these
scripts and never an ad-hoc equivalent.

- `pnpm install --frozen-lockfile` · `pnpm check` (everything CI runs but the
  audit and the changeset check)
- `pnpm test` (each package, 100% coverage) · `pnpm test:tools` (the
  repository's own rules, in `tools/`)
- `pnpm lint` (oxlint, type-aware) · `pnpm format` (oxfmt, writes) ·
  `pnpm format:check` · `pnpm typecheck`
- `pnpm build` (tsdown) · `pnpm check:packages` (builds, packs, and checks the
  tarballs as a consumer meets them)
- `pnpm changeset` (add release notes) · `pnpm clean`

## Architecture rules

Enforced by `.oxlintrc.json` (proven by `tools/lint-rules.test.ts`) and
`tools/`.

- **Dependency direction is one way.** `core` (`containerized-state`) is a leaf
  with no dependency; `react` and `with-persistence` depend on it and never on
  each other. No cycles.
- Imports of another package go through its public entry point, never its
  internals or a relative path.
- `index.ts` is only a package's entry (`src/index.ts`) and holds only
  re-exports.
- A package that takes a sibling as a peer also takes it as a `workspace:`
  development dependency, so its tests run against the workspace and not a
  published copy.
- A sibling a package depends on is `workspace:^`, never an exact version:
  `Container` is nominal to TypeScript, so a pinned copy would be a different
  type from the one the consumer installed.
- The react package's peer range starts before `react/jsx-runtime` existed, so
  its source uses `createElement`, not JSX (`tools/package-tarball.ts`).
- Tests import core's source through `vitest.base.ts`, never a built copy.
- Strict TypeScript. No `any`, and no `@ts-ignore`; `@ts-expect-error` and lint
  disables name the rule and give the reason on the same line.
- Prefer `type` over `interface`, and arrow functions over `function`, exported
  ones included. `function` stays only where an arrow cannot do the job.
- Named exports only; no default export in a package's source.
- Packages are tree-shakeable ESM with no import-time side effects.
- Every exported function has explicit types (`isolatedDeclarations`).

## Non-Negotiables

- **No new runtime dependency without an ADR.** The allow-list is in
  `tools/manifests.ts`. Dependency lifecycle scripts are off; development
  dependencies are exact versions at least 7 days old.
- **Behavior changes are documented** in the package's README, the public
  contract, in the same change, with a changeset.
- New behavior needs tests. Tests are deterministic and hermetic: no real
  network, no real clock, no real timers (fake them). Coverage stays at 100%.
- Never weaken a test or a lint rule to go green.
- Every workflow action is pinned by a full commit SHA, and an expression never
  reaches a script except through `env:` (`tools/workflows.test.ts`).
- One logical change per pull request.

## Knowledge maintenance

| If you change...            | Review...                                                                         |
| --------------------------- | --------------------------------------------------------------------------------- |
| a package's public API      | its README, its tests, `EXPECTED_EXPORTS` in `tools/check-packages.ts`, changeset |
| package structure           | `.oxlintrc.json`, `tools/lint-rules.test.ts`, `.ai/memories/architecture.md`      |
| tests or test tooling       | `.ai/memories/testing.md`, `vitest.base.ts`                                       |
| build, CI, or release       | `runbook/release.md`, `.github/`, `.ai/memories/development-workflow.md`          |
| a dependency or a tool      | `decisions/`, `tools/manifests.ts`                                                |
| the agent workflow or layer | `AGENTS.md`, `CONTRIBUTING.md`, `.ai/README.md`, ADR-002                          |

## Precedence

Explicit developer instructions > code/config > package READMEs > decisions >
runbook > memories > working memories > assumptions. Trust the higher source;
fix or flag the lower one.
