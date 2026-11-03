# containerized-state-plugin-persistence

## 1.4.0

### Minor Changes

- [#35](https://github.com/mimshins/containerized-state/pull/35) [`8732d36`](https://github.com/mimshins/containerized-state/commit/8732d36df860f07db33d9eedeef30dab7490efa8) Thanks [@mimshins](https://github.com/mimshins)! - Fix correctness problems found in a review:
  
  - `setValue` settles only after every subscriber has finished, and rejects with an `AggregateError` if several failed. It used to reject at the first failure, while others were still running, and lose the rest.
  - `computedSubscribe` no longer notifies of an unchanged value when `computeValue` returns a new object. A custom `isEqual` still decides for itself.
  - A new `Container.getServerValue()` is what the React hooks render on the server and while hydrating. `PersistentContainer` returns its initial value there, which fixes a hydration mismatch with a persisted value.
  - `react-containerized-state` no longer imports `react/jsx-runtime`, which its peer range did not guarantee, and depends on `containerized-state` with a caret range instead of an exact version, which could install a second, incompatible `Container`. `Subscribe` now returns `ReactElement`.
  - `PersistentContainer.reset()` keeps a value a subscriber sets in response, which used to be cleared from storage, and no longer writes the initial value first.
  - `withPersistence` keeps a value that is a function instead of calling it.
  - `PersistenceConfig` takes `serialize` and `deserialize`, for values JSON cannot hold and to validate what is stored, and `onError`, to hear about failures that are otherwise silent.

### Patch Changes

- [#35](https://github.com/mimshins/containerized-state/pull/35) [`8732d36`](https://github.com/mimshins/containerized-state/commit/8732d36df860f07db33d9eedeef30dab7490efa8) Thanks [@mimshins](https://github.com/mimshins)! - Build with the updated toolchain. Optional options and props also accept an explicit `undefined`, for projects that use `exactOptionalPropertyTypes`.
- Updated dependencies [[`8732d36`](https://github.com/mimshins/containerized-state/commit/8732d36df860f07db33d9eedeef30dab7490efa8), [`8732d36`](https://github.com/mimshins/containerized-state/commit/8732d36df860f07db33d9eedeef30dab7490efa8)]:
  - containerized-state@3.4.0

## 1.3.0
### Minor Changes



- [#32](https://github.com/mimshins/containerized-state/pull/32) [`0c02bd5`](https://github.com/mimshins/containerized-state/commit/0c02bd595a2a3a086080538e4f35950eb03da9ff) Thanks [@mimshins](https://github.com/mimshins)! - Accept any storage with `getItem`, `setItem` and `removeItem`, through the new
  `PersistenceStorage` type. A custom storage no longer has to implement the rest
  of `Storage`. `localStorage` and `sessionStorage` work as before.

### Patch Changes



- [#31](https://github.com/mimshins/containerized-state/pull/31) [`1ef3623`](https://github.com/mimshins/containerized-state/commit/1ef362321310959ce9e41cb31a617a1eae981842) Thanks [@mimshins](https://github.com/mimshins)! - Mark the packages as free of side effects, so bundlers can drop what is not
  imported. `react-containerized-state` no longer asks for `react-dom`, which it
  never uses, so React Native projects get no peer warning.


- [#30](https://github.com/mimshins/containerized-state/pull/30) [`ceed3fa`](https://github.com/mimshins/containerized-state/commit/ceed3fa61f0875e559664df71d0ed48a20cf6c34) Thanks [@mimshins](https://github.com/mimshins)! - Restore a persisted value faithfully. A saved `null` now comes back as `null`
  instead of the initial value. Data under the key that this package did not store,
  such as a number or an object with no timestamp, is ignored instead of becoming
  the value. A `ttl` of 0 now expires the value instead of never expiring it.


- [#27](https://github.com/mimshins/containerized-state/pull/27) [`c91a09f`](https://github.com/mimshins/containerized-state/commit/c91a09f5ba806f0a0fbc013bd0421e6fd5821560) Thanks [@mimshins](https://github.com/mimshins)! - Save to storage before notifying subscribers. A subscriber that rejects, never
  resolves or finishes late can no longer stop a save, or leave an older value in
  storage over a newer one. `reset` clears storage the same way, and no longer
  rejects when storage is unavailable.


- [#26](https://github.com/mimshins/containerized-state/pull/26) [`cd357b2`](https://github.com/mimshins/containerized-state/commit/cd357b22a0e17882087840c94b87623ed38c1aea) Thanks [@mimshins](https://github.com/mimshins)! - Import the `Container` type from `containerized-state` instead of bundling a copy
  of it. `withPersistence(Container.create(...))` and
  `useValue(persistentContainer)` now typecheck in an installed project.
- Updated dependencies [[`b09c1d5`](https://github.com/mimshins/containerized-state/commit/b09c1d520292d729c21f0298eeed48efcba88bad), [`1ef3623`](https://github.com/mimshins/containerized-state/commit/1ef362321310959ce9e41cb31a617a1eae981842)]:
  - containerized-state@3.3.1

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
