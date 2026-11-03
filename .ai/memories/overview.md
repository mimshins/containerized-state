---
description: What the packages are and how they relate. Read first.
---

# Overview

- `packages/core` (`containerized-state`): the `Container` class. No dependencies.
- `packages/react` (`react-containerized-state`): `useValue`, `useUpdate`,
  `useComputedValue`, `Subscribe`; re-exports core. Depends on core and
  `use-sync-external-store`.
- `packages/with-persistence` (`containerized-state-plugin-persistence`):
  `PersistentContainer` and `withPersistence`. Core is a peer.

Each package's README is its public contract. Versions come from changesets; core
and react are linked.
