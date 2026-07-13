# containerized-state-plugin-persistence

## 1.2.0
### Minor Changes



- [#22](https://github.com/mimshins/containerized-state/pull/22) [`2fc35b4`](https://github.com/mimshins/containerized-state/commit/2fc35b474c1de1e4a4f5328f20651effa18e0298) Thanks [@amir78729](https://github.com/amir78729)! - **BREAKING**: `withPersistence` now returns a new `PersistentContainer<T>` instance instead of mutating the original container.
  
  - Introduced `PersistentContainer<T>` class that extends `Container<T>`, providing a named type that resolves TS4094 errors in declaration emit.
  - `withPersistence(container, config)` creates and returns a `PersistentContainer<T>` using the source container's current value as the initial value.
  - The returned instance is fully compatible with all hooks and utilities that accept `Container<T>`.
  - Consumers must now use the returned container rather than relying on the original container reference being modified.

## 1.1.0
### Minor Changes



- [`251be02`](https://github.com/mimshins/containerized-state/commit/251be02b6be7000b33e58c3d3311b9fefad09763) Thanks [@mimshins](https://github.com/mimshins)! - Refactor: update to make the packages ESM-only.


### Patch Changes

- Updated dependencies [[`251be02`](https://github.com/mimshins/containerized-state/commit/251be02b6be7000b33e58c3d3311b9fefad09763)]:
  - containerized-state@3.3.0

## 1.0.0
### Major Changes



- [#16](https://github.com/mimshins/containerized-state/pull/16) [`4e8a6e8`](https://github.com/mimshins/containerized-state/commit/4e8a6e899bc603c5ccf11e95d45b9f32955c9a32) Thanks [@mimshins](https://github.com/mimshins)! - Introduce the stable version
