---
"containerized-state-plugin-persistence": minor
---

**BREAKING**: `withPersistence` now returns a new `PersistentContainer<T>` instance instead of mutating the original container.

- Introduced `PersistentContainer<T>` class that extends `Container<T>`, providing a named type that resolves TS4094 errors in declaration emit.
- `withPersistence(container, config)` creates and returns a `PersistentContainer<T>` using the source container's current value as the initial value.
- The returned instance is fully compatible with all hooks and utilities that accept `Container<T>`.
- Consumers must now use the returned container rather than relying on the original container reference being modified.
