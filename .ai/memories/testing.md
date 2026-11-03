---
description: How tests are organized and how to add one. Read before writing or changing tests.
---

# Testing

Procedure: [write-tests](../skills/write-tests/SKILL.md).

- **Unit and component:** `packages/*/src/*.test.{ts,tsx}`, 100% coverage
  (`vitest.base.ts`). They resolve core to its source.
- **Guards:** `tools/*.test.ts` (`pnpm test:tools`). A guard has a case proving it
  refuses a violation and a "holds for the repository" case.
- **Lint rules:** `tools/lint-rules.test.ts` runs the real oxlint on a scratch tree.
  A new rule gets a case.
- **Tarballs:** `tools/check-packages.ts` imports the packed packages under Node's
  ESM loader and compiles `tools/published-types/consumer.ts` against them.
- React is tested at the version in `packages/react/package.json` only.
