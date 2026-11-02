---
"react-containerized-state": patch
"containerized-state-plugin-persistence": patch
---

Import the `Container` type from `containerized-state` instead of bundling a copy
of it. `withPersistence(Container.create(...))` and
`useValue(persistentContainer)` now typecheck in an installed project.
