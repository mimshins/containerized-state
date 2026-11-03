# ADR-001: Toolchain and supply chain

**Status:** Accepted, 2026-11-03

## Context

The repository had ESLint, Prettier, madge, and several small script helpers,
and its CI ran unpinned actions. Its layout now follows the conventions of the
maintainer's `se-client-kit`, scaled to three small packages.

## Decision

1. **oxlint and oxfmt** replace ESLint, Prettier, and madge (`import/no-cycle`).
   oxlint runs type-aware through `oxlint-tsgolint`, so `no-floating-promises`
   and the other type-checked rules ESLint gave are kept.
2. **TypeScript 7, Vite 8, Vitest 5, tsdown.** Declarations come from
   `isolatedDeclarations` through oxc.
3. **No task orchestrator.** Wireit's caching does not pay for itself at this
   size; `pnpm check` is a plain chain of scripts.
4. **No Testing Library jest-dom.** Its type augmentation fails against Vitest 5
   under `skipLibCheck: false`, and plain assertions did the same job.
5. **Supply chain.** Development dependencies are exact and at least 7 days old
   (`minimumReleaseAge`), lifecycle scripts are off, and `trustPolicy` refuses a
   weaker publisher. Actions are pinned by commit SHA. npm publishing uses
   trusted publishing, with no stored token.
6. **Lint rules off, and why:**
   - `prefer-readonly-parameter-types`: `Container` and React props are not
     deeply readonly and cannot be.
   - `no-underscore-dangle`: `_value` and friends are protected API; renaming
     them breaks subclasses.
   - `react-in-jsx-scope`: the automatic JSX runtime.
   - `require-mock-type-parameters`: noise in tests.
   - In tests and tools only: `max-lines`, `no-unsafe-type-assertion`,
     `consistent-function-scoping`, `no-conditional-in-test`.

## Consequences

Published packages must keep working with no token in the repository, so each
one needs a trusted publisher on npmjs.com ([runbook](../runbook/release.md)).
Adding a runtime dependency takes an ADR and a line in `tools/manifests.ts`.
