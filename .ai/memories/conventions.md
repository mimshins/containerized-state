---
description: TypeScript and code style. Read before writing code.
---

# Conventions

The rules are in [AGENTS.md](../../AGENTS.md) and enforced by `.oxlintrc.json`. Why
some rules are off: [ADR-001](../../decisions/ADR-001-toolchain.md).

- `_value`, `_subscribers`, and `_initialValue` are protected and visible to
  subclasses, so they are public API; renaming one is a breaking change.
- Options a consumer passes are typed `x?: T | undefined`, so a project with
  `exactOptionalPropertyTypes` can forward an optional value.
- The code targets ES2022 (`#private`); see `tsdown.base.ts`.
